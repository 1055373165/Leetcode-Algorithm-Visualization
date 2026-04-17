# OverlayFS — 分层的文件系统

## 前三个技术解决了什么，还差什么

到这里，我们已经有了：

- **chroot / Mount namespace**：进程看到自己的文件系统
- **Namespace**：进程看到自己的世界（PID、网络、用户...）
- **Cgroup**：进程被限制了资源用量

如果只是"跑一个隔离的进程"，这三个已经够了。

但 Docker 还需要解决一个工程问题：**镜像怎么存储和分发？**

想象你有 100 个容器，都基于 Ubuntu 22.04。每个容器的 rootfs 大约 80MB。如果每个容器独立存一份，就是 8GB。而且这 100 份里，95% 的内容是完全一样的——都是 Ubuntu 的基础文件。

更严重的是分发问题：你从 Docker Hub 拉一个镜像，改了一行配置，推上去一个新版本。如果镜像是一个整体的文件系统包，每次都要上传/下载整个 80MB。但你实际改的可能只有 1KB。

**需要一种机制：让多个容器共享不变的基础层，只存储各自的差异。**

这就是 OverlayFS 的工作。

---

## Union Filesystem 的思想

OverlayFS 属于 **Union Filesystem** 家族。这个思想比 OverlayFS 早得多：

**把多个目录"叠"在一起，呈现为一个统一的视图。** 上层遮盖下层，就像一叠透明胶片——你看到的是所有层叠加的结果。

Linux 历史上有多个 Union FS 实现：

- **UnionFS**（2003）—— 最早的，学术项目
- **AUFS**（2006）—— Another UnionFS，长期被 Docker 使用但始终没进入内核主线
- **OverlayFS**（2014，内核 3.18）—— 最终进入内核主线的实现

AUFS 功能更多，但代码复杂度太高（几万行补丁），内核维护者拒绝合并。OverlayFS 的设计哲学是**最小化**——只做两层叠加，代码简洁到足以被内核接受。

这个取舍本身就是一个设计决策：**功能完备性输给了可维护性。**

---

## OverlayFS 的核心模型

OverlayFS 只有四个概念：

```
merged（合并视图）← 用户/容器看到的
  │
  ├── upperdir（上层，可读写）← 容器的修改写在这里
  │
  └── lowerdir（下层，只读）← 镜像的内容在这里
         │
        work（工作目录）← 内核用于原子操作的临时目录
```

挂载命令：

```bash
mount -t overlay overlay \
  -o lowerdir=/lower,upperdir=/upper,workdir=/work \
  /merged
```

挂载后，`/merged` 目录展示的是 lower 和 upper 叠加的结果。

### 读操作

当进程读 `/merged/foo.txt` 时：

1. 先查 upperdir：如果 `/upper/foo.txt` 存在，返回它
2. 再查 lowerdir：如果 `/lower/foo.txt` 存在，返回它
3. 都没有：文件不存在

就是一个简单的优先级查找。upper 遮盖 lower。

### 写操作（Copy-on-Write）

当进程要修改 `/merged/foo.txt`，而这个文件来自 lowerdir（只读）时：

1. 内核把 `/lower/foo.txt` **完整复制**到 `/upper/foo.txt`
2. 修改 `/upper/foo.txt`
3. 下次读的时候，upper 里的版本会遮盖 lower 里的原始版本

这就是 **Copy-on-Write（写时复制）** 。注意是整个文件复制，不是增量——如果你修改一个 100MB 文件的一个字节，upper 里会多出一个 100MB 的文件。

这是一个重要的性能特征：OverlayFS 的 CoW 粒度是文件级别的，不是块级别的。这和 btrfs、ZFS 的块级 CoW 不同。

### 删除操作（Whiteout）

当进程删除 `/merged/foo.txt`，而这个文件来自 lowerdir 时，OverlayFS 不能真的去删除 lowerdir 里的文件（它是只读的）。

解决方案：在 upperdir 里创建一个**白障文件（whiteout）**：

```bash
# 内核在 upper 目录创建一个字符设备文件（0,0）
mknod /upper/foo.txt c 0 0
```

当 OverlayFS 在 upper 里看到一个 whiteout 文件时，它知道对应的 lower 层文件应该被"遮盖"——从 merged 视图中消失。

文件并没有被删除。它只是被遮住了。

同样，删除一个目录会创建一个 **opaque 标记**（通过扩展属性 `trusted.overlay.opaque=y`），表示这个目录下的所有 lower 层内容都应该被遮盖。

---

## Docker 镜像的分层结构

Docker 镜像就是一叠 OverlayFS 的 lower 层：

```dockerfile
FROM ubuntu:22.04          # 层 1：Ubuntu 基础镜像（~80MB）
RUN apt-get install nginx  # 层 2：安装 nginx（~20MB）
COPY nginx.conf /etc/      # 层 3：配置文件（~1KB）
```

每条指令生成一个新的层。构建完成后：

```
层 3（nginx.conf）  ← 最上面的 lowerdir
层 2（nginx 安装） ← 中间的 lowerdir
层 1（Ubuntu 基础）← 最底下的 lowerdir
```

OverlayFS 支持多个 lowerdir（用 `:` 分隔）：

```bash
mount -t overlay overlay \
  -o lowerdir=/layer3:/layer2:/layer1,upperdir=/container_rw,workdir=/work \
  /merged
```

当容器启动时，Docker 给它一个新的空 upperdir。容器运行过程中的所有写操作都落在这个 upperdir 里。容器停止后，这个 upperdir 就是容器的"可写层"。

**100 个基于同一个镜像的容器，共享完全相同的 lowerdir 层，各自有独立的 upperdir。**

