# 146. LRU 缓存：哈希表与链表的联姻

## 1. 审题（Problem）

### 1.1 约束解码
设计一个 **LRU (Least Recently Used)** 缓存机制。
核心操作有两个：
1.  `get(key)`：如果存在，返回 value，并将该节点标记为“最近使用”。
2.  `put(key, value)`：插入或更新。如果容量满了，要驱逐“最久未使用”的节点。
**硬性要求**：两个操作的时间复杂度必须都是 **$O(1)$**。

### 1.2 边界陷阱
*   **空校验**：访问不存在的 key 返回 -1。
*   **容量为 0**：虽然题目约束 capacity >= 1，但在工程实现中要注意。
*   **更新已存在的 key**：这算作一次“使用”，需要更新 value 并移动到“最近使用”位置。
*   **驱逐逻辑**：当 `size > capacity` 时，必须删除最旧的那个。

### 1.3 问题归类
这是一个 **数据结构设计** 题。
*   用数组？插入删除是 $O(N)$。❌
*   用链表？查找是 $O(N)$。❌
*   用哈希表？查找是 $O(1)$，但没有顺序，无法知道谁是“最近”谁是“最久”。❌
我们需要把哈希表和链表结合起来——**哈希链表（LinkedHashMap）**。

## 2. 思维演化（Reasoning）

### 2.1 为什么需要“双向”链表？
我们需要一个队列来维护顺序：
*   队头：最近使用（Most Recently Used）。
*   队尾：最久未使用（Least Recently Used）。
当我们需要删除一个特定节点（比如更新了某个 key，或者使用了某个 key，需要把它移到队头）时：
*   **单向链表**：虽然可以通过 Map 找到该节点，但删除它需要知道它的 **前驱节点**。单向链表找前驱是 $O(N)$。
*   **双向链表**：节点自带 `prev` 指针，删除自身只需要 $O(1)$。
**结论**：必须用双向链表。

### 2.2 为什么需要哈希表？
链表虽然能维护顺序，但查找 key 对应的节点在哪里需要遍历。
为了实现 `get` 的 $O(1)$，我们需要一个 `Map<key, Node>`，直接定位到链表中的节点地址。

### 2.3 组合威力
*   **Map**：负责快速定位（索引）。
*   **DoubleList**：负责快速移动（数据组织）。
这就好比图书馆：
*   Map 是索引卡片，告诉你书在哪一架哪一层。
*   List 是书架，书本身按“阅读热度”排列。拿书（删除+插入）很快。

## 3. 直觉培养（Intuition）

### 3.1 虚拟头尾节点的智慧
在实现双向链表时，最烦的就是处理 NULL 指针。
比如删除最后一个节点，要判断 `tail` 是否为空；插入第一个节点，要判断 `head` 是否为空。
**技巧**：使用 `Dummy Head` 和 `Dummy Tail`。
*   初始化：`Head <-> Tail`
*   插入：永远插在 `Head` 和 `Head.next` 之间。
*   删除：永远是删除 `Tail.prev`（最久未使用）。
这样，真实的节点永远夹在两个哨兵之间，永远不用判断 NULL。

![LRU缓存动画](animation.mp4)

## 4. 代码实现（Solution）

```go
type LRUCache struct {
	capacity int
	cache    map[int]*DLinkedNode
	head     *DLinkedNode
	tail     *DLinkedNode
}

type DLinkedNode struct {
	key, value int
	prev, next *DLinkedNode
}

// 构造函数：初始化哈希表和双向链表（哨兵）
func Constructor(capacity int) LRUCache {
	l := LRUCache{
		capacity: capacity,
		cache:    map[int]*DLinkedNode{},
		head:     &DLinkedNode{},
		tail:     &DLinkedNode{},
	}
	// 连接哨兵
	l.head.next = l.tail
	l.tail.prev = l.head
	return l
}

func (this *LRUCache) Get(key int) int {
	if node, ok := this.cache[key]; ok {
		// 1. 命中，通过哈希表直接拿到节点
		// 2. 移到头部（先删再加）
		this.moveToHead(node)
		return node.value
	}
	return -1
}

func (this *LRUCache) Put(key int, value int) {
	if node, ok := this.cache[key]; ok {
		// 1. key 存在：更新值，移到头部
		node.value = value
		this.moveToHead(node)
	} else {
		// 2. key 不存在：创建新节点
		node := &DLinkedNode{key: key, value: value}
		this.cache[key] = node
		this.addToHead(node)
		
		// 3. 检查容量：如果超限，删除尾部
		if len(this.cache) > this.capacity {
			removed := this.removeTail()
			delete(this.cache, removed.key) // 别忘了删 Map
		}
	}
}

// --- 辅助函数：原子操作 ---

func (this *LRUCache) moveToHead(node *DLinkedNode) {
	this.removeNode(node)
	this.addToHead(node)
}

func (this *LRUCache) removeNode(node *DLinkedNode) {
	node.prev.next = node.next
	node.next.prev = node.prev
}

func (this *LRUCache) addToHead(node *DLinkedNode) {
	// 插入到 head 和 head.next 之间
	node.prev = this.head
	node.next = this.head.next
	this.head.next.prev = node
	this.head.next = node
}

func (this *LRUCache) removeTail() *DLinkedNode {
	node := this.tail.prev // tail 前面那个才是真正的末尾
	this.removeNode(node)
	return node
}
```

### 4.2 复杂度证明
*   **时间复杂度**: $O(1)$。Map 查找是 $O(1)$，链表指针操作是 $O(1)$。
*   **空间复杂度**: $O(capacity)$。存储最多 `capacity` 个节点。

### 4.3 易错点清单
1.  **Map 同步**：删除链表节点时，千万别忘了同步删除 `cache` 中的 key。我们在 `removeTail` 返回了被删节点，就是为了能在 `Put` 中执行 `delete(this.cache, removed.key)`。
2.  **双向连接**：在 `addToHead` 时，涉及 4 个指针的修改（新节点的前后，原 head.next 的前，head 的后），顺序不能乱，或者直接对着图写。
3.  **Key 的必要性**：链表节点 `DLinkedNode` 中必须存 `key`。为什么？因为在 `removeTail` 时，我们需要根据链表淘汰的节点找到 Map 中的 key 并删除。如果节点里只有 value，Map 就删不掉了（Map 是单向的）。

## 5. 融会贯通（Mastery）

### 5.1 变体题群
| 题目 | 变化点 | 解法调整 |
| :--- | :--- | :--- |
| **146. LRU** | 最近最少使用 | Hash + DoubleList |
| **460. LFU** | 最不经常使用（按频率） | 两个 Hash，一个存 KV，一个存 Freq->List。逻辑非常复杂，面试通常只考 LRU |
| **Redis LRU** | 近似 LRU | 随机采样几个 key，淘汰最旧的。因为维护双向链表太耗内存。 |

### 5.2 模式识别
当题目要求：
1.  **Key-Value 存储**
2.  **有时序或优先级要求**（最近使用、最大、最小）
3.  **$O(1)$ 操作**
这就暗示需要 **哈希表**（解决查找） + **链表/树**（解决顺序）。
*   如果要 $O(1)$ 查找最值 -> Hash + 双向链表（LRU）
*   如果要 $O(\log n)$ 范围查找 -> Hash + 跳表/红黑树
