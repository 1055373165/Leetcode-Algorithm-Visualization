import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import React from 'react';

export type SequenceStep = {
    currentIndex?: number; // Index in the original array being processed
    currentValue?: number;
    description: string;
    // Set status
    setHighlights?: number[]; // Numbers currently "lit up" in the conceptual set
    // Sequence building
    sequenceChain?: number[]; // Numbers in the current chain being built (e.g. [1, 2, 3])
    // Visual states
    processedIndices?: number[]; // Indices that have been processed/skipped
    isStartOfSequence?: boolean; // If true, highlight current as start
};

interface ConsecutiveSequenceVisualizerProps {
    nums: number[];
    steps: SequenceStep[];
    title: string;
}

export const ConsecutiveSequenceVisualizer: React.FC<ConsecutiveSequenceVisualizerProps> = ({
    nums,
    steps,
    title
}) => {
    const frame = useCurrentFrame();
    const {fps} = useVideoConfig();

    const durationPerStep = 2 * fps;
    const currentStepIndex = Math.min(
        Math.floor(frame / durationPerStep),
        steps.length - 1
    );
    const step = steps[currentStepIndex];

    return (
        <AbsoluteFill className="bg-gray-900 text-white p-10 flex flex-col items-center" style={{backgroundColor: '#1e1e1e', color: 'white', fontFamily: 'sans-serif'}}>
            <h1 style={{fontSize: 40, marginBottom: 40}}>{title}</h1>
            
            {/* Array View */}
            <div style={{
                display: 'flex', 
                flexWrap: 'wrap', 
                justifyContent: 'center', 
                gap: 20,
                width: '90%',
                marginBottom: 60
            }}>
                {nums.map((num, i) => {
                    const isCurrent = step.currentIndex === i;
                    const isProcessed = step.processedIndices?.includes(i);
                    const isInChain = step.sequenceChain?.includes(num);
                    
                    let bg = '#333';
                    let border = '#555';
                    let color = '#ccc';
                    let opacity = 1;

                    if (isCurrent) {
                        border = '#ffeb3b'; // Yellow focus
                        bg = '#444';
                        color = '#fff';
                    }
                    
                    if (isProcessed && !isCurrent) {
                        opacity = 0.4; // Fade out processed
                    }

                    if (isInChain) {
                        bg = 'rgba(76, 175, 80, 0.3)';
                        border = '#4caf50';
                        color = '#a5d6a7';
                        opacity = 1;
                    }

                    if (step.isStartOfSequence && isCurrent) {
                        bg = 'rgba(33, 150, 243, 0.3)';
                        border = '#2196f3'; // Blue for Start
                        color = '#90caf9';
                    }

                    return (
                        <div key={i} style={{
                            width: 80,
                            height: 80,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: `3px solid ${border}`,
                            backgroundColor: bg,
                            color: color,
                            fontSize: 32,
                            borderRadius: 12,
                            opacity,
                            transition: 'all 0.3s',
                            position: 'relative'
                        }}>
                            {num}
                            {isCurrent && <div style={{position: 'absolute', bottom: -30, fontSize: 14, color: '#ffeb3b'}}>curr</div>}
                        </div>
                    );
                })}
            </div>

            {/* Logical Chain View */}
            {step.sequenceChain && step.sequenceChain.length > 0 && (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    backgroundColor: '#2d2d2d',
                    padding: 30,
                    borderRadius: 15,
                    width: '90%',
                    minHeight: 150
                }}>
                    <div style={{color: '#aaa', marginBottom: 20}}>Building Sequence... Length: <span style={{color: '#fff', fontWeight: 'bold'}}>{step.sequenceChain.length}</span></div>
                    <div style={{display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center'}}>
                        {step.sequenceChain.map((val, idx) => (
                            <React.Fragment key={idx}>
                                <div style={{
                                    padding: '10px 20px',
                                    borderRadius: 8,
                                    backgroundColor: '#4caf50',
                                    color: '#fff',
                                    fontSize: 24,
                                    fontWeight: 'bold'
                                }}>
                                    {val}
                                </div>
                                {idx < step.sequenceChain!.length - 1 && (
                                    <div style={{display: 'flex', alignItems: 'center', color: '#666'}}>➔</div>
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            )}

            {/* Info Panel */}
            <div style={{
                marginTop: 'auto',
                marginBottom: 40,
                backgroundColor: '#333', 
                padding: 20, 
                borderRadius: 10, 
                width: '80%', 
                textAlign: 'center'
            }}>
                <div style={{fontSize: 28, color: '#fff'}}>
                    {step.description}
                </div>
            </div>

        </AbsoluteFill>
    );
};
