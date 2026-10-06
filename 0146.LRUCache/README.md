# 146. LRU 缓存

## 1. 30 秒面试回答

这题是**数据结构设计题**。最优解是 `哈希表 + 双向链表`：哈希表负责 `O(1)` 定位 key，对应节点在链表中的位置；双向链表维护最近使用顺序，头部是 MRU，尾部是 LRU。`get` 命中后把节点移到头部，`put` 插入或更新后也移到头部，超容量时淘汰尾部。时间复杂度平均 `O(1)`，因为每次操作只做一次哈希查询和常数次链表摘除/插入；空间 `O(capacity)`。

## 2. 我第一眼应该先想到什么

- **信号词**：`设计缓存`、`get/put`、`最近最少使用`、`两个操作都要 O(1)`
- **为什么这些信号会把人引向这个解法**：你既要按 key 随机访问，又要维护“新旧顺序”，而且还要常数时间删除中间节点和淘汰尾部
- **第一次做最自然的暴力起点**：`map + 时间戳`，每次访问更新时间，容量满了扫描最老的 key
- **暴力真正慢在哪里**：淘汰时必须全表找最小时间戳，是 `O(n)`；如果用数组维护顺序，中间元素被访问后移到头部也要整体搬移，还是 `O(n)`

## 3. 核心洞察

### 面试官想考什么

面试官想看你能不能把两个互相冲突的需求拼起来：

- `按 key O(1) 找到元素`
- `按最近使用顺序 O(1) 调整位置 / 淘汰尾部`

这本质上是在考你会不会把**索引结构**和**顺序结构**解耦。

### 面试官期望解 vs 快速稳妥解

在 Go 语境里，这两者**本质上是同一个解法**，只是在链表这一层是“手写”还是“用标准库 `container/list`”：

- **最优解**：`map + doubly linked list`
- **面试时推荐策略**：先口头说清“哈希表 + 双向链表 + 头新尾旧”的机制；写代码时主推 `container/list` 版本，更稳；如果面试官追问底层，再把 `list.List` 换成手写哨兵双向链表

### 最关键的不变量

- 哈希表中每个 `key` 都唯一映射到链表中的一个节点
- 链表从前到后表示 `最近使用 -> 最久未使用`
- 每次 `get` 命中或 `put` 更新/插入后，该节点都必须成为头部
- 真正要淘汰的节点，永远是尾部

### 为什么它是这题的命门

因为题目不是单纯考“缓存”，而是在考：**你能不能在 O(1) 内同时解决“定位”和“重排”**。  
单独一个结构都不够，必须组合。

### 为什么这样设计不会漏解

因为所有活跃 key 都同时存在于两处：

- map 负责“能找到”
- 链表负责“知道冷热”

节点每次被访问就立刻移到头部，所以尾部始终保持“最久未使用”的语义，不会淘汰错人。

### 为什么容易误判成别的相邻题型

- **容易误判成队列**：队列只能删头尾，删中间节点不行
- **容易误判成堆 / 优先队列**：能找到最老的，但更新一个 key 的“最近时间”不是 `O(1)`
- **容易误判成单链表**：找到节点后，删它还需要前驱，仍然不是 `O(1)`

## 4. 最优解怎么一步步长出来

1. **暴力起点**  
   用 `map[key] = value` 存值，再配一个时间戳或数组记录冷热

2. **瓶颈**  
   淘汰最老元素要扫描；命中一个中间元素后挪到最新位置要搬移

3. **观察到的规律**  
   这题所有复杂操作，最终都可以归结成两种常数动作：
   - 通过 key 立刻找到节点
   - 把节点从当前位置摘掉，再插到头部

4. **如何利用规律进入最优解**  
   哈希表解决“找节点”，双向链表解决“摘节点 / 插头部 / 删尾部”

### 最容易想错的思维岔路

**岔路**：用单链表维护顺序，因为“尾删好像也很方便”。

错在这里：`get(key)` 命中的是中间节点，你要把它移到头部，单链表没有前驱就没法 `O(1)` 删除它。

## 5. 手推一个关键样例

统一样例：

- `capacity = 2`
- 操作序列：`put(1,1), put(2,2), get(1), put(3,3), get(2), put(4,4), get(1), get(3), get(4)`

链表顺序统一记为：`[MRU ... LRU]`

| 关键时刻 | 操作 | 链表顺序 | 说明 |
|---|---|---|---|
| 1 | `put(1,1)` | `[1]` | 新节点插头部 |
| 2 | `put(2,2)` | `[2,1]` | 2 最新，1 变旧 |
| 3 | `get(1)` | `[1,2]` | 命中 1，移到头部 |
| 4 | `put(3,3)` | `[3,1]` | 容量满，淘汰尾部 2 |
| 5 | `get(2)` | `[3,1]` | 2 已被淘汰，返回 `-1` |
| 6 | `put(4,4)` | `[4,3]` | 容量满，淘汰尾部 1 |
| 7 | `get(3)` | `[3,4]` | 命中 3，移到头部 |
| 8 | `get(4)` | `[4,3]` | 命中 4，移到头部 |

