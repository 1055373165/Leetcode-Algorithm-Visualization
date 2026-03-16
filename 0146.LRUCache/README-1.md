# 146. LRU 缓存 (LRU Cache)

表面上看，这道题要求我们模拟一种名为“最近最少使用”的缓存淘汰策略。但从数据结构操作的本质来看，我们需要设计一个容器，能够同时满足三种严苛的需求：以 $O(1)$ 的代价寻址并读取任意键对应的数据、以 $O(1)$ 的代价将被访问的数据标记为“最新”，以及在容量写满时，以 $O(1)$ 的代价精准抛弃掉“最旧”的数据。这道题的核心矛盾在于：无序的集合查询快但无法维护“年龄时间线”，而有严格顺序的结构能维持年龄，却往往难以在极低成本下被打乱重排。

### 为什么联想与锁定这种解法？

解这道题的第一视角，必须紧紧咬住题目给定的约束条件：平均时间复杂度为 $O(1)$。
看到 $O(1)$ 查询，我们别无选择，瞬间被锚定必须引入“哈希表”；而 $O(1)$ 淘汰和更新状态又意味着，我们不能让元素按照插入的时间被锁死，而是必须随访问动态调整位置。什么样的结构能做到 $O(1)$ 被任意中间剥离、头尾插入，并且还能维持时间线顺序？单链表不行（寻找前驱需要遍历），数组不行（中间删除引发行列搬家），唯有**双向链表**。这种根据绝对约束的层层锁死推导，决定了“哈希表 + 双向链表（LinkedHashMap 原型）”不是一种天才的灵光一现，而是两个极值需求交合时的必然产物。

### 朴素思路与根本瓶颈

最直觉的想法可能是维持一个哈希映射表，再另外维护一个数组，里面存储每个 key 最后被访问的时间戳。这非常符合人类大脑对“最近没用过”的直观理解。但问题是，一旦容量达到阈值，你必须进行全量扫描比对才能找出那个时间戳最小（最老）的家伙，这就将原本期待极速的缓存操作拖垮为了 $O(N)$。

如果使用普通动态数组将元素本身排队，一旦排在中间的元素被触碰了，你把它剥离提取出来放到队首，依然会使其后的所有数据整体向前平移挪动，同样是严重的卡顿瓶颈。这暗示了我们：通往极速的终点，是不需要底层执行大动干戈的物理内存连续平移，我们需要只改变“拓扑指向”就能变换队伍位置的功能机构。

### 破局的关键思维转折点

真正彻底解构这道题的思维转折点，是重新理解哈希表存放价值的方式——**哈希表不仅能存储简单的值对象，它更可以存储直接指向双向链表节点的内存地址（指针）。**

一旦你突破了这一层理解，这套机制就运转如飞了：哈希表提供雷达坐标，双向链表执行原点空降。当你想获取一个元素，哈希表带你瞬间穿越到该元素节点在链表里的位置；并且因为它是双向链表，自身就保存了“前驱”和“后继”的内存地址，它便可以不假思索地在原地剪断关系，自己把自己从当前老化队伍中摘出来，“空降”并缝合到代表新生最热的“链表头部”。

### 推荐解法与状态设计的合理性

这就是通常在工程界里大名鼎鼎的 LinkedHashMap 原型实现。
在这个推荐解法中，最高明的一点是我们引入了极具统筹意义的设计手段：配置两个永远不含有效数据、也绝不被淘汰的占位符——**虚拟头节点（Dummy Head）和虚拟尾节点（Dummy Tail）**。

我们将紧贴 Dummy Head 后面的节点定义为“绝对最新”，而紧靠 Dummy Tail 前面那个老弱病残节点定义为“绝对最旧”。
为什么这种指针和边界移动无懈可击？
1. 它用虚拟墙隔离了所有“当前链表空空如也”、“只剩一个独苗”等恶心的空指针问题（`nil` panic），所有的脱链操作统一可以化简为 `n.prev.next = n.next; n.next.prev = n.prev`。
2. 因为系统有着铁律般的操作规程：任何一次新增或者老数据被触磁访问，无一例外地都执行一发强硬的“摘除 + 强行挂接到虚拟头后方”。只要坚守这条流水线，根本不可能出现由于逻辑分支漏算而导致冷热倒挂。最老的废弃数据，顺其自然就随着时间沉淀堆积在尾部护城墙（Dummy Tail）的最前侧。

