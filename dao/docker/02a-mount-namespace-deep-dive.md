# Mount Namespace 深潜 — 附带 Inode 的默会知识

> 这份文档是 `02-namespace.md` 的延伸。主文档讲了"是什么"，这里讲"为什么是这样"。如果你看到 `/proc/[pid]/ns/net` 那段觉得"好像懂了，但说不出为什么 bind mount 就能保住一个没有进程的 namespace"，这份文档就是写给那种感觉的。

---

## 第一部分：Inode 的默会知识

大多数人对 inode 的理解停留在"inode 是文件元数据"。这个说法不错，但它遮蔽了一个更根本的事实：

**在 Unix 的世界里，inode 才是文件本身，文件名只是指向 inode 的引用。**

把这句话真正吃进去，namespace 里很多"魔法"就不魔法了。

### 一个文件是什么

在 ext4、xfs 这类文件系统中，每个文件对应磁盘上的一个 inode 结构，存了：

- 文件大小
- 权限、所有者、时间戳
- 指向文件数据块的指针
- 硬链接计数（`nlink`）

注意：**inode 里没有文件名。**

文件名在哪里？在**目录**里。目录本身也是一个文件，它的内容是一张表：

```
目录 /home 的内容：
  "alice"  -> inode 12345
  "bob"    -> inode 12346
  "shared" -> inode 12345    ← 和 alice 指向同一个 inode（硬链接）
```

所以：

- **文件名是目录里的一条记录**，不是文件的属性
- **同一个 inode 可以有多个文件名**（硬链接）
- `rm foo` 不是删除文件——它是调用 `unlink()`，从目录里删掉"foo"这条记录，然后把 inode 的 nlink 减 1

### 文件的生命周期：引用计数

一个 inode 什么时候真正被释放？

```
nlink（目录中的引用数） == 0
  AND
打开的文件描述符数 == 0
```

这两个条件**同时**满足时，inode 才被释放，数据块才被回收。

这带来一个 Unix 最经典的现象：**删除正在打开的文件**

```bash
# 终端 1
tail -f /var/log/huge.log &    # 进程持有这个文件的 fd

# 终端 2
rm /var/log/huge.log            # nlink 变成 0
df -h                           # 但磁盘空间没有释放！
ls /var/log/huge.log            # 文件名消失了

# 直到终端 1 的进程退出，fd 关闭，inode 才真正释放
```

文件"被删了"但仍然存在。这不是 bug，是 Unix 的深层设计——**inode 是对象，文件名是引用，fd 也是引用。只要还有任何引用，对象就活着。**

这是一种内置于文件系统的引用计数垃圾回收。

### `/proc/[pid]/fd/` 验证这个模型

```bash
# 一个进程打开一个文件后，把文件删了
# 进程的 fd 仍然可用
ls -la /proc/[pid]/fd/
# lrwx------ ... 3 -> /var/log/huge.log (deleted)
```

内核老老实实地告诉你：这个 fd 指向一个已经被 `unlink` 的 inode。名字没了，但 inode 还在，因为这个 fd 还在引用它。

**记住这个模型：inode 是对象，所有"名字"（文件名、fd、mount 引用）都是对它的引用。只要有引用，对象不死。**

这就是理解 namespace 为什么能"空存在"的钥匙。

---

## 第二部分：Namespace 也是对象

现在看 `/proc/[pid]/ns/net -> net:[4026531840]`。

这个"文件"不是普通文件，它属于一个叫 **nsfs**（namespace filesystem）的特殊文件系统。内核在 3.19 版本引入了这个东西，专门用来"把 namespace 表示为文件"。

方括号里的 `4026531840` 就是这个 nsfs 文件的 inode 号。

关键理解：**namespace 本身是内核中的一个对象，有引用计数。** 它有多少种引用？

1. **进程**：一个进程的 `nsproxy` 结构指向它的各个 namespace，这是一份引用
2. **文件描述符**：`open("/proc/[pid]/ns/net")` 返回的 fd 引用这个 namespace
3. **挂载**：bind mount 这个 nsfs 文件到某处，挂载本身也是一份引用

