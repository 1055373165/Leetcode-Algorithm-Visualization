# 21. 合并两个有序链表：归并的序曲

## 1. 审题（Problem）

### 1.1 约束解码
将两个升序链表合并为一个新的 **升序** 链表并返回。新链表是通过拼接给定的两个链表的所有节点组成的。
*   **升序**：输入是升序，要求输出也是升序。
*   **节点复用**：题目暗示“拼接”，通常我们不需要创建新节点，而是直接修改 `Next` 指针。

### 1.2 边界陷阱
*   `list1` 为空，或 `list2` 为空，或都为空。
*   链表长度差异很大。

### 1.3 问题归类
*   **链表 (Linked List)**。
*   **递归 / 迭代 (Recursion / Iteration)**。

## 2. 思维演化（Reasoning）

### 2.1 方案 A：新建链表
创建一个新的链表，每次比较两个链表的头，谁小就把谁的值复制过去。
*   简单，但浪费空间 ($O(M+N)$)。题目通常希望原地调整指针。

### 2.2 方案 B：原地迭代（推荐）
我们需要一个 `prev` 指针指向“当前已合并链表的尾部”。
1.  比较 `l1.Val` 和 `l2.Val`。
2.  如果 `l1` 小，把 `prev.Next` 指向 `l1`，然后 `l1` 前进一步。
3.  如果 `l2` 小，把 `prev.Next` 指向 `l2`，然后 `l2` 前进一步。
4.  `prev` 前进一步。
5.  **关键技巧**：引入**哨兵节点 (Dummy Head)**，简化对头部的处理。

### 2.3 方案 C：递归
`merge(l1, l2)` 的结果取决于：
*   如果 `l1.Val < l2.Val`，结果是 `l1` 连上 `merge(l1.Next, l2)`。
*   否则，结果是 `l2` 连上 `merge(l1, l2.Next)`。
*   代码极其优雅，但空间复杂度为 $O(M+N)$（栈深度）。

## 3. 直觉培养（Intuition）

### 3.1 拉链的比喻
这就像是把两条拉链扣在一起。
*   滑块（指针）每次只走一格。
*   哪边的齿轮（节点）小，滑块就先咬住哪边。
*   最后剩下一截长的，直接整段接在后面。

![合并两个有序链表动画](animation.mp4)

**可视化重点**：
1.  **比较**：高亮对比两个头节点的值。
2.  **择优**：较小的节点脱离原链表，加入结果链表。
3.  **连接**：展示 Result 链表不断变长的过程。

## 4. 代码实现（Solution）

```go
/**
 * Definition for singly-linked list.
 * type ListNode struct {
 *     Val int
 *     Next *ListNode
 * }
 */
func mergeTwoLists(list1 *ListNode, list2 *ListNode) *ListNode {
    // 哨兵节点，由于最后要返回 dummy.Next，所以 dummy 的值不重要
    dummy := &ListNode{Val: -1}
    current := dummy
    
    // 当两个链表都不为空时，进行比较和拼接
    for list1 != nil && list2 != nil {
        if list1.Val <= list2.Val {
            current.Next = list1
            list1 = list1.Next
        } else {
            current.Next = list2
            list2 = list2.Next
        }
        current = current.Next
    }
    
    // 处理剩余部分
    // 如果 list1 还没走完，直接把剩下的接到后面
    if list1 != nil {
        current.Next = list1
    }
    // 如果 list2 还没走完，直接把剩下的接到后面
    if list2 != nil {
        current.Next = list2
    }
    
    return dummy.Next
}
```

### 4.2 复杂度分析
*   **时间复杂度**: $O(M+N)$。每个节点都被访问一次。
*   **空间复杂度**: $O(1)$。只用了几个指针。

## 5. 融会贯通（Mastery）

### 5.1 变体题群
| 题目 | 关键词 | 解法微调 |
| :--- | :--- | :--- |
| **21. 合并两个有序链表** | 2 个 | 迭代 / 递归 |
| **23. 合并 K 个升序链表** | K 个 | 最小堆 (Priority Queue) 或 分治归并 |
| **88. 合并两个有序数组** | 数组 | 从后往前填，避免移动元素 |
| **148. 排序链表** | 归并排序 | 快慢指针找中点 + mergeTwoLists |

### 5.2 哨兵节点的艺术
在链表题中，只要涉及到**新链表的构建**或者**头节点可能发生变化**（如删除头节点），使用 **Dummy Head** 几乎是标准操作。它能消除空链表和头节点处理的特殊情况，让代码逻辑高度统一。