### 复杂度的真实来源

- **时间复杂度**：$O(1)$，纯粹到极致的常量时间。由于哈希表的寻址路由开销是基于常数次映射的摊还 $O(1)$。随后的链表手术阶段，不管是移动到头、新挂到头、还是淘汰老尾结点，在计算机内部执行的仅仅只是不超过 10 次的地址指针赋值替换（如 `a.next = b`），没有任何随着数据体积 N 不同而增加的循环。
- **空间复杂度**：$O(\text{capacity})$。每个被准入的实体，它占用了哈希表里的一个映射 Key，同时分配了一个节点对象的结构体容器承载前后指针。这种空间伸缩是严格遵照你的 capacity 线性生长的。

### 思路推演验证

让我们在一个 `capacity = 2` 的微缩沙盘上，用最代表核心机制的动作演示运行轨迹：

1. **执行 `put(1, 1)`**
   新数据来到，装入新节点 `[1:1]` 并挂在最新位。
   链表格局：`Head <-> [1:1] <-> Tail`，而在暗处，字典 `map[1]` 已悄悄拴牢了这颗节点。
2. **执行 `put(2, 2)`**
   新客临门，老顾客让位。
   链表格局：`Head <-> [2:2] <-> [1:1] <-> Tail`，字典 `map[2]` 登记在案。
3. **执行 `get(1)`** （**这是检验运转的最关键一步**）
   哈希表依据 key 1 拿到 `[1:1]` 节点坐标。剥除原来在尾部的链，直接传送到当红烫手区域（头部）。
   链表格局骤变：`Head <-> [1:1] <-> [2:2] <-> Tail`。（此时 1 夺回新鲜热度宝座，而刚才处于第一的 2 顺势老去一位）。
4. **执行 `put(3, 3)`** （触发满载抛弃规则！）
   此时记录数量超出限制。首先将死亡准星对准 `Tail.prev`，也就上面已经被冷落的 `[2:2]`。
   我们必须将其粉碎并踢出内存，但在这之前需要清理门户：**这里就揭示了最常见的陷阱**。如果不看 `[2:2]` 这个节点内部储存的 key 是什么，你拿着它的值 2 回到茫茫字典里，依然不知道该移除哪一条哈希链。所以必须要利用 `[2:2]` 里带有的那个原生 key 坐标发起呼叫：`delete(map, 2)` 销户。
   然后才是 `[3:3]` 顺利继位：`Head <-> [3:3] <-> [1:1] <-> Tail`。

### 实现的最易错点

1. **链表节点忘存 Key：** 许多有实现经验的人在写双端链表算法时，都喜欢节点主体只包裹个 `Value`。但到了 LRU，因为需要在淘汰时去同步削删 Map，仅有 value 是找不到原来的访问路标（key）的，导致抛弃过程在此卡死。**因此节点里面必须要以双摄形态记录（既存 Key 又存 Value）**。
2. **职责模糊的函数堆叠：** 切割移动节点的手术太容易出意外了，必须严防死守。千万要用剥离后的 `remove(node)` 与挂载专用的 `insertHead(node)` 两个纯粹原语将功能拆分开，不要手写揉进判断逻辑里进行合并，那往往是一段在面试现场永远理不清的迷魂阵。

### 方法论的可迁移性与演变

一旦你建立起这套“哈希充当 $O(1)$ 空间跃迁罗盘 + 链表负责 $O(1)$ 局部拓扑维系”的“复合件思路”，许多地狱算法就瞬间迎刃而解：
比如同宗兄弟 460 题 (LFU 缓存机制)，当你发现不仅仅需要记录时间新旧，更还要根据使用频率做分层淘汰时，只需让最初始的那张哈希频控表，指向很多条互相隔离的 LRU 二级双向链表簇就可以了。432 题也是基于该模型演进的数据体系。

