# 8. 字符串转换整数 (atoi)：有限状态机的魅力

## 1. 审题（Problem）

### 1.1 约束解码
实现 `myAtoi(string s)` 函数，将字符串转换成一个 32 位有符号整数。
算法流程：
1.  **丢弃无用前导空格**。
2.  **检查符号**（'-' 或 '+'），如果没符号默认为正。
3.  **读入数字**，直到到达非数字字符或结尾。
4.  **转换**，将数字字符串转为整数。
5.  **越界处理**，如果超过 32 位有符号整数范围 `[-2^31, 2^31 - 1]`，截断并返回边界值。

### 1.2 边界陷阱
*   全是空格。
*   只有符号没有数字（`"+"`, `"-"`）。
*   数字后面跟着乱码（`"4193 with words"`）。
*   乱码开头（`"words and 987"`）。
*   越界（`"-91283472332"`）。

### 1.3 问题归类
*   **字符串 (String)**。
*   **模拟 (Simulation)**。
*   **确定性有限自动机 (DFA, Deterministic Finite Automaton)**。

## 2. 思维演化（Reasoning）

### 2.1 方案 A：臃肿的 if-else
直接写一大堆 `if-else`。
*   先 `trim` 空格。
*   判断第一位是不是符号。
*   循环读数字。
*   每次乘 10 加新数字前判断溢出。
*   代码容易写得乱七八糟，边界条件容易漏。

### 2.2 方案 B：有限状态机 (DFA)
我们将解析过程抽象为几个状态：
1.  **Start**：开始状态，处理空格。
2.  **Signed**：遇到符号。
3.  **Number**：正在读取数字。
4.  **End**：结束（可能是遇到非数字，或读完）。

状态转移表：
| 当前状态 | 空格 | 符号 | 数字 | 其他 |
| :--- | :--- | :--- | :--- | :--- |
| **Start** | Start | Signed | Number | End |
| **Signed** | End | End | Number | End |
| **Number** | End | End | Number | End |
| **End** | End | End | End | End |

## 3. 直觉培养（Intuition）

### 3.1 自动机
想象你在玩一个简单的走格子游戏。
*   一开始你在 `Start` 格子，看到空格就原地踏步。
*   看到 `+` 或 `-`，你跳到 `Signed` 格子，记下正负号。
*   看到数字，你跳到 `Number` 格子，开始疯狂捡金币（累加数字）。
*   在 `Start` 或 `Signed` 或 `Number` 格子，只要看到不该看的东西（比如字母），立刻跳到 `End` 格子结束游戏。

![字符串转换整数动画](animation.mp4)

**可视化重点**：
1.  **状态流转**：高亮显示当前处于哪个状态节点。
2.  **指针移动**：逐个字符扫描输入字符串。
3.  **结果累加**：实时显示 `result = result * 10 + digit` 的过程。

## 4. 代码实现（Solution）

```go
func myAtoi(s string) int {
	// 定义常量
	const (
		MaxInt = 1<<31 - 1
		MinInt = -1 << 31
	)

	index := 0
	n := len(s)
	sign := 1
	res := 0

	// 1. 丢弃前导空格
	for index < n && s[index] == ' ' {
		index++
	}

	// 2. 检查符号
	if index < n {
		if s[index] == '+' {
			sign = 1
			index++
		} else if s[index] == '-' {
			sign = -1
			index++
		}
	}

	// 3. 读取数字
	for index < n {
		char := s[index]
		if char < '0' || char > '9' {
			break 
		}

		digit := int(char - '0')

		// 4. 越界检查 (提前检查)
		// 如果 res > MaxInt/10，或者 res == MaxInt/10 且 digit > 7，说明肯定越界
        // 注意：这里统一用正数累加，最后乘符号
		if res > MaxInt/10 || (res == MaxInt/10 && digit > MaxInt%10) {
			if sign == 1 {
				return MaxInt
			}
			return MinInt
		}

		res = res*10 + digit
		index++
	}

    // 5. 返回结果
	return res * sign
}
```

### 4.2 复杂度分析
*   **时间复杂度**: $O(N)$。DFA 只需要遍历字符串一次。
*   **空间复杂度**: $O(1)$。

## 5. 融会贯通（Mastery）

### 5.1 为什么要用 DFA？
虽然这道题看起来简单，但如果在工程中编写复杂的 Tokenizer（词法分析器）或 Parser（语法分析器），**有限状态机** 是最清晰、最健壮的设计模式。它把“做什么”和“处于什么状态”解耦，避免了层层嵌套的 `if-else` 地狱。

### 5.2 越界检查的技巧
检查 `res * 10 + digit > MaxInt` 是否成立，**不能直接乘**（因为乘了就溢出了）。
必须移项变为 `res > (MaxInt - digit) / 10`，或者更通用的：
`if res > MaxInt/10` 肯定溢出。
`if res == MaxInt/10` 且 `digit > 7`（MaxInt 的个位）肯定溢出。
