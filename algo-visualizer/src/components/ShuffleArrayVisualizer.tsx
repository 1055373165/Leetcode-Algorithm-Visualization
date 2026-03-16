import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import React from 'react';

export type ShuffleArrayStep = {
    nums: number[];
    result: number[];
    currentIndex: number; // 0 to n-1
    n: number;
    action: 'move_x' | 'move_y' | 'wait';
    description: string;
};

interface ShuffleArrayVisualizerProps {
    steps: ShuffleArrayStep[];
}

export const ShuffleArrayVisualizer: React.FC<ShuffleArrayVisualizerProps> = ({
    steps,
}) => {
    const frame = useCurrentFrame();
    const {fps} = useVideoConfig();

    if (!steps || steps.length === 0) return null;

    const durationPerStep = 2 * fps; // 2 seconds per step (simpler animation)
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
             <h1 style={{fontSize: 50, marginBottom: 40}}>1470. Shuffle the Array</h1>
             
             <div style={{
                 flex: 1,
                 display: 'flex',
                 flexDirection: 'column',
                 alignItems: 'center',
                 justifyContent: 'center',
                 gap: 80,
                 width: '100%'
             }}>
                
                {/* Source Array */}
                <div>
                     <div style={{fontSize: 28, marginBottom: 10, color: '#aaa', textAlign: 'center'}}>Source Array (nums)</div>
                     <div style={{display: 'flex', gap}}>
                        {step.nums.map((num, idx) => {
                            const isX = idx < step.n;
                            const isY = idx >= step.n;
                            
                            // Highlight logic
                            const isActive = (step.action === 'move_x' && idx === step.currentIndex) || 
                                             (step.action === 'move_y' && idx === step.n + step.currentIndex);

                            return (
                                <div key={idx} style={{
                                    width: boxSize, height: boxSize,
                                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                                    position: 'relative'
                                }}>
                                    <div style={{
                                        width: '100%', height: '100%',
                                        backgroundColor: isX ? '#2196f3' : '#f44336', // Blue for X, Red for Y
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        borderRadius: 15,
                                        fontSize: 32, fontWeight: 'bold',
                                        color: '#fff',
                                        opacity: isActive ? 1 : 0.6,
                                        transform: isActive ? 'scale(1.1) translateY(-10px)' : 'scale(1)',
                                        transition: 'all 0.3s ease',
                                        boxShadow: isActive ? '0 0 20px rgba(255,255,255,0.5)' : 'none'
                                    }}>
                                        {num}
                                    </div>
                                    <div style={{marginTop: 5, fontSize: 16, color: '#666'}}>{idx}</div>
                                    {isActive && <div style={{position: 'absolute', top: -30, color: '#fff'}}>↓</div>}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Arrow */}
                <div style={{fontSize: 40, color: '#aaa'}}>⬇️ Zipper Merge ⬇️</div>

                 {/* Result Array */}
                 <div>
                    <div style={{fontSize: 28, marginBottom: 10, color: '#aaa', textAlign: 'center'}}>Result Array</div>
                    <div style={{display: 'flex', gap: gap}}>
                        {step.result.map((num, idx) => {
                             const isFilled = num !== 0;
                             const isInitialZero = num === 0;

                             // Determine color based on source (even indices are X, odd are Y)
                             const isFromX = idx % 2 === 0;
                             
                             return (
                                <div key={idx} style={{
                                    width: boxSize, height: boxSize,
                                    backgroundColor: isInitialZero ? '#333' : (isFromX ? '#2196f3' : '#f44336'),
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    borderRadius: 15,
                                    fontSize: 32, fontWeight: 'bold',
                                    color: isInitialZero ? '#555' : '#fff',
                                    border: '2px solid #555',
                                    transition: 'all 0.3s ease'
                                }}>
                                    {isInitialZero ? '' : num}
                                </div>
                             );
                        })}
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
                fontSize: 32,
                color: '#fff',
                border: '1px solid #555',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
            }}>
                {step.description}
            </div>
        </AbsoluteFill>
    );
};
