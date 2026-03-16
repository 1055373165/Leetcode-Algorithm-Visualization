import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import React from 'react';

export type KthLargestStep = {
    nums: number[];
    left: number;
    right: number;
    pivotIndex: number | null; // Index of current pivot
    i: number | null; // Partition pointer
    j: number | null; // Scan pointer
    target: number; // Target index (n-k)
    found: boolean;
    description: string;
};

interface KthLargestVisualizerProps {
    steps: KthLargestStep[];
    title: string;
}

export const KthLargestVisualizer: React.FC<KthLargestVisualizerProps> = ({
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
                gap: 60
            }}>
                {/* Array Visualization */}
                <div style={{display: 'flex', gap: 15, flexWrap: 'wrap', justifyContent: 'center'}}>
                    {step.nums.map((val, idx) => {
                        const inRange = idx >= step.left && idx <= step.right;
                        const isPivot = step.pivotIndex === idx;
                        const isI = step.i === idx;
                        const isJ = step.j === idx;
                        const isTarget = step.found && idx === step.target;
                        
                        let bgColor = '#333';
                        if (isTarget) bgColor = '#4caf50';
                        else if (isPivot) bgColor = '#ff9800';
                        else if (!inRange) bgColor = '#111'; // Dimmed

                        return (
                            <div key={idx} style={{
                                width: 70, height: 70,
                                display: 'flex', flexDirection: 'column',
                                alignItems: 'center', position: 'relative'
                            }}>
                                <div style={{
                                    width: 70, height: 70,
                                    borderRadius: 10,
                                    backgroundColor: bgColor,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontWeight: 'bold', fontSize: 24,
                                    border: `2px solid ${inRange ? '#777' : '#333'}`,
                                    color: inRange ? '#fff' : '#555',
                                    opacity: inRange ? 1 : 0.5
                                }}>
                                    {val}
                                </div>
                                <div style={{marginTop: 5, color: '#aaa', fontSize: 14}}>{idx}</div>

                                {/* Pointers */}
                                {isI && inRange && (
                                    <div style={{
                                        position: 'absolute', top: -30, 
                                        color: '#2196f3', fontWeight: 'bold', fontSize: 16
                                    }}>
                                        i
                                    </div>
                                )}
                                {isJ && inRange && (
                                    <div style={{
                                        position: 'absolute', bottom: -30, 
                                        color: '#e91e63', fontWeight: 'bold', fontSize: 16
                                    }}>
                                        j
                                    </div>
                                )}
                                {isPivot && (
                                    <div style={{
                                        position: 'absolute', top: -30, right: -10,
                                        color: '#ff9800', fontWeight: 'bold', fontSize: 12,
                                        backgroundColor: '#333', padding: 2, borderRadius: 3
                                    }}>
                                        Pivot
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Legend / Status */}
                <div style={{
                    display: 'flex', gap: 30,
                    backgroundColor: '#222', padding: 20, borderRadius: 10,
                    flexWrap: 'wrap', justifyContent: 'center'
                }}>
                     <div style={{color: '#fff'}}>Target Index: {step.target} (n-k)</div>
                     <div style={{color: '#9e9e9e'}}>Range: [{step.left}, {step.right}]</div>
                     <div style={{color: '#2196f3'}}>i: Partition Boundary</div>
                     <div style={{color: '#e91e63'}}>j: Scanner</div>
                     <div style={{color: '#ff9800'}}>Pivot</div>
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
                fontSize: 26,
                color: '#fff',
                border: '1px solid #555'
            }}>
                {step.description}
            </div>
        </AbsoluteFill>
    );
};
