import React from 'react';
import {NumberOfIslandsVisualizer, NumberOfIslandsStep} from '../components/NumberOfIslandsVisualizer';

// Initial Grid:
// 1 1 0 0 0
// 1 1 0 0 0
// 0 0 1 0 0
// 0 0 0 1 1
const initialGrid = [
    ["1", "1", "0", "0", "0"],
    ["1", "1", "0", "0", "0"],
    ["0", "0", "1", "0", "0"],
    ["0", "0", "0", "1", "1"]
];

// Helper to deep copy grid
const copyGrid = (grid: string[][]) => grid.map(row => [...row]);

const STEPS: NumberOfIslandsStep[] = [];

// HARDCODED STEPS for Visualization simplicity
// Step 0: Init
STEPS.push({
    grid: copyGrid(initialGrid),
    currentRow: -1, currentCol: -1, islandCount: 0,
    description: "Start scanning the grid for '1's (Land)."
});

// Row 0
STEPS.push({
    grid: copyGrid(initialGrid),
    currentRow: 0, currentCol: 0, islandCount: 0,
    description: "Found Land at [0,0]! Increment count and start Flood Fill."
});

// Flood Fill Island 1
let grid1 = copyGrid(initialGrid);
grid1[0][0] = '2'; // Mark visited
STEPS.push({
    grid: copyGrid(grid1),
    currentRow: 0, currentCol: 0, islandCount: 1,
    description: "Flood Fill: Mark [0,0] as visited (2). Check neighbors.",
    floodCells: [{r:0, c:0}]
});

grid1[0][1] = '2';
grid1[1][0] = '2';
STEPS.push({
    grid: copyGrid(grid1),
    currentRow: 0, currentCol: 0, islandCount: 1,
    description: "Flood Fill: Spreading to [0,1] and [1,0].",
    floodCells: [{r:0, c:1}, {r:1, c:0}]
});

grid1[1][1] = '2';
STEPS.push({
    grid: copyGrid(grid1),
    currentRow: 0, currentCol: 0, islandCount: 1,
    description: "Flood Fill: Spreading to [1,1]. Entire island marked.",
    floodCells: [{r:1, c:1}]
});

// Continue Scanning
STEPS.push({
    grid: copyGrid(grid1),
    currentRow: 0, currentCol: 1, islandCount: 1,
    description: "Scan [0,1]: It is '2' (Visited). Skip."
});
STEPS.push({
    grid: copyGrid(grid1),
    currentRow: 0, currentCol: 2, islandCount: 1,
    description: "Scan [0,2]: It is '0' (Water). Skip."
});
// ... skipping some steps for brevity in animation ...
STEPS.push({
    grid: copyGrid(grid1),
    currentRow: 2, currentCol: 2, islandCount: 1,
    description: "Scan [2,2]: Found Land! Increment count and Flood Fill."
});

// Flood Fill Island 2
let grid2 = copyGrid(grid1);
grid2[2][2] = '2';
STEPS.push({
    grid: copyGrid(grid2),
    currentRow: 2, currentCol: 2, islandCount: 2,
    description: "Flood Fill: Mark [2,2] as visited. Neighbors are water.",
    floodCells: [{r:2, c:2}]
});

// Continue Scanning to last island
STEPS.push({
    grid: copyGrid(grid2),
    currentRow: 3, currentCol: 3, islandCount: 2,
    description: "Scan [3,3]: Found Land! Increment count. Flood Fill [3,3] and [3,4]."
});

let grid3 = copyGrid(grid2);
grid3[3][3] = '2';
grid3[3][4] = '2';
STEPS.push({
    grid: copyGrid(grid3),
    currentRow: 3, currentCol: 3, islandCount: 3,
    description: "Island 3 Flooded. Total Islands: 3.",
    floodCells: [{r:3, c:3}, {r:3, c:4}]
});

STEPS.push({
    grid: copyGrid(grid3),
    currentRow: 4, currentCol: 0, islandCount: 3,
    description: "Finished scanning grid. Result: 3 Islands."
});


export const NumberOfIslandsComposition: React.FC = () => {
    return (
        <NumberOfIslandsVisualizer
            steps={STEPS}
            title="200. Number of Islands: DFS Flood Fill"
        />
    );
};