这里最关键的两个转折：

- `get(1)` 不是“只返回值”，而是“返回值 + 刷新冷热”
- `put(3,3)` / `put(4,4)` 不是随机淘汰，而是**必淘汰尾部**

## 6. ASCII 状态转移图

同样使用样例：

```text
Frame 1: 执行 put(1,1), put(2,2) 后

map   : {1 -> node1, 2 -> node2}
list  : HEAD <-> [2] <-> [1] <-> TAIL
state : front = MRU, back = LRU

说明：2 是最新，1 是最旧。


Frame 2: 执行 get(1)

map   : {1 -> node1, 2 -> node2}
list  : HEAD <-> [1] <-> [2] <-> TAIL
ret   : 1

说明：命中 key=1 后，node1 从尾部摘下并插到头部。


Frame 3: 执行 put(3,3)

map   : {1 -> node1, 3 -> node3}
list  : HEAD <-> [3] <-> [1] <-> TAIL
evict : [2]

说明：容量满时，尾部 [2] 一定是 LRU，所以先删 2，再把 3 放到头部。


Frame 4: 执行 put(4,4), get(3), get(4)

put(4,4) 后:
list  : HEAD <-> [4] <-> [3] <-> TAIL
evict : [1]

get(3) 后:
list  : HEAD <-> [3] <-> [4] <-> TAIL

get(4) 后:
list  : HEAD <-> [4] <-> [3] <-> TAIL

说明：每次命中都刷新到头部，尾部语义始终保持正确。
```

## 7. 最优解视频生成方案

- **视频目标**：让人看懂 LRU 的真正机制不是“记住模板”，而是“命中要移头、超容要删尾，map 只是帮你瞬间定位节点”
- **视觉映射**：
  - HashMap：右侧卡片展示 `key -> node`
  - 双向链表：中间从 `HEAD` 到 `TAIL`，前端标 `MRU`，尾端标 `LRU`
  - 当前操作：顶部大号操作条，例如 `get(1)`、`put(3,3)`
  - 淘汰节点：红色高亮
- **镜头拆分**：
  1. 初始化并插入 `1`、`2`
  2. `get(1)`：命中并移到头部
  3. `put(3,3)`：容量满，淘汰尾部 `2`
  4. `put(4,4)`：再次淘汰尾部 `1`
  5. `get(3)` / `get(4)`：连续刷新热点
- **step 数据字段**：
  - `operation`
  - `capacity`
  - `size`
  - `nodes`（按 MRU -> LRU 顺序）
  - `activeKey`
  - `victimKey`
  - `newKey`
  - `result`
  - `actionLabel`
  - `what`
  - `why`
  - `invariant`
  - `progress`
- **节奏建议**：
  - 总时长约 30 秒
  - 每步 2.5 秒
  - `put(3,3)` 和 `put(4,4)` 的淘汰镜头放慢，突出“删尾”的决策

### 实际生成的 Remotion 代码

- Composition: [algo-visualizer/src/compositions/LRUCache.tsx](/Users/smy/project/algorithm/algo-visualizer/src/compositions/LRUCache.tsx)
- Visualizer: [algo-visualizer/src/components/LRUCacheVisualizer.tsx](/Users/smy/project/algorithm/algo-visualizer/src/components/LRUCacheVisualizer.tsx)
- 注册入口: [algo-visualizer/src/index.tsx](/Users/smy/project/algorithm/algo-visualizer/src/index.tsx)

### 渲染命令

```bash
npx remotion render src/index.tsx LRUCache --output ../0146.LRUCache/animation.mp4
```

## 8. Go 代码

### 解法一：快速稳妥解（`container/list`）

```go
import "container/list"

type entry struct {
	key   int
	value int
}

type LRUCache struct {
	capacity int
	items    map[int]*list.Element
	order    *list.List // Front = MRU, Back = LRU
}

func Constructor(capacity int) LRUCache {
	return LRUCache{
		capacity: capacity,
		items:    make(map[int]*list.Element, capacity),
		order:    list.New(),
	}
}

func (c *LRUCache) Get(key int) int {
	e, ok := c.items[key]
	if !ok {
		return -1
	}
	c.order.MoveToFront(e)
	return e.Value.(*entry).value
}

func (c *LRUCache) Put(key int, value int) {
	if c.capacity == 0 {
		return
	}

	if e, ok := c.items[key]; ok {
		kv := e.Value.(*entry)
		kv.value = value
		c.order.MoveToFront(e)
		return
	}

	if len(c.items) == c.capacity {
		back := c.order.Back()
		kv := back.Value.(*entry)
		delete(c.items, kv.key)
		c.order.Remove(back)
	}

	c.items[key] = c.order.PushFront(&entry{key: key, value: value})
}
```

### 为什么主推这版

- 在 Go 里更稳，更适合面试现场一次写对
- 代码依然完整体现了 `map + doubly linked list` 的核心机制
- 关键动作只有 3 个：`MoveToFront`、`Remove`、`PushFront`