### Go 常规题解实现思路

下面是以 Go 的习惯呈现的最推荐常规解法结构，没有炫技，没有造作，所有的设计职责泾渭分明。

```go
// 必须同时承载 key 与 val
type node struct {
    key, val   int
    prev, next *node
}

type LRUCache struct {
    capacity int
    cache    map[int]*node
    head     *node
    tail     *node
}

func Constructor(capacity int) LRUCache {
    l := LRUCache{
        capacity: capacity,
        cache:    make(map[int]*node, capacity),
        head:     &node{},
        tail:     &node{},
    }
    // 牢牢锁死隔离边界的虚拟头尾闭环
    l.head.next = l.tail
    l.tail.prev = l.head
    return l
}

func (this *LRUCache) Get(key int) int {
    if n, ok := this.cache[key]; ok {
        this.moveToHead(n) // 取出就热烫一遍
        return n.val
    }
    return -1
}

func (this *LRUCache) Put(key int, value int) {
    if n, ok := this.cache[key]; ok {
        n.val = value
        this.moveToHead(n) // 若已存在，则只是数值翻新，地位拔升
        return
    }

    // 这是一个没有碰见过的新面孔
    newNode := &node{key: key, val: value}
    this.cache[key] = newNode
    this.insertHead(newNode)

    // 清算是否发生溢出满载的情况
    if len(this.cache) > this.capacity {
        lruNode := this.tail.prev
        this.removeNode(lruNode)
        // 从目录网将其永远抹去
        delete(this.cache, lruNode.key)
    }
}

// ================= 底层链表原语抽象 =================

// 将节点从其所在的原有位置无痕剥离
func (this *LRUCache) removeNode(n *node) {
    n.prev.next = n.next
    n.next.prev = n.prev
}

// 将任意游离节点强制塞入虚拟头节点之后（享受最热待遇）
func (this *LRUCache) insertHead(n *node) {
    n.prev = this.head
    n.next = this.head.next
    
    this.head.next.prev = n
    this.head.next = n
}

// 复合动作封装：连根拔起 + 挪到人前
func (this *LRUCache) moveToHead(n *node) {
    this.removeNode(n)
    this.insertHead(n)
}
```

---

### 进阶实现视角：工业级榨取底线篇

上述解法在绝大多数后端工程师笔试与日常应用领域就已经是最干净的满分标准件了。**但如果这里是一场最极端的角力赛场——例如你在开发数据库底层页缓冲模块（Page Cache）、亦或像 Fasthttp/GroupCache 等等超高吞吐协议扫描网关的核心骨骼——那么原教旨主义的指针满天飞就会显露致命缺陷。**

**优化究竟到底在切除什么？**
当我们按照常规法执行着无数次 `newNode := &node{}` 进行内存开户以及对应的移除抛弃操作时，这种无边际不可预测的在 Heap（堆）上的微末碎片分配行为，有两个巨大原罪：
1. **毁灭级的局部缓存（Cache Locality）坍塌**：随着零碎空间碎片化分配，本该相邻紧凑的数据结构会在内存中四溅横飞。当你通过指针连环穿越顺手查找的时候，由于物理距离隔离，本可以提前预置命中的 CPU L1/L2 高速缓存将频频阻断（Cache Miss）。
2. **GC 噩梦的催化剂**：你堆叠了极其庞大数量的存活小对象结构时，无论释放还是轮询扫描存活链条，都将把 Go 的垃圾回收协程拉入沉重的标记清理消耗战。

**颠覆改造方案：内存池直配与静态索引表征**
既然这道题已经提供了永远铁打定长的 `capacity` 上限尺度。那么，我们要杜绝堆区对象新建的过程。这种工程范式的颠覆表现为：我们提前、强制并在生命周期之初就预申请完整条连续内存的数组，也就是一块专供节点生存的水泥楼地盘。随后抛掉原生指针不用，全面退化到**以物理门牌号——也就是数组整型切片的“索引 Index”去交织前后的引诱（类似于上古时期的静态链表）。**

