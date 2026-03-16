# 22. 括号生成：回溯法的决策树

## 1. 审题（Problem）

### 1.1 约束解码
数字 `n` 代表生成括号的对数。
我们需要生成所有可能的、**有效的**括号组合。
有效的意思是：每一个左括号都有对应的右括号，且顺序正确。
例如 `n=3`：`((()))`, `(()())`, ...

### 1.2 边界陷阱
*   `n=1` -> `()`
*   `n` 最大为 8（题目通常规模较小，暗示 exponential 复杂度）。

### 1.3 问题归类
这是一个典型的 **组合生成** 问题。
只要是“生成所有可能”、“排列组合”，第一反应就是 **回溯法 (Backtracking)** 或者说 **深度优先搜索 (DFS)**。

## 2. 思维演化（Reasoning）

### 2.1 暴力穷举
对于 `n` 对括号，总共有 $2n$ 个位置。
每个位置可以是 `(` 或 `)`。
总共有 $2^{2n}$ 种组合。然后对每一个组合检查是否有效。
复杂度太高，且包含大量无效路径（例如 `))))((((`）。

### 2.2 聪明地做选择（剪枝）
我们在生成字符串的过程中，时刻保持警惕，只做“正确”的选择。
任何时刻，我们只有两个选择：放 `(` 或者放 `)`。
但这需满足条件：
1.  **能不能放 `(`**？只要手中还有 `(` 没用完（即 `open_count < n`），就可以放。
2.  **能不能放 `)`**？只有当目前**已有的** `(` 多于 `)` 时（即 `close_count < open_count`），放 `)` 才是合法的。否则就闭合不了了。

### 2.3 递归状态
我们需要维护的状态很简单：
*   `current_str`: 当前拼出的字符串。
*   `open`: 已经用了几个左括号。
*   `close`: 已经用了几个右括号。

## 3. 直觉培养（Intuition）

### 3.1 决策树生长
想象我们在种一棵树。
*   根节点是空字符串。
*   每一层分出两个叉：左边加 `(`，右边加 `)`。
*   但是这棵树被我们要么“修剪”了（不满足条件不让长），要么长到一半发现不行就“回溯”了。

![括号生成动画](animation.mp4)

## 4. 代码实现（Solution）

```go
func generateParenthesis(n int) []string {
	var res []string

	// DFS 函数
	// path: 当前构建的字符串
	// open: 左括号已使用数量
	// close: 右括号已使用数量
	var dfs func(path string, open, close int)
	dfs = func(path string, open, close int) {
		// 1. 终止条件：长度达标（或者 open == n && close == n）
		if len(path) == 2*n {
			res = append(res, path)
			return
		}

		// 2. 尝试加左括号
		if open < n {
			dfs(path+"(", open+1, close)
		}

		// 3. 尝试加右括号
		if close < open {
			dfs(path+")", open, close+1)
		}
	}

	dfs("", 0, 0)
	return res
}
```

### 4.2 复杂度证明
*   **时间复杂度**: $O(\frac{4^n}{\sqrt{n}})$。
    *   严格来说是第 $n$ 个 **卡特兰数 (Catalan Number)**: $C_n = \frac{1}{n+1}\binom{2n}{n}$。
    *   卡特兰数的渐进增长大概是 $4^n / n^{1.5}$。
*   **空间复杂度**: $O(n)$。
    *   递归堆栈的深度最多为 $2n$。

### 4.3 易错点清单
1.  **剪枝条件**：最容易写错的就是 `close < open` 这个条件。记住：右括号永远不能比左括号多，否则就没救了。
2.  **字符串拼接**：在 Go/Java 等语言中，字符串拼接会产生新对象。在回溯中这通常是方便的（隐式回溯），但如果 N 很大，可能需要用 `StringBuilder` / `[]byte` 并显式 backtrack（pop操作）。对于本题 N=8，直接拼接完全没问题。

## 5. 融会贯通（Mastery）

### 5.1 变体题群
| 题目 | 变化点 | 解法调整 |
| :--- | :--- | :--- |
| **22. 括号生成** | 标准题 | DFS + 剪枝 |
| **20. 有效的括号** | 验证字符串 | Stack |
| **32. 最长有效括号** | 找最长子串 | DP 或 Stack |
| **301. 删除无效的括号** | 删除最少使其有效 | BFS（找最短路径/最少删除） |

### 5.2 模式识别
当题目要求：
1.  **生成所有** 合法组合
2.  有明确的 **选择限制**
通常就是 **Backtracking (DFS)**。
写这类题板子：
```python
def backtrack(path, state):
    if goal_reached(state):
        res.append(path)
        return
    
    for choice in choices:
        if is_valid(choice, state):
            make_move(choice)
            backtrack(path + choice, new_state)
            undo_move(choice) # 如果 path 是引用类型需要这一步
```
