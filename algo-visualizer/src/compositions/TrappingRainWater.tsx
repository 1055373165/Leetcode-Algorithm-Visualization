import React from 'react';
import {RainWaterVisualizer, RainWaterStep} from '../components/RainWaterVisualizer';

const HEIGHTS = [0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1];
// Indexes:      0  1  2  3  4  5  6  7  8  9 10 11

const STEPS: RainWaterStep[] = [
    {
        pointers: [
            {index: 0, label: 'L', color: '#ffeb3b'},
            {index: 11, label: 'R', color: '#ffeb3b'}
        ],
        description: "Init L=0, R=11. MaxLeft=0, MaxRight=0.",
        waterLevels: Array(12).fill(0),
        maxLeft: 0,
        maxRight: 0,
        currentWaterSum: 0
    },
    // L=0 (h=0), R=11 (h=1). h[L] < h[R] -> Process L
    {
        pointers: [
            {index: 0, label: 'L', color: '#ffeb3b'},
            {index: 11, label: 'R', color: '#ffeb3b'} // h[R]=1
        ],
        description: "h[L]=0 < h[R]=1. Update MaxLeft. Process L.",
        waterLevels: Array(12).fill(0),
        maxLeft: 0, // Old MaxLeft
        maxRight: 1, // Actually we don't know MaxRight fully, but strictly logic uses partial. 
                     // Standard alg: maintain max_left and max_right seen SO FAR.
                     // On L side, we only care about max_left vs 'something on right >= max_left'.
                     // Actually logic: h[L] < h[R] implies max_left < max_right (if updated) is NOT necessarily true yet?
                     // Let's follow standard code:
                     // if h[L] < h[R]:
                     //   if h[L] >= max_l: max_l = h[L]
                     //   else: ans += max_l - h[L]
                     //   L++
        currentWaterSum: 0
    },
    {
        pointers: [
            {index: 0, label: 'L', color: '#ffeb3b'}, // h=0
            {index: 11, label: 'R', color: '#ffeb3b'}
        ],
        description: "h[L]=0 >= max_l(0). Update MaxLeft -> 0. Move L.",
        waterLevels: Array(12).fill(0),
        maxLeft: 0,
        maxRight: 0,
        currentWaterSum: 0
    },
    
    // L=1 (h=1), R=11 (h=1)
    {
        pointers: [
            {index: 1, label: 'L', color: '#ffeb3b'},
            {index: 11, label: 'R', color: '#ffeb3b'}
        ],
        description: "L=1 (h=1). h[L] <= h[R] (1==1). Process L (or R). Let's L.",
        waterLevels: Array(12).fill(0),
        maxLeft: 0,
        maxRight: 0,
        currentWaterSum: 0
    },
    {
        pointers: [
            {index: 1, label: 'L', color: '#ffeb3b'},
            {index: 11, label: 'R', color: '#ffeb3b'}
        ],
        description: "h[L]=1 > max_l(0). Update MaxLeft -> 1. Move L.",
        waterLevels: Array(12).fill(0),
        maxLeft: 1,
        maxRight: 0,
        currentWaterSum: 0
    },

    // L=2 (h=0), R=11 (h=1)
    {
        pointers: [
            {index: 2, label: 'L', color: '#ffeb3b'},
            {index: 11, label: 'R', color: '#ffeb3b'}
        ],
        description: "L=2 (h=0) < h[R]=1. Process L.",
        waterLevels: Array(12).fill(0),
        maxLeft: 1,
        maxRight: 1, // Implicitly we know right is at least 1
        currentWaterSum: 0
    },
    {
        pointers: [
            {index: 2, label: 'L', color: '#ffeb3b'},
            {index: 11, label: 'R', color: '#ffeb3b'}
        ],
        description: "h[L]=0 < max_l(1). Trap Water! Vol = 1 - 0 = 1.",
        waterLevels: [0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0], // idx 2 gets 1
        maxLeft: 1,
        maxRight: 1,
        currentWaterSum: 1
    },
    {
        pointers: [
            {index: 3, label: 'L', color: '#ffeb3b'}, // Move L
            {index: 11, label: 'R', color: '#ffeb3b'}
        ],
        description: "Move L to 3 (h=2). h[3]=2 > h[11]=1. Switch to R.",
        waterLevels: [0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        maxLeft: 1,
        maxRight: 1,
        currentWaterSum: 1
    },

    // Switch to R processing
    // R=11 (h=1) -> h[11] >= max_r (init 0). Update max_r=1. Move R to 10.
    {
        pointers: [
            {index: 3, label: 'L', color: '#ffeb3b'},
            {index: 10, label: 'R', color: '#ffeb3b'}
        ],
        description: "Process R=11. Update MaxRight -> 1. Move R left.",
        waterLevels: [0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        maxLeft: 1,
        maxRight: 1,
        currentWaterSum: 1
    },

    // L=3 (h=2), R=10 (h=2). Equal. Process L.
    {
        pointers: [
            {index: 3, label: 'L', color: '#ffeb3b'},
            {index: 10, label: 'R', color: '#ffeb3b'}
        ],
        description: "Process L=3. h[3]=2 > MaxLeft(1). Update MaxLeft->2.",
        waterLevels: [0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        maxLeft: 2,
        maxRight: 1,
        currentWaterSum: 1
    },
    {
        pointers: [
            {index: 4, label: 'L', color: '#ffeb3b'},
            {index: 10, label: 'R', color: '#ffeb3b'}
        ],
        description: "Move L to 4 (h=1). h[L]=1 < h[R]=2. Process L.",
        waterLevels: [0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        maxLeft: 2,
        maxRight: 1,
        currentWaterSum: 1
    },
    {
        pointers: [
            {index: 4, label: 'L', color: '#ffeb3b'},
            {index: 10, label: 'R', color: '#ffeb3b'}
        ],
        description: "h[L]=1 < MaxLeft(2). Trap Water! Vol = 2 - 1 = 1.",
        waterLevels: [0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0],
        maxLeft: 2,
        maxRight: 2, // Actually R side is at least 1, but L side logic relies on MaxLeft & MaxRight implicitly
        currentWaterSum: 2
    },

    // Skip ahead (visual logic simplification)
    // Fill the rest...
    {
        pointers: [
            {index: 5, label: 'L', color: '#ffeb3b'},
            {index: 10, label: 'R', color: '#ffeb3b'}
        ],
        description: "Fast Forward: Trapping water at idx 5 (0) -> 2 units.",
        waterLevels: [0, 0, 1, 0, 1, 2, 0, 0, 0, 0, 0, 0],
        maxLeft: 2,
        maxRight: 2,
        currentWaterSum: 4
    },
     {
        pointers: [
            {index: 6, label: 'L', color: '#ffeb3b'},
            {index: 7, label: 'R', color: '#ffeb3b'}
        ],
        description: "Fast Forward: Idx 6 (1)->1 unit. Idx 8,9 resolved.",
        waterLevels: [0, 0, 1, 0, 1, 2, 1, 0, 0, 1, 0, 0], // idx 9 is 1 unit (min(3,2)-1=1)
        maxLeft: 3,
        maxRight: 2,
        currentWaterSum: 4
    },
    // Final
    {
        pointers: [],
        description: "Completed! Total Water Trapped = 6.",
        waterLevels: [0, 0, 1, 0, 1, 2, 1, 0, 0, 1, 0, 0],
        maxLeft: 3,
        maxRight: 2,
        currentWaterSum: 6
    }
];

export const TrappingRainWaterComposition: React.FC = () => {
    return (
        <RainWaterVisualizer
            heights={HEIGHTS}
            steps={STEPS}
            title="Trapping Rain Water: Two Pointer"
        />
    );
};
