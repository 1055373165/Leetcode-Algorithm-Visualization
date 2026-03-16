import React from 'react';
import {NumberArrayVisualizer, NumberArrayStep} from '../components/NumberArrayVisualizer';

const NUMBERS = [-4, -1, -1, 0, 1, 2];
// Original was [-1, 0, 1, 2, -1, -4], sorted is [-4, -1, -1, 0, 1, 2]

const STEPS: NumberArrayStep[] = [
    {
        pointers: [],
        description: "Step 1: Sort the array [-1, 0, 1, 2, -1, -4] -> [-4, -1, -1, 0, 1, 2]",
        highlights: []
    },
    // Iteration 1: i=0 (-4)
    {
        pointers: [{index: 0, label: 'i', color: '#ffeb3b'}],
        description: "Fix i = 0 (val: -4). Target for L+R is 4.",
        highlights: [{index: 0, color: '#ffeb3b'}]
    },
    {
        pointers: [
            {index: 0, label: 'i', color: '#ffeb3b'},
            {index: 1, label: 'L', color: '#4caf50'},
            {index: 5, label: 'R', color: '#f44336'}
        ],
        description: "Init L=i+1, R=end.",
        secondaryInfo: "Sum = -4 + (-1) + 2 = -3. (-3 < 0). Too small.",
        highlights: [{index: 0, color: '#ffeb3b'}]
    },
    {
        pointers: [
            {index: 0, label: 'i', color: '#ffeb3b'},
            {index: 2, label: 'L', color: '#4caf50'},
            {index: 5, label: 'R', color: '#f44336'}
        ],
        description: "Move L right to increase sum.",
        secondaryInfo: "Sum = -4 + (-1) + 2 = -3. (-3 < 0). Still too small.",
        highlights: [{index: 0, color: '#ffeb3b'}]
    },
    {
        pointers: [
            {index: 0, label: 'i', color: '#ffeb3b'},
            {index: 3, label: 'L', color: '#4caf50'},
            {index: 5, label: 'R', color: '#f44336'}
        ],
        description: "Move L right again.",
        secondaryInfo: "Sum = -4 + 0 + 2 = -2. (-2 < 0). Too small.",
        highlights: [{index: 0, color: '#ffeb3b'}]
    },
    // Skipping some for brevity... eventually L=4(1), R=5(2) -> -4+1+2 = -1.
    // Let's jump to next i.
    
    // Iteration 2: i=1 (-1)
    {
        pointers: [{index: 1, label: 'i', color: '#ffeb3b'}],
        description: "Fix i = 1 (val: -1). Target for L+R is 1.",
        highlights: [{index: 1, color: '#ffeb3b'}]
    },
    {
        pointers: [
            {index: 1, label: 'i', color: '#ffeb3b'},
            {index: 2, label: 'L', color: '#4caf50'},
            {index: 5, label: 'R', color: '#f44336'}
        ],
        description: "Init L=i+1, R=end.",
        secondaryInfo: "Sum = -1 + (-1) + 2 = 0. Found One!",
        highlights: [
            {index: 1, color: '#ffeb3b'},
            {index: 2, color: '#4caf50'}, // Found
            {index: 5, color: '#f44336'}  // Found
        ]
    },
    {
        pointers: [
            {index: 1, label: 'i', color: '#ffeb3b'},
            {index: 3, label: 'L', color: '#4caf50'},
            {index: 4, label: 'R', color: '#f44336'}
        ],
        description: "Record [-1, -1, 2]. Move L right, R left. Skip duplicates.",
        secondaryInfo: "Sum = -1 + 0 + 1 = 0. Found Another!",
        highlights: [
            {index: 1, color: '#ffeb3b'},
            {index: 3, color: '#4caf50'},
            {index: 4, color: '#f44336'}
        ]
    },
    {
        pointers: [
            {index: 1, label: 'i', color: '#ffeb3b'},
            {index: 3, label: 'L', color: '#4caf50'}, // L and R cross or meet?
            {index: 3, label: 'R', color: '#f44336'}  // visual simplification
        ],
        description: "Record [-1, 0, 1]. Pointers meet using while(L<R).",
        secondaryInfo: "Finished iteration for i=1.",
        highlights: [{index: 1, color: '#ffeb3b'}]
    },
    
    // Iteration 3: i=2 (-1) check duplicate
    {
        pointers: [{index: 2, label: 'i', color: '#ffeb3b'}],
        description: "Fix i = 2 (val: -1). Duplicate of i=1! Skip.",
        highlights: [{index: 2, color: '#777'}] // Grey out
    },
    
    // End
    {
        pointers: [],
        description: "Finished. Found triplets: [-1, -1, 2] and [-1, 0, 1].",
        highlights: []
    }
];

export const ThreeSumComposition: React.FC = () => {
    return (
        <NumberArrayVisualizer
            numbers={NUMBERS}
            steps={STEPS}
            title="3Sum: Sorted Array + Two Pointers"
        />
    );
};
