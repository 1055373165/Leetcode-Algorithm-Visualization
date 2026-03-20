# 208. 实现 Trie (前缀树)

## 1. 30 秒面试回答

这题是**字典树（Trie）设计题**。核心思路：用一棵 26 叉树，每个节点包含 `children[26]` 指针和 `isEnd` 标记。`insert` 沿路径逐字符建节点；`search` 沿路径走到底检查 `isEnd=true`；`startsWith` 同理但不检查 `isEnd`。三个操作均 **O(m)** 时间（m 为字符串长度），空间 O(总字符数 × 26)。方案成立因为前缀共享——所有公共前缀只存一份，天然支持前缀查询。

---

## 2. 我第一眼应该先想到什么

- **信号词**："前缀"、"startsWith" → 前缀树天然语义
- **结构特征**：需同时支持精确查找和前缀查找，且动态插入
- **暴力起点**：用 HashSet 存所有单词，`search` O(1)，但 `startsWith` 要遍历所有单词检查前缀 → O(n×m)
- **暴力慢在哪**：前缀查询没有索引结构，必须逐个比对所有已插入单词

---

## 3. 核心洞察

- **关键数据结构**：每个节点是 `children [26]*TrieNode` + `isEnd bool`
- **命门**：`search` 和 `startsWith` 的**唯一区别**是最后一步是否检查 `isEnd`。面试必问这一点
- **不会漏解**：每条从根到某节点的路径唯一对应一个字符串前缀，`isEnd` 精确标记哪些前缀是完整单词
- **容易误判**：
  - 不要和 HashMap 混淆——HashMap 能做精确查找但无法高效做前缀查询
  - 不要和后缀树混淆——后缀树解决的是子串问题
  - 不要觉得"用 HashMap<char, Node> 代替数组"更好——面试中 26 大小数组更清晰、更快

---

## 4. 最优解怎么一步步长出来

1. **暴力**：HashSet 存单词，`search` O(1)，`startsWith` O(总单词数 × 平均长度)
2. **瓶颈**：前缀查询无法利用已有索引
3. **规律**：多个单词共享前缀（如 `apple`、`app`），前缀部分的路径完全相同
4. **最优解**：用树结构共享前缀路径，每层对应一个字符位，`children[c-'a']` 指向下一层

**最容易想错的岔路**：以为用 `map[string]bool` 就够了，忘了 `startsWith` 的效率要求。或者在节点里存整个字符串而不是只存一个字符位的分支。

---

## 5. 手推关键样例

操作序列：`insert("apple")`, `search("apple")`, `search("app")`, `startsWith("app")`, `insert("app")`, `search("app")`

```
insert("apple"):
  root → a → p → p → l → e(isEnd=true)
  逐字符建节点，最后标记 isEnd

search("apple"):
  root→a→p→p→l→e → isEnd=true → return true ✓

search("app"):
  root→a→p→p → isEnd=false → return false ✗
  ★ 关键转折：节点存在但不是单词结尾！

startsWith("app"):
  root→a→p→p → 节点存在 → return true ✓
  ★ 关键区别：不检查 isEnd

insert("app"):
  root→a→p→p(isEnd 改为 true) → l → e(isEnd=true)
  路径已存在，只修改 p 节点的 isEnd 标记！

search("app"):
  root→a→p→p → isEnd=true → return true ✓
```

---

## 6. ASCII 状态转移图

```
=== Frame 1: insert("apple") 后 ===

root
 └─ a
    └─ p
       └─ p
          └─ l
             └─ e [END★]

=== Frame 2: search("app") → false ===

root
 └─ a  ← 走
    └─ p  ← 走
       └─ p  ← 到这里，isEnd=false → return false
          └─ l
             └─ e [END★]

=== Frame 3: startsWith("app") → true ===

root
 └─ a  ← 走
    └─ p  ← 走
       └─ p  ← 到这里，节点存在 → return true（不查 isEnd）
          └─ l
             └─ e [END★]

=== Frame 4: insert("app") 后 ===

root
 └─ a
    └─ p
       └─ p [END★]     ← 新增 isEnd 标记
          └─ l
             └─ e [END★]
```

---

## 7. 最优解视频生成方案

- **视频目标**：展示 Trie 的插入、搜索、前缀查询过程，突出 `isEnd` 标记的关键作用
- **视觉映射**：树形结构逐层展开；当前遍历节点高亮（橙色）；`isEnd` 节点绿色 + ★；字符串中当前处理位置高亮
- **镜头拆分**：
  1. 插入 "apple"：逐字符建节点，最后标记 isEnd
  2. 搜索 "apple" → true：沿路径走到 e，isEnd=true
  3. 搜索 "app" → false：走到第二个 p，isEnd=false（核心对比）
  4. startsWith "app" → true：同样路径但不查 isEnd（核心区别）
  5. 插入 "app"：只改 isEnd 标记
  6. 搜索 "app" → true：isEnd 已变 true
- **step 数据字段**：`operation`, `word`, `currentCharIndex`, `trieSnapshot`, `result`, `reason`, `phase`
- **节奏建议**：总时长 ~30s，每步 2s，search("app")→false 和 startsWith("app")→true 对比处放慢

