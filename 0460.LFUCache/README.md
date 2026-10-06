# 460. LFU Cache

## 1. 30 秒面试回答

这题属于**复合数据结构设计**模式。核心是用三层映射：`keyMap` O(1) 定位节点，`freqMap` 把相同频次的节点组织成各自的双向链表（链表内部按 LRU 排列），`minFreq` 追踪当前最小频次。每次 get/put 命中已有 key 时，频次 +1 并把节点从旧频次链表摘到新频次链表；容量满时，从 `freqMap[minFreq]` 的尾部淘汰。时间 O(1)：每次操作只做常数次 map 查找 + 链表摘挂。空间 O(capacity)。

---

## 2. 我第一眼应该先想到什么

**信号词**：「最不经常使用」「频次最低」「频次相同时淘汰最久未使用的」。

- 出现"频次"就不是 LRU——LRU 只看访问时间顺序，而 LFU 需要额外维护每个 key 的计数器。
- "频次相同时按 LRU 淘汰"意味着**同频次内部还需要 LRU 顺序**。

**暴力起点**：每个 key 存 `(value, freq, lastUsedTimestamp)`，淘汰时遍历所有 key 找 `min(freq)`，同频再比时间戳。get O(1) 但 put 淘汰 O(n)。

**暴力慢在哪**：淘汰时需要线性扫描所有 key 才能找到最小频次，这一步是 O(n)。

---

## 3. 核心洞察

**命门：「频次分桶 + 桶内 LRU + minFreq 指针」三者联动。**

1. **频次分桶**：`freqMap[f]` 是一个双向链表，里面所有节点当前频次都是 `f`。这样"找到频次最低的一组节点"只需要 `freqMap[minFreq]`，O(1)。
2. **桶内 LRU**：每个桶就是一个小型 LRU 链表——新来的/刚被访问的放头部，淘汰时从尾部摘。解决了"同频次时淘汰最久未使用"。
3. **minFreq 追踪**：这是唯一容易出 bug 的状态。更新规则只有两条：
   - **插入新 key** → `minFreq = 1`（新 key 频次一定是 1，不可能更小）
   - **节点从 freq f 升到 f+1 后，如果 `freqMap[f]` 变空且 `f == minFreq`** → `minFreq++`

**为什么不会漏解**：每个节点的频次只增不减，minFreq 的维护只在两个精确时刻更新，不存在"中间状态"。

**为什么容易和 LRU 搞混**：LRU 只有一条链表管全局顺序，LFU 有 N 条链表（每个频次一条），再加一个 minFreq 指针。从 LRU 迁移过来时，最大的思维跳跃是"链表不再是全局的，而是按频次分桶的"。

---

## 4. 最优解怎么一步步长出来

1. **暴力**：map 存 `{val, freq, time}`，淘汰时 O(n) 扫描
2. **瓶颈**：扫描所有 key 找最小频次太慢
3. **观察**：频次是离散的正整数，可以用 `freqMap[f]` 把同频次节点归到一起；只要维护 `minFreq`，淘汰就变成 O(1)
4. **最优解**：三层结构 `keyMap + freqMap + minFreq`

**最容易想错的思维岔路**：试图用一个 min-heap 维护频次。heap 的问题是：更新已有 key 的频次后无法 O(1) 调整堆内位置（decrease-key 在普通二叉堆是 O(n) 的），且同频次 LRU 淘汰在 heap 里很难表达。

---

## 5. 手推一个关键样例

**样例**：`capacity = 2`

```
操作序列：LFUCache(2), put(1,10), put(2,20), get(1), put(3,30), get(2), get(3)
```

