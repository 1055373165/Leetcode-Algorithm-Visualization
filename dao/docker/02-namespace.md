# Namespace — 改变进程感知到的现实

## 从 chroot 的问题出发

上一篇最后留了一个问题：Linux 为什么没有走 FreeBSD jail 那种"一把全隔离"的路？

答案藏在 Unix 的基因里——**组合优于集成**。

jail 是一个单一的系统调用，同时隔离文件系统、网络、进程。这很方便，但你不能只要网络隔离而不要文件系统隔离。它是一个原子的、不可拆分的东西。

Linux 的选择是：**把"隔离"拆成多个独立的维度，每个维度可以单独开关。** 这就是 namespace。

你可以给一个进程只开 Network namespace（只隔离网络），不开 PID namespace（进程还是共享的）。这种可组合性使得 namespace 不只是为了"做容器"——它的应用场景远比容器广。

---

## Namespace 是什么

一句话：**Namespace 让一个进程看到一个资源的私有副本（或视图），而不是系统的全局版本。**

注意措辞——不是"限制"进程，而是改变进程"看到"的东西。进程不知道自己在 namespace 里，就像 chroot 里的进程不知道自己的 `/` 不是真的。

Linux 目前有 8 种 namespace：

| Namespace | 隔离什么 | 系统调用标志 | 内核版本 |
|-----------|---------|-----------|---------|
| **Mount (mnt)** | 挂载点表 | `CLONE_NEWNS` | 2.4.19 (2002) |
| **UTS** | 主机名和域名 | `CLONE_NEWUTS` | 2.6.19 (2006) |
| **IPC** | 进程间通信（信号量、消息队列、共享内存） | `CLONE_NEWIPC` | 2.6.19 (2006) |
| **PID** | 进程 ID 空间 | `CLONE_NEWPID` | 2.6.24 (2008) |
| **Network (net)** | 网络栈（接口、路由表、iptables、端口空间） | `CLONE_NEWNET` | 2.6.29 (2009) |
| **User** | UID/GID 映射 | `CLONE_NEWUSER` | 3.8 (2013) |
| **Cgroup** | Cgroup 根目录视图 | `CLONE_NEWCGROUP` | 4.6 (2016) |
| **Time** | 系统时钟（CLOCK_MONOTONIC, CLOCK_BOOTTIME） | `CLONE_NEWTIME` | 5.6 (2020) |

看版本号。从 2002 到 2020，Linux 花了 18 年才把 namespace 体系基本完成。这不是一次性设计好的，而是随着需求逐步演化的。

---

## 三个核心系统调用

与 namespace 交互只需要三个系统调用：

### `clone()` — 创建新进程，同时放入新的 namespace

```c
// 创建一个子进程，拥有独立的 PID 和 Network namespace
int flags = CLONE_NEWPID | CLONE_NEWNET | SIGCHLD;
pid_t pid = clone(child_func, stack + STACK_SIZE, flags, NULL);
```

`clone()` 是 `fork()` 的超集。`fork()` 创建的子进程和父进程共享所有 namespace，而 `clone()` 可以选择性地创建新的 namespace。

### `unshare()` — 让当前进程脱离某个 namespace

```c
// 当前进程获得自己独立的 mount namespace
unshare(CLONE_NEWNS);
```

不创建新进程，只是让当前进程"脱离"共享。Docker 不常用这个，但 `unshare` 命令行工具用的就是它，非常适合实验。

### `setns()` — 加入一个已存在的 namespace

```c
// 打开目标 namespace 的文件描述符
int fd = open("/proc/[pid]/ns/net", O_RDONLY);
// 加入那个 namespace
setns(fd, CLONE_NEWNET);
```

这就是 `docker exec` 的原理——找到容器进程的 namespace，然后把新进程塞进去。

---

## 用你熟悉的 Network Namespace 深入理解

你对网络栈很熟，所以我们用 net namespace 来剖析"namespace 到底做了什么"。

一个 Linux 系统的网络栈包含：

- 网络接口（eth0, lo, ...）
- 路由表
- iptables/nftables 规则
- socket 端口空间
- /proc/net 下的所有信息

当你创建一个新的 net namespace 时，内核做了什么？

**它创建了上述所有东西的一份全新的、空的实例。** 新的 net namespace 里只有一个 `lo` 接口（还是 DOWN 的），没有路由表，没有 iptables 规则，没有任何 socket。

这不是"复制"——是从零构建。

```bash
# 创建一个新的 net namespace
sudo ip netns add test_ns

# 在里面执行命令——看看网络接口
sudo ip netns exec test_ns ip link
# 只有 lo，且是 DOWN 的

# 看看路由表
sudo ip netns exec test_ns ip route
# 空的

# 看看端口
sudo ip netns exec test_ns ss -tlnp
# 空的
```

那容器怎么联网？通过 **veth pair**（虚拟以太网对）：

```
Host namespace          Container namespace
     │                        │
   docker0 (bridge)        eth0 (veth 的一端)
     │                        │
   vethXXX (veth 的另一端) ←──┘
```

veth pair 就像一根虚拟网线，两端在不同的 namespace 里。数据从一端进去，从另一端出来。docker0 网桥把多个 veth 端连在一起，就像一个虚拟交换机。

这整个模型你应该很熟悉——它就是用软件模拟了物理网络的拓扑。namespace 的作用是让每个"虚拟机"看到自己的那一套网络栈，而不是主机的。

---

## PID Namespace：最反直觉的那个

PID namespace 值得单独讲，因为它是**嵌套的**。

