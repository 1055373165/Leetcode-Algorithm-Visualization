import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import React from 'react';

export type GridCell = {
    row: number;
    col: number;
    val: string; // '0', '1', '2' (visited)
    isCurrent: boolean; // Currently being checked by the loop
    isFlooding: boolean; // Currently part of the flood fill recursion
};

export type NumberOfIslandsStep = {
    grid: string[][]; // Snapshot of the grid
    currentRow: number;
    currentCol: number;
    islandCount: number;
    description: string;
    floodCells?: {r: number, c: number}[]; // Cells currently being flooded in this step
};

interface NumberOfIslandsVisualizerProps {
    steps: NumberOfIslandsStep[];
    title: string;
}

export const NumberOfIslandsVisualizer: React.FC<NumberOfIslandsVisualizerProps> = ({
    steps,
    title
}) => {
    const frame = useCurrentFrame();
    const {fps} = useVideoConfig();

    if (!steps || steps.length === 0) return null;

    const durationPerStep = 2 * fps; // 2 seconds per step
    const currentStepIndex = Math.min(
        Math.floor(frame / durationPerStep),
        steps.length - 1
    );
    const step = steps[currentStepIndex];

    if (!step) return null;

    const renderCell = (char: string, r: number, c: number) => {
        const isCurrent = r === step.currentRow && c === step.currentCol;
        const isFlooding = step.floodCells?.some(cell => cell.r === r && cell.c === c);
        
        let bgColor = '#1e88e5'; // Water (0) - Blue
        let textColor = '#fff';

        if (char === '1') {
            bgColor = '#43a047'; // Land (1) - Green
        } else if (char === '0') {
            bgColor = '#1e88e5'; // Water (0) - Blue
        } else if (char === '2') {
            bgColor = '#555'; // Visited Land (2) - Gray
        }

        if (isFlooding) {
            bgColor = '#ffca28'; // Flooding - Amber/Yellow
            textColor = '#000';
        }
        
        if (isCurrent) {
            // Highlighting the scanner
            return (
                <div key={`${r}-${c}`} style={{
                    width: 60,
                    height: 60,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: bgColor,
                    color: textColor,
                    border: '4px solid #f44336', // Red border for scanner
                    borderRadius: 8,
                    fontSize: 24,
                    fontWeight: 'bold',
                    boxShadow: '0 0 15px rgba(244, 67, 54, 0.6)',
                    transform: 'scale(1.1)',
                    zIndex: 10
                }}>
                    {char}
                </div>
            );
        }

        return (
            <div key={`${r}-${c}`} style={{
                width: 60,
                height: 60,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: bgColor,
                color: textColor,
                border: '1px solid #333',
                borderRadius: 8,
                fontSize: 24,
                fontWeight: 'bold',
                opacity: char === '2' ? 0.6 : 1
            }}>
                {char}
            </div>
        );
    };

    return (
        <AbsoluteFill className="bg-gray-900 text-white p-10 flex flex-col items-center" style={{backgroundColor: '#1e1e1e', color: 'white', fontFamily: 'sans-serif'}}>
            {/* Header */}
            <h1 style={{fontSize: 40, marginBottom: 20, textAlign: 'center'}}>{title}</h1>
            
            <div style={{
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                flex: 1,
                justifyContent: 'center',
                gap: 40
            }}>
                {/* Grid */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 5,
                    padding: 20,
                    backgroundColor: '#2a2a2a',
                    borderRadius: 15,
                    border: '1px solid #444'
                }}>
                    {step.grid.map((row, r) => (
                        <div key={r} style={{display: 'flex', gap: 5}}>
                            {row.map((val, c) => renderCell(val, r, c))}
                        </div>
                    ))}
                </div>

                {/* Info Panel */}
                <div style={{
                    display: 'flex', 
                    gap: 60, 
                    backgroundColor: '#333', 
                    padding: '20px 40px', 
                    borderRadius: 15,
                    border: '1px solid #555'
                }}>
                    <div style={{textAlign: 'center'}}>
                        <div style={{color: '#aaa', fontSize: 20}}>Current Cell</div>
                        <div style={{fontSize: 36, fontWeight: 'bold', color: '#ff9800'}}>
                            [{step.currentRow}, {step.currentCol}]
                        </div>
                    </div>
                    <div style={{textAlign: 'center'}}>
                        <div style={{color: '#aaa', fontSize: 20}}>Islands Found</div>
                        <div style={{fontSize: 36, fontWeight: 'bold', color: '#4caf50'}}>{step.islandCount}</div>
                    </div>
                </div>
            </div>

            {/* Description Panel */}
            <div style={{
                marginTop: 20,
                marginBottom: 40,
                backgroundColor: '#333', 
                padding: 20, 
                borderRadius: 10, 
                width: '80%', 
                textAlign: 'center',
                fontSize: 28,
                color: '#fff',
                border: '1px solid #555'
            }}>
                {step.description}
            </div>
        </AbsoluteFill>
    );
};
