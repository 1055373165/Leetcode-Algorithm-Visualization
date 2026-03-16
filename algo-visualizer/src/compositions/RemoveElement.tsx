import React from 'react';
import {RemoveElementVisualizer, RemoveElementStep} from '../components/RemoveElementVisualizer';

const initialNums = [0, 1, 2, 2, 3, 0, 4, 2];
const val = 2;

const STEPS: RemoveElementStep[] = [];
let nums = [...initialNums];
let k = 0;

// Init
STEPS.push({
    nums: [...nums], i: 0, k: 0, val,
    description: "Start: i (reader) and k (writer) at 0. Find numbers != 2.",
    highlightIndices: [], action: 'scan'
});

for (let i = 0; i < nums.length; i++) {
    // Scan step
    STEPS.push({
        nums: [...nums], i, k, val,
        description: `Check nums[${i}] = ${nums[i]}. Is it ${val}?`,
        highlightIndices: [i], action: 'scan'
    });

    if (nums[i] !== val) {
        // Copy step
        nums[k] = nums[i]; // Visualize rewrite
        STEPS.push({
            nums: [...nums], i, k, val,
            description: `${nums[i]} != ${val}. Copy nums[${i}] to nums[${k}]. Increment k.`,
            highlightIndices: [i, k], action: 'copy'
        });
        k++;
    } else {
        // Skip step
        STEPS.push({
            nums: [...nums], i, k, val,
            description: `${nums[i]} == ${val}. Skip it. k stays at ${k}.`,
            highlightIndices: [i], action: 'skip'
        });
    }
}

// Finish
STEPS.push({
    nums: [...nums], i: nums.length, k, val,
    description: `Finished. New length k = ${k}. Elements 0 to ${k-1} are valid.`,
    highlightIndices: [], action: 'finish'
});

export const RemoveElementComposition: React.FC = () => {
    return (
        <RemoveElementVisualizer
            steps={STEPS}
            title="27. Remove Element: Two Pointers"
        />
    );
};