### Remotion 代码

- Composition：`algo-visualizer/src/compositions/ImplementTrie.tsx`
- Visualizer：`algo-visualizer/src/components/ImplementTrieVisualizer.tsx`
- 已注册到 `algo-visualizer/src/Root.tsx`

---

## 8. Go 代码

```go
type Trie struct {
    children [26]*Trie
    isEnd    bool
}

func Constructor() Trie {
    return Trie{}
}

func (t *Trie) Insert(word string) {
    node := t
    for _, ch := range word {
        idx := ch - 'a'
        if node.children[idx] == nil {
            node.children[idx] = &Trie{}
        }
        node = node.children[idx]
    }
    node.isEnd = true // 只有这一步和 search/startsWith 不同
}

func (t *Trie) Search(word string) bool {
    node := t.find(word)
    return node != nil && node.isEnd // 必须检查 isEnd
}

func (t *Trie) StartsWith(prefix string) bool {
    return t.find(prefix) != nil // 不检查 isEnd
}

// find 抽取公共逻辑：沿 word 路径走到底，返回终点节点
func (t *Trie) find(word string) *Trie {
    node := t
    for _, ch := range word {
        idx := ch - 'a'
        if node.children[idx] == nil {
            return nil
        }
        node = node.children[idx]
    }
    return node
}
```

**设计要点**：
- `find` 抽取公共遍历逻辑，`Search` 多查一个 `isEnd`，`StartsWith` 只查节点是否存在
- `Trie` 自身就是节点类型，不需要额外的 `TrieNode` 结构体——面试简洁优先
- `[26]*Trie` 用指针数组而非 map，查找 O(1)

---

## 9. 最容易写错的地方

1. **`Search` 忘记检查 `isEnd`**：最经典的 bug。`"app"` 的路径存在但不是完整单词，必须检查 `isEnd`
2. **`Insert` 最后忘记设 `isEnd = true`**：循环结束后忘了标记，导致插入的词搜不到
3. **`find` 中 `nil` 检查时机错误**：应该在进入 `children[idx]` 之前检查，而非之后
4. **混淆"节点不存在"和"节点存在但 isEnd=false"**：前者 search 和 startsWith 都返回 false；后者只有 search 返回 false
5. **面试追问：为什么用 `[26]*Trie` 而不是 `map[rune]*Trie`？** 答：固定大小数组访问 O(1)、cache 友好、面试场景字符集已知（小写字母）。如果字符集大（如 Unicode），才用 map

---

## 10. 相邻题迁移

### 1. [211. 添加与搜索单词 - 数据结构设计](https://leetcode.cn/problems/design-add-and-search-words-data-structure/)
- **共用骨架**：完全相同的 Trie 节点结构和 insert 逻辑
- **关键不同**：search 支持 `.` 通配符，需要在 `.` 处对所有非空 children 做 DFS
- **修改哪一层**：只改 `search`/`find` 方法，加一个 `if ch == '.' { 遍历所有 children }` 分支

### 2. [212. 单词搜索 II](https://leetcode.cn/problems/word-search-ii/)
- **共用骨架**：用 Trie 存所有待搜索单词，然后在二维网格上 DFS
- **关键不同**：Trie 不是主角而是辅助——用来剪枝 DFS，避免逐词搜索
- **修改哪一层**：需要新写网格 DFS，但 Trie 的 insert 完全复用；核心新增是 DFS 中沿 Trie 路径走、遇到 isEnd 就收集答案

### 3. [648. 单词替换](https://leetcode.cn/problems/replace-words/)
- **共用骨架**：Trie 的 insert 和前缀查找
- **关键不同**：不是找完整单词，而是找最短前缀匹配——沿 Trie 走，第一次遇到 `isEnd=true` 就停
- **修改哪一层**：在 `find` 的循环里加一个 `if node.isEnd { return 当前前缀 }` 提前退出

---

## 11. 闭卷自测

1. `search("app")` 返回 false 但 `startsWith("app")` 返回 true，底层实现的**唯一区别**是哪一行代码？
2. 如果把 `[26]*Trie` 改成 `map[byte]*Trie`，时间复杂度变了吗？空间呢？什么场景下该用 map？
3. 为什么 Trie 的 `Insert` 不需要检查"单词是否已存在"？重复插入会发生什么？
4. 如果题目改成"支持删除单词"，Trie 最先坏在哪里？你会怎么改？
5. 一句话复述：Trie 和 HashMap 解决前缀查询的本质效率差异是什么？

---

## 12. 复盘卡

```
题型信号：前缀查询 + 动态插入 → 字典树
核心不变量：每个节点 = children[26] + isEnd，路径 = 前缀
最关键转折：search 和 startsWith 的唯一区别是最后是否检查 isEnd
最易错点：search 忘查 isEnd，把"路径存在"等同于"单词存在"
一句话口诀：Trie 共享前缀、isEnd 区分词尾，search 查 isEnd、startsWith 不查
```
