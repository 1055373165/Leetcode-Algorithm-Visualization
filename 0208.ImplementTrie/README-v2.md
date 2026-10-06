# 208. 实现 Trie (前缀树) — v2

## 1. 30 秒面试回答

这题是**数据结构设计题**，考察字典树（Trie）的实现。用一棵 26 叉树，每个节点包含 `children [26]*Trie` 和 `isEnd` 标记。`insert` 沿路径逐字符建节点，末尾设 `isEnd=true`；`search` 和 `startsWith` 共享同一条遍历逻辑，唯一区别是 `search` 最后要检查 `isEnd`。三个操作均 O(m)（m 为字符串长度），因为每个操作只沿一条路径走一遍。空间 O(总字符数 × 26)，因为每个节点固定分配 26 个指针槽位。

## 2. 我第一眼应该先想到什么

**信号词**：`prefix`、`startsWith` —— 出现"前缀"语义就该条件反射想到 Trie。

**暴力起点**：用 `map[string]bool` 存所有单词。`search` 是 O(1)，但 `startsWith` 必须遍历所有 key 逐个检查是否以 prefix 开头 —— O(n×m)，n 是已插入单词数。

**暴力慢在哪**：`startsWith` 没有索引结构。每次前缀查询都要全量扫描所有已插入单词，重复比较每个单词的前缀部分。Hash 只能做精确匹配，无法做前缀匹配。

## 3. 核心洞察

### 面试官想考什么

面试官想看你能不能**从零设计一个支持前缀操作的数据结构**，而不是调库。考察的是对树形结构的设计能力和对"前缀共享"这一核心性质的理解。

### 最优解（快速稳妥解 = 面试官期望解）

这题两者是同一个。没有取巧的替代方案——Trie 就是标准答案。

### 关键不变量

**每个节点 = `children[26]` + `isEnd`**。从根到任意节点的路径唯一对应一个字符串前缀，`isEnd` 精确标记哪些前缀是完整单词。

### 为什么是命门

`search` 和 `startsWith` 的**全部区别**浓缩在一行代码：`return node != nil && node.isEnd` vs `return node != nil`。理解这一点 = 理解 Trie 的本质。

### 为什么不会漏解

插入时逐字符建路径，保证每个字符串都有唯一路径。查询时沿路径走，路径不存在则返回 false。`isEnd` 区分"路径存在但不是完整词"和"路径存在且是完整词"。

### 容易误判的方向

- 以为 `map[string]bool` 就够用 —— 忘了 `startsWith` 的效率需求
- 以为要用后缀树 —— 后缀树解决的是**子串**问题，不是前缀问题
- 以为用 `map[rune]*Node` 代替 `[26]*Node` 更好 —— 面试场景字符集已知，数组更快更清晰

## 4. 最优解怎么一步步长出来

1. **暴力**：`map[string]bool`，`search` O(1)，`startsWith` O(n×m)
2. **瓶颈**：前缀查询无法利用哈希索引
3. **观察**：多个单词共享前缀（`apple`、`app` 共享 `a-p-p`），前缀路径完全相同
4. **最优解**：用树共享前缀路径，每层对应一个字符位，`children[ch-'a']` 指向下一层

**最容易想错的岔路**：在节点里存整个字符串而不是只存分支指针。Trie 节点不存字符本身——字符信息编码在"从父到子的边"里。

## 5. 手推关键样例

操作序列：`insert("apple")` → `search("app")` → `startsWith("app")` → `insert("app")` → `search("app")`

**此样例贯穿 Section 6 和 Section 7。**

| 操作 | 路径遍历 | isEnd 状态 | 返回值 | 关键点 |
|------|----------|------------|--------|--------|
| insert("apple") | 建 a→p→p→l→e | e.isEnd=true | — | 逐字符建节点 |
| search("app") | 走 a→p→p | p.isEnd=**false** | **false** | 节点存在 ≠ 单词存在 |
| startsWith("app") | 走 a→p→p | 不查 isEnd | **true** | 节点存在即可 |
| insert("app") | 走 a→p→p | p.isEnd 改为 **true** | — | 路径已存在，只改标记 |
| search("app") | 走 a→p→p | p.isEnd=**true** | **true** | 标记变了，结果变了 |

**关键转折**：`search("app")` 和 `startsWith("app")` 走的路径完全相同，结果却不同。面试官必问这个对比。

## 6. ASCII 状态转移图

```
=== 帧1: insert("apple") 后 ===

root
 └─ a
    └─ p
       └─ p
          └─ l
             └─ e [END★]

=== 帧2: search("app") → false ===

root
 └─ a  ← walk
    └─ p  ← walk
       └─ p  ← 到这里停下。isEnd=false → return false
          └─ l           ★ 核心：节点存在但不是词尾
             └─ e [END★]

=== 帧3: startsWith("app") → true ===

root
 └─ a  ← walk
    └─ p  ← walk
       └─ p  ← 到这里停下。节点存在 → return true
          └─ l           ★ 核心：和 search 走的路径一模一样
             └─ e [END★]     但不查 isEnd

=== 帧4: insert("app") 后 ===

root
 └─ a
    └─ p
       └─ p [END★]  ← 新增 isEnd 标记（节点早就存在）
          └─ l
             └─ e [END★]
```

## 7. 最优解视频生成方案

**视频目标**：展示 Trie 的插入和查询过程，突出 `isEnd` 在 `search` vs `startsWith` 中的决定性作用。

**视觉映射**：
- 树形结构：节点为圆形，边上标字符
- 当前遍历节点：橙色高亮
- `isEnd` 节点：绿色 + ★ 标记
- 操作字符串：顶部显示，当前字符高亮
- 操作结果：底部状态栏

