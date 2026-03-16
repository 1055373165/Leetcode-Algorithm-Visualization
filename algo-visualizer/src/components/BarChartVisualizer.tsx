import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import React from 'react';

export type BarChartStep = {
    pointers: {index: number, label: string, color: string}[];
    description: string;
    maxArea: number;
    currentArea?: number;
    highlightIndices?: number[]; // Indices to highlight (e.g., the shorter bar)
};

interface BarChartVisualizerProps {
    heights: number[];
    steps: BarChartStep[];
    title: string;
}

export const BarChartVisualizer: React.FC<BarChartVisualizerProps> = ({
    heights,
    steps,
    title
}) => {
    const frame = useCurrentFrame();
    const {fps} = useVideoConfig();

    // Calculate step
    const durationPerStep = 1.5 * fps;
    const currentStepIndex = Math.min(
        Math.floor(frame / durationPerStep),
        steps.length - 1
    );
    const step = steps[currentStepIndex];

    const maxVal = Math.max(...heights);
    
    // Find left and right pointers to draw water
    const leftPtr = step.pointers.find(p => p.label === 'L');
    const rightPtr = step.pointers.find(p => p.label === 'R');

    return (
        <AbsoluteFill className="bg-gray-900 text-white p-10 flex flex-col items-center" style={{backgroundColor: '#1e1e1e', color: 'white', fontFamily: 'sans-serif'}}>
            <h1 style={{fontSize: 40, marginBottom: 20}}>{title}</h1>
            
            <div style={{
                display: 'flex', 
                alignItems: 'flex-end', 
                justifyContent: 'center', 
                height: 400, 
                width: '80%', 
                gap: 10,
                position: 'relative'
            }}>
                {/* Water Layer */}
                {leftPtr && rightPtr && (
                    <div style={{
                        position: 'absolute',
                        left: `${(leftPtr.index * (100 / heights.length)) + (100 / heights.length / 2)}%`,
                        width: `${(rightPtr.index - leftPtr.index) * (100 / heights.length)}%`,
                        bottom: 0,
                        height: `${Math.min(heights[leftPtr.index], heights[rightPtr.index]) / maxVal * 100}%`,
                        backgroundColor: 'rgba(33, 150, 243, 0.5)', // Blue water
                        transition: 'all 0.3s',
                        zIndex: 0
                    }} />
                )}

                {/* Bars */}
                {heights.map((h, i) => {
                    const isHighlighted = step.highlightIndices?.includes(i);
                    const pointer = step.pointers.find(p => p.index === i);
                    
                    return (
                        <div key={i} style={{
                            height: `${h / maxVal * 100}%`,
                            width: '100%',
                            backgroundColor: isHighlighted ? '#e57373' : '#eee',
                            borderRadius: '4px 4px 0 0',
                            position: 'relative',
                            zIndex: 1,
                            transition: 'height 0.3s'
                        }}>
                            {/* Height Label */}
                            <span style={{
                                position: 'absolute', 
                                top: -25, 
                                width: '100%', 
                                textAlign: 'center', 
                                color: '#aaa',
                                fontSize: 14
                            }}>{h}</span>

                            {/* Pointer */}
                            {pointer && (
                                <div style={{
                                    position: 'absolute',
                                    bottom: -40,
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    color: pointer.color,
                                    fontWeight: 'bold',
                                    fontSize: 20,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center'
                                }}>
                                    <div style={{width: 0, height: 0, borderLeft: '8px solid transparent', borderRight: '8px solid transparent', borderBottom: `10px solid ${pointer.color}`, marginBottom: 5}} />
                                    {pointer.label}
                                </div>
                            )}
                            
                            {/* Index Label */}
                             <span style={{
                                position: 'absolute', 
                                bottom: -65, 
                                width: '100%', 
                                textAlign: 'center', 
                                color: '#555',
                                fontSize: 12
                            }}>{i}</span>
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
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div style={{fontSize: 24}}>
                    <div>Max Area: <span style={{color: '#4caf50', fontWeight: 'bold'}}>{step.maxArea}</span></div>
                    {step.currentArea !== undefined && (
                        <div style={{fontSize: 18, color: '#aaa'}}>Current: {step.currentArea}</div>
                    )}
                </div>
                <div style={{fontSize: 24, color: '#64b5f6', maxWidth: '60%', textAlign: 'right'}}>
                    {step.description}
                </div>
            </div>

        </AbsoluteFill>
    );
};
