import React from 'react';
import {SubarraySumVisualizer, SubarraySumStep} from '../components/SubarraySumVisualizer';

const nums = [1, 2, 1, 2, 1];
const k = 3;

// Helper to create entry
const e = (k: any, v: number) => ({k: String(k), v});

// Manual steps for [1, 2, 1, 2, 1], k=3
const STEPS: SubarraySumStep[] = [
    {
        nums, index: -1, currentPre: 0, k,
        prefixMapEntries: [e(0, 1)], count: 0,
        description: "Init: Prefix Sum = 0. Map = {0: 1}.",
        isMatch: false, highlightMapKey: null
    },
    // i=0, num=1
    {
        nums, index: 0, currentPre: 1, k,
        prefixMapEntries: [e(0, 1)], count: 0,
        description: "Add 1. Pre = 1. Target = 1 - 3 = -2. Map has -2? No.",
        isMatch: false, highlightMapKey: -2
    },
    {
        nums, index: 0, currentPre: 1, k,
        prefixMapEntries: [e(0, 1), e(1, 1)], count: 0,
        description: "Add current Pre (1) to Map.",
        isMatch: false, highlightMapKey: null
    },
    // i=1, num=2
    {
        nums, index: 1, currentPre: 3, k,
        prefixMapEntries: [e(0, 1), e(1, 1)], count: 0,
        description: "Add 2. Pre = 3. Target = 3 - 3 = 0. Map has 0? Yes!",
        isMatch: true, highlightMapKey: 0
    },
    {
        nums, index: 1, currentPre: 3, k,
        prefixMapEntries: [e(0, 1), e(1, 1), e(3, 1)], count: 1,
        description: "Count += 1. Add current Pre (3) to Map.",
        isMatch: false, highlightMapKey: null
    },
    // i=2, num=1
    {
        nums, index: 2, currentPre: 4, k,
        prefixMapEntries: [e(0, 1), e(1, 1), e(3, 1)], count: 1,
        description: "Add 1. Pre = 4. Target = 4 - 3 = 1. Map has 1? Yes!",
        isMatch: true, highlightMapKey: 1
    },
    {
        nums, index: 2, currentPre: 4, k,
        prefixMapEntries: [e(0, 1), e(1, 1), e(3, 1), e(4, 1)], count: 2,
        description: "Count += 1. Add current Pre (4) to Map.",
        isMatch: false, highlightMapKey: null
    },
    // i=3, num=2
    {
        nums, index: 3, currentPre: 6, k,
        prefixMapEntries: [e(0, 1), e(1, 1), e(3, 1), e(4, 1)], count: 2,
        description: "Add 2. Pre = 6. Target = 6 - 3 = 3. Map has 3? Yes!",
        isMatch: true, highlightMapKey: 3
    },
    {
        nums, index: 3, currentPre: 6, k,
        prefixMapEntries: [e(0, 1), e(1, 1), e(3, 1), e(4, 1), e(6, 1)], count: 3,
        description: "Count += 1. Add current Pre (6) to Map.",
        isMatch: false, highlightMapKey: null
    },
    // i=4, num=1
    {
        nums, index: 4, currentPre: 7, k,
        prefixMapEntries: [e(0, 1), e(1, 1), e(3, 1), e(4, 1), e(6, 1)], count: 3,
        description: "Add 1. Pre = 7. Target = 7 - 3 = 4. Map has 4? Yes!",
        isMatch: true, highlightMapKey: 4
    },
    {
        nums, index: 4, currentPre: 7, k,
        prefixMapEntries: [e(0, 1), e(1, 1), e(3, 1), e(4, 1), e(6, 1), e(7, 1)], count: 4,
        description: "Count += 1. Add current Pre (7) to Map. Finished.",
        isMatch: false, highlightMapKey: null
    }
];

export const SubarraySumEqualsKComposition: React.FC = () => {
    return (
        <SubarraySumVisualizer
            steps={STEPS}
            title="Subarray Sum Equals K: Prefix Sum + HashMap"
        />
    );
};