| 步骤 | 操作 | keyMap | freqMap | minFreq | 返回 | 关键事件 |
|------|------|--------|---------|---------|------|---------|
| 1 | put(1,10) | {1} | f1:[1] | 1 | - | 新 key，freq=1，minFreq=1 |
| 2 | put(2,20) | {1,2} | f1:[2,1] | 1 | - | key 2 插入 f1 链表头部 |
| 3 | get(1) | {1,2} | f1:[2], f2:[1] | 1 | 10 | key 1 频次 1→2，从 f1 摘到 f2；f1 非空，minFreq 不变 |
| 4 | put(3,30) | {1,3} | f1:[3], f2:[1] | 1 | - | **容量满 → 淘汰 freqMap[minFreq=1] 尾部 = key 2；插入 key 3，freq=1，minFreq=1** |
| 5 | get(2) | {1,3} | f1:[3], f2:[1] | 1 | -1 | key 2 已被淘汰，miss |
| 6 | get(3) | {1,3} | f2:[3,1] | 2 | 30 | key 3 频次 1→2，从 f1 摘到 f2 头部；**f1 变空且 minFreq==1 → minFreq=2** |

**关键转折**：步骤 4 展示了 LFU 的核心机制——淘汰的不是最近没碰的（那是 LRU），而是频次最低的 key 2（freq=1），尽管 key 2 比 key 1 更晚 put。步骤 6 展示了 minFreq 自动升级。

---

## 6. ASCII 状态转移图

**使用 Section 5 同一样例**

### 帧 1：put(2,20) 后（步骤 2 完成）

```
keyMap: { 1 → node(1,10,f=1),  2 → node(2,20,f=1) }

freqMap:
  freq=1: HEAD ⇄ [2,20] ⇄ [1,10] ⇄ TAIL
                   ↑ MRU              ↑ LRU
minFreq = 1
```

### 帧 2：get(1) 后（步骤 3 完成）

```
keyMap: { 1 → node(1,10,f=2),  2 → node(2,20,f=1) }

freqMap:
  freq=1: HEAD ⇄ [2,20] ⇄ TAIL        ← key 1 已被摘走
  freq=2: HEAD ⇄ [1,10] ⇄ TAIL        ← key 1 升频到这里
minFreq = 1   ← freq=1 链表还有 key 2，所以不变
```

> key 1 命中 → 从 freq=1 链表摘除 → 插入 freq=2 链表头部。minFreq 不动因为 freq=1 还非空。

### 帧 3：put(3,30) 淘汰 key 2 并插入 key 3（步骤 4 完成）

```
keyMap: { 1 → node(1,10,f=2),  3 → node(3,30,f=1) }

freqMap:
  freq=1: HEAD ⇄ [3,30] ⇄ TAIL        ← key 2 被淘汰，key 3 新插入
  freq=2: HEAD ⇄ [1,10] ⇄ TAIL
minFreq = 1   ← 新插入 key，minFreq 强制重置为 1
```

> 满容量 → `freqMap[minFreq=1]` 尾部 = key 2 → 淘汰 → 插入 key 3(freq=1) → minFreq=1

### 帧 4：get(3) 后（步骤 6 完成）

```
keyMap: { 1 → node(1,10,f=2),  3 → node(3,30,f=2) }

freqMap:
  freq=1: HEAD ⇄ TAIL                  ← 空了！
  freq=2: HEAD ⇄ [3,30] ⇄ [1,10] ⇄ TAIL
                   ↑ MRU       ↑ LRU
minFreq = 2   ← freq=1 变空且 minFreq 原来就是 1，所以 minFreq++
```

> key 3 升频后 freq=1 链表清空，minFreq 从 1 升到 2。

---

## 7. 最优解视频生成方案

### 文字方案

- **视频目标**：让观众直观看到 LFU 的"频次分桶 + 桶内 LRU + minFreq 指针"三者如何联动
- **视觉映射**：
  - 每个频次桶是一条横向双向链表（和 LRU 可视化风格一致）
  - 频次桶纵向堆叠，freq=1 在底部，freq 越高越靠上
  - `minFreq` 用一个红色箭头指向当前最小频次桶
  - 被淘汰节点用红色高亮 + 删除线，新插入节点用蓝色脉冲，命中节点用绿色
  - 右侧 HashMap 面板显示 keyMap 内容
