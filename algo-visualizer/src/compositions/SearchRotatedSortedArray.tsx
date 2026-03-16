import React from 'react';
import {SearchRotatedSortedArrayVisualizer, SearchRotatedSortedArrayStep} from '../components/SearchRotatedSortedArrayVisualizer';

const nums = [4, 5, 6, 7, 0, 1, 2];
const target = 0;

const steps: SearchRotatedSortedArrayStep[] = [];

// Simulation
let left = 0;
let right = nums.length - 1;

steps.push({
    nums, left, right, mid: -1, sortedHalf: null, target, foundIndex: null,
    description: "Start Binary Search. Left=0, Right=6."
});

while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    
    // Step: Calc Mid
    steps.push({
        nums, left, right, mid, sortedHalf: null, target, foundIndex: null,
        description: `Calculate Mid = floor((${left} + ${right}) / 2) = ${mid}. Value is ${nums[mid]}.`
    });

    if (nums[mid] === target) {
        steps.push({
            nums, left, right, mid, sortedHalf: null, target, foundIndex: mid,
            description: `Match! nums[mid] (${nums[mid]}) === target (${target}). Return index ${mid}.`
        });
        break;
    }

    // Determine Sorted Half
    const isLeftSorted = nums[left] <= nums[mid];
    
    // Visual Step: Highlight Sorted
    steps.push({
        nums, left, right, mid, sortedHalf: isLeftSorted ? 'left' : 'right', target, foundIndex: null,
        description: isLeftSorted 
            ? `nums[left] (${nums[left]}) <= nums[mid] (${nums[mid]}). Left half is sorted.`
            : `nums[left] (${nums[left]}) > nums[mid] (${nums[mid]}). Right half is sorted.`
    });

    if (isLeftSorted) {
        if (target >= nums[left] && target < nums[mid]) {
            steps.push({
                nums, left, right, mid, sortedHalf: 'left', target, foundIndex: null,
                description: `Target ${target} is in sorted range [${nums[left]}, ${nums[mid]}]. Move Right to Mid-1.`
            });
            right = mid - 1;
        } else {
            steps.push({
                nums, left, right, mid, sortedHalf: 'left', target, foundIndex: null,
                description: `Target ${target} NOT in sorted range [${nums[left]}, ${nums[mid]}]. Move Left to Mid+1.`
            });
            left = mid + 1;
        }
    } else {
        if (target > nums[mid] && target <= nums[right]) {
            steps.push({
                nums, left, right, mid, sortedHalf: 'right', target, foundIndex: null,
                description: `Target ${target} is in sorted range [${nums[mid]}, ${nums[right]}]. Move Left to Mid+1.`
            });
            left = mid + 1;
        } else {
            steps.push({
                nums, left, right, mid, sortedHalf: 'right', target, foundIndex: null,
                description: `Target ${target} NOT in sorted range [${nums[mid]}, ${nums[right]}]. Move Right to Mid-1.`
            });
            right = mid - 1;
        }
    }
}


export const SearchRotatedSortedArrayComposition: React.FC = () => {
    return (
        <SearchRotatedSortedArrayVisualizer
            steps={steps}
            title="33. Search in Rotated Sorted Array"
        />
    );
};
