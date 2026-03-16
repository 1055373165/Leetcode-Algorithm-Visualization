import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import React from 'react';

export type MoveZeroesStep = {
    nums: number[];
    left: number; // Insert Position
    right: number; // Current Scanner
    action: 'scan' | 'swap' | 'skip';
    description: string;
};

interface MoveZeroesVisualizerProps {
    steps: MoveZeroesStep[];
}

export const MoveZeroesVisualizer: React.FC<MoveZeroesVisualizerProps> = ({
    steps,
}) => {
    const frame = useCurrentFrame();
    const {fps} = useVideoConfig();

    if (!steps || steps.length === 0) return null;

    const durationPerStep = 3 * fps; // 3 seconds per step
    const currentStepIndex = Math.min(
        Math.floor(frame / durationPerStep),
        steps.length - 1
    );
    const step = steps[currentStepIndex];

    if (!step) return null;

    const boxSize = 80;
    const gap = 20;

    return (
        <AbsoluteFill className="bg-gray-900 text-white p-10 flex flex-col items-center" style={{backgroundColor: '#1e1e1e', color: 'white', fontFamily: 'sans-serif'}}>
             <h1 style={{fontSize: 50, marginBottom: 40}}>283. Move Zeroes</h1>
             
             <div style={{
                 flex: 1,
                 display: 'flex',
                 flexDirection: 'column',
                 alignItems: 'center',
                 justifyContent: 'center',
                 gap: 80,
                 width: '100%'
             }}>
                
                {/* Array Visualization */}
                <div style={{display: 'flex', gap, position: 'relative', marginTop: 40}}>
                    {step.nums.map((num, idx) => {
                        const isLeft = idx === step.left;
                        const isRight = idx === step.right;
                        const isZero = num === 0;
                        
                        return (
                            <div key={idx} style={{
                                width: boxSize, height: boxSize,
                                display: 'flex', flexDirection: 'column', alignItems: 'center',
                                position: 'relative'
                            }}>
                                {/* Box */}
                                <div style={{
                                    width: '100%', height: '100%',
                                    backgroundColor: isZero ? '#333' : '#444',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    borderRadius: 15,
                                    border: `3px solid ${isRight ? '#ff9800' : (isLeft ? '#2196f3' : '#555')}`,
                                    fontSize: 32, fontWeight: 'bold',
                                    color: isZero ? '#777' : '#fff',
                                    transition: 'all 0.3s ease',
                                    transform: (step.action === 'swap' && (isLeft || isRight)) ? 'scale(1.1)' : 'scale(1)'
                                }}>
                                    {num}
                                </div>
                                
                                {/* Index */}
                                <div style={{marginTop: 10, fontSize: 18, color: '#666'}}>{idx}</div>

                                {/* Pointers */}
                                {isLeft && (
                                    <div style={{
                                        position: 'absolute', top: -60, 
                                        color: '#2196f3', fontWeight: 'bold', fontSize: 24,
                                        display: 'flex', flexDirection: 'column', alignItems: 'center'
                                    }}>
                                        <div>Left</div>
                                        <div>↓</div>
                                    </div>
                                )}
                                {isRight && (
                                    <div style={{
                                        position: 'absolute', bottom: -60, 
                                        color: '#ff9800', fontWeight: 'bold', fontSize: 24,
                                        display: 'flex', flexDirection: 'column', alignItems: 'center'
                                    }}>
                                        <div>↑</div>
                                        <div>Right</div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                 {/* Legend */}
                 <div style={{display: 'flex', gap: 40, fontSize: 24}}>
                     <div style={{color: '#2196f3', display: 'flex', alignItems: 'center', gap: 10}}>
                         <div style={{width: 15, height: 15, backgroundColor: '#2196f3', borderRadius: '50%'}}/>
                         Left (Insert Pos)
                     </div>
                     <div style={{color: '#ff9800', display: 'flex', alignItems: 'center', gap: 10}}>
                         <div style={{width: 15, height: 15, backgroundColor: '#ff9800', borderRadius: '50%'}}/>
                         Right (Scanner)
                     </div>
                 </div>

             </div>

             {/* Description Panel */}
             <div style={{
                marginBottom: 50,
                backgroundColor: '#333', 
                padding: 30, 
                borderRadius: 15, 
                width: '80%', 
                textAlign: 'center',
                fontSize: 32, // Larger font
                color: '#fff',
                border: '1px solid #555',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
            }}>
                {step.description}
            </div>
        </AbsoluteFill>
    );
};
