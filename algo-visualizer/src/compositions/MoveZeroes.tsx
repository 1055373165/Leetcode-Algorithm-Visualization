import React from 'react';
import {MoveZeroesVisualizer, MoveZeroesStep} from '../components/MoveZeroesVisualizer';

const numsInput = [0, 1, 0, 3, 12];

const steps: MoveZeroesStep[] = [];

// Simulation
const nums = [...numsInput];
let left = 0;

steps.push({
    nums: [...nums],
    left: 0,
    right: 0,
    action: 'scan',
    description: "Start: Left points to insertion pos, Right scans for non-zeroes."
});

for (let right = 0; right < nums.length; right++) {
    const val = nums[right];

    if (val !== 0) {
        // Swap
        const temp = nums[left];
        nums[left] = nums[right];
        nums[right] = temp;

        steps.push({
            nums: [...nums],
            left,
            right,
            action: 'swap',
            description: `Found non-zero ${val}. Swap with Left (${temp}). Left moves forward.`
        });
        
        left++;
    } else {
        steps.push({
            nums: [...nums],
            left,
            right,
            action: 'skip',
            description: `Found 0. Skip. Right moves forward.`
        });
    }
}

steps.push({
    nums: [...nums],
    left,
    right: nums.length - 1,
    action: 'scan',
    description: "Done! All non-zeroes are at the front. Zeroes are at the back."
});

export const MoveZeroesComposition: React.FC = () => {
    return (
        <MoveZeroesVisualizer
            steps={steps}
        />
    );
};
