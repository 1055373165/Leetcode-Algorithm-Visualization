import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import React from 'react';

export type PalindromePartitioningStep = {
    path: string[]; // Current partitions chosen so far, e.g., ["a", "a"]
    remaining: string; // Remaining string to partition, e.g., "b"
    checking: string; // Substring currently being checked, e.g., "b"
    isValid: boolean | null; // Result of check. null if check in progress.
    foundSolutions: string[][]; // List of checked full solutions
    description: string;
};

interface PalindromePartitioningVisualizerProps {
    steps: PalindromePartitioningStep[];
    title: string;
}

export const PalindromePartitioningVisualizer: React.FC<PalindromePartitioningVisualizerProps> = ({
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
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 40
            }}>
                {/* Current Path State */}
                <div style={{display: 'flex', gap: 10, alignItems: 'center', height: 80}}>
                    <div style={{color: '#aaa', fontSize: 24, marginRight: 20}}>Current Path:</div>
                    {step.path.map((s, idx) => (
                        <div key={idx} style={{
                            padding: '10px 20px',
                            backgroundColor: '#4caf50',
                            borderRadius: 8,
                            fontSize: 24,
                            fontWeight: 'bold',
                            border: '2px solid #81c784'
                        }}>
                            {s}
                        </div>
                    ))}
                    {/* Checking Block */}
                    {step.checking && (
                        <div style={{
                            padding: '10px 20px',
                            backgroundColor: step.isValid === null ? '#ff9800' : (step.isValid ? '#4caf50' : '#ef5350'),
                            borderRadius: 8,
                            fontSize: 24,
                            fontWeight: 'bold',
                            border: '2px dashed #fff',
                            opacity: 0.8
                        }}>
                            {step.checking}?
                        </div>
                    )}
                </div>

                {/* Remaining Check */}
                <div style={{display: 'flex', gap: 10, alignItems: 'center', height: 60}}>
                    <div style={{color: '#aaa', fontSize: 20, marginRight: 20}}>Remaining:</div>
                    <div style={{fontSize: 32, fontFamily: 'monospace', letterSpacing: 5}}>
                        {step.remaining}
                    </div>
                </div>

                {/* Solutions Found */}
                <div style={{
                    display: 'flex', flexDirection: 'column', gap: 10, 
                    borderTop: '1px solid #555', paddingTop: 20, width: '80%', alignItems: 'center'
                }}>
                    <div style={{color: '#aaa', fontSize: 20}}>Solutions Found:</div>
                    <div style={{display: 'flex', gap: 20}}>
                        {step.foundSolutions.map((sol, idx) => (
                            <div key={idx} style={{
                                display: 'flex', gap: 5, padding: 10, 
                                backgroundColor: '#333', borderRadius: 8, border: '1px solid #555'
                            }}>
                                {sol.map((s, i) => (
                                    <span key={i} style={{color: '#4fc3f7'}}>{`"${s}"`}</span>
                                ))}
                            </div>
                        ))}
                        {step.foundSolutions.length === 0 && <div style={{color: '#666'}}>None yet...</div>}
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
