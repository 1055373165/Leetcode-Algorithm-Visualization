import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import React from 'react';

export type NumberArrayStep = {
    pointers: {index: number, label: string, color: string}[];
    description: string;
    highlights?: {index: number, color: string}[]; // Background color for specific cells
    secondaryInfo?: string; // e.g. "Sum: -4 + (-1) + 2 = -3"
};

interface NumberArrayVisualizerProps {
    numbers: number[];
    steps: NumberArrayStep[];
    title: string;
}

export const NumberArrayVisualizer: React.FC<NumberArrayVisualizerProps> = ({
    numbers,
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

    return (
        <AbsoluteFill className="bg-gray-900 text-white p-10 flex flex-col items-center" style={{backgroundColor: '#1e1e1e', color: 'white', fontFamily: 'sans-serif'}}>
            <h1 style={{fontSize: 40, marginBottom: 40}}>{title}</h1>
            
            <div style={{
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: 15,
                marginTop: 60
            }}>
                {numbers.map((num, i) => {
                    const highlight = step.highlights?.find(h => h.index === i);
                    const pointers = step.pointers.filter(p => p.index === i);
                    
                    return (
                        <div key={i} style={{
                            width: 80,
                            height: 80,
                            border: `3px solid ${highlight ? highlight.color : '#555'}`,
                            backgroundColor: highlight ? highlight.color + '44' : 'transparent', // Semi-transparent
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 32,
                            borderRadius: 12,
                            position: 'relative',
                            transition: 'all 0.3s'
                        }}>
                            {num}
                            
                            {/* Pointers */}
                            <div style={{
                                position: 'absolute',
                                bottom: -60,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: 2
                            }}>
                                {pointers.map((p, pIdx) => (
                                    <div key={pIdx} style={{
                                        color: p.color,
                                        fontWeight: 'bold',
                                        fontSize: 20,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center'
                                    }}>
                                        <div style={{
                                            width: 0, 
                                            height: 0, 
                                            borderLeft: '6px solid transparent', 
                                            borderRight: '6px solid transparent', 
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
                                top: -30, 
                                width: '100%', 
                                textAlign: 'center', 
                                color: '#555',
                                fontSize: 14
                            }}>{i}</span>
                        </div>
                    );
                })}
            </div>

            {/* Info Panel */}
            <div style={{
                marginTop: 100, 
                backgroundColor: '#333', 
                padding: 30, 
                borderRadius: 10, 
                width: '80%', 
                display: 'flex', 
                flexDirection: 'column',
                gap: 15
            }}>
                <div style={{fontSize: 32, color: '#64b5f6'}}>
                    {step.description}
                </div>
                {step.secondaryInfo && (
                    <div style={{fontSize: 24, color: '#aaa', borderTop: '1px solid #555', paddingTop: 10}}>
                        {step.secondaryInfo}
                    </div>
                )}
            </div>

        </AbsoluteFill>
    );
};