```
Host PID namespace (PID namespace 0)
  └── Container PID namespace (PID namespace 1)
       进程在这里的 PID = 1
       同一个进程在主机上的 PID = 31425
```

同一个进程有两个 PID。在容器内它是 PID 1（init 进程），在主机上它是一个普通的 PID 31425。

这意味着：
- 容器内的进程**只能看到同一个 PID namespace 里的其他进程**
- 主机上的进程**能看到所有 PID namespace 里的进程**（只是用主机的 PID）

这种"上帝视角"是故意设计的——主机需要管理所有容器，所以它必须能看到一切。

一个关键后果：**容器里的 PID 1 有特殊语义。** Linux 内核对 PID 1 有特殊处理——信号处理行为不同，孤儿进程会被它收养。这就是为什么 Docker 容器里直接跑应用经常出问题（僵尸进程），而 `tini` 或 `dumb-init` 这类 init 系统存在的原因。

---

## Mount Namespace：第一个，也是最复杂的

Mount namespace 是最早出现的（2002），标志是 `CLONE_NEWNS`——注意它叫 `NEWNS`（new namespace），不叫 `NEWMNT`。因为它出现的时候还没有其他 namespace，"namespace"就只意味着"mount namespace"。

它隔离的是**挂载点表**——进程看到的文件系统挂载布局。

这和 chroot 的区别：

| | chroot | Mount namespace |
|---|--------|----------------|
| 改变什么 | 路径解析的起点（根目录） | 整个挂载点表 |
| 安全性 | 可逃逸 | 不可逃逸（除非有 CAP_SYS_ADMIN） |
| 灵活性 | 只能改根 | 可以有完全不同的挂载布局 |

Docker 两个都用：先用 mount namespace 获得独立的挂载表，然后在里面用 `pivot_root`（chroot 的增强版）把根切换到容器的 rootfs。

---

## 设计决策：Namespace 为什么不是虚拟机

面试官最常追问的：namespace 和虚拟机的区别到底在哪？

表面回答是"namespace 共享内核，VM 有自己的内核"。但更深的回答是：

**虚拟机模拟的是硬件，namespace 修改的是内核数据结构的可见性。**

虚拟机（通过 Hypervisor）给每个 Guest OS 一套虚拟硬件——虚拟 CPU、虚拟内存、虚拟磁盘、虚拟网卡。Guest OS 运行自己的内核，这个内核和硬件之间多了一层翻译。

Namespace 完全不同。它不模拟任何东西。它只是**在内核的数据结构上加了一层间接引用**。原来所有进程共享一个全局的路由表，现在每个 net namespace 有自己的路由表指针。进程访问路由表时，内核查的是它所在 namespace 的那份，而不是全局的那份。

这就像：虚拟机给每个人建了一栋独立的房子（有自己的地基、管道、电路），而 namespace 是在同一栋楼里用隔墙分了房间——共享地基和管道，但每个房间看不到其他房间。

性能差异因此而来：namespace 没有虚拟化开销，因为根本没发生虚拟化——进程直接跑在真实的内核上，只是内核给它展示了一个过滤后的视图。

但安全差异也因此而来：共享内核意味着**内核漏洞是容器隔离的天花板**。虚拟机逃逸需要攻破 Hypervisor，容器逃逸只需要攻破内核。这也是为什么 gVisor、Kata Containers 等项目存在——它们试图在容器的轻量和虚拟机的安全之间找到中间地带。

---

## `/proc/[pid]/ns/` — namespace 的可见形态

每个进程的 namespace 成员关系，可以在 `/proc/[pid]/ns/` 下看到：

```bash
ls -la /proc/self/ns/
# lrwxrwxrwx 1 root root 0 ... cgroup -> cgroup:[4026531835]
# lrwxrwxrwx 1 root root 0 ... ipc -> ipc:[4026531839]
# lrwxrwxrwx 1 root root 0 ... mnt -> mnt:[4026531841]
# lrwxrwxrwx 1 root root 0 ... net -> net:[4026531840]
# lrwxrwxrwx 1 root root 0 ... pid -> pid:[4026531836]
# lrwxrwxrwx 1 root root 0 ... user -> user:[4026531837]
# lrwxrwxrwx 1 root root 0 ... uts -> uts:[4026531838]
```

方括号里的数字是 inode 号。两个进程如果 `net` 指向同一个 inode 号，它们就在同一个 net namespace 里。

这些文件有一个精妙的用途：**只要有人持有这个文件描述符，namespace 就不会被销毁**——即使里面已经没有进程了。这就是 `ip netns add` 能创建"空" namespace 的原理——它在 `/var/run/netns/` 下 bind mount 了这个文件。

---

## 面试中的关键叙述线

> "Namespace 的本质不是'限制'，而是'欺骗'——让进程以为自己看到的是全部。它修改的是内核数据结构的间接引用，使得同一个内核可以同时向不同的进程展示不同的'世界'。
>
> Linux 选择把隔离拆成多个维度（mount、pid、net...），而不是做一个大而全的 jail，这让每个维度可以独立使用和组合。Docker 容器就是一个同时开启了所有维度隔离的进程。
>
> 但 namespace 只回答了'看到什么'的问题。'能用多少资源'——这是 cgroup 的工作。"

---

## 留给你的问题

User namespace 是 2013 年才加入的，比其他 namespace 晚了好几年，而且到今天很多发行版默认还是不开 unprivileged user namespace。

**为什么 user namespace 这么难做？它试图解决的问题和它引入的风险之间，张力在哪里？**

提示：想想一个容器内的 root 用户，映射到主机上的一个普通用户。这件事听起来简单，但它对内核的哪些假设构成了挑战？
