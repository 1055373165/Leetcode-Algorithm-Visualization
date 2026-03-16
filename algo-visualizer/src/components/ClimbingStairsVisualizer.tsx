import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import React from 'react';

export type ClimbingStairsStep = {
    n: number;
    currentStep: number; // The step we are currently calculating (i)
    dp: (number | null)[]; // Array of calculated ways. null means not yet calculated.
    highlightIndices: number[]; // Indices to highlight (i-1, i-2)
    description: string;
};

interface ClimbingStairsVisualizerProps {
    steps: ClimbingStairsStep[];
    title: string;
}

export const ClimbingStairsVisualizer: React.FC<ClimbingStairsVisualizerProps> = ({
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
                gap: 40
            }}>
                {/* Staircase Visualization */}
                <div style={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    gap: 10,
                    height: 400,
                    padding: 20,
                    backgroundColor: '#252525',
                    borderRadius: 15,
                    border: '1px solid #444',
                    width: '90%',
                    justifyContent: 'center'
                }}>
                    {Array.from({length: step.n + 1}).map((_, i) => {
                        const isCurrent = i === step.currentStep;
                        const isHighlight = step.highlightIndices.includes(i);
                        const val = step.dp[i];
                        const height = 40 + (i * 30); // Stairs get higher

                        let bgColor = '#555'; // Default gray
                        let borderColor = '#777';
                        
                        if (isCurrent) {
                            bgColor = '#2196f3'; // Current target - Blue
                            borderColor = '#64b5f6';
                        } else if (isHighlight) {
                            bgColor = '#ff9800'; // Source (i-1, i-2) - Orange
                            borderColor = '#ffb74d';
                        } else if (val !== null) {
                            bgColor = '#4caf50'; // Calculated - Green
                            borderColor = '#81c784';
                        }

                        return (
                            <div key={i} style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'flex-end',
                                width: 80
                            }}>
                                {/* Value Bubble */}
                                <div style={{
                                    marginBottom: 10,
                                    fontSize: 24,
                                    fontWeight: 'bold',
                                    color: '#fff',
                                    opacity: val !== null ? 1 : 0
                                }}>
                                    {val}
                                </div>
                                
                                {/* Stair Block */}
                                <div style={{
                                    width: '100%',
                                    height: height,
                                    backgroundColor: bgColor,
                                    border: `2px solid ${borderColor}`,
                                    borderRadius: '8px 8px 0 0',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'rgba(255,255,255,0.7)',
                                    fontSize: 18,
                                    transition: 'all 0.3s'
                                }}>
                                    Step {i}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Info Panel: DP Equation */}
                <div style={{
                    display: 'flex', 
                    gap: 40, 
                    backgroundColor: '#333', 
                    padding: '20px 40px', 
                    borderRadius: 15,
                    border: '1px solid #555'
                }}>
                    <div style={{fontSize: 32, fontFamily: 'monospace', color: '#fff'}}>
                        dp[{step.currentStep}] = 
                        <span style={{color: '#ff9800'}}> dp[{step.currentStep - 1}]</span> + 
                        <span style={{color: '#ff9800'}}> dp[{step.currentStep - 2}]</span>
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
