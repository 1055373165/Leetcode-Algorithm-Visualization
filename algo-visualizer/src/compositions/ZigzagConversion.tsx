import React from 'react';
import {ZigzagConversionVisualizer, ZigzagConversionStep} from '../components/ZigzagConversionVisualizer';

const INPUT = "PAYPALISHIRING";
const NUM_ROWS = 4;

// Build the zigzag grid and generate steps
const steps: ZigzagConversionStep[] = [];

// Calculate grid dimensions
const n = INPUT.length;
const cycle = 2 * (NUM_ROWS - 1);
const numCycles = Math.ceil(n / cycle);
const numCols = numCycles * (cycle / 2); // each cycle occupies numRows-1 columns

// Initialize empty grid
const buildEmptyGrid = (): (string | null)[][] => {
    const grid: (string | null)[][] = [];
    for (let r = 0; r < NUM_ROWS; r++) {
        grid.push(new Array(numCols).fill(null));
    }
    return grid;
};

// Phase 1: Place characters into zigzag
const grid = buildEmptyGrid();
let curRow = 0;
let curCol = 0;
let goingDown = true;

// Clone grid helper
const cloneGrid = (g: (string | null)[][]): (string | null)[][] =>
    g.map(row => [...row]);

// Initial step
steps.push({
    phase: 'place',
    charIndex: -1,
    row: 0,
    col: 0,
    currentRow: -1,
    grid: cloneGrid(grid),
    result: '',
    highlighted: [],
    reason: `Place "${INPUT}" into Z-shape with ${NUM_ROWS} rows (cycle=${cycle})`,
});

for (let i = 0; i < n; i++) {
    grid[curRow][curCol] = INPUT[i];

    steps.push({
        phase: 'place',
        charIndex: i,
        row: curRow,
        col: curCol,
        currentRow: -1,
        grid: cloneGrid(grid),
        result: '',
        highlighted: [],
        reason: `Place '${INPUT[i]}' at row ${curRow}, col ${curCol}${curRow === 0 ? ' (top, bounce down)' : curRow === NUM_ROWS - 1 ? ' (bottom, bounce up)' : goingDown ? ' (going down)' : ' (going up)'}`,
    });

    // Move to next position
    if (curRow === NUM_ROWS - 1) {
        goingDown = false;
    } else if (curRow === 0) {
        goingDown = true;
    }

    if (goingDown) {
        curRow++;
    } else {
        curRow--;
        curCol++;
    }
}

// Phase 2: Read row by row
let result = '';

for (let r = 0; r < NUM_ROWS; r++) {
    const rowChars: number[] = []; // highlighted positions
    let rowStr = '';

    for (let c = 0; c < numCols; c++) {
        if (grid[r][c] !== null) {
            rowChars.push(r * numCols + c);
            rowStr += grid[r][c];
        }
    }

    steps.push({
        phase: 'read',
        charIndex: -1,
        row: -1,
        col: -1,
        currentRow: r,
        grid: cloneGrid(grid),
        result: result,
        highlighted: rowChars,
        reason: `Read row ${r}: "${rowStr}" → collect into result`,
    });

    result += rowStr;

    steps.push({
        phase: 'read',
        charIndex: -1,
        row: -1,
        col: -1,
        currentRow: r,
        grid: cloneGrid(grid),
        result: result,
        highlighted: rowChars,
        reason: `After row ${r}: result = "${result}"`,
    });
}

// Phase 3: Done
steps.push({
    phase: 'done',
    charIndex: -1,
    row: -1,
    col: -1,
    currentRow: -1,
    grid: cloneGrid(grid),
    result: result,
    highlighted: [],
    reason: `Done! "${INPUT}" → "${result}"`,
});

export const ZIGZAG_CONVERSION_TOTAL_FRAMES = steps.length * 45; // 1.5s per step at 30fps

export const ZigzagConversionComposition: React.FC = () => {
    return (
        <ZigzagConversionVisualizer
            steps={steps}
            title="6. ZigZag Conversion"
            input={INPUT}
            numRows={NUM_ROWS}
        />
    );
};
