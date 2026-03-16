import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import React from 'react';

export type DailyTemperaturesStep = {
    temps: number[];
    result: number[];
    stack: number[]; // Store indices
    currentIndex: number;
    compareIndex: number | null; // Index currently being compared with current
    action: 'push' | 'pop' | 'next';
    description: string;
};

interface DailyTemperaturesVisualizerProps {
    steps: DailyTemperaturesStep[];
}

export const DailyTemperaturesVisualizer: React.FC<DailyTemperaturesVisualizerProps> = ({
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

    const boxSize = 60;
    const gap = 15;

    return (
        <AbsoluteFill className="bg-gray-900 text-white p-10 flex flex-col items-center" style={{backgroundColor: '#1e1e1e', color: 'white', fontFamily: 'sans-serif'}}>
             <h1 style={{fontSize: 40, marginBottom: 20}}>739. Daily Temperatures (Monotonic Stack)</h1>
             
             <div style={{
                 flex: 1,
                 display: 'flex',
                 flexDirection: 'column',
                 alignItems: 'center',
                 justifyContent: 'center',
                 width: '100%',
                 gap: 40
             }}>
                
                {/* Main Visualization Area: Arrays and Stack */}
                <div style={{display: 'flex', flexDirection: 'row', gap: 100, alignItems: 'flex-start'}}>
                    
                    {/* Arrays Container */}
                    <div style={{display: 'flex', flexDirection: 'column', gap: 40}}>
                        
                        {/* Temperatures Array */}
                        <div>
                            <div style={{fontSize: 24, marginBottom: 10, color: '#aaa'}}>Temperatures</div>
                            <div style={{display: 'flex', gap}}>
                                {step.temps.map((temp, idx) => {
                                    const isCurrent = idx === step.currentIndex;
                                    const isCompare = idx === step.compareIndex;
                                    const isResolved = step.result[idx] !== 0; // Has found next warmer day

                                    let bgColor = '#444';
                                    if (isCurrent) bgColor = '#2196f3'; // Blue for current
                                    if (isCompare) bgColor = '#ff9800'; // Orange for compare target
                                    if (isResolved && !isCompare) bgColor = '#4caf50'; // Green for resolved

                                    return (
                                        <div key={idx} style={{
                                            width: boxSize, height: boxSize * 1.5,
                                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end',
                                            position: 'relative'
                                        }}>
                                            {/* Bar/Box */}
                                            <div style={{
                                                width: '100%', height: `${(temp - 60) * 5}%`, // Simple visual scaling
                                                minHeight: 40,
                                                backgroundColor: bgColor,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                borderRadius: 8,
                                                border: (isCurrent || isCompare) ? '2px solid white' : 'none',
                                                fontSize: 20, fontWeight: 'bold',
                                                color: '#fff',
                                                transition: 'all 0.3s ease'
                                            }}>
                                                {temp}
                                            </div>
                                            {/* Index */}
                                            <div style={{marginTop: 5, fontSize: 14, color: '#888'}}>{idx}</div>
                                            
                                            {/* Pointer for Current */}
                                            {isCurrent && (
                                                <div style={{position: 'absolute', top: -30, color: '#2196f3', fontSize: 20}}>↓ i</div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                         {/* Result Array */}
                         <div>
                            <div style={{fontSize: 24, marginBottom: 10, color: '#aaa'}}>Result (Days to Wait)</div>
                            <div style={{display: 'flex', gap}}>
                                {step.result.map((res, idx) => (
                                    <div key={idx} style={{
                                        width: boxSize, height: boxSize,
                                        backgroundColor: res === 0 ? '#333' : '#4caf50',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        borderRadius: 8,
                                        fontSize: 24, fontWeight: 'bold',
                                        color: res === 0 ? '#777' : '#fff',
                                        border: '1px solid #555'
                                    }}>
                                        {res}
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>

                    {/* Stack Visualization */}
                    <div style={{
                        width: 150, 
                        minHeight: 400,
                        border: '4px solid #666', 
                        borderTop: 'none', 
                        borderRadius: '0 0 10px 10px',
                        display: 'flex', 
                        flexDirection: 'column-reverse', // Grow from bottom
                        alignItems: 'center',
                        justifyContent: 'flex-start',
                        padding: 10,
                        gap: 10,
                        backgroundColor: '#222'
                    }}>
                        <div style={{position: 'absolute', marginTop: -40, fontSize: 24, color: '#aaa'}}>Stack (Indices)</div>
                        
                        {step.stack.map((stackIdx, i) => {
                             const isTop = i === step.stack.length - 1;
                             const isCompare = stackIdx === step.compareIndex;
                             
                             return (
                                <div key={i} style={{
                                    width: '90%', height: 50,
                                    backgroundColor: isCompare ? '#ff9800' : '#673ab7', // Purple standard, Orange if comparing
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    borderRadius: 5,
                                    fontSize: 20, fontWeight: 'bold',
                                    color: '#fff',
                                    border: isTop ? '2px solid white' : 'none'
                                }}>
                                    idx: {stackIdx}
                                    <span style={{fontSize: 12, marginLeft: 5}}>({step.temps[stackIdx]}°)</span>
                                </div>
                             );
                        })}
                    </div>

                </div>

             </div>

             {/* Description Panel */}
             <div style={{
                marginBottom: 30,
                backgroundColor: '#333', 
                padding: 20, 
                borderRadius: 15, 
                width: '80%', 
                textAlign: 'center',
                fontSize: 28,
                color: '#fff',
                border: '1px solid #555',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
            }}>
                {step.description}
            </div>
        </AbsoluteFill>
    );
};
