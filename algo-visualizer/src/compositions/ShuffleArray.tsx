import React from 'react';
import {ShuffleArrayVisualizer, ShuffleArrayStep} from '../components/ShuffleArrayVisualizer';

const nums = [2, 5, 1, 3, 4, 7];
const n = 3;

const steps: ShuffleArrayStep[] = [];

// Simulation
const result = new Array(2 * n).fill(0);

steps.push({
    nums: [...nums],
    result: [...result],
    currentIndex: 0,
    n,
    action: 'wait',
    description: "Start: Array split into [x1, x2, x3] (Blue) and [y1, y2, y3] (Red)."
});

for (let i = 0; i < n; i++) {
    // Move X
    result[2 * i] = nums[i];
    steps.push({
        nums: [...nums],
        result: [...result],
        currentIndex: i,
        n,
        action: 'move_x',
        description: `Move x${i+1} (${nums[i]}) to result[${2*i}].`
    });

    // Move Y
    result[2 * i + 1] = nums[n + i];
    steps.push({
        nums: [...nums],
        result: [...result],
        currentIndex: i,
        n,
        action: 'move_y',
        description: `Move y${i+1} (${nums[n+i]}) to result[${2*i+1}].`
    });
}

steps.push({
    nums: [...nums],
    result: [...result],
    currentIndex: n-1,
    n,
    action: 'wait',
    description: "Done! Array shuffled."
});

export const ShuffleArrayComposition: React.FC = () => {
    return (
        <ShuffleArrayVisualizer
            steps={steps}
        />
    );
};
