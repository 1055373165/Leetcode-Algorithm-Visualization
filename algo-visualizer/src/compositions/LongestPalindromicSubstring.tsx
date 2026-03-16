import React from 'react';
import {SlidingWindowVisualizer, SlidingWindowStep} from '../components/SlidingWindowVisualizer';

const INPUT_STRING = "babad";

// Visualizing "Center Expansion"
// We will show just a few key expansions to save time.
// 1. Center 'a' (index 1) -> "bab"
// 2. Center 'b' (index 2) -> "aba" (shorter/same, but let's show one that works well)
// Actually "babad":
// i=0 ('b'): "b"
// i=1 ('a'): "a" -> "bab" -> mismatch "cbabc" (if it existed)
// Let's manually craft steps to show the intuition.

const STEPS: SlidingWindowStep[] = [
    // Center at index 0 ('b')
    {left: 0, right: 0, map: {}, description: "Center 0 ('b'): Expand...", maxLen: 1},
    {left: 0, right: 0, map: {}, description: "Center 0: 'b' matches itself", maxLen: 1},
    
    // Center at index 1 ('a')
    {left: 1, right: 1, map: {}, description: "Center 1 ('a'): Expand...", maxLen: 1},
    {left: 0, right: 2, map: {}, description: "Expand: 'b' == 'b'. Match!", maxLen: 3},
    {left: -1, right: 3, map: {}, description: "Expand: Out of bounds. Stop.", maxLen: 3, conflict: true}, // Visualizer might need tweak for -1, let's keep it 0-len or just show conflict

    // Center at index 2 ('b')
    {left: 2, right: 2, map: {}, description: "Center 2 ('b'): Expand...", maxLen: 3},
    {left: 1, right: 3, map: {}, description: "Expand: 'a' != 'a' (Wait 'a'=='a')", maxLen: 3}, 
    // Wait input is 'babad'
    // 0:b, 1:a, 2:b, 3:a, 4:d
    // Center 2 ('b'):
    // L=1('a'), R=3('a') -> Match! "aba" (len 3)
    // L=0('b'), R=4('d') -> Mismatch!
    {left: 1, right: 3, map: {}, description: "Expand: 'a' == 'a'. Match!", maxLen: 3},
    {left: 0, right: 4, map: {}, description: "Expand: 'b' != 'd'. Mismatch!", maxLen: 3, conflict: true},

    // Finished
    {left: 0, right: 2, map: {}, description: "Global Max Found: 'bab' (or 'aba')", maxLen: 3},
];

// Note: The visualizer might throw if index is -1. 
// Let's check visualizer logic: `chars.map((char, index) => ...)`
// if left is -1, it checks `index === step.left` (false), `index >= step.left` (true for all).
// Wait: `index >= step.left && index <= step.right`.
// If left=-1, right=3. Indices 0,1,2,3 will be in window.
// This is actually fine for highlighting "tried to expand but failed".
// But strictly speaking, the valid window was the previous one.
// Let's adjust steps to be cleaner.

const STEPS_CLEAN: SlidingWindowStep[] = [
    {left: 0, right: 0, map: {}, description: "Idx 0 ('b'): Single char is palindrome", maxLen: 1},
    
    {left: 1, right: 1, map: {}, description: "Idx 1 ('a'): Try expand...", maxLen: 1},
    {left: 0, right: 2, map: {}, description: "Hit 'b' and 'b'. Match! -> 'bab'", maxLen: 3},
    
    {left: 2, right: 2, map: {}, description: "Idx 2 ('b'): Try expand...", maxLen: 3},
    {left: 1, right: 3, map: {}, description: "Hit 'a' and 'a'. Match! -> 'aba'", maxLen: 3},
    {left: 0, right: 4, map: {}, description: "Hit 'b' and 'd'. Mismatch!", maxLen: 3, conflict: true},

    {left: 0, right: 2, map: {}, description: "Result: 'bab' (len 3)", maxLen: 3},
];

export const LongestPalindromicSubstringComposition: React.FC = () => {
    return (
        <SlidingWindowVisualizer
            inputString={INPUT_STRING}
            steps={STEPS_CLEAN}
            title="Longest Palindromic Substring"
        />
    );
};
