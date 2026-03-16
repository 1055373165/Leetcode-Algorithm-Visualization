import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import React from 'react';

export type FindDuplicateStep = {
    nums: number[];
    slow: number;
    fast: number;
    phase: 'phase1' | 'phase2' | 'found';
    description: string;
};

interface FindDuplicateVisualizerProps {
    steps: FindDuplicateStep[];
    title: string;
}

export const FindDuplicateVisualizer: React.FC<FindDuplicateVisualizerProps> = ({
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
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: 60
            }}>
                {/* Array Visualization with SVG Overlay */}
                <div style={{position: 'relative', marginTop: 60}}>
                    {/* SVG Layer */}
                    <svg style={{
                        position: 'absolute', 
                        top: -60, left: 0, 
                        width: '100%', height: 'calc(100% + 120px)', 
                        pointerEvents: 'none', 
                        overflow: 'visible',
                        zIndex: 0
                    }}>
                        <defs>
                            <marker id="arrowhead" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
                                <polygon points="0 0, 6 2, 0 4" fill="#666" />
                            </marker>
                        </defs>
                        {step.nums.map((nextIdx, currentIdx) => {
                            // Calculate positions
                            // item width 80, gap 15. Center is at (index * 95) + 40
                            const startX = currentIdx * 95 + 40;
                            const endX = nextIdx * 95 + 40;
                            
                            // Height of curve depends on distance
                            const distance = Math.abs(endX - startX);
                            const arcHeight = 40 + distance * 0.15;
                            
                            // Control points for Bezier curve
                            // Curve goes UP from top of box
                            const startY = 60; // Relative to SVG top (since SVG top is -60 relative to container)
                            const endY = 60; 

                            const controlY = startY - arcHeight;

                            const pathData = `M ${startX} ${startY} Q ${(startX + endX) / 2} ${controlY} ${endX} ${endY}`;
                            
                            return (
                                <g key={`arrow-${currentIdx}`}>
                                    <path 
                                        d={pathData} 
                                        fill="none" 
                                        stroke="#555" 
                                        strokeWidth="2" 
                                        strokeOpacity="0.4"
                                        markerEnd="url(#arrowhead)"
                                    />
                                    {/* Small label for next hop */}
                                    {/* <text x={(startX+endX)/2} y={controlY + 10} fill="#555" fontSize="12" textAnchor="middle">{nextIdx}</text> */}
                                </g>
                            );
                        })}
                    </svg>

                    <div style={{display: 'flex', gap: 15, position: 'relative', zIndex: 1}}>
                        {step.nums.map((val, idx) => {
                            const isSlow = step.slow === idx; 
                            
                            const isFast = step.phase === 'phase1' && step.fast === idx;
                            const isFastPhase2 = step.phase === 'phase2' && step.fast === idx; 
                            
                            return (
                                <div key={idx} style={{
                                    width: 80, height: 80,
                                    display: 'flex', flexDirection: 'column',
                                    alignItems: 'center', position: 'relative'
                                }}>
                                    <div style={{
                                        width: 80, height: 80,
                                        borderRadius: 10,
                                        backgroundColor: '#333',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontWeight: 'bold', fontSize: 28,
                                        border: '1px solid #555',
                                        color: '#fff',
                                        zIndex: 2
                                    }}>
                                        {val}
                                    </div>
                                    <div style={{marginTop: 5, color: '#aaa', fontSize: 16}}>Idx: {idx}</div>

                                    {/* Pointers */}
                                    {isSlow && (
                                        <div style={{
                                            position: 'absolute', top: -55, 
                                            color: '#29b6f6', fontWeight: 'bold', fontSize: 20,
                                            display: 'flex', flexDirection: 'column', alignItems: 'center',
                                            zIndex: 10
                                        }}>
                                            <div>Slow</div>
                                            <div style={{fontSize: 20}}>v</div>
                                        </div>
                                    )}
                                    {(isFast || isFastPhase2) && (
                                        <div style={{
                                            position: 'absolute', bottom: -50, 
                                            color: isFastPhase2 ? '#29b6f6' : '#ff4081', 
                                            fontWeight: 'bold', fontSize: 20,
                                            display: 'flex', flexDirection: 'column-reverse', alignItems: 'center',
                                            zIndex: 10
                                        }}>
                                            <div>{isFastPhase2 ? 'Slow2' : 'Fast'}</div>
                                            <div style={{fontSize: 20}}>^</div>
                                        </div>
                                    )}
                                    
                                    {step.phase === 'found' && step.slow === idx && (
                                        <div style={{
                                            position: 'absolute', top: -90, 
                                            color: '#4caf50', fontWeight: 'bold', fontSize: 24,
                                            backgroundColor: '#1e1e1e', padding: 5, borderRadius: 5, border: '1px solid #4caf50',
                                            zIndex: 20, width: 200, textAlign: 'center'
                                        }}>
                                            Duplicate found!
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Legend / Status */}
                <div style={{
                    display: 'flex', gap: 40,
                    backgroundColor: '#222', padding: 20, borderRadius: 10
                }}>
                    <div style={{color: '#29b6f6'}}>Slow: {step.slow} (nums[{step.slow}])</div>
                    {step.phase === 'phase1' && <div style={{color: '#ff4081'}}>Fast: {step.fast} (nums[{step.fast}])</div>}
                    {step.phase === 'phase2' && <div style={{color: '#29b6f6'}}>Slow2: {step.fast}</div>}
                    <div style={{color: '#fff', fontWeight: 'bold'}}>Phase: {step.phase === 'phase1' ? '1. Intersection' : (step.phase === 'phase2' ? '2. Entry' : 'Found')}</div>
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