这就是镜像高效的原因：存储上只有一份 Ubuntu 基础层 + 一份 nginx 层 + 100 个几乎为空的 upperdir。分发上，如果对方已经有了 Ubuntu 基础层，只需要下载 nginx 层和配置层。

---

## 设计决策：为什么是文件级 CoW 而不是块级

块级 CoW（btrfs、ZFS）：修改一个文件只复制被修改的块（通常 4KB）。修改 100MB 文件的一个字节，只多占 4KB。

文件级 CoW（OverlayFS）：修改一个文件要复制整个文件。修改 100MB 文件的一个字节，多占 100MB。

OverlayFS 为什么选择文件级？

**因为它不是一个存储引擎，它是一个叠加层。** OverlayFS 工作在 VFS（虚拟文件系统）层面，在底层文件系统之上。它不管理磁盘块，不做日志，不做校验。它只做一件事：把多个目录合成一个视图。

块级 CoW 需要深入到存储引擎内部，管理块的分配、引用计数、碎片整理。OverlayFS 故意不做这些——它把存储管理的复杂性留给底层文件系统（ext4、xfs）。

代价是大文件修改的效率低。所以容器里的最佳实践是：**不要在容器的可写层存大文件。** 数据应该放在 volume 里（绕过 OverlayFS，直接挂载宿主机目录或者外部存储）。

这不是 OverlayFS 的缺陷，而是它选择的抽象层次带来的必然约束。

---

## 实际观察 Docker 的 OverlayFS

```bash
# 查看 Docker 使用的存储驱动
docker info | grep "Storage Driver"
# Storage Driver: overlay2

# 查看一个容器的挂载信息
docker inspect <container_id> --format '{{.GraphDriver.Data}}'
# map[
#   LowerDir:/var/lib/docker/overlay2/xxx/diff:/var/lib/docker/overlay2/yyy/diff
#   MergedDir:/var/lib/docker/overlay2/zzz/merged
#   UpperDir:/var/lib/docker/overlay2/zzz/diff
#   WorkDir:/var/lib/docker/overlay2/zzz/work
# ]

# 直接进入 UpperDir 看容器的修改
ls /var/lib/docker/overlay2/zzz/diff/
# 你只会看到容器运行后修改过的文件
```

`overlay2` 是 Docker 当前的默认存储驱动。它相比早期的 `overlay` 驱动优化了 inode 使用——不再为每一层消耗一个 inode。

---

## OverlayFS 的限制和边界

一些容器场景下会踩到的坑：

### `open(O_RDWR)` 触发全文件复制

在容器里打开一个 lower 层的文件进行写操作，即使你一个字节都没改，OverlayFS 也会把整个文件 copy-up 到 upper 层（因为它需要准备一个可写副本）。数据库引擎（如 SQLite）直接在容器可写层运行时，可能产生大量无意义的 copy-up。

### 硬链接的语义

Lower 层里两个文件如果是硬链接（共享 inode），copy-up 后在 upper 层会变成两个独立的文件。硬链接关系被打破了。

### `rename()` 的原子性

跨层的 rename（比如 lower 层的文件 rename 到一个 upper 层已有的目录）在某些内核版本下有兼容性问题。workdir 存在的一个重要原因就是支持这类原子操作。

---

## 四块拼图的合体

现在把四个技术放在一起，看 Docker 启动一个容器时做了什么：

```
docker run -it --memory=256m ubuntu bash
```

1. **OverlayFS**：把 ubuntu 镜像的多个层叠加起来，创建 merged 视图，准备空的 upperdir
2. **clone() + Namespace**：创建新进程，同时进入新的 mount、pid、net、uts、ipc、user namespace
3. **Mount namespace + pivot_root**：在新的 mount namespace 里，把根切换到 OverlayFS 的 merged 目录
4. **Cgroup**：创建新的 cgroup，把容器进程加入，设置 memory.max=256MB
5. **exec**：在这个完全隔离的环境里执行 `/bin/bash`

从 bash 的视角：它看到一个完整的 Ubuntu 文件系统（OverlayFS），以为自己是 PID 1（PID namespace），有自己的网络（net namespace），最多只能用 256MB 内存（cgroup），而且不知道以上任何一件事。

**这就是容器。不是虚拟机，不是沙箱。就是一个被精心"欺骗"的进程。**

---

## 面试中的关键叙述线

> "Docker 镜像的分层结构依赖 OverlayFS——一种 union filesystem。它把多个只读层叠在一起，加上一个可写层，合并成容器看到的文件系统。
>
> 核心机制是 Copy-on-Write：容器只在修改文件时才复制到自己的可写层。这让 100 个容器可以共享同一份基础镜像，只存储各自的差异。
>
> OverlayFS 的 CoW 是文件级的（不是块级的），因为它工作在 VFS 层面，不管理磁盘块。这导致大文件修改的效率低，所以容器里的数据应该放在 volume 里绕过 OverlayFS。
>
> 把四个技术连起来：OverlayFS 提供文件系统内容，namespace 提供多维度隔离，cgroup 限制资源用量。容器就是这三者（加上 chroot/pivot_root）的组合。"

---

## 留给你的问题

Docker 的 `docker commit` 命令把容器当前的可写层（upperdir）固化成一个新的镜像层。`docker build` 每一条 `RUN` 指令也是类似的过程。

**如果一个 Dockerfile 里有这样的操作：**

```dockerfile
RUN apt-get install -y some-package    # +200MB
RUN apt-get clean                      # 清理缓存
```

**最终镜像的大小是减小了还是没变？为什么？**

理解了这个，你就理解了 OverlayFS 分层模型的一个关键直觉——层只能叠加，不能回溯修改。
