import React from 'react';
import {RotateImageVisualizer, RotateStep} from '../components/RotateImageVisualizer';

const initialMatrix = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9]
];

const steps: RotateStep[] = [];

// Deep copy helper
const clone = (m: number[][]) => m.map(row => [...row]);

let matrix = clone(initialMatrix);
const n = matrix.length;

steps.push({
    matrix: clone(matrix), highlightIndices: [], operation: 'none',
    description: "Start: Initial Matrix."
});

// 1. Transpose
for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
        // Swap
        const temp = matrix[i][j];
        matrix[i][j] = matrix[j][i];
        matrix[j][i] = temp;
        
        steps.push({
            matrix: clone(matrix), highlightIndices: [[i, j], [j, i]], operation: 'transpose',
            description: `Transpose: Swap (${i},${j}) with (${j},${i}).`
        });
    }
}

steps.push({
    matrix: clone(matrix), highlightIndices: [], operation: 'none',
    description: "Transpose Complete. Rows became Columns."
});

// 2. Reflect
for (let i = 0; i < n; i++) {
    for (let j = 0; j < Math.floor(n / 2); j++) {
        // Swap
         const temp = matrix[i][j];
         matrix[i][j] = matrix[i][n - 1 - j];
         matrix[i][n - 1 - j] = temp;
         
         steps.push({
            matrix: clone(matrix), highlightIndices: [[i, j], [i, n - 1 - j]], operation: 'reflect',
            description: `Reflect Row ${i}: Swap (${i},${j}) with (${i},${n - 1 - j}).`
        });
    }
}

steps.push({
    matrix: clone(matrix), highlightIndices: [], operation: 'none',
    description: "Rotation Complete."
});

export const RotateImageComposition: React.FC = () => {
    return (
        <RotateImageVisualizer
            steps={steps}
            title="48. Rotate Image"
        />
    );
};
