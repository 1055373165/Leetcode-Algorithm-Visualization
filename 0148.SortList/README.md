# 148. 排序链表：归并的旋律

## 1. 审题（Problem）

### 1.1 约束解码
给你链表的头结点 `head`，请将其按 **升序** 排列并返回 **排序后的链表**。
*   进阶要求：时间复杂度 $O(n \log n)$，空间复杂度 $O(1)$。

### 1.2 边界陷阱
*   空链表或只有一个节点（无需排序）。
*   链表非常长（递归深度如果太深可能爆栈，但在 $O(\log n)$ 下通常安全）。

### 1.3 问题归类
*   **链表 (Linked List)**。
*   **排序 (Sorting)**。
*   **归并排序 (Merge Sort)**。

## 2. 思维演化（Reasoning）

### 2.1 方案 A：转数组排序
把链表节点值放进数组，排序数组，再重建链表。
*   简单粗暴，可以通过，但空间复杂度 $O(n)$，且面试官通常不满意。

### 2.2 方案 B：自顶向下归并排序 (Top-Down Merge Sort)
归并排序天然适合链表，因为不需要随机访问。
1.  **找中点**：快慢指针法（Slow/Fast Pointers）。
2.  **断开**：把链表从中点断开成两半。
3.  **递归**：分别对左右两半进行排序。
4.  **合并**：使用 **合并两个有序链表** 的逻辑（参见题目 21）。
*   时间：$T(n) = 2T(n/2) + O(n) \Rightarrow O(n \log n)$。
*   空间：$O(\log n)$（递归栈）。虽然题目要求 $O(1)$，但对于链表排序，通常认为 $O(\log n)$ 栈空间是可以接受的。

### 2.3 方案 C：自底向上归并排序 (Bottom-Up)
为了严格达到 $O(1)$ 空间，可以使用迭代法。
*   Step 1: 归并长度为 1 的子链表。
*   Step 2: 归并长度为 2 的子链表。
*   Step 4... 直到长度 >= n。
*   极其繁琐，代码量大，面试中除非明确要求禁止递归，否则优先写递归版。

## 3. 直觉培养（Intuition）

### 3.1 分而治之
把一团乱麻（无序链表）拆分成最小的单元（单个节点）。单个节点天然是有序的。然后两两合并，有序的片段就像滚雪球一样越来越大。

![排序链表动画](animation.mp4)

**可视化重点**：
1.  **拆解 (Split)**：像树枝分叉一样，把链表拆成越来越小的片段。
2.  **Base Case**：当只剩一个球（节点）时，停止拆解。
3.  **合并 (Merge)**：两个有序小链表，像拉链一样咬合在一起，变成一个长有序链表。

## 4. 代码实现（Solution）

```go
/**
 * Definition for singly-linked list.
 * type ListNode struct {
 *     Val int
 *     Next *ListNode
 * }
 */
func sortList(head *ListNode) *ListNode {
	// Base Case: 空或只有一个节点，直接返回
	if head == nil || head.Next == nil {
		return head
	}

	// 1. 找中点 (快慢指针)
	slow, fast := head, head.Next
	for fast != nil && fast.Next != nil {
		slow = slow.Next
		fast = fast.Next.Next
	}
	
	// 2. 切分链表
	mid := slow.Next
	slow.Next = nil // 断开连接

	// 3. 递归排序
	left := sortList(head)
	right := sortList(mid)

	// 4. 合并有序链表
	return merge(left, right)
}

// 复用 LeetCode 21 的合并逻辑
func merge(l1, l2 *ListNode) *ListNode {
	dummy := &ListNode{Val: 0}
	current := dummy

	for l1 != nil && l2 != nil {
		if l1.Val < l2.Val {
			current.Next = l1
			l1 = l1.Next
		} else {
			current.Next = l2
			l2 = l2.Next
		}
		current = current.Next
	}

	if l1 != nil {
		current.Next = l1
	}
	if l2 != nil {
		current.Next = l2
	}

	return dummy.Next
}
```

### 4.2 复杂度分析
*   **时间复杂度**: $O(n \log n)$。
*   **空间复杂度**: $O(\log n)$（递归栈）。

## 5. 融会贯通（Mastery）

### 5.1 为什么不用快排？
*   **快速排序 (Quick Sort)** 依赖于随机访问（如 `swap(arr[i], arr[j])`），链表很难实现高效的 `partition` 操作（虽然也可以做，通常是值交换节点交换，或者维护三个链表 Less/Equal/Greater）。
*   **归并排序** 只需要顺序访问，且不依赖额外的数组空间（不像数组归并需要 $O(n)$ 辅助空间），非常适合链表。

### 5.2 找中点的细节
`slow, fast := head, head.Next` vs `slow, fast := head, head`
*   使用 `head, head.Next` 是为了在偶数长度时，`slow` 停在**中点偏左**的位置，方便 `slow.Next` 作为右半部分的起点，并且能正确断开（`slow.Next = nil`）。
