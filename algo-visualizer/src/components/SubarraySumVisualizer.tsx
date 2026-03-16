import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import React from 'react';

export type SubarraySumStep = {
    nums: number[];
    index: number;
    currentPre: number;
    k: number;
    // Workaround: Pass map as array of entries to avoid serialization issues with Objects/Maps in Remotion
    prefixMapEntries: {k: string, v: number}[]; 
    count: number;
    description: string;
    highlightMapKey?: number | null;
    isMatch: boolean;
};

interface SubarraySumVisualizerProps {
    steps: SubarraySumStep[];
    title: string;
}

export const SubarraySumVisualizer: React.FC<SubarraySumVisualizerProps> = ({
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
                width: '100%',
                gap: 40
            }}>
                {/* 1. Array Visualization */}
                <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10}}>
                    <div style={{fontSize: 24, color: '#aaa'}}>nums</div>
                    <div style={{display: 'flex', gap: 15}}>
                        {step.nums && step.nums.map((val, i) => {
                            const isCurrent = i === step.index;
                            return (
                                <div key={i} style={{
                                    width: 70,
                                    height: 70,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: `3px solid ${isCurrent ? '#ffeb3b' : '#555'}`,
                                    backgroundColor: isCurrent ? '#444' : '#333',
                                    color: '#fff',
                                    fontSize: 28,
                                    borderRadius: 10,
                                    position: 'relative'
                                }}>
                                    {val}
                                    {isCurrent && (
                                        <div style={{
                                            position: 'absolute',
                                            top: -30,
                                            color: '#ffeb3b',
                                            fontWeight: 'bold',
                                            fontSize: 18
                                        }}>
                                            i
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* 2. Info Panel (Math) */}
                <div style={{
                    display: 'flex', 
                    gap: 60, 
                    backgroundColor: '#333', 
                    padding: '20px 40px', 
                    borderRadius: 15,
                    border: '1px solid #555'
                }}>
                    <div style={{textAlign: 'center'}}>
                        <div style={{color: '#aaa', fontSize: 20}}>Prefix Sum</div>
                        <div style={{fontSize: 36, fontWeight: 'bold', color: '#2196f3'}}>{step.currentPre}</div>
                    </div>
                    <div style={{textAlign: 'center'}}>
                        <div style={{color: '#aaa', fontSize: 20}}>Target (Pre - K)</div>
                        <div style={{fontSize: 36, fontWeight: 'bold', color: '#ff9800'}}>
                            {step.currentPre} - {step.k} = {step.currentPre - step.k}
                        </div>
                    </div>
                    <div style={{textAlign: 'center'}}>
                        <div style={{color: '#aaa', fontSize: 20}}>Total Count</div>
                        <div style={{fontSize: 36, fontWeight: 'bold', color: '#4caf50'}}>{step.count}</div>
                    </div>
                </div>

                {/* 3. HashMap Visualization */}
                <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, width: '100%'}}>
                    <div style={{fontSize: 24, color: '#aaa'}}>Prefix Sum Map (Val {'->'} Count)</div>
                    <div style={{
                        display: 'flex', 
                        flexWrap: 'wrap', 
                        gap: 20, 
                        justifyContent: 'center',
                        maxWidth: '80%'
                    }}>
                        {step.prefixMapEntries && step.prefixMapEntries.map((entry) => {
                            // entry is {k: string, v: number}
                            // highlightMapKey is number | null
                            const isTarget = step.highlightMapKey !== null && step.highlightMapKey !== undefined && String(step.highlightMapKey) === entry.k;
                            
                            return (
                                <div key={entry.k} style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    padding: 10,
                                    borderRadius: 8,
                                    backgroundColor: isTarget ? 'rgba(76, 175, 80, 0.2)' : '#252525',
                                    border: `2px solid ${isTarget ? '#4caf50' : '#444'}`,
                                    minWidth: 80,
                                    transition: 'all 0.3s'
                                }}>
                                    <div style={{color: '#bbb', fontSize: 16}}>Sum: {entry.k}</div>
                                    <div style={{color: '#fff', fontSize: 24, fontWeight: 'bold'}}>{entry.v}</div>
                                    {isTarget && (
                                        <div style={{color: '#4caf50', fontSize: 14, marginTop: 5}}>Match!</div>
                                    )}
                                </div>
                            );
                        })}
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
                border: step.isMatch ? '2px solid #4caf50' : '1px solid #555'
            }}>
                <div style={{fontSize: 28, color: '#fff'}}>
                    {step.description}
                </div>
            </div>

        </AbsoluteFill>
    );
};
