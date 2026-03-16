import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import React from 'react';

export type RemoveElementStep = {
    nums: (number | null)[]; // use null to show 'garbage' if needed, or just numbers
    i: number; // Reader index
    k: number; // Writer index
    val: number; // Target value to remove
    description: string;
    highlightIndices: number[]; // Indices involved in current operation
    action: 'scan' | 'copy' | 'skip' | 'finish';
};

interface RemoveElementVisualizerProps {
    steps: RemoveElementStep[];
    title: string;
}

export const RemoveElementVisualizer: React.FC<RemoveElementVisualizerProps> = ({
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
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                flex: 1,
                justifyContent: 'center',
                width: '100%',
                gap: 60
            }}>
                {/* Array Visualization */}
                <div style={{
                    display: 'flex',
                    gap: 15,
                    padding: 20,
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    {step.nums.map((num, idx) => {
                        const isReader = idx === step.i;
                        const isWriter = idx === step.k;
                        const isVal = num === step.val;
                        const isKept = idx < step.k;
                        
                        let bgColor = '#333';
                        if (isKept) bgColor = '#2e7d32'; // Green for kept
                        else if (step.action === 'finish' && idx >= step.k) bgColor = '#555'; // Gray for garbage
                        
                        // Highlight current action
                        if (step.action === 'copy' && idx === step.k) bgColor = '#1565c0'; // Writing here
                        if (step.action === 'skip' && idx === step.i) bgColor = '#c62828'; // Skipping this

                        return (
                            <div key={idx} style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                position: 'relative'
                            }}>
                                {/* Reader Pointer (Top) */}
                                {isReader && (
                                    <div style={{
                                        position: 'absolute',
                                        top: -40,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        color: '#2196f3'
                                    }}>
                                        <div style={{fontSize: 20, fontWeight: 'bold'}}>i</div>
                                        <div style={{fontSize: 20}}>▼</div>
                                    </div>
                                )}

                                {/* Array Box */}
                                <div style={{
                                    width: 80,
                                    height: 80,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: bgColor,
                                    border: `3px solid ${isVal ? '#ef5350' : '#4caf50'}`,
                                    borderRadius: 10,
                                    fontSize: 32,
                                    fontWeight: 'bold',
                                    color: '#fff',
                                    transition: 'all 0.3s'
                                }}>
                                    {num}
                                </div>

                                {/* Writer Pointer (Bottom) */}
                                {isWriter && (
                                    <div style={{
                                        position: 'absolute',
                                        bottom: -40,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        color: '#4caf50'
                                    }}>
                                        <div style={{fontSize: 20}}>▲</div>
                                        <div style={{fontSize: 20, fontWeight: 'bold'}}>k</div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
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
                        <div style={{color: '#aaa', fontSize: 20}}>Target (val)</div>
                        <div style={{fontSize: 36, fontWeight: 'bold', color: '#ef5350'}}>{step.val}</div>
                    </div>
                    <div style={{textAlign: 'center'}}>
                        <div style={{color: '#aaa', fontSize: 20}}>New Length (k)</div>
                        <div style={{fontSize: 36, fontWeight: 'bold', color: '#4caf50'}}>{step.k}</div>
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