只要这三类引用中的任何一个存在，namespace 对象就不会被销毁。

所以 `ip netns add foo` 的完整过程是：

```c
// 伪代码
fd = clone(..., CLONE_NEWNET);      // 创建新的 net namespace
                                     // 此时只有 clone 出来的进程引用它

touch("/var/run/netns/foo");         // 创建一个空文件作为挂载点
mount("/proc/[child_pid]/ns/net",   // 把 nsfs 文件 bind mount 到这里
      "/var/run/netns/foo",
      MS_BIND);                      // ← 多了一份"挂载"引用

kill(child_pid);                     // 子进程死了，它那份引用消失
                                     // 但 bind mount 那份引用还在
                                     // → namespace 活着，但里面没有进程
```

这就是为什么一个 net namespace 可以"空着存在"——挂载本身持有引用。

**这和"已删除但被打开的文件仍在"是同一个模型的两个实例。** Unix 在设计上反复使用了这个模式。

---

## 第三部分：Mount Namespace 的内核数据结构

### 四个核心结构

现在进入 mount namespace 最硬核的部分。你需要分清楚四个容易混淆的东西：

| 结构体 | 代表什么 | 生命周期 |
|---|---|---|
| **`inode`** | 文件本体（在磁盘上） | 所有名字和 fd 引用都没了才释放 |
| **`dentry`** | 路径名的缓存（"/home/alice" 这样的一段） | 内存中的缓存，可回收 |
| **`super_block`** | 一个已挂载的文件系统实例 | 挂载时创建，全部卸载时销毁 |
| **`vfsmount`** | 一次挂载事件（把一个 fs 挂到某个点上） | 每次 `mount` 命令创建一个 |

一个 super_block 对应一个 **文件系统实例**（比如你挂载 `/dev/sda1` 到 `/mnt`，产生一个 super_block）。

一个 vfsmount 对应一次 **挂载动作**（同一个文件系统可以被 bind mount 到多个地方，产生多个 vfsmount，但共享同一个 super_block）。

```
/dev/sda1 的 super_block
   ↑
   ├── vfsmount_A：挂在 /mnt
   └── vfsmount_B：bind mount 到 /opt/data
```

从文件内容的角度，它们是同一个文件系统——改 `/mnt/foo` 就是改 `/opt/data/foo`。但从挂载树的角度，它们是两个独立的挂载点。

### 挂载树

挂载点之间形成一棵树：

```
vfsmount 关系（以挂载点为节点）：
/                    (root vfsmount)
├── /proc            (proc 的 vfsmount，其 parent 是 root vfsmount)
├── /sys             (sysfs 的 vfsmount)
├── /home            (可能是 root vfsmount 上的一个目录，没有独立挂载)
└── /mnt/data        (ext4 的 vfsmount，parent 是 root vfsmount)
    └── /mnt/data/backup   (另一次挂载，parent 是 /mnt/data 的 vfsmount)
```

**mount namespace 隔离的就是这棵树。**

### mnt_namespace 结构

```c
struct mnt_namespace {
    atomic_t        count;      // 引用计数
    struct ns_common ns;         // 通用 namespace 结构（含 inode 号）
    struct mount    *root;       // 这个 namespace 的根挂载点
    struct list_head list;       // 所有 vfsmount 的链表
    // ...
};
```

每个进程的 `task_struct` 里有：

```c
struct nsproxy *nsproxy;    // 指向进程所在的各个 namespace
  └── struct mnt_namespace *mnt_ns;    // 指向 mount namespace
        └── 这个 namespace 的挂载树
```

当进程调用 `open("/foo")`：

1. 内核查 `current->nsproxy->mnt_ns->root` 找到根挂载
2. 从根挂载的 dentry 开始解析路径
3. 解析过程中，如果遇到挂载点，就跳到对应的 vfsmount
4. 最终找到 inode，执行打开

**整个路径解析的"世界"就是 `current->nsproxy->mnt_ns` 决定的。** 换了 namespace，就换了挂载树，就是换了世界。

