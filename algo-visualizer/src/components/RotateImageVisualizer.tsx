import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import React from 'react';

export type RotateStep = {
    matrix: number[][];
    highlightIndices: [number, number][]; // Indices being swapped
    operation: 'transpose' | 'reflect' | 'none';
    description: string;
};

interface RotateImageVisualizerProps {
    steps: RotateStep[];
    title: string;
}

export const RotateImageVisualizer: React.FC<RotateImageVisualizerProps> = ({
    steps,
    title
}) => {
    const frame = useCurrentFrame();
    const {fps} = useVideoConfig();

    if (!steps || steps.length === 0) return null;

    const durationPerStep = 2 * fps;
    const currentStepIndex = Math.min(
        Math.floor(frame / durationPerStep),
        steps.length - 1
    );
    const step = steps[currentStepIndex];

    if (!step) return null;

    return (
        <AbsoluteFill className="bg-gray-900 text-white p-10 flex flex-col items-center" style={{backgroundColor: '#1e1e1e', color: 'white', fontFamily: 'sans-serif'}}>
            {/* Header */}
            <h1 style={{fontSize: 40, marginBottom: 20, textAlign: 'center'}}>{title}</h1>
            
            <div style={{
                flex: 1,
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: 50
            }}>
                {/* Matrix */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${step.matrix.length}, 80px)`,
                    gap: 10,
                    padding: 20,
                    backgroundColor: '#222',
                    borderRadius: 10,
                    border: '2px solid #444'
                }}>
                    {step.matrix.map((row, rIdx) => (
                        row.map((val, cIdx) => {
                            const isHighlighted = step.highlightIndices.some(([r, c]) => r === rIdx && c === cIdx);
                            let bgColor = '#333';
                            if (isHighlighted) {
                                bgColor = step.operation === 'transpose' ? '#ba68c8' : '#4caf50';
                            }

                            return (
                                <div key={`${rIdx}-${cIdx}`} style={{
                                    width: 80, height: 80,
                                    backgroundColor: bgColor,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 32, fontWeight: 'bold',
                                    borderRadius: 8,
                                    border: '1px solid #555'
                                }}>
                                    {val}
                                </div>
                            );
                        })
                    ))}
                </div>
            </div>

            {/* Description Panel */}
            <div style={{
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
