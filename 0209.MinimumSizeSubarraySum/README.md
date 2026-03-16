# 209. Minimum Size Subarray Sum：伸缩的毛毛虫

![Minimum Size Subarray Sum Animation](animation.mp4)

## 1. 审题（Problem）

### 1.1 约束解码
给定一个含有 $n$ 个正整数的数组 `nums` 和一个正整数 `target`。
我们要找出该数组中满足 **其和 $\ge$ target** 的长度最小的 **连续子数组**。
*   **正整数**：这个约束至关重要！这意味着子数组越长，和越大（**单调性**）。如果包含负数，滑动窗口将失效（需要前缀和+单调队列/TreeSet）。
*   **连续子数组**：必须连续，所以不能排序。

### 1.2 边界陷阱
*   **无解**：如果整个数组的和都小于 `target`，返回 `0`。
*   **最小解**：可能某个单独的元素就 $\ge$ `target`，此时长度为 `1`。

### 1.3 问题归类
寻找满足条件的 **“最短”** 的 **“连续”** 区间。
结合“正整数”带来的单调性，这是最经典的 **变长滑动窗口（Dynamic Sliding Window）** 问题。

## 2. 思维演化（Reasoning）

### 2.1 暴力解法
枚举所有可能的子数组 `[i, j]`，计算它们的和。
*   两层循环枚举起止点 $O(N^2)$。
*   内层通过前缀和 $O(1)$ 计算区间和。
*   总复杂度 $O(N^2)$。对于 $N=10^5$，显然会超时。

### 2.2 瓶颈分析
暴力法中，对于固定的起点 `i`，我们可能会尝试 `j = i, i+1, i+2...` 直到和 $\ge$ target。
假设在 `j` 处第一次满足条件。此时我们记录下长度 `j - i + 1`。
接下来，暴力法会让 `i` 变成 `i+1`，然后 `j` 又从 `i+1` 开始重新往右走。
**浪费在哪里？**
由于数组全是正数，当 `[i, j]` 满足条件时，`[i+1, j]` 的和一定比 `[i, j]` 小。
但 `[i+1, j]` 很可能依然非常接近 target。我们没必要把 `j` 拉回 `i+1` 重新跑，而是应该**保持 `j` 不动（甚至继续向右）**，试着缩小左边界 `i`。

### 2.3 优化演化链
我们利用**单调性**维护一个窗口 `[left, right]`：
1.  **Expand（伸）**：`right` 向右移，扩大窗口，为了让和变大，直到满足 `>= target`。
2.  **Contract（缩）**：`left` 向右移，缩小窗口，求取“最小长度”，直到如果不满足条件为止。
这种“进一个、出一个”的策略，保证了 `left` 和 `right` 都最多遍历数组一次。
*   总复杂度：$O(N)$。

## 3. 直觉培养（Intuition）

### 3.1 毛毛虫类比
把这个滑动窗口想象成一条在树枝（数组）上爬行的**毛毛虫**。
毛毛虫吃树叶（数字）来补充能量（Sum）。
1.  **饥饿状态（Sum < target）**：毛毛虫伸长头（Right++），大口吃叶子。
2.  **饱腹状态（Sum >= target）**：毛毛虫觉得身体太长了不灵活，于是收缩尾巴（Left++），吐出旧叶子，试图在保持饱腹的前提下把自己缩得最短。

### 3.2 模式识别清单
看到以下组合：
*   “最小长度” / “最大长度”。
*   “连续子数组”。
*   “全是正数” / “非负数”（保证单调性）。

-> **变长滑动窗口**。

## 4. 代码实现（Solution）

### 4.1 核心代码（Go）

```go
func minSubArrayLen(target int, nums []int) int {
	n := len(nums)
	if n == 0 {
		return 0
	}

	left := 0
	sum := 0
	minLen := n + 1 // 初始化为一个不可能的大值

	// 滑动窗口：[left, right]
	for right, num := range nums {
		// 1. 进窗口：累加 current value
		sum += num

		// 2. 满足条件时，尝试收缩窗口
		for sum >= target {
			// 更新最小长度
			currentLen := right - left + 1
			if currentLen < minLen {
				minLen = currentLen
			}

			// 出窗口：减去 leaving value
			sum -= nums[left]
			left++
		}
	}

	if minLen > n {
		return 0
	}
	return minLen
}
```

### 4.2 复杂度分析
*   **时间复杂度**：$O(N)$。虽然有两层循环（for 和 while），但 `right` 和 `left` 每个都只会增加，最多各自遍历一次数组。总操作次数是 $2N$。
*   **空间复杂度**：$O(1)$。

### 4.3 易错点
*   **初始值**：`minLen` 要初始化为 `n+1` 或 `INT_MAX`，方便后续取 `min`。
*   **返回值**：如果循环结束后 `minLen` 没变过，说明整个数组加起来都不够 target，要返回 `0`。
*   **循环条件**：内部是用 `while (sum >= target)`，因为可能减去一个左边的大数后，剩下部分和依然很大，还能继续缩。

## 5. 融会贯通（Mastery）

### 5.1 变体题群

| 题目 | 变化点 | 解法调整 |
| :--- | :--- | :--- |
| **209. 长度最小的子数组** | Sum >= target, 正数 | 标准变长窗口（求 Min）。 |
| **3. 无重复字符的最长子串** | 不含重复字符 | 窗口内有重复时 Contract，求 Max。 |
| **862. 和至少为 K 的最短子数组** | **包含负数** | 单调性被破坏，滑动窗口失效。需用 **前缀和 + 单调队列** $O(N)$。 |
| **76. 最小覆盖子串** | 字符覆盖 | 维护字符频数，满足覆盖条件时 Contract。 |

### 5.2 模板沉淀：变长窗口滑动
```go
// 变长窗口模板
func dynamicSlidingWindow(nums []int) int {
    left := 0
    // state variables (sum, count, etc.)
    
    for right := 0; right < len(nums); right++ {
        // 1. Expand: update state with nums[right]
        
        // 2. Contract: while (condition satisfied/broken)
        for condition() {
            // update result (min/max)
             
            // remove nums[left] from state
            left++
        }
    }
    return result
}
```