**镜头拆分**（使用同一样例 "apple"/"app"）：
1. insert("apple")：逐字符建节点，最后标记 isEnd
2. search("app") → false：走到 p，isEnd=false（核心对比点，放慢）
3. startsWith("app") → true：同样路径但不查 isEnd（对比 search）
4. insert("app")：只改 isEnd 标记
5. search("app") → true：isEnd 变了，结果变了

**step 数据字段**：`operation`(insert/search/startsWith), `word`, `charIndex`, `trieSnapshot`(树形快照), `result`(true/false/null), `phase`(traverse/check/done), `reason`

**节奏建议**：总时长 ~30s，每步 2s。search("app")→false 和 startsWith("app")→true 的对比处放慢到 3s。

### 实际生成 Remotion 视频代码

已有 Composition 和 Visualizer 实现。现在需要更新注册尺寸为 1920×1080 并重新渲染高清版本。

## 8. Go 代码

```go
type Trie struct {
	children [26]*Trie // 指针在前，内存对齐
	isEnd    bool      // bool 在后，避免 padding
}

func Constructor() Trie {
	return Trie{}
}

func (t *Trie) Insert(word string) {
	node := t
	for _, ch := range word {
		i := ch - 'a'
		if node.children[i] == nil {
			node.children[i] = &Trie{}
		}
		node = node.children[i]
	}
	node.isEnd = true
}

func (t *Trie) Search(word string) bool {
	node := t.traverse(word)
	return node != nil && node.isEnd // 检查 isEnd
}

func (t *Trie) StartsWith(prefix string) bool {
	return t.traverse(prefix) != nil // 不检查 isEnd
}

// traverse 抽取公共逻辑：沿 word 路径走到底
func (t *Trie) traverse(word string) *Trie {
	node := t
	for _, ch := range word {
		i := ch - 'a'
		if node.children[i] == nil {
			return nil
		}
		node = node.children[i]
	}
	return node
}
```

**Go 惯用写法要点**：
- **结构体内存对齐**：`[26]*Trie`（指针数组，208 bytes）在前，`isEnd`（bool，1 byte）在后，无 padding 浪费
- **方法命名**：公共遍历逻辑用未导出方法 `traverse`，符合 Go 最小导出原则
- **接收者命名**：用 `t` 而非 `this`/`self`，Go 惯例用类型首字母
- **`Trie` 自身即节点**：不需要额外 `TrieNode` 类型，面试简洁优先

**面试加分项**：
- 问为什么用 `[26]*Trie` 而不是 `map[rune]*Trie`？→ 字符集已知（小写字母），数组 O(1) 访问且 cache 友好。如果扩展到 Unicode 才考虑 map
- `Constructor()` 返回值类型而非指针，这样调用方拿到的是栈上对象，LeetCode 框架会取地址传入后续方法

## 9. 最容易写错的地方

1. **`Search` 忘检查 `isEnd`**：最经典 bug。`"app"` 路径存在但 `isEnd=false`，必须检查。面试官 100% 会出这个 case
2. **`Insert` 最后忘设 `isEnd = true`**：循环体只建节点，循环后忘标记。插入的词永远搜不到
3. **`traverse` 中 nil 检查时机**：必须在**进入** `children[i]` 之前检查，不是走到下一层之后。否则空指针
4. **混淆两种 false**：`traverse` 返回 nil（路径不存在）vs 返回非 nil 但 `isEnd=false`（路径存在但不是词尾）。前者 search 和 startsWith 都返回 false；后者只有 search 返回 false
5. **面试追问**："如果要支持删除怎么办？" —— 需要引用计数或递归回溯删除空节点。直接设 `isEnd=false` 不够，因为可能留下无用节点链

## 10. 相邻题迁移

### 1. LeetCode 211. 添加与搜索单词
- **共用骨架**：完全相同的 Trie 节点结构和 insert
- **关键不同**：search 支持 `.` 通配符，遇到 `.` 要对所有非空 children 做 DFS
- **修改层**：只改 `traverse`/`search` 方法，加 `if ch == '.' { 遍历所有 children }` 分支

### 2. LeetCode 212. 单词搜索 II
- **共用骨架**：Trie 的 insert 完全复用
- **关键不同**：Trie 不是主角而是剪枝工具——在二维网格 DFS 时沿 Trie 路径走，避免逐词搜索
- **修改层**：新增网格 DFS，DFS 中同步走 Trie，遇到 `isEnd` 收集答案

### 3. LeetCode 648. 单词替换
- **共用骨架**：Trie 的 insert 和前缀查找
- **关键不同**：找最短前缀匹配——沿 Trie 走，第一次遇到 `isEnd=true` 就提前返回
- **修改层**：在 `traverse` 循环里加 `if node.isEnd { return 当前前缀 }` 提前退出

## 11. 闭卷自测

1. `search("app")` 返回 false 但 `startsWith("app")` 返回 true，底层实现的**唯一区别**是哪一行代码？
2. 为什么 Trie 节点不存储字符本身？字符信息存在哪里？
3. 如果把 `[26]*Trie` 改成 `map[rune]*Trie`，时间复杂度变了吗？空间呢？什么场景才该用 map？
4. 重复执行 `insert("apple")` 两次会发生什么？为什么不需要"已存在"检查？
5. 如果题目新增 `delete(word)` 方法，只设 `isEnd=false` 够不够？会造成什么问题？

## 12. 复盘卡

```
题型信号：前缀查询 + 动态插入 → 字典树
核心不变量：每个节点 = children[26] + isEnd，根到节点的路径 = 前缀
最关键转折：search 和 startsWith 的唯一区别是最后一行是否检查 isEnd
最易错点：search 忘查 isEnd，把"路径存在"等同于"单词存在"
一句话口诀：Trie 共享前缀存路径，isEnd 一查分词缀
```
