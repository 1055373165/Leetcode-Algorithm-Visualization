import React from 'react';
import {ConsecutiveSequenceVisualizer, SequenceStep} from '../components/ConsecutiveSequenceVisualizer';

const NUMS = [100, 4, 200, 1, 3, 2];
const SET = new Set(NUMS); // Logical set for reference

const STEPS: SequenceStep[] = [
    {
        description: "Init: Put all numbers into a HashSet for O(1) lookup.",
        processedIndices: [],
        sequenceChain: []
    },
    // Loop 1: 100
    {
        currentIndex: 0, // 100
        currentValue: 100,
        description: "Check 100. Is (100 - 1 = 99) in Set?",
        processedIndices: [],
        sequenceChain: []
    },
    {
        currentIndex: 0,
        currentValue: 100,
        description: "99 NOT in Set. 100 is a START of a sequence.",
        processedIndices: [],
        isStartOfSequence: true,
        sequenceChain: [100]
    },
    {
        currentIndex: 0,
        currentValue: 100,
        description: "Check 101... Not found. Seq Len = 1.",
        processedIndices: [0], // Done with 100
        sequenceChain: [100]
    },

    // Loop 2: 4
    {
        currentIndex: 1, // 4
        currentValue: 4,
        description: "Check 4. Is (4 - 1 = 3) in Set?",
        processedIndices: [0],
        sequenceChain: []
    },
    {
        currentIndex: 1,
        currentValue: 4,
        description: "3 IS in Set. 4 is NOT the start. Skip.",
        processedIndices: [0, 1],
        sequenceChain: []
    },

    // Loop 3: 200
    {
        currentIndex: 2, // 200
        currentValue: 200,
        description: "Check 200. Is 199 in Set? No. 200 is START.",
        processedIndices: [0, 1],
        isStartOfSequence: true,
        sequenceChain: [200]
    },
    {
        currentIndex: 2,
        currentValue: 200,
        description: "Check 201... Not found. Seq Len = 1.",
        processedIndices: [0, 1, 2],
        sequenceChain: [200]
    },

    // Loop 4: 1
    {
        currentIndex: 3, // 1
        currentValue: 1,
        description: "Check 1. Is 0 in Set? No. 1 is START.",
        processedIndices: [0, 1, 2],
        isStartOfSequence: true,
        sequenceChain: [1]
    },
    {
        currentIndex: 3,
        currentValue: 1,
        description: "Found START! Expanding... Look for 2.",
        processedIndices: [0, 1, 2],
        isStartOfSequence: true,
        sequenceChain: [1, 2] // Found 2 visually
    },
    {
        currentIndex: 3,
        currentValue: 1,
        description: "Found 2! Look for 3.",
        processedIndices: [0, 1, 2],
        isStartOfSequence: true,
        sequenceChain: [1, 2, 3] // Found 3
    },
    {
        currentIndex: 3,
        currentValue: 1,
        description: "Found 3! Look for 4.",
        processedIndices: [0, 1, 2],
        isStartOfSequence: true,
        sequenceChain: [1, 2, 3, 4] // Found 4
    },
    {
        currentIndex: 3,
        currentValue: 1,
        description: "Found 4! Look for 5... Not found. Seq Len = 4.",
        processedIndices: [0, 1, 2, 3],
        sequenceChain: [1, 2, 3, 4]
    },

    // Loop 5: 3
    {
        currentIndex: 4, // 3
        currentValue: 3,
        description: "Check 3. Is 2 in Set? Yes. Skip.",
        processedIndices: [0, 1, 2, 3, 4],
        sequenceChain: []
    },

    // Loop 6: 2
    {
        currentIndex: 5, // 2
        currentValue: 2,
        description: "Check 2. Is 1 in Set? Yes. Skip.",
        processedIndices: [0, 1, 2, 3, 4, 5],
        sequenceChain: []
    },

    // Final
    {
        description: "Done. Max Length = 4 (Sequence: 1, 2, 3, 4).",
        processedIndices: [0, 1, 2, 3, 4, 5],
        sequenceChain: [1, 2, 3, 4]
    }
];

export const LongestConsecutiveSequenceComposition: React.FC = () => {
    return (
        <ConsecutiveSequenceVisualizer
            nums={NUMS}
            steps={STEPS}
            title="Longest Consecutive Sequence: O(n)"
        />
    );
};