### unshare(CLONE_NEWNS) 做了什么

```c
// 内核做的事情（简化）：
new_ns = kmalloc(sizeof(struct mnt_namespace));
copy_tree(current->nsproxy->mnt_ns->root, &new_ns->root);
// ↑ 关键：复制整棵挂载树，但 super_block 不复制
current->nsproxy->mnt_ns = new_ns;
```

**只复制挂载树（vfsmount 的结构），不复制文件系统内容（super_block）。**

这意味着：

- 新旧 namespace 看到的文件系统**内容是共享的**——改同一个文件两边都看得到
- 新旧 namespace 的**挂载动作是独立的**——你在新 namespace 里挂载一个 tmpfs，旧 namespace 看不到

这是一种很精巧的隔离：结构独立，内容共享。

---

## 第四部分：Mount Propagation — 最容易被忽略的概念

上面说"挂载动作是独立的"其实是一个**默认行为**。实际上挂载点有四种传播类型（propagation type），它们决定了跨 namespace 的挂载动作是否传播。

面试里问 mount namespace，能讲到这一层的凤毛麟角。

### 四种传播类型

| 类型 | 行为 | 典型用途 |
|---|---|---|
| `MS_SHARED` | 在这个挂载点下的挂载操作，会传播到其他 MS_SHARED 的副本 | systemd 默认把 `/` 设为 shared |
| `MS_PRIVATE` | 完全隔离，挂载操作不传播 | 真正的容器隔离 |
| `MS_SLAVE` | 接收传播（主的挂载会出现在 slave 里），但自己的挂载不传播出去 | 需要"订阅"宿主机挂载但不污染宿主机 |
| `MS_UNBINDABLE` | 不可被 bind mount | 防止挂载循环 |

### 为什么需要这么复杂

场景：你在宿主机上插了一个 U 盘，自动挂载在 `/media/usb`。你希望容器看到这个挂载吗？

- 如果容器的 `/` 是 `MS_SHARED`（并且和宿主机共享）：U 盘挂载会传播到容器里，容器看得到
- 如果容器的 `/` 是 `MS_PRIVATE`：容器完全看不到
- 如果容器的 `/` 是 `MS_SLAVE`：容器能看到 U 盘，但容器自己挂载的东西不会传播到宿主机

Docker 的选择是 `MS_SLAVE`——容器能继承宿主机的挂载变化（比如新插入的磁盘），但容器自己的挂载不会污染宿主机。这是一个在"隔离"和"实用"之间的权衡。

### 一个经典的坑

systemd 把 `/` 设为 `MS_SHARED`。如果你用 `unshare -m` 创建一个 mount namespace，然后在里面挂载一个 tmpfs：

```bash
unshare -m
mount -t tmpfs tmpfs /mnt
# 你期望：只有 unshare 后的这个 shell 看到 /mnt 的 tmpfs
# 实际：如果 / 是 shared 的，这个挂载可能传播到宿主机！
```

这就是为什么 Docker 启动容器时，要先把自己的挂载树改成 private：

```c
// runc 源码里类似这样的调用
mount("", "/", NULL, MS_REC | MS_PRIVATE, NULL);
// 把整棵挂载树（包括子挂载）都改成 private
// 之后在这个 namespace 里的挂载操作，不会传播到宿主机
```

**理解这一层，你就理解了为什么"mount namespace 隔离挂载"这句话是个简化——真正的隔离还需要传播类型的配合。**

---

## 第五部分：pivot_root vs chroot

容器启动的最后一步是切换根目录。Docker 用的不是 `chroot`，而是 `pivot_root`。

### chroot 的问题（重申）

`chroot` 只改 `task_struct->fs->root` 这个字段。**旧的根目录和它的所有挂载仍然存在于进程的 mount namespace 中**——只是路径不可达。有特权的进程可以通过各种手段（比如前一份文档里讲的 chroot escape）逃出去。

### pivot_root 的做法

```c
pivot_root(new_root, put_old);
```

做两件事：

