import React from 'react';
import {SlidingWindowVisualizer, SlidingWindowStep} from '../components/SlidingWindowVisualizer';

const INPUT_STRING = "abcabcbb";

// Define the steps of the algorithm
// Based on the blog post logic
const STEPS: SlidingWindowStep[] = [
	{left: 0, right: 0, map: {a: 0}, description: "Init: Expand R to 'a'", maxLen: 1},
	{left: 0, right: 1, map: {a: 0, b: 1}, description: "Expand R to 'b'", maxLen: 2},
	{left: 0, right: 2, map: {a: 0, b: 1, c: 2}, description: "Expand R to 'c'", maxLen: 3},
	{left: 0, right: 3, map: {a: 0, b: 1, c: 2}, description: "Conflict! 'a' seen at 0", maxLen: 3, conflict: true},
	{left: 1, right: 3, map: {a: 3, b: 1, c: 2}, description: "Jump L to 0+1=1, Update 'a'", maxLen: 3},
	{left: 1, right: 4, map: {a: 3, b: 4, c: 2}, description: "Expand R to 'b' (Update 'b')", maxLen: 3}, // b at 1, valid
    {left: 2, right: 4, map: {a: 3, b: 4, c: 2}, description: "Conflict! 'b' seen at 1. Jump L", maxLen: 3, conflict: true},
    {left: 2, right: 5, map: {a: 3, b: 4, c: 5}, description: "Expand R to 'c' (Update 'c')", maxLen: 3},
    {left: 3, right: 5, map: {a: 3, b: 4, c: 5}, description: "Conflict! 'c' seen at 2. Jump L", maxLen: 3, conflict: true},
	{left: 3, right: 6, map: {a: 3, b: 4, c: 5, b_new: 6}, description: "Expand R to 'b'", maxLen: 3}, // b seen at 4
    {left: 5, right: 6, map: {a: 3, b: 6, c: 5}, description: "Conflict! 'b' seen at 4. Jump L", maxLen: 3, conflict: true},
	{left: 5, right: 7, map: {a: 3, b: 6, c: 5, b_new_2: 7}, description: "Expand R to 'b'", maxLen: 3}, // b seen at 6
    {left: 7, right: 7, map: {a: 3, b: 7, c: 5}, description: "Conflict! 'b' seen at 6. Jump L", maxLen: 3, conflict: true},
];

export const LongestSubstringComposition: React.FC = () => {
    return (
        <SlidingWindowVisualizer
            inputString={INPUT_STRING}
            steps={STEPS}
            title="Sliding Window: Longest Substring"
        />
    );
};
