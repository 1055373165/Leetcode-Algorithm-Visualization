import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import React from 'react';

export type GreatestSumStep = {
    nums: number[];
    currentIndex: number;
    dp: number[]; // [max_rem0, max_rem1, max_rem2]
    prevDp: number[]; // snapshot before update
    description: string;
};

interface GreatestSumVisualizerProps {
    steps: GreatestSumStep[];
    title: string;
}

export const GreatestSumVisualizer: React.FC<GreatestSumVisualizerProps> = ({
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
                {/* Input Array */}
                <div style={{display: 'flex', gap: 10}}>
                    {step.nums.map((num, idx) => {
                        const isCurrent = idx === step.currentIndex;
                        return (
                            <div key={idx} style={{
                                width: 60, height: 60,
                                borderRadius: 10,
                                backgroundColor: isCurrent ? '#ffca28' : '#333',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontWeight: 'bold', fontSize: 24,
                                color: isCurrent ? '#000' : '#fff',
                                border: '2px solid #555'
                            }}>
                                {num}
                            </div>
                        );
                    })}
                </div>

                {/* DP Table */}
                <div style={{
                    display: 'flex', gap: 40, 
                    backgroundColor: '#222', padding: 30, borderRadius: 15,
                    border: '1px solid #444'
                }}>
                    {step.dp.map((val, idx) => {
                        const prevVal = step.prevDp[idx];
                        const changed = val !== prevVal;
                        
                        return (
                            <div key={idx} style={{textAlign: 'center', width: 150}}>
                                <div style={{color: '#aaa', fontSize: 20, marginBottom: 10}}>DP[Remainder {idx}]</div>
                                <div style={{
                                    fontSize: 40, fontWeight: 'bold', 
                                    color: changed ? '#4caf50' : '#fff',
                                    transition: 'color 0.5s'
                                }}>
                                    {val === -Infinity ? '-' : val}
                                </div>
                                {changed && (
                                    <div style={{color: '#81c784', fontSize: 16}}>
                                        Was {prevVal === -Infinity ? '-' : prevVal}
                                    </div>
                                )}
                            </div>
                        );
                    })}
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