1. 把进程的根挂载从旧的切换到 `new_root`
2. 把旧的根挂载移动到 `put_old` 这个路径下

然后你可以 `umount put_old`——**把旧根彻底从挂载树中卸下**。

之后这个 mount namespace 里根本不存在对宿主机根文件系统的引用。没有指针，也就没有逃逸的路径。

容器启动的实际流程：

```
1. unshare(CLONE_NEWNS)               # 进入新 mount namespace
2. mount("", "/", NULL, MS_REC|MS_PRIVATE, NULL)  # 把挂载改成 private
3. mount(image_rootfs, "/new_root", ...)          # 挂载容器的 rootfs
4. chdir("/new_root")
5. pivot_root(".", ".old_root")       # 切换根，旧根放在 .old_root
6. umount2(".old_root", MNT_DETACH)   # 卸下旧根
7. rmdir(".old_root")
8. exec(container_command)            # 开始跑容器进程
```

每一步都有理由，缺一步就有一个逃逸或污染的路径。

---

## 第六部分：把所有东西串起来

回到最初那段 `/proc/[pid]/ns/net` 的代码。现在你应该能看懂每一个细节：

```bash
ls -la /proc/self/ns/
# lrwxrwxrwx ... mnt -> mnt:[4026531841]
```

- `mnt:[4026531841]` 是一个 nsfs 文件的 inode 号
- 这个 inode 代表一个内核中的 `mnt_namespace` 对象
- 打开这个文件（获得 fd）会增加 namespace 的引用计数
- bind mount 这个文件到某处，也会增加引用计数
- 只要引用计数 > 0，`mnt_namespace` 对象就活着
- `mnt_namespace` 对象里有挂载树（一堆 vfsmount）
- 这棵挂载树决定了加入这个 namespace 的进程，路径解析时看到的"世界"

**一切的根都是同一个思想：对象靠引用计数活着，名字是引用，fd 是引用，挂载是引用。** 你在 Unix 文件系统里第一次学到的东西，原封不动地用在了 namespace 的设计里。

这不是巧合。这是 Linus 和一众内核开发者的审美——**如果一个模型在一个层面上是对的，那就把它用到其他层面**。

---

## 面试中如果被追问到这一层

典型追问路径：

> 面试官："mount namespace 隔离的是什么？"
> 
> 你："挂载点表。每个进程通过 `nsproxy->mnt_ns` 指向自己的 mount namespace，里面维护了一棵由 vfsmount 组成的挂载树。"
> 
> 面试官："不同 namespace 改同一个文件，能互相看到吗？"
> 
> 你："能。因为 mount namespace 只复制 vfsmount 的结构，不复制 super_block。super_block 是共享的，文件内容就是共享的。"
> 
> 面试官："那 Docker 怎么确保宿主机看不到容器的挂载？"
> 
> 你："仅仅 unshare mount namespace 不够，还要处理挂载传播。systemd 默认把 `/` 设成 MS_SHARED，挂载会传播。Docker 会先把容器的挂载树改成 MS_PRIVATE 或 MS_SLAVE，才能真正隔离挂载动作。"
> 
> 面试官："chroot 和 pivot_root 有什么本质区别？"
> 
> 你："chroot 只改路径解析起点，旧根的挂载仍在 mount namespace 里，只是不可达，有逃逸可能。pivot_root 把旧根从挂载树中移出，然后可以 umount，彻底让它在 namespace 中不存在——不是隐藏，是物理上没了。"

到这个深度，面试官基本就不追了。

---

## 留给你的问题

现在你看 `docker exec` 的实现：它怎么让一个新进程进入已运行容器的 mount namespace？

提示：

- `setns(fd, CLONE_NEWNS)` 需要一个 fd
- 这个 fd 从哪里来？
- 容器的主进程还活着，它的 `/proc/[pid]/ns/mnt` 就是一个可用的 fd 来源
- 但如果容器已经退出呢？还能 exec 进去吗？为什么？

**这个问题的答案会让你意识到：`docker exec` 本质上就是 `setns` + `unshare` 的组合，没有魔法。**
