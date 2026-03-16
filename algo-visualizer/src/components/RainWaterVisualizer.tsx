import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import React from 'react';

export type RainWaterStep = {
    pointers: {index: number, label: string, color: string}[];
    description: string;
    waterLevels: number[]; // Water height at each index (0 if no water)
    maxLeft?: number;
    maxRight?: number;
    currentWaterSum?: number;
};

interface RainWaterVisualizerProps {
    heights: number[];
    steps: RainWaterStep[];
    title: string;
}

export const RainWaterVisualizer: React.FC<RainWaterVisualizerProps> = ({
    heights,
    steps,
    title
}) => {
    const frame = useCurrentFrame();
    const {fps} = useVideoConfig();

    const durationPerStep = 1.5 * fps;
    const currentStepIndex = Math.min(
        Math.floor(frame / durationPerStep),
        steps.length - 1
    );
    const step = steps[currentStepIndex];

    const maxVal = Math.max(...heights, ...step.waterLevels.map((w, i) => w + heights[i]));

    return (
        <AbsoluteFill className="bg-gray-900 text-white p-10 flex flex-col items-center" style={{backgroundColor: '#1e1e1e', color: 'white', fontFamily: 'sans-serif'}}>
            <h1 style={{fontSize: 40, marginBottom: 20}}>{title}</h1>
            
            <div style={{
                display: 'flex', 
                alignItems: 'flex-end', 
                justifyContent: 'center', 
                height: 400, 
                width: '80%', 
                gap: 5,
                position: 'relative',
                borderBottom: '2px solid #555'
            }}>
                {heights.map((h, i) => {
                    const water = step.waterLevels[i] || 0;
                    const totalHeight = h + water;
                    const pointers = step.pointers.filter(p => p.index === i);
                    
                    return (
                        <div key={i} style={{
                            height: '100%',
                            width: '100%',
                            display: 'flex',
                            flexDirection: 'column-reverse', // Stack from bottom
                            position: 'relative'
                        }}>
                             {/* Pointers */}
                             <div style={{
                                position: 'absolute',
                                bottom: -50,
                                left: '50%',
                                transform: 'translateX(-50%)',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: 2,
                                zIndex: 10
                            }}>
                                {pointers.map((p, pIdx) => (
                                    <div key={pIdx} style={{
                                        color: p.color,
                                        fontWeight: 'bold',
                                        fontSize: 16,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center'
                                    }}>
                                        <div style={{
                                            width: 0, 
                                            height: 0, 
                                            borderLeft: '5px solid transparent', 
                                            borderRight: '5px solid transparent', 
                                            borderBottom: `8px solid ${p.color}`, 
                                            marginBottom: 2
                                        }} />
                                        {p.label}
                                    </div>
                                ))}
                            </div>

                             {/* Index Label */}
                             <span style={{
                                position: 'absolute', 
                                bottom: -70, 
                                width: '100%', 
                                textAlign: 'center', 
                                color: '#555',
                                fontSize: 12
                            }}>{i}</span>

                            {/* Ground (Height) */}
                            <div style={{
                                height: `${h / maxVal * 100}%`,
                                backgroundColor: '#9e9e9e', // Grey ground
                                width: '100%',
                                border: '1px solid #424242',
                                boxSizing: 'border-box',
                                transition: 'height 0.3s'
                            }} />

                            {/* Water */}
                            {water > 0 && (
                                <div style={{
                                    height: `${water / maxVal * 100}%`,
                                    backgroundColor: 'rgba(33, 150, 243, 0.8)', // Blue water
                                    width: '100%',
                                    border: '1px solid #1976d2',
                                    boxSizing: 'border-box',
                                    transition: 'height 0.3s'
                                }} />
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Info Panel */}
            <div style={{
                marginTop: 80, 
                backgroundColor: '#333', 
                padding: 20, 
                borderRadius: 10, 
                width: '80%', 
                display: 'flex', 
                flexDirection: 'column',
                gap: 15
            }}>
                <div style={{display: 'flex', justifyContent: 'space-between', fontSize: 24, color: '#aaa'}}>
                     <div>MaxLeft: <span style={{color: '#ffeb3b'}}>{step.maxLeft ?? '-'}</span></div>
                     <div>MaxRight: <span style={{color: '#ffeb3b'}}>{step.maxRight ?? '-'}</span></div>
                     <div>Total Water: <span style={{color: '#2196f3'}}>{step.currentWaterSum ?? 0}</span></div>
                </div>
                <div style={{fontSize: 28, color: '#fff', borderTop: '1px solid #555', paddingTop: 10}}>
                    {step.description}
                </div>
            </div>

        </AbsoluteFill>
    );
};
