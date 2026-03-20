import React from 'react';
import {SlidingWindowMaxVisualizer, SlidingWindowMaxStep} from '../components/SlidingWindowMaxVisualizer';

const nums = [1, 3, -1, -3, 5, 3, 6, 7];
const k = 3;

const steps: SlidingWindowMaxStep[] = [];
const resultSize = nums.length - k + 1;
const result: (number | null)[] = new Array(resultSize).fill(null);
const deque: number[] = []; // stores indices, front is max

// Init step
steps.push({
    nums, k,
    currentIndex: -1,
    deque: [],
    windowLeft: 0,
    result: [...result],
    action: 'init',
    removedIndex: null,
    reason: `Sliding Window Maximum: nums=[${nums}], k=${k}. Use monotonic decreasing deque.`,
});

for (let i = 0; i < nums.length; i++) {
    const windowLeft = Math.max(0, i - k + 1);

    // Step 1: Remove front if out of window
    if (deque.length > 0 && deque[0] < windowLeft) {
        const removed = deque[0];
        steps.push({
            nums, k,
            currentIndex: i,
            deque: [...deque],
            windowLeft,
            result: [...result],
            action: 'remove_front',
            removedIndex: removed,
            reason: `i=${i}: deque front index ${removed} is outside window [${windowLeft},${i}]. Remove from front.`,
        });
        deque.shift();
    }

    // Step 2: Remove back elements smaller than nums[i]
    while (deque.length > 0 && nums[deque[deque.length - 1]] <= nums[i]) {
        const removed = deque[deque.length - 1];
        steps.push({
            nums, k,
            currentIndex: i,
            deque: [...deque],
            windowLeft,
            result: [...result],
            action: 'remove_back',
            removedIndex: removed,
            reason: `i=${i}: nums[${removed}]=${nums[removed]} ≤ nums[${i}]=${nums[i]}. Remove ${removed} from back (can never be max).`,
        });
        deque.pop();
    }

    // Step 3: Push current index
    deque.push(i);
    steps.push({
        nums, k,
        currentIndex: i,
        deque: [...deque],
        windowLeft,
        result: [...result],
        action: 'push',
        removedIndex: null,
        reason: `i=${i}: push index ${i} (val=${nums[i]}) to deque back. Deque: [${deque.map(d => `${d}(${nums[d]})`).join(', ')}]`,
    });

    // Step 4: Collect result if window is full
    if (i >= k - 1) {
        const maxVal = nums[deque[0]];
        const resultIdx = i - k + 1;
        result[resultIdx] = maxVal;
        steps.push({
            nums, k,
            currentIndex: i,
            deque: [...deque],
            windowLeft,
            result: [...result],
            action: 'collect',
            removedIndex: null,
            reason: `Window [${windowLeft},${i}] full → max = nums[${deque[0]}] = ${maxVal}. result[${resultIdx}] = ${maxVal}`,
        });
    }
}

// Done
steps.push({
    nums, k,
    currentIndex: nums.length,
    deque: [...deque],
    windowLeft: nums.length - k,
    result: [...result],
    action: 'done',
    removedIndex: null,
    reason: `Done! result = [${result.join(', ')}]`,
});

export const SlidingWindowMaxComposition: React.FC = () => {
    return (
        <SlidingWindowMaxVisualizer
            steps={steps}
            title="239. Sliding Window Maximum (Monotonic Deque)"
        />
    );
};
