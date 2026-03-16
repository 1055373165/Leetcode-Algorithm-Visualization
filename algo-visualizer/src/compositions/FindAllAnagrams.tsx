import React from 'react';
import {FindAllAnagramsVisualizer, FindAllAnagramsStep} from '../components/FindAllAnagramsVisualizer';

const s = "cbaebabacd";
const p = "abc";

const steps: FindAllAnagramsStep[] = [];

// Helper to check map equality
const isAnagram = (map1: Record<string, number>, map2: Record<string, number>) => {
    const keys1 = Object.keys(map1);
    const keys2 = Object.keys(map2);
    if (keys1.length !== keys2.length) return false;
    for (const key of keys1) {
        if (map1[key] !== map2[key]) return false;
    }
    return true;
};

// Logic Generation
const pCounts: Record<string, number> = {};
for (const char of p) {
    pCounts[char] = (pCounts[char] || 0) + 1;
}

const sCounts: Record<string, number> = {};
const resultIndices: number[] = [];

// Initial Window (0 to p.length - 1)
// We'll build it step by step for visualization if needed, but for fixed window usually we just slide
// Let's show the initial window filling up or just start with it filled?
// Standard sliding window: fill first p.length-1, then loop.
// For simplicity in visualization, let's just start with the first window 
// but we need to show the state *before* it slides.

// Let's initialize first window
for (let i = 0; i < p.length; i++) {
    const char = s[i];
    sCounts[char] = (sCounts[char] || 0) + 1;
}

// Initial check
let isMatch = isAnagram(sCounts, pCounts);
if (isMatch) resultIndices.push(0);

steps.push({
    s, p,
    windowStart: 0,
    windowEnd: p.length,
    sCounts: {...sCounts},
    pCounts,
    matchCount: 0, // Not strictly used in this viz but good for state
    resultIndices: [...resultIndices],
    isMatch,
    description: `Initial Window [0-${p.length-1}]: Counts ${isMatch ? 'MATCH' : 'do not match'}.`
});

// Slide
for (let i = p.length; i < s.length; i++) {
    const startChar = s[i - p.length];
    const newChar = s[i];

    // Remove startChar
    if (sCounts[startChar] === 1) {
        delete sCounts[startChar];
    } else {
        sCounts[startChar]--;
    }

    // Add newChar
    sCounts[newChar] = (sCounts[newChar] || 0) + 1;

    // Check
    const windowStart = i - p.length + 1;
    const windowEnd = i + 1;
    isMatch = isAnagram(sCounts, pCounts);
    if (isMatch) resultIndices.push(windowStart);

    steps.push({
        s, p,
        windowStart,
        windowEnd,
        sCounts: {...sCounts},
        pCounts,
        matchCount: 0,
        resultIndices: [...resultIndices],
        isMatch,
        description: `Slide to [${windowStart}-${windowEnd-1}]: -'${startChar}', +'${newChar}'. ${isMatch ? 'MATCH FOUND!' : 'No match.'}`
    });
}

export const FindAllAnagramsComposition: React.FC = () => {
    return (
        <FindAllAnagramsVisualizer
            steps={steps}
        />
    );
};