- **镜头拆分**：
  1. intro：展示空的 LFU 结构，说明三层映射
  2. put(1,10) + put(2,20)：两个 key 进入 freq=1 桶
  3. get(1)：key 1 从 freq=1 升到 freq=2，体现频次迁移
  4. put(3,30)：满容量淘汰 key 2，展示 minFreq 指向淘汰桶的机制
  5. get(2) miss + get(3)：miss 返回 -1；key 3 升频后 minFreq 升级
- **step 数据字段**：`phase, operation, capacity, size, freqBuckets, minFreq, activeKey, victimKey, newKey, result, actionLabel, what, why, invariant, progress`
- **节奏建议**：总时长 ~30 秒，每步 2.5 秒。淘汰步（put(3,30)）拆成两个子步骤（标记淘汰 + 插入新 key），各 2.5 秒

### 实际生成 Remotion 视频代码

见下方创建的文件。

---

## 8. Go 代码

**最优解**（面试官期望解：手写双向链表 + 频次分桶）

面试官出 LFU 想考的是：**你能否设计多层数据结构的联动，在 O(1) 内完成 get/put/evict 三个操作**。这题不存在"快速稳妥解"和"面试官期望解"的分离——手写链表 + 频次分桶就是唯一的 O(1) 方案，也是面试官期望的方案。

```go
type entry struct {
	key, val, freq int
	prev, next     *entry
}

type freqList struct {
	head, tail *entry
	size       int
}

func newFreqList() *freqList {
	h, t := &entry{}, &entry{}
	h.next, t.prev = t, h
	return &freqList{head: h, tail: t}
}

func (fl *freqList) addFirst(e *entry) {
	e.prev = fl.head
	e.next = fl.head.next
	fl.head.next.prev = e
	fl.head.next = e
	fl.size++
}

func (fl *freqList) remove(e *entry) {
	e.prev.next = e.next
	e.next.prev = e.prev
	e.prev, e.next = nil, nil
	fl.size--
}

func (fl *freqList) removeLast() *entry {
	e := fl.tail.prev
	fl.remove(e)
	return e
}

type LFUCache struct {
	cap, minFreq int
	keyMap       map[int]*entry
	freqMap      map[int]*freqList
}

func Constructor(capacity int) LFUCache {
	return LFUCache{
		cap:     capacity,
		keyMap:  make(map[int]*entry),
		freqMap: make(map[int]*freqList),
	}
}

// promote 把节点从旧频次桶摘出，freq+1，挂到新频次桶头部
func (c *LFUCache) promote(e *entry) {
	oldList := c.freqMap[e.freq]
	oldList.remove(e)
	// 旧桶空了且恰好是 minFreq → minFreq 跟着涨
	if oldList.size == 0 && e.freq == c.minFreq {
		c.minFreq++
	}
	e.freq++
	fl, ok := c.freqMap[e.freq]
	if !ok {
		fl = newFreqList()
		c.freqMap[e.freq] = fl
	}
	fl.addFirst(e)
}

func (c *LFUCache) Get(key int) int {
	e, ok := c.keyMap[key]
	if !ok {
		return -1
	}
	c.promote(e)
	return e.val
}

func (c *LFUCache) Put(key, value int) {
	if c.cap == 0 {
		return
	}
	if e, ok := c.keyMap[key]; ok {
		e.val = value
		c.promote(e)
		return
	}
	// 满容量 → 淘汰 minFreq 桶的尾部
	if len(c.keyMap) == c.cap {
		fl := c.freqMap[c.minFreq]
		victim := fl.removeLast()
		delete(c.keyMap, victim.key)
	}
	e := &entry{key: key, val: value, freq: 1}
	c.keyMap[key] = e
	fl, ok := c.freqMap[1]
	if !ok {
		fl = newFreqList()
		c.freqMap[1] = fl
	}
	fl.addFirst(e)
	c.minFreq = 1 // 新 key 频次一定是 1
}
```

