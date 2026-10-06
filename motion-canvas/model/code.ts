export const SOLUTIONS = {
  go: {
    label: 'Go',
    note: '用长度为 k 的环形队列保存下标，避免从切片头部搬移元素。',
    code: `func maxSlidingWindow(nums []int, k int) []int {
    if k < 1 || k > len(nums) { return nil }
    deque := make([]int, k)
    head, size := 0, 0
    result := make([]int, 0, len(nums)-k+1)
    for i, value := range nums {
        if size > 0 && deque[head] <= i-k {
            head = (head + 1) % k
            size--
        }
        for size > 0 && nums[deque[(head+size-1)%k]] <= value {
            size--
        }
        deque[(head+size)%k] = i
        size++
        if i >= k-1 {
            result = append(result, nums[deque[head]])
        }
    }
    return result
}`,
  },
  python: {
    label: 'Python',
    note: 'collections.deque 支持队头、队尾操作；不要用 list.pop(0) 代替。',
    code: `from collections import deque
from typing import List

class Solution:
    def maxSlidingWindow(self, nums: List[int], k: int) -> List[int]:
        if k < 1 or k > len(nums):
            return []
        candidates = deque()
        result = []
        for i, value in enumerate(nums):
            if candidates and candidates[0] <= i - k:
                candidates.popleft()
            while candidates and nums[candidates[-1]] <= value:
                candidates.pop()
            candidates.append(i)
            if i >= k - 1:
                result.append(nums[candidates[0]])
        return result`,
  },
  cpp: {
    label: 'C++',
    note: 'std::deque 保存下标。比较的是 nums[index]，过期判断比较的是 index。',
    code: `#include <deque>
#include <vector>

class Solution {
public:
    std::vector<int> maxSlidingWindow(std::vector<int>& nums, int k) {
        if (k < 1 || k > static_cast<int>(nums.size())) return {};
        std::deque<int> candidates;
        std::vector<int> result;
        result.reserve(nums.size() - k + 1);
        for (int i = 0; i < static_cast<int>(nums.size()); ++i) {
            if (!candidates.empty() && candidates.front() <= i - k)
                candidates.pop_front();
            while (!candidates.empty() && nums[candidates.back()] <= nums[i])
                candidates.pop_back();
            candidates.push_back(i);
            if (i >= k - 1) result.push_back(nums[candidates.front()]);
        }
        return result;
    }
};`,
  },
} as const;

export type Language = keyof typeof SOLUTIONS;
