import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import React from 'react';

export type Interval = [number, number];

export type MergeIntervalsStep = {
    sortedIntervals: Interval[]; // All input intervals, sorted
    currentIndex: number; // Index of interval being processed
    merged: Interval[]; // List of finalized merged intervals
    currentMerged: Interval | null; // The interval currently being built/extended
    action: 'start' | 'check' | 'merge' | 'push' | 'finish';
    description: string;
};

interface MergeIntervalsVisualizerProps {
    steps: MergeIntervalsStep[];
    title: string;
}

export const MergeIntervalsVisualizer: React.FC<MergeIntervalsVisualizerProps> = ({
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

    // Scale calculation
    // Max value typically 18 in example. Let's assume max 20 for scale.
    const maxVal = 20;
    const padding = 50;
    const width = 1100; // available width
    const scaleX = (val: number) => (val / maxVal) * width;

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
                gap: 40,
                padding: '0 50px'
            }}>
                {/* Timeline Grid */}
                <div style={{
                    width: width + 100,
                    position: 'relative',
                    height: 400,
                    borderLeft: '2px solid #555',
                    borderBottom: '2px solid #555',
                    padding: '20px'
                }}>
                    {/* Input Intervals (Top Half) */}
                    <div style={{position: 'absolute', top: 0, left: 50, width: '100%', height: '50%'}}>
                        <div style={{color: '#aaa', marginBottom: 10, fontSize: 20}}>Input Sorted Intervals</div>
                        {step.sortedIntervals.map((interval, idx) => {
                            const isCurrent = idx === step.currentIndex;
                            const isProcessed = idx < step.currentIndex;
                            
                            let opacity = 1;
                            let bgColor = '#42a5f5'; // Blue
                            
                            if (isProcessed) {
                                opacity = 0.3;
                                bgColor = '#bbb';
                            } else if (isCurrent) {
                                bgColor = '#ffca28'; // Yellow highlighting current check
                            }

                            return (
                                <div key={idx} style={{
                                    position: 'absolute',
                                    left: scaleX(interval[0]),
                                    width: scaleX(interval[1] - interval[0]),
                                    top: 40 + (idx * 35),
                                    height: 25,
                                    backgroundColor: bgColor,
                                    borderRadius: 4,
                                    opacity,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 14, color: '#000', fontWeight: 'bold'
                                }}>
                                    [{interval[0]}, {interval[1]}]
                                </div>
                            );
                        })}
                    </div>

                    {/* Merged Result (Bottom Half) */}
                    <div style={{position: 'absolute', top: '50%', left: 50, width: '100%', height: '50%'}}>
                         <div style={{color: '#aaa', marginBottom: 10, fontSize: 20}}>Merged Result</div>
                         {/* Committed Merged Intervals */}
                         {step.merged.map((interval, idx) => (
                             <div key={`m-${idx}`} style={{
                                 position: 'absolute',
                                 left: scaleX(interval[0]),
                                 width: scaleX(interval[1] - interval[0]),
                                 top: 40, // Single row for result
                                 height: 30,
                                 backgroundColor: '#66bb6a', // Green
                                 borderRadius: 4,
                                 display: 'flex', alignItems: 'center', justifyContent: 'center',
                                 fontSize: 16, color: '#fff', fontWeight: 'bold',
                                 boxShadow: '0 2px 5px rgba(0,0,0,0.3)'
                             }}>
                                 [{interval[0]}, {interval[1]}]
                             </div>
                         ))}

                         {/* Currently Building Merged Interval */}
                         {step.currentMerged && (
                             <div style={{
                                 position: 'absolute',
                                 left: scaleX(step.currentMerged[0]),
                                 width: scaleX(step.currentMerged[1] - step.currentMerged[0]),
                                 top: 40,
                                 height: 30,
                                 backgroundColor: '#ef5350', // Red/Orange active
                                 borderRadius: 4,
                                 display: 'flex', alignItems: 'center', justifyContent: 'center',
                                 fontSize: 16, color: '#fff', fontWeight: 'bold',
                                 border: '2px dashed #fff',
                                 zIndex: 10
                             }}>
                                 [{step.currentMerged[0]}, {step.currentMerged[1]}]
                             </div>
                         )}
                    </div>

                    {/* Ticks */}
                    {Array.from({length: maxVal + 1}).map((_, i) => (
                        <div key={i} style={{
                            position: 'absolute',
                            left: 50 + scaleX(i),
                            bottom: -25,
                            transform: 'translateX(-50%)',
                            color: '#777',
                            fontSize: 12
                        }}>
                            {i}
                            <div style={{width: 1, height: 5, backgroundColor: '#555', margin: '0 auto'}}/>
                        </div>
                    ))}
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
