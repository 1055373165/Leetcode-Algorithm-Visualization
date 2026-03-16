import React from 'react';
import {MinSubArrayLenVisualizer, MinSubArrayLenStep} from '../components/MinSubArrayLenVisualizer';

const target = 7;
const nums = [2, 3, 1, 2, 4, 3];

const steps: MinSubArrayLenStep[] = [];

// Logic Generation
let left = 0;
let currentSum = 0;
let minLength = Infinity;

for (let right = 0; right < nums.length; right++) {
    // Expand
    currentSum += nums[right];
    steps.push({
        nums, target, left, right, currentSum, minLength,
        phase: 'expand',
        description: `Expand Right: Add ${nums[right]}. Sum is ${currentSum}.`
    });

    while (currentSum >= target) {
        // Check new min
        const currentLength = right - left + 1;
        let p = 'contract';
        if (currentLength < minLength) {
            minLength = currentLength;
            p = 'found_new_min';
            steps.push({
                nums, target, left, right, currentSum, minLength,
                phase: 'found_new_min',
                description: `Sum ${currentSum} >= ${target}. Valid window! Length ${currentLength} is new Min.`
            });
        } else {
             steps.push({
                nums, target, left, right, currentSum, minLength,
                phase: 'contract',
                description: `Sum ${currentSum} >= ${target}. Valid window. Length ${currentLength} is not smaller than ${minLength}.`
            });
        }

        // Contract
        currentSum -= nums[left];
        const oldLeft = left;
        left++;
        
        steps.push({
            nums, target, left, right, currentSum, minLength,
            phase: 'contract',
            description: `Contract Left: Remove ${nums[oldLeft]}. Sum becomes ${currentSum}.`
        });
    }
}

export const MinSubArrayLenComposition: React.FC = () => {
    return (
        <MinSubArrayLenVisualizer
            steps={steps}
        />
    );
};
