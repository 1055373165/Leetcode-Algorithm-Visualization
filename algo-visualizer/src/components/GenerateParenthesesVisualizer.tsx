import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import React from 'react';

export type ParenthesisStep = {
    currentString: string;
    openCount: number;
    closeCount: number;
    description: string;
    status: 'exploring' | 'success' | 'backtracking' | 'invalid';
    results: string[]; // List of valid combinations found so far
    n: number;
    highlightLastChar?: boolean; // Highlight the newly added char
};

interface GenerateParenthesesVisualizerProps {
    steps: ParenthesisStep[];
    title: string;
}

export const GenerateParenthesesVisualizer: React.FC<GenerateParenthesesVisualizerProps> = ({
    steps,
    title
}) => {
    const frame = useCurrentFrame();
    const {fps} = useVideoConfig();

    const durationPerStep = 2.5 * fps; // Slightly slower to follow recursion
    const currentStepIndex = Math.min(
        Math.floor(frame / durationPerStep),
        steps.length - 1
    );
    const step = steps[currentStepIndex];

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'success': return '#4caf50'; // Green
            case 'backtracking': return '#f44336'; // Red/Orange
            case 'invalid': return '#9e9e9e'; // Gray
            case 'exploring': default: return '#2196f3'; // Blue
        }
    };

    return (
        <AbsoluteFill className="bg-gray-900 text-white p-10 flex flex-col items-center" style={{backgroundColor: '#1e1e1e', color: 'white', fontFamily: 'sans-serif'}}>
            <h1 style={{fontSize: 36, marginBottom: 20}}>{title} (n={step.n})</h1>
            
            <div style={{
                display: 'flex', 
                flexDirection: 'row',
                justifyContent: 'center',
                width: '100%',
                height: '80%',
                gap: 40
            }}>
                {/* Left: State & Constraints */}
                <div style={{
                    width: '35%', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 30
                }}>
                    <div style={{fontSize: 24, color: '#aaa'}}>Current State</div>
                    <div style={{
                        fontSize: 60, 
                        fontWeight: 'bold', 
                        fontFamily: 'monospace',
                        color: getStatusColor(step.status),
                        border: `4px solid ${getStatusColor(step.status)}`,
                        padding: '20px 40px',
                        borderRadius: 15,
                        backgroundColor: '#333',
                        minWidth: 300,
                        textAlign: 'center',
                        textShadow: step.status === 'success' ? '0 0 20px rgba(76, 175, 80, 0.8)' : 'none'
                    }}>
                        {step.currentString || '""'}
                    </div>

                    <div style={{display: 'flex', gap: 40}}>
                        <div style={{textAlign: 'center'}}>
                            <div style={{fontSize: 20, color: '#aaa'}}>Open Count</div>
                            <div style={{fontSize: 40, fontWeight: 'bold', color: step.openCount < step.n ? '#fff' : '#f44336'}}>
                                {step.openCount} / {step.n}
                            </div>
                        </div>
                        <div style={{textAlign: 'center'}}>
                            <div style={{fontSize: 20, color: '#aaa'}}>Close Count</div>
                            <div style={{fontSize: 40, fontWeight: 'bold', color: step.closeCount < step.openCount ? '#fff' : '#f44336'}}>
                                {step.closeCount}
                            </div>
                        </div>
                    </div>

                    <div style={{
                        fontSize: 24, 
                        textAlign: 'center', 
                        color: '#ddd', 
                        backgroundColor: '#444', 
                        padding: 20, 
                        borderRadius: 10,
                        width: '100%'
                    }}>
                        Status: <span style={{color: getStatusColor(step.status), fontWeight: 'bold'}}>{step.status.toUpperCase()}</span>
                    </div>
                </div>

                {/* Right: Results List */}
                <div style={{
                    width: '30%', 
                    border: '1px solid #444', 
                    borderRadius: 10, 
                    padding: 20,
                    backgroundColor: '#252525',
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    <div style={{textAlign: 'center', color: '#aaa', marginBottom: 15, fontSize: 24}}>
                        Found Solutions ({step.results.length})
                    </div>
                    <div style={{
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: 10, 
                        overflowY: 'auto',
                        flex: 1
                    }}>
                        {step.results.map((res, i) => (
                            <div key={i} style={{
                                fontSize: 28, 
                                fontFamily: 'monospace', 
                                padding: '10px', 
                                backgroundColor: '#333', 
                                borderRadius: 5,
                                color: '#a5d6a7',
                                borderLeft: '5px solid #4caf50'
                            }}>
                                {res}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom: Description */}
            <div style={{
                marginTop: 20, 
                backgroundColor: '#333', 
                padding: 20, 
                borderRadius: 10, 
                width: '80%', 
                textAlign: 'center'
            }}>
                <div style={{fontSize: 26, color: '#fff'}}>
                    {step.description}
                </div>
            </div>

        </AbsoluteFill>
    );
};
