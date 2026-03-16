import React from 'react';
import {ClimbingStairsVisualizer, ClimbingStairsStep} from '../components/ClimbingStairsVisualizer';

const N = 5;

// Helper to create steps
const STEPS: ClimbingStairsStep[] = [];

// Base Cases
// dp[0] = 1, dp[1] = 1
let dp: (number|null)[] = Array(N + 1).fill(null);
dp[0] = 1;
dp[1] = 1;

STEPS.push({
    n: N,
    currentStep: 0,
    dp: [...dp],
    highlightIndices: [],
    description: "Base Case: Step 0 (Ground) has 1 way (do nothing)."
});

STEPS.push({
    n: N,
    currentStep: 1,
    dp: [...dp],
    highlightIndices: [0],
    description: "Base Case: Step 1 can only be reached from Step 0 (1 step)."
});

// Iteration
for (let i = 2; i <= N; i++) {
    // Show preparing to calculate
    STEPS.push({
        n: N,
        currentStep: i,
        dp: [...dp],
        highlightIndices: [i-1, i-2],
        description: `Calculate Step ${i}: Sum of ways to reach Step ${i-1} and Step ${i-2}.`
    });

    // Calculate
    const val = (dp[i-1] || 0) + (dp[i-2] || 0);
    dp[i] = val;

    // Show result
    STEPS.push({
        n: N,
        currentStep: i,
        dp: [...dp],
        highlightIndices: [i-1, i-2],
        description: `Step ${i} = ${dp[i-1]} + ${dp[i-2]} = ${val} ways.`
    });
}

// Final
STEPS.push({
    n: N,
    currentStep: N,
    dp: [...dp],
    highlightIndices: [],
    description: `Finished! Total distinct ways to climb to top (Step ${N}): ${dp[N]}.`
});

export const ClimbingStairsComposition: React.FC = () => {
    return (
        <ClimbingStairsVisualizer
            steps={STEPS}
            title="70. Climbing Stairs: Dynamic Programming"
        />
    );
};
