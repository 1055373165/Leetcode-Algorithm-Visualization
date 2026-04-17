# Cgroup — 资源的边界

## 从 namespace 留下的缺口开始

Namespace 解决了"看到什么"的问题。一个进程在自己的 namespace 里，以为自己独占了一整台机器。

但"以为"和"真的"之间有一道裂缝：

一个容器里的进程虽然看不到其他容器的进程，但它仍然能吃掉主机上 100% 的 CPU。它看到的内存是隔离的吗？不是——它调用 `malloc` 分配的内存来自同一个物理内存池。一个失控的容器可以把整台机器的内存吃光，触发 OOM killer，杀掉其他容器的进程。

**Namespace 是视觉上的隔离，cgroup 是物理上的隔离。**

如果 namespace 是隔墙（让你看不到邻居），cgroup 就是水电表（限制你能用多少水电）。没有水电表的公寓楼，一户人家开着水龙头不关，整栋楼都停水。

---

## Cgroup 是什么

Control Group（控制组）。它做一件事：**把一组进程绑在一起，对这组进程施加资源限制、优先级控制和审计。**

三个核心能力：

- **限制（Limit）**：这组进程最多用 512MB 内存、50% 的 CPU
- **优先级（Priority）**：CPU 繁忙时，A 组进程的优先级高于 B 组
- **审计（Accounting）**：这组进程实际用了多少 CPU 时间、多少内存

---

## 一段被忽略的历史

Cgroup 最早由 Google 工程师 Paul Menage 和 Rohit Seth 在 2006 年提出，最初叫 "process containers"。Google 内部早就在用类似的机制管理数据中心的进程——不是为了容器，而是为了**多租户资源隔离**。

这个出身很重要：cgroup 的设计目标从一开始就不是"让容器跑起来"，而是"在一台机器上公平地分配资源给成百上千的服务"。Docker 后来借用了它，但 cgroup 的设计视角比 Docker 宽得多。

---

## Cgroup v1 vs v2：一次重要的架构重构

### v1 的设计（2008）

v1 的核心概念是**层级（hierarchy）**。每个资源控制器（CPU、内存、IO...）有自己独立的层级树：

```
/sys/fs/cgroup/
├── cpu/
│   ├── docker/
│   │   ├── container_a/    ← CPU 限制
│   │   └── container_b/
│   └── ...
├── memory/
│   ├── docker/
│   │   ├── container_a/    ← 内存限制
│   │   └── container_b/
│   └── ...
├── blkio/
│   └── ...
└── ...
```

每个控制器的树是独立的。一个进程在 cpu 树里可以属于 group A，在 memory 树里属于 group B。

这导致了一个根本性的问题：**跨控制器的一致性很难保证。** 你想对一组进程同时限制 CPU 和内存，需要在两棵不同的树上分别操作，还要确保两边的进程成员一致。

### v2 的设计（2016，内核 4.5+）

v2 的核心决策：**只有一棵树，所有控制器共享。**

```
/sys/fs/cgroup/
├── docker/
│   ├── container_a/
│   │   ├── cgroup.controllers    ← 可用的控制器列表
│   │   ├── cpu.max               ← CPU 限制
│   │   ├── memory.max            ← 内存限制
│   │   └── io.max                ← IO 限制
│   └── container_b/
│       └── ...
└── ...
```

一个进程在树中只有一个位置，所有资源限制都在同一个节点上配置。

### 设计决策：为什么 v1 先选了多树？

因为各个控制器的开发者是不同的人，在不同的时间独立贡献的。CPU 控制器和内存控制器之间没有协调设计。每个人把自己的控制器做成独立的子系统，自然就形成了多棵树。

v2 是在看到了多树设计的痛苦之后做的统一。这是一个经典的**先分后合**的工程演化模式——先让各部分独立发展，积累够多经验后再统一架构。

---

## 关键控制器深入

### CPU 控制器

v2 中用 `cpu.max` 控制：

```bash
# 格式：quota period（微秒）
# 每 100ms 周期内，最多用 50ms 的 CPU
echo "50000 100000" > /sys/fs/cgroup/docker/container_a/cpu.max
```

这意味着这个 cgroup 里的进程，在每个 100ms 的时间窗口内，最多获得 50ms 的 CPU 时间。等效于 0.5 个 CPU 核。

`docker run --cpus=0.5` 设的就是这个。

一个微妙的点：这是**硬限制**。即使 CPU 完全空闲，这个 cgroup 的进程也不能超过 50ms/100ms。这和 `cpu.weight`（v2）/ `cpu.shares`（v1）不同——后者是**软限制**，只在 CPU 竞争时生效。

