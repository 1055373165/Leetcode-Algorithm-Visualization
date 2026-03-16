import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import React from 'react';

export type BucketStep = {
    currentIndex?: number; // Index in input array
    currentString?: string;
    description: string;
    sortedKey?: string; // The sorted version of the current string
    buckets: {[key: string]: string[]}; // Current state of buckets
    isProcessing?: boolean; // Show the "Processing" animation (sorting)
    highlightBucket?: string; // Key of bucket to highlight
};

interface GroupAnagramsVisualizerProps {
    strs: string[];
    steps: BucketStep[];
    title: string;
}

export const GroupAnagramsVisualizer: React.FC<GroupAnagramsVisualizerProps> = ({
    strs,
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
            <h1 style={{fontSize: 40, marginBottom: 20}}>{title}</h1>
            
            <div style={{
                display: 'flex', 
                flexDirection: 'row',
                justifyContent: 'space-between',
                width: '95%',
                height: '70%',
                gap: 20
            }}>
                {/* Left: Input List */}
                <div style={{
                    width: '20%', 
                    border: '1px solid #444', 
                    borderRadius: 10, 
                    padding: 10,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10
                }}>
                    <div style={{textAlign: 'center', color: '#aaa', marginBottom: 10}}>Input List</div>
                    {strs.map((s, i) => {
                        const isCurrent = step.currentIndex === i;
                        const isProcessed = (step.currentIndex !== undefined && i < step.currentIndex);
                        
                        return (
                            <div key={i} style={{
                                padding: '10px',
                                backgroundColor: isCurrent ? '#ffeb3b' : (isProcessed ? '#333' : '#555'),
                                color: isCurrent ? '#000' : (isProcessed ? '#777' : '#fff'),
                                borderRadius: 5,
                                textAlign: 'center',
                                fontSize: 24,
                                opacity: isProcessed ? 0.5 : 1
                            }}>
                                "{s}"
                            </div>
                        );
                    })}
                </div>

                {/* Center: Processing Station */}
                <div style={{
                    width: '30%', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: 30
                }}>
                    {step.currentString && (
                        <>
                            <div style={{fontSize: 20, color: '#aaa'}}>Processing</div>
                            <div style={{
                                fontSize: 48, 
                                fontWeight: 'bold', 
                                color: '#ffeb3b',
                                border: '3px solid #ffeb3b',
                                padding: '10px 30px',
                                borderRadius: 10
                            }}>
                                "{step.currentString}"
                            </div>
                            
                            <div style={{fontSize: 30, color: '#aaa'}}>⬇ Sort ⬇</div>
                            
                            {step.sortedKey && (
                                <div style={{
                                    fontSize: 48, 
                                    fontWeight: 'bold', 
                                    color: '#4caf50',
                                    border: '3px dashed #4caf50',
                                    padding: '10px 30px',
                                    borderRadius: 10
                                }}>
                                    "{step.sortedKey}"
                                </div>
                            )}
                            
                            {step.sortedKey && (
                                <div style={{fontSize: 20, color: '#aaa'}}>Key</div>
                            )}
                        </>
                    )}
                </div>

                {/* Right: Buckets (Map) */}
                <div style={{
                    width: '45%', 
                    border: '1px solid #444', 
                    borderRadius: 10, 
                    padding: 10,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                    overflowY: 'auto'
                }}>
                    <div style={{textAlign: 'center', color: '#aaa', marginBottom: 10}}>Hash Map (Buckets)</div>
                    <div style={{display: 'flex', flexWrap: 'wrap', gap: 15, alignContent: 'flex-start'}}>
                    {Object.entries(step.buckets).sort().map(([key, vals]) => {
                        const isHighlighted = step.highlightBucket === key;
                        return (
                            <div key={key} style={{
                                border: `2px solid ${isHighlighted ? '#4caf50' : '#666'}`,
                                borderRadius: 8,
                                padding: 10,
                                backgroundColor: isHighlighted ? 'rgba(76, 175, 80, 0.2)' : '#333',
                                minWidth: 120,
                                transition: 'all 0.3s'
                            }}>
                                <div style={{
                                    borderBottom: '1px solid #555', 
                                    marginBottom: 5, 
                                    paddingBottom: 5,
                                    fontWeight: 'bold',
                                    color: isHighlighted ? '#a5d6a7' : '#ccc',
                                    fontSize: 18
                                }}>
                                    Key: "{key}"
                                </div>
                                <div style={{display: 'flex', flexDirection: 'column', gap: 2}}>
                                    {vals.map((v, vIdx) => (
                                        <div key={vIdx} style={{
                                            backgroundColor: '#555', 
                                            padding: '2px 8px', 
                                            borderRadius: 4,
                                            fontSize: 16
                                        }}>
                                            "{v}"
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                    </div>
                </div>
            </div>

            {/* Info Panel */}
            <div style={{
                marginTop: 'auto',
                marginBottom: 20,
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
