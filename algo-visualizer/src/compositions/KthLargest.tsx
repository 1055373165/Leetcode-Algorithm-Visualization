import React from 'react';
import {KthLargestVisualizer, KthLargestStep} from '../components/KthLargestVisualizer';

const initialNums = [3, 2, 1, 5, 6, 4];
const k = 2;
const target = initialNums.length - k;

const clone = (arr: number[]) => [...arr];
const steps: KthLargestStep[] = [];

// Simulation
let nums = clone(initialNums);
let left = 0;
let right = nums.length - 1;

steps.push({
    nums: clone(nums), left, right, pivotIndex: null, i: null, j: null, target, found: false,
    description: `Start QuickSelect. Find ${k}th largest -> Index ${target}.`
});

// QuickSelect Loop simulation
// Since we want deterministic animation, we'll hardcode pivot choices or use a deterministic "random"
// For [3, 2, 1, 5, 6, 4], target 4 (value 5).
// Round 1: Range [0, 5]. Pivot index 5 (val 4).
// Partition:
// 3 < 4 (swap), 2 < 4 (swap), 1 < 4 (swap), 5 > 4, 6 > 4.
// Array becomes [3, 2, 1, 4, 6, 5]? No.
// Let's trace Partition logic.
// Pivot 4 (idx 5). moved to end (it is at end).
// i=0.
// j=0 (3 < 4): swap(0,0), i=1. Array: [3, 2, 1, 5, 6, 4]
// j=1 (2 < 4): swap(1,1), i=2. Array: [3, 2, 1, 5, 6, 4]
// j=2 (1 < 4): swap(2,2), i=3. Array: [3, 2, 1, 5, 6, 4]
// j=3 (5 > 4): no swap.
// j=4 (6 > 4): no swap.
// End loop. Swap pivot to i=3. Array: [3, 2, 1, 4, 6, 5]
// Pivot final index 3. Target 4. 3 < 4. Recurse Right: [4, 5].

function tracePartition(l: number, r: number, pIdx: number) {
    const pivotVal = nums[pIdx];
    
    steps.push({
        nums: clone(nums), left: l, right: r, pivotIndex: pIdx, i: null, j: null, target, found: false,
        description: `Chosen Pivot: ${pivotVal} at index ${pIdx}.`
    });

    // Move pivot to right
    [nums[pIdx], nums[r]] = [nums[r], nums[pIdx]];
    steps.push({
        nums: clone(nums), left: l, right: r, pivotIndex: r, i: null, j: null, target, found: false,
        description: `Move Pivot ${pivotVal} to end (index ${r}).`
    });

    let i = l;
    for (let j = l; j < r; j++) {
        steps.push({
            nums: clone(nums), left: l, right: r, pivotIndex: r, i, j, target, found: false,
            description: `Compare nums[${j}]=${nums[j]} with Pivot ${pivotVal}.`
        });

        if (nums[j] < pivotVal) {
             [nums[i], nums[j]] = [nums[j], nums[i]];
             steps.push({
                nums: clone(nums), left: l, right: r, pivotIndex: r, i, j, target, found: false,
                description: `${nums[i]} < ${pivotVal}: Swap to left (i). i++`
            });
             i++;
        }
    }

    // Restore pivot
    [nums[i], nums[r]] = [nums[r], nums[i]];
    steps.push({
        nums: clone(nums), left: l, right: r, pivotIndex: i, i, j: r, target, found: false,
        description: `Restore Pivot to final position ${i}.`
    });

    return i;
}

// Logic flow
let done = false;
let currentL = 0;
let currentR = nums.length - 1;

// Iteration 1
// Pivot: 4 (index 5)
let finalP = tracePartition(currentL, currentR, 5);
if (finalP === target) {
     steps.push({nums: clone(nums), left: currentL, right: currentR, pivotIndex: finalP, i: null, j: null, target, found: true, description: "Pivot reached target index!"});
     done = true;
} else if (finalP < target) {
    steps.push({nums: clone(nums), left: currentL, right: currentR, pivotIndex: finalP, i: null, j: null, target, found: false, description: `Pivot ${finalP} < Target ${target}. Recurse Right.`});
    currentL = finalP + 1;
} else {
    // ...
}

if (!done) {
    // Iteration 2: Range [4, 5]. Array: [..., 6, 5]. (Indices 4, 5)
    // Pivot: 5 (index 5)
    finalP = tracePartition(currentL, currentR, 5);
    if (finalP === target) {
        steps.push({nums: clone(nums), left: currentL, right: currentR, pivotIndex: finalP, i: null, j: null, target, found: true, description: "Pivot reached target index!"});
    }
}


export const KthLargestComposition: React.FC = () => {
    return (
        <KthLargestVisualizer
            steps={steps}
            title="215. Kth Largest Element"
        />
    );
};
