import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import React from 'react';

export type AtoiState = 'Start' | 'Signed' | 'Number' | 'End';

export type AtoiStep = {
    input: string;
    currentIndex: number;
    state: AtoiState;
    sign: 1 | -1 | null;
    result: number;
    description: string;
};

interface AtoiVisualizerProps {
    steps: AtoiStep[];
    title: string;
}

export const AtoiVisualizer: React.FC<AtoiVisualizerProps> = ({
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

    // State Colors
    const getStateColor = (s: AtoiState) => {
        if (s === step.state) return '#ffca28'; // Active Yellow
        return '#555'; // Inactive Gray
    };

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
                {/* Input String Visualization */}
                <div style={{display: 'flex', gap: 5, fontSize: 30, fontFamily: 'monospace'}}>
                    {step.input.split('').map((char, idx) => {
                        const isActive = idx === step.currentIndex;
                        return (
                            <div key={idx} style={{
                                padding: '10px 15px',
                                backgroundColor: isActive ? '#2196f3' : '#333',
                                border: '1px solid #555',
                                borderRadius: 5,
                                color: isActive ? '#fff' : '#aaa',
                                width: 40, textAlign: 'center'
                            }}>
                                {char === ' ' ? '␣' : char}
                            </div>
                        );
                    })}
                </div>

                {/* State Machine Visualization */}
                <div style={{display: 'flex', gap: 40, alignItems: 'center'}}>
                    {['Start', 'Signed', 'Number', 'End'].map((s) => (
                        <div key={s} style={{
                            width: 100, height: 100,
                            borderRadius: '50%',
                            backgroundColor: getStateColor(s as AtoiState),
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 20, fontWeight: 'bold',
                            border: '3px solid #fff',
                            boxShadow: s === step.state ? '0 0 20px #ffca28' : 'none',
                            color: s === step.state ? '#000' : '#fff'
                        }}>
                            {s}
                        </div>
                    ))}
                </div>

                {/* Data Panel */}
                <div style={{
                    display: 'flex', gap: 60,
                    backgroundColor: '#222', padding: 20, borderRadius: 10,
                    border: '1px solid #444'
                }}>
                    <div style={{textAlign: 'center', minWidth: 100}}>
                        <div style={{color: '#aaa', fontSize: 18}}>Sign</div>
                        <div style={{fontSize: 32, fontWeight: 'bold', color: '#4caf50'}}>
                            {step.sign === 1 ? '+' : (step.sign === -1 ? '-' : '?')}
                        </div>
                    </div>
                    <div style={{textAlign: 'center', minWidth: 150}}>
                        <div style={{color: '#aaa', fontSize: 18}}>Accumulator</div>
                         <div style={{fontSize: 32, fontWeight: 'bold', color: '#fff'}}>
                            {step.result}
                        </div>
                    </div>
                    <div style={{textAlign: 'center', minWidth: 150}}>
                        <div style={{color: '#aaa', fontSize: 18}}>Final Result</div>
                         <div style={{fontSize: 32, fontWeight: 'bold', color: '#ffca28'}}>
                            {step.sign ? step.result * step.sign : step.result}
                        </div>
                    </div>
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
