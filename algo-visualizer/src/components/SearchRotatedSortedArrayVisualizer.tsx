import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import React from 'react';

export type SearchRotatedSortedArrayStep = {
    nums: number[];
    left: number;
    right: number;
    mid: number;
    sortedHalf: 'left' | 'right' | null; // Which half is determined to be sorted
    target: number;
    foundIndex: number | null; // -1 if not found, index if found, null if searching
    description: string;
};

interface SearchRotatedSortedArrayVisualizerProps {
    steps: SearchRotatedSortedArrayStep[];
    title: string;
}

export const SearchRotatedSortedArrayVisualizer: React.FC<SearchRotatedSortedArrayVisualizerProps> = ({
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
            <h2 style={{fontSize: 30, color: '#aaa', marginBottom: 40}}>Target: {step.target}</h2>
            
            <div style={{
                flex: 1,
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: 60
            }}>
                <div style={{display: 'flex', gap: 10}}>
                    {step.nums.map((num, idx) => {
                        const inRange = idx >= step.left && idx <= step.right;
                        const isMid = idx === step.mid;
                        const isFound = idx === step.foundIndex;
                        
                        // Highlight Logic
                        let bgColor = '#333';
                        let opacity = 0.5;
                        
                        if (inRange) {
                            opacity = 1;
                            bgColor = '#555';
                        }
                        
                        if (isMid) {
                            bgColor = '#ffca28'; // Yellow Mid
                        }
                        
                        // Sorted Half Highlight
                        if (step.sortedHalf === 'left' && idx >= step.left && idx < step.mid) {
                            // Left Sorted
                           // border bottom green?
                        }
                        
                        if (isFound) {
                            bgColor = '#4caf50'; // Green Found
                        }

                        return (
                            <div key={idx} style={{
                                width: 80, height: 80,
                                display: 'flex', flexDirection: 'column',
                                alignItems: 'center', position: 'relative',
                                opacity
                            }}>
                                <div style={{
                                    width: 80, height: 80,
                                    borderRadius: 10,
                                    backgroundColor: bgColor,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontWeight: 'bold', fontSize: 28,
                                    color: isMid ? '#000' : '#fff',
                                    border: isMid ? '3px solid #fff' : 'none'
                                }}>
                                    {num}
                                </div>

                                {/* Indices */}
                                <div style={{marginTop: 10, color: '#777', fontSize: 16}}>{idx}</div>

                                {/* Pointers */}
                                {idx === step.left && (
                                    <div style={{position: 'absolute', top: -40, color: '#42a5f5', fontSize: 20, fontWeight: 'bold'}}>L</div>
                                )}
                                {idx === step.right && (
                                    <div style={{position: 'absolute', top: -40, color: '#ef5350', fontSize: 20, fontWeight: 'bold'}}>R</div>
                                )}
                                {isMid && (
                                    <div style={{position: 'absolute', top: -60, color: '#ffca28', fontSize: 20, fontWeight: 'bold'}}>M</div>
                                )}

                                {/* Sorted Half Indicator */}
                                {step.sortedHalf === 'left' && idx >= step.left && idx <= step.mid && (
                                    <div style={{position: 'absolute', bottom: -10, width: '100%', height: 4, backgroundColor: '#66bb6a'}}></div>
                                )}
                                {step.sortedHalf === 'right' && idx >= step.mid && idx <= step.right && (
                                    <div style={{position: 'absolute', bottom: -10, width: '100%', height: 4, backgroundColor: '#66bb6a'}}></div>
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
                fontSize: 26,
                color: '#fff',
                border: '1px solid #555'
            }}>
                {step.description}
            </div>
        </AbsoluteFill>
    );
};
