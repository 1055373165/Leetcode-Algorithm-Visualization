import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import React from 'react';

export type MinSubArrayLenStep = {
    nums: number[];
    target: number;
    left: number;
    right: number; // current right pointer (inclusive in algorithm usually, but for visual slice usually exclusive or inclusive depend on design)
                   // Let's adhere to standard: [left, right] includes nums[right]
    currentSum: number;
    minLength: number;
    phase: 'expand' | 'contract' | 'found_new_min';
    description: string;
};

interface MinSubArrayLenVisualizerProps {
    steps: MinSubArrayLenStep[];
}

export const MinSubArrayLenVisualizer: React.FC<MinSubArrayLenVisualizerProps> = ({
    steps,
}) => {
    const frame = useCurrentFrame();
    const {fps} = useVideoConfig();

    if (!steps || steps.length === 0) return null;

    const durationPerStep = 3 * fps;
    const currentStepIndex = Math.min(
        Math.floor(frame / durationPerStep),
        steps.length - 1
    );
    const step = steps[currentStepIndex];

    if (!step) return null;

    const boxSize = 60;
    const gap = 15;

    return (
        <AbsoluteFill className="bg-gray-900 text-white p-10 flex flex-col items-center" style={{backgroundColor: '#1e1e1e', color: 'white', fontFamily: 'sans-serif'}}>
             <h1 style={{fontSize: 40, marginBottom: 20}}>209. Minimum Size Subarray Sum</h1>
             
             <div style={{
                 flex: 1,
                 display: 'flex',
                 flexDirection: 'column',
                 alignItems: 'center',
                 justifyContent: 'center',
                 gap: 60,
                 width: '100%'
             }}>
                
                {/* Status Board */}
                <div style={{display: 'flex', gap: 60, fontSize: 28, fontWeight: 'bold'}}>
                    <div style={{color: '#fff'}}>Target: <span style={{color: '#ff9800'}}>{step.target}</span></div>
                    <div style={{color: '#fff'}}>Current Sum: <span style={{
                        color: step.currentSum >= step.target ? '#4caf50' : '#2196f3'
                    }}>{step.currentSum}</span></div>
                    <div style={{color: '#fff'}}>Min Length: <span style={{color: '#e91e63'}}>{step.minLength === Infinity ? '∞' : step.minLength}</span></div>
                </div>

                {/* Array Visualization */}
                <div style={{display: 'flex', gap, position: 'relative', marginTop: 40}}>
                    
                    {/* Dynamic Window Bracket */}
                    {/* Calculate position based on left and right indices */}
                    {/* We assume right is inclusive */}
                    <div style={{
                        position: 'absolute',
                        left: step.left * (boxSize + gap) - 10,
                        top: -15,
                        width: (step.right - step.left + 1) * (boxSize + gap) - gap + 20,
                        height: boxSize + 30,
                        border: `4px solid ${step.currentSum >= step.target ? '#4caf50' : '#2196f3'}`,
                        borderRadius: 15,
                        transition: 'all 0.3s ease-in-out',
                        boxShadow: step.currentSum >= step.target ? '0 0 20px rgba(76, 175, 80, 0.4)' : 'none',
                        zIndex: 0,
                        opacity: step.right < step.left ? 0 : 1 // Hide if invalid window
                    }} />

                    {step.nums.map((num, idx) => {
                        const isInWindow = idx >= step.left && idx <= step.right;
                        
                        return (
                            <div key={idx} style={{
                                width: boxSize, height: boxSize,
                                display: 'flex', flexDirection: 'column', alignItems: 'center',
                                position: 'relative', zIndex: 1
                            }}>
                                <div style={{
                                    width: '100%', height: '100%',
                                    backgroundColor: isInWindow ? '#333' : '#111',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    borderRadius: 10,
                                    border: '1px solid #444',
                                    fontSize: 28, fontWeight: 'bold',
                                    color: isInWindow ? '#fff' : '#555',
                                    transition: 'color 0.3s'
                                }}>
                                    {num}
                                </div>
                                <div style={{marginTop: 5, fontSize: 14, color: '#666'}}>{idx}</div>
                                
                                {/* Pointer Labels */}
                                {idx === step.left && (
                                    <div style={{position: 'absolute', top: -45, color: '#2196f3', fontWeight: 'bold'}}>L</div>
                                )}
                                {idx === step.right && (
                                    <div style={{position: 'absolute', bottom: -45, color: '#ff9800', fontWeight: 'bold'}}>R</div>
                                )}
                            </div>
                        );
                    })}
                </div>

                 {/* Phase Indicator */}
                 <div style={{
                     marginTop: 20,
                     fontSize: 24,
                     fontWeight: 'bold',
                     color: step.phase === 'expand' ? '#ff9800' : (step.phase === 'contract' ? '#2196f3' : '#e91e63')
                 }}>
                     {step.phase === 'expand' ? 'Expanding Right (Adding)' : (step.phase === 'contract' ? 'Contracting Left (Removing)' : 'New Min Length Found!')}
                 </div>

             </div>

             <div style={{
                marginTop: 30,
                backgroundColor: '#333', 
                padding: 20, 
                borderRadius: 10, 
                width: '80%', 
                textAlign: 'center',
                fontSize: 24,
                color: '#fff',
                border: '1px solid #555'
            }}>
                {step.description}
            </div>
        </AbsoluteFill>
    );
};
