# 1470. Shuffle the Array：拉链式合并

![Shuffle Array Animation](animation.mp4)

## 1. 审题（Problem）

### 1.1 约束解码
给定一个数组 `nums`，包含 `2n` 个元素，格式为 $[x_1, x_2, ..., x_n, y_1, y_2, ..., y_n]$。
要求重排为 $[x_1, y_1, x_2, y_2, ..., x_n, y_n]$。
*   **输入**：数组 `nums` 和整数 `n`。
*   **输出**：重排后的数组。
*   **核心**：这是一个典型的 **Interleaving（交错）** 或 **Zipper（拉链）** 操作。

### 1.2 问题归类
数组操作，通常涉及 **新建数组** 或 **原地位运算**（高级技巧）。

## 2. 思维演化（Reasoning）

### 2.1 双指针（Zipper Merge）
观察重排后的规律：
*   $nums[0] \rightarrow result[0]$
*   $nums[n] \rightarrow result[1]$
*   $nums[1] \rightarrow result[2]$
*   $nums[n+1] \rightarrow result[3]$
*   ...
*   $nums[i] \rightarrow result[2*i]$
*   $nums[n+i] \rightarrow result[2*i+1]$

我们只需要遍历 `i` 从 `0` 到 `n-1`，每次填两个坑即可。就像拉拉链一样，左边一个，右边一个，交替进入新数组。

### 2.2 空间复杂度
这种方法需要创建一个长度为 `2n` 的新数组，空间复杂度为 $O(N)$。对于这道题，这是标准解法。

## 3. 直觉培养（Intuition）

### 3.1 拉链效应（Zipper Effect）
想象你有两副扑克牌（前半部分是蓝色，后半部分是红色）。
洗牌时，如果你能完美地一张蓝一张红地交错落下，这就是 Shuffle。
$x_1$ 落下，紧接着 $y_1$ 落下，然后 $x_2$，然后 $y_2$...

## 4. 代码实现（Solution）

### 4.1 核心代码（Go）

```go
func shuffle(nums []int, n int) []int {
	result := make([]int, 2*n)
	for i := 0; i < n; i++ {
		result[2*i] = nums[i]     // 填入 x_i
		result[2*i+1] = nums[n+i] // 填入 y_i
	}
	return result
}
```

### 4.2 复杂度分析
*   **时间复杂度**：$O(N)$。遍历一次。
*   **空间复杂度**：$O(N)$。用于存储结果。

## 5. 融会贯通（Mastery）

### 5.1 进阶：原地操作（$O(1)$ Space）
如果面试官要求 $O(1)$ 空间复杂度（不计算返回数组），且题目允许修改原数组，且数据范围允许（本题 $1 <= nums[i] <= 1000$），我们可以利用 **位运算**。
*   一个 `int` 有 32 位，本题数值很小，只用了低 10 位（$2^{10}=1024$）。
*   我们可以把 $[x_i, y_i]$ 两个数存在同一个 `int` 里：高 10 位存 $y_i$，低 10 位存 $x_i$。
*   先遍历一遍，把 $y_i$ 塞到 $x_i$ 的高位（或者找个对应的位置存起来）。
*   再遍历一遍，解包出来放到正确的位置。
    *   注：C++ 这种 hack 更方便，Go 也可以模拟。不过对于这道简单题，新建数组是标准解。

### 5.2 类似题目
*   **1920. Build Array from Permutation**
*   **1929. Concatenation of Array**
均为数组下标映射的基础题。
