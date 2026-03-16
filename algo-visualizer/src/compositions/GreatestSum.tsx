import React from 'react';
import {GreatestSumVisualizer, GreatestSumStep} from '../components/GreatestSumVisualizer';

const nums = [3, 6, 5, 1, 8];

const steps: GreatestSumStep[] = [];

// Init
// Use a small number instead of -Infinity for easier JSON serialization if needed, 
// represented as -Infinity in logic but visually handled.
// JS Infinity works fine in runtime usually.
let dp = [0, -Infinity, -Infinity]; 

steps.push({
    nums, currentIndex: -1, dp: [...dp], prevDp: [...dp],
    description: "Start: Init DP[0]=0 (Empty sum), DP[1]= -Inf, DP[2]= -Inf."
});

for (let i = 0; i < nums.length; i++) {
    const num = nums[i];
    const prevDp = [...dp];
    const nextDp = [...dp];
    
    // We update nextDp based on prevDp
    for (let r = 0; r < 3; r++) {
        if (prevDp[r] !== -Infinity) {
            const currentSum = prevDp[r] + num;
            const remainder = currentSum % 3;
            nextDp[remainder] = Math.max(nextDp[remainder], currentSum);
        }
    }
    
    steps.push({
        nums, currentIndex: i, dp: [...nextDp], prevDp: [...prevDp],
        description: `Process ${num}: Update states. (e.g. ${num}%3 = ${num%3})`
    });
    
    dp = nextDp;
}

steps.push({
    nums, currentIndex: nums.length, dp: [...dp], prevDp: [...dp],
    description: `Complete. Result is DP[0] = ${dp[0]}.`
});

export const GreatestSumComposition: React.FC = () => {
    return (
        <GreatestSumVisualizer
            steps={steps}
            title="1262. Greatest Sum Divisible by Three"
        />
    );
};