**代码与核心机制的对应**：
- `promote()` 完整封装了"从旧频次桶摘出 → freq++ → 挂入新频次桶 → 更新 minFreq"这个最核心操作
- `Put` 里先检查已有 key（更新值 + promote），再检查容量（淘汰 minFreq 桶尾部），最后插入 freq=1 桶并重置 minFreq=1
- `Get` 只需 promote + 返回值

**面试口述路线**：先画三层结构图 → 讲 promote 是唯一复杂操作 → 讲 minFreq 的两条更新规则 → 写代码

---

## 9. 最容易写错的地方

1. **minFreq 更新遗漏**：promote 中把节点从旧频次桶摘出后，必须检查"旧桶是否空了 && 旧频次 == minFreq"。只检查空不检查 == minFreq 会导致 minFreq 被错误升级。

2. **put 已有 key 时忘记 promote**：put 一个已存在的 key 不仅要更新 value，还要增加频次。漏掉 promote 会导致频次计数错误。

3. **新 key 插入后忘记 `minFreq = 1`**：新 key 的频次一定是 1，所以 minFreq 必须无条件重置为 1。最常见 bug 是只在"freqMap[1] 为空"时才重置。

4. **capacity == 0 时没有特判**：题目允许 capacity=0，此时 put 应该直接 return。不特判会导致插入后立刻淘汰自己，但 keyMap 里已经有残留。

5. **freqMap 中新频次桶没有懒初始化**：promote 后 freq+1 的桶可能不存在，必须按需创建。面试官会追问"freqMap 的桶是什么时候创建的"。

---

## 10. 相邻题迁移

### 146. LRU Cache
- **共用骨架**：HashMap + 双向链表，O(1) get/put
- **关键不同**：LRU 只有一条全局链表按使用时间排序；LFU 有 N 条链表按频次分桶，桶内才按 LRU 排
- **修改层**：把 LRU 的单链表拆成 freqMap 多桶 + 加 freq 字段 + 加 minFreq 追踪

### 432. All O(one) Data Structure
- **共用骨架**：频次分桶 + 双向链表管理不同频次的桶
- **关键不同**：432 要求 O(1) 返回 max 和 min key，桶之间也用双向链表串起来；LFU 的桶之间不需要链表，只用 minFreq 指针
- **修改层**：把 freqMap 从 HashMap 改成桶之间的双向链表，去掉 capacity/eviction 逻辑，加 getMaxKey/getMinKey

### 895. Maximum Frequency Stack
- **共用骨架**：频次分桶，freqMap[f] 存储频次为 f 的元素集合
- **关键不同**：FreqStack 用栈而不是双向链表（后进先出 vs LRU 淘汰），且只需要 push/pop 不需要 get by key
- **修改层**：把每个频次桶从双向链表换成栈，去掉 keyMap，pop 时从 maxFreq 桶顶弹出

---

## 11. 闭卷自测

1. LFU 和 LRU 的淘汰决策依据分别是什么？为什么 LFU 不能只用一条双向链表？
2. `minFreq` 的更新只有两条规则，分别是什么？为什么这两条就够了？
3. 如果两个 key 频次相同，LFU 怎么决定淘汰哪一个？这个机制在代码里是哪一行？
4. 如果题目改成"频次相同时淘汰最近使用的（MRU）"，代码需要改哪里？
5. 明天闭卷写 LFU，你只记一句话该记什么？

---

## 12. 复盘卡

```
题型信号：频次 + 最不经常使用 + O(1) + 同频按 LRU 淘汰
核心不变量：freqMap[f] 按 LRU 排列同频次节点，minFreq 始终指向当前最小非空频次
最关键转折：promote 后旧桶变空且旧频次 == minFreq 时 minFreq++；新 key 插入时 minFreq 无条件置 1
最易错点：promote 后忘记检查 minFreq 是否需要升级；put 已有 key 忘记 promote；capacity=0 特判
一句话口诀：keyMap 找节点，freqMap 按频次分桶且桶内 LRU，minFreq 追踪淘汰目标——promote 是唯一核心操作
```