### 解法二：手写双向链表版

```go
type node struct {
	key   int
	value int
	prev  *node
	next  *node
}

type LRUCache struct {
	capacity int
	items    map[int]*node
	head     *node // dummy head, head.next is MRU
	tail     *node // dummy tail, tail.prev is LRU
}

func Constructor(capacity int) LRUCache {
	head := &node{}
	tail := &node{}
	head.next = tail
	tail.prev = head

	return LRUCache{
		capacity: capacity,
		items:    make(map[int]*node, capacity),
		head:     head,
		tail:     tail,
	}
}

func (c *LRUCache) Get(key int) int {
	n, ok := c.items[key]
	if !ok {
		return -1
	}
	c.moveToFront(n)
	return n.value
}

func (c *LRUCache) Put(key int, value int) {
	if c.capacity == 0 {
		return
	}

	if n, ok := c.items[key]; ok {
		n.value = value
		c.moveToFront(n)
		return
	}

	if len(c.items) == c.capacity {
		last := c.removeLast()
		delete(c.items, last.key)
	}

	n := &node{key: key, value: value}
	c.items[key] = n
	c.addFirst(n)
}

func (c *LRUCache) addFirst(n *node) {
	n.prev = c.head
	n.next = c.head.next
	c.head.next.prev = n
	c.head.next = n
}

func (c *LRUCache) remove(n *node) {
	n.prev.next = n.next
	n.next.prev = n.prev
}

func (c *LRUCache) moveToFront(n *node) {
	c.remove(n)
	c.addFirst(n)
}

func (c *LRUCache) removeLast() *node {
	n := c.tail.prev
	c.remove(n)
	return n
}
```

### 什么时候要切到手写版

- 面试官明确说“不要用标准库容器”
- 面试官追问你是否真的理解双向链表的 `O(1)` 摘除 / 插入
- 题目本身就在考“特殊数据结构的内部实现”，而不是只考会不会调用 API

### 两版的本质关系

- `container/list` 版更适合现场稳定写对
- 手写版更能直接展示你对哨兵节点、前后指针和尾删逻辑的掌控
- 真正不能丢的是**机制**：`map` 找节点，双向链表排冷热，命中移头，超容删尾

## 9. 最容易写错的地方

1. **`get` 命中后忘了移到头部**  
   这是最常见的逻辑 bug。返回值对了，但冷热顺序错了

2. **更新已有 key 时只改 value，不刷新位置**  
   `put` 命中旧 key 也算一次使用，必须变成 MRU

3. **淘汰尾部后忘删 map**  
   链表里删了，map 里还留着脏指针，后续 `get` 会读到幽灵节点

4. **链表方向记反**  
   一定统一口径：`Front = MRU`，`Back = LRU`

5. **节点里不存 key**  
   淘汰尾节点时，map 删除需要 key；如果节点里没有 key，就没法 `delete(items, key)`

## 10. 相邻题迁移

### 1. 460. LFU 缓存

- **共用骨架**：都是 `key -> 节点` 的快速定位 + 链表维护局部顺序
- **关键不同**：LRU 只按“最近性”排；LFU 先按“频次”分层，再在同频内按最近性排
- **该改哪一层**：保留 `map + list` 组合思维，只是把“一条链表”升级成“freq -> 多条链表”

### 2. 432. 全 O(1) 的数据结构

- **共用骨架**：哈希表定位 + 双向链表维护有序状态
- **关键不同**：节点不再是单个 key，而是“某个频次桶”
- **该改哪一层**：保留“节点可 O(1) 摘除和插入”的链表骨架，把节点语义从缓存项换成计数桶

### 3. 380. O(1) 时间插入、删除和获取随机元素

- **共用骨架**：也是设计题，也是 `O(1)` 强约束
- **关键不同**：380 不要求维护冷热顺序，所以不需要链表，改成 `map + slice + swap-delete`
- **该改哪一层**：保留“索引结构 + 主存结构分离”的思维，但把“顺序结构”从双向链表换成数组

## 11. 闭卷自测

1. 为什么这题不能只用 `map`？
2. 为什么这里必须是**双向**链表，而不是单链表？
3. `get` 和 `put` 命中旧 key 时，链表上必须做什么动作？
4. 为什么尾部一定就是应该被淘汰的节点？
5. 如果我把 `Front/MRU` 和 `Back/LRU` 的定义反过来，代码要改哪几层？

## 12. 复盘卡

```text
题型信号：设计缓存 + 最近最少使用 + get/put 都要 O(1)
核心不变量：map 定位节点，链表维护 MRU -> LRU，命中后移头，超容删尾
最关键转折：问题不是“怎么存值”，而是“怎么在 O(1) 内同时定位和重排”
最易错点：get/put 命中旧 key 后忘记刷新到头部；淘汰尾部后忘删 map
一句话口诀：map 负责找，双链表负责排；命中就移头，超容就删尾
```