这换回来了两件事：**零分配（Zero Array Object Allocation）**与绝对整齐划一具备超高读取预判规律内存簇列。
我们只需付出代价——放弃动态伸缩功能并换来些许抽象失真的可读性成本：

```go
// 进阶分配自由（Allocation-Free）静态数组池写法
type staticNode struct {
	key, val   int
	prev, next int // 用单纯的 int 索引代替实打实的地址指针
}

type LRUCacheOptimized struct {
	capacity int
	cache    map[int]int  // value 是存放 nodes 连续数组中的索引
	nodes    []staticNode // 核心武器：预分配出击内存池
	
	head, tail int
	freeList   int        // 管理那些因为被淘汰而中途闲置空洞下来的可复用数组下标链
}

func ConstructorOptimized(capacity int) LRUCacheOptimized {
	poolSize := capacity + 2 // 补偿预留给 2 席虚拟化边界的坑位
	l := LRUCacheOptimized{
		capacity: capacity,
		cache:    make(map[int]int, capacity),
		nodes:    make([]staticNode, poolSize), 
		head:     0,              // 索引 0 代表绝对头边界
		tail:     poolSize - 1,   // 最高索引用作绝对尾护城河
		freeList: 1,              // 未开发的处女地从 1 开始
	}
	
	l.nodes[l.head].next = l.tail
	l.nodes[l.tail].prev = l.head
	
	// 初始化空闲链条编织（将初始所有待填充物理坑位排号串烧起来）
	for i := 1; i < poolSize-1; i++ {
		l.nodes[i].next = i + 1
	}
	// 踩死最后的哨兵标示为枯竭：-1
	l.nodes[poolSize-2].next = -1
	
	return l
}

func (this *LRUCacheOptimized) Get(key int) int {
	if idx, ok := this.cache[key]; ok {
		this.moveToHead(idx)
		return this.nodes[idx].val
	}
	return -1
}

func (this *LRUCacheOptimized) Put(key int, value int) {
	if idx, ok := this.cache[key]; ok {
		this.nodes[idx].val = value
		this.moveToHead(idx)
		return
	}

	// 缓存容量满溢时，我们强制占领最老住户的物理房间号
	if len(this.cache) == this.capacity {
		lruIdx := this.nodes[this.tail].prev
		this.removeNode(lruIdx)
		delete(this.cache, this.nodes[lruIdx].key)
		
		// 房间扫空后归还空闲挂牌调度表，下文即刻便可复用
		this.nodes[lruIdx].next = this.freeList
		this.freeList = lruIdx
	}

	// 此时必然从备用空闲连线里合法拉出新的房源（可能是新资源位，也可能是刚刚被没收腾挪出的死链）
	newIdx := this.freeList
	this.freeList = this.nodes[newIdx].next 
	
	this.nodes[newIdx].key = key
	this.nodes[newIdx].val = value
	this.cache[key] = newIdx
	this.insertHead(newIdx)
}

func (this *LRUCacheOptimized) removeNode(idx int) {
	prev := this.nodes[idx].prev
	next := this.nodes[idx].next
	this.nodes[prev].next = next
	this.nodes[next].prev = prev
}

func (this *LRUCacheOptimized) insertHead(idx int) {
	prev := this.head
	next := this.nodes[this.head].next
	
	this.nodes[idx].prev = prev
	this.nodes[idx].next = next
	this.nodes[prev].next = idx
	this.nodes[next].prev = idx
}

func (this *LRUCacheOptimized) moveToHead(idx int) {
	this.removeNode(idx)
	this.insertHead(idx)
}
```
当一名工程师决定舍弃原生指针语法糖的庇护，以内存和索引布局换回不带毛刺的心跳极致图层重构时。他不仅仅是在为了某道题目通关，这其实便已触类旁通揭开了为何有些组件能顶住 C100k 压力不丢包的底层基因面具。对于什么时候应该止步于常规的双链表封装可读性、什么时候必须向底层死磕发起性能极限优化索要毫秒红利，才是区别算法套路熟练者与技术专家的重要鸿沟。
