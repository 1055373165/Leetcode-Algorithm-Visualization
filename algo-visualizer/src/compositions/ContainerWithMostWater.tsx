import React from 'react';
import {BarChartVisualizer, BarChartStep} from '../components/BarChartVisualizer';

const HEIGHTS = [1, 8, 6, 2, 5, 4, 8, 3, 7];

const STEPS: BarChartStep[] = [
    {
        pointers: [{index: 0, label: 'L', color: '#ffeb3b'}, {index: 8, label: 'R', color: '#ffeb3b'}],
        description: "Init: L at 0 (h=1), R at 8 (h=7)",
        maxArea: 0,
        currentArea: 0
    },
    {
        pointers: [{index: 0, label: 'L', color: '#ffeb3b'}, {index: 8, label: 'R', color: '#ffeb3b'}],
        description: "Area = min(1, 7) * (8-0) = 1 * 8 = 8",
        maxArea: 8,
        currentArea: 8,
        highlightIndices: [0] // Highlight shorter bar
    },
    {
        pointers: [{index: 1, label: 'L', color: '#ffeb3b'}, {index: 8, label: 'R', color: '#ffeb3b'}],
        description: "L is shorter (1 < 7), so move L right.",
        maxArea: 8,
        currentArea: 0
    },
    {
        pointers: [{index: 1, label: 'L', color: '#ffeb3b'}, {index: 8, label: 'R', color: '#ffeb3b'}],
        description: "New Area = min(8, 7) * (8-1) = 7 * 7 = 49",
        maxArea: 49,
        currentArea: 49,
        highlightIndices: [8] // Highlight shorter bar (7)
    },
    {
        pointers: [{index: 1, label: 'L', color: '#ffeb3b'}, {index: 7, label: 'R', color: '#ffeb3b'}],
        description: "R is shorter (7 < 8), so move R left.",
        maxArea: 49,
        currentArea: 0
    },
    {
        pointers: [{index: 1, label: 'L', color: '#ffeb3b'}, {index: 7, label: 'R', color: '#ffeb3b'}],
        description: "Area = min(8, 3) * (7-1) = 3 * 6 = 18",
        maxArea: 49,
        currentArea: 18,
        highlightIndices: [7] // Highlight shorter bar (3)
    },
    {
        pointers: [{index: 1, label: 'L', color: '#ffeb3b'}, {index: 6, label: 'R', color: '#ffeb3b'}],
        description: "R (3) < L (8), move R left.",
        maxArea: 49,
        currentArea: 0
    },
    {
        pointers: [{index: 1, label: 'L', color: '#ffeb3b'}, {index: 6, label: 'R', color: '#ffeb3b'}],
        description: "Area = min(8, 8) * (6-1) = 8 * 5 = 40",
        maxArea: 49,
        currentArea: 40,
        highlightIndices: [1, 6] // Both equal, move either. Strategy says usually move both or one.
    },
    {
        pointers: [{index: 2, label: 'L', color: '#ffeb3b'}, {index: 6, label: 'R', color: '#ffeb3b'}],
        description: "Heights equal. Move L (or R). Let's move L.",
        maxArea: 49,
        currentArea: 0
    },
    {
        pointers: [{index: 2, label: 'L', color: '#ffeb3b'}, {index: 6, label: 'R', color: '#ffeb3b'}],
        description: "Area = min(6, 8) * (6-2) = 6 * 4 = 24",
        maxArea: 49,
        currentArea: 24,
        highlightIndices: [2]
    },
    // We can skip a few steps for brevity or show them fast
    {
        pointers: [{index: 2, label: 'L', color: '#ffeb3b'}, {index: 6, label: 'R', color: '#ffeb3b'}],
        description: "Finished! Max Area is 49.",
        maxArea: 49,
        currentArea: 24
    }
];

export const ContainerWithMostWaterComposition: React.FC = () => {
    return (
        <BarChartVisualizer
            heights={HEIGHTS}
            steps={STEPS}
            title="Container With Most Water"
        />
    );
};