面试追问点：**什么时候用硬限制，什么时候用软限制？** 如果机器上只有一个容器，硬限制意味着浪费——CPU 闲着也不让用。但硬限制提供可预测性，适合延迟敏感的服务。

### Memory 控制器

```bash
# 限制最大内存为 256MB
echo "268435456" > /sys/fs/cgroup/docker/container_a/memory.max

# 查看当前实际使用
cat /sys/fs/cgroup/docker/container_a/memory.current
```

当 cgroup 的内存使用达到 `memory.max` 时，内核不是拒绝分配，而是先尝试回收（reclaim）——把不活跃的页面换出。如果回收后仍然不够，**触发 OOM killer，杀掉这个 cgroup 里的某个进程**。

这就是 Docker 容器被 OOM kill 的机制。不是 Docker 杀的，是内核的 cgroup memory 控制器杀的。

`memory.high` 是另一个阈值——超过它时不会被 kill，但会被积极回收，进程会变慢。这是一个"软天花板"，让进程感受到压力，而不是直接死亡。

### IO 控制器

```bash
# 限制对某个设备的读写带宽
# 格式：major:minor rbps=bytes/s wbps=bytes/s
echo "8:0 rbps=10485760 wbps=10485760" > /sys/fs/cgroup/docker/container_a/io.max
```

IO 隔离是 cgroup 中最难做好的部分。原因：Linux 的 IO 路径有多层缓存（page cache、块设备队列），cgroup 的限制在哪一层生效，决定了效果截然不同。

这也是为什么 `--blkio-weight` 在很多场景下"不起作用"——它限制的是直接 IO，而大多数读操作走的是 page cache，不走直接 IO 路径。

---

## Cgroup 的机制：一切都是文件

Cgroup 通过 **cgroupfs**（一个伪文件系统）暴露接口。所有操作都是读写文件：

```bash
# 创建一个 cgroup
mkdir /sys/fs/cgroup/my_group

# 把进程加入这个 cgroup
echo $PID > /sys/fs/cgroup/my_group/cgroup.procs

# 设置内存限制
echo "268435456" > /sys/fs/cgroup/my_group/memory.max

# 查看当前成员
cat /sys/fs/cgroup/my_group/cgroup.procs
```

没有特殊的系统调用，没有 API。就是 `echo` 和 `cat`。

这个设计决策值得停下来想一想：**为什么用文件系统接口，而不是系统调用？**

和 `/proc` 的哲学一致——在 Unix 的世界观里，文件是最通用的接口。任何语言、任何工具都能读写文件。用 shell 脚本就能管理 cgroup，不需要写 C 程序。

而且文件系统天然有层级结构，cgroup 的树形组织正好映射到目录的树形结构。`mkdir` 创建 cgroup，`rmdir` 删除 cgroup——语义完全吻合。

---

## Cgroup 与 Namespace 的关系

容易混淆的一点：cgroup 和 namespace 是正交的两个机制。

- **Namespace** 改变进程"看到"什么 → 感知层面的隔离
- **Cgroup** 限制进程"能用"多少 → 物理层面的限制

Docker 两者都用：先用 namespace 创建隔离的环境，再用 cgroup 限制资源用量。

但还有一个 **Cgroup namespace**（2016 年加入），它把 cgroup 本身也做了视图隔离——容器里的进程看到的 cgroup 根路径是 `/`，而不是主机上的 `/sys/fs/cgroup/docker/container_a/`。这让容器内的进程以为自己的 cgroup 就是根 cgroup。

---

## 面试中的关键叙述线

> "Namespace 让进程看到自己的世界，但不阻止它消耗共享资源。Cgroup 补上了这个缺口——它把一组进程绑在一起，然后对这组进程施加 CPU、内存、IO 等维度的限制。
>
> 它的设计经历了 v1（多树独立控制器）到 v2（单树统一控制器）的演进。v1 的多树来自各控制器独立开发的历史，v2 统一后解决了跨控制器一致性问题。
>
> 底层接口全部是文件系统——创建目录就是创建 cgroup，写文件就是配置限制，读文件就是查看状态。这是 Unix '一切皆文件'哲学的体现。"

---

## 留给你的问题

Docker 用 `--memory` 设置硬限制时，容器里的应用（比如 JVM）并不知道自己被限制了。JVM 默认按物理内存的比例设置堆大小。在一台 64GB 内存的机器上，容器限制了 1GB，但 JVM 以为自己有 64GB，可能会尝试分配 16GB 堆——然后被 OOM kill。

**为什么 cgroup 的内存限制对进程是"不可见的"？这是设计缺陷还是设计选择？如果让进程能感知到 cgroup 限制，需要改变什么？**

提示：想想 `/proc/meminfo` 在容器里显示的是什么。然后想想为什么 LXCFS 这个项目存在。
