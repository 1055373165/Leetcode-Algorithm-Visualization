import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import React from 'react';

export type FindAllAnagramsStep = {
    s: string;
    p: string;
    windowStart: number;
    windowEnd: number; // exclusive
    sCounts: Record<string, number>;
    pCounts: Record<string, number>;
    matchCount: number;
    resultIndices: number[];
    isMatch: boolean;
    description: string;
};

interface FindAllAnagramsVisualizerProps {
    steps: FindAllAnagramsStep[];
}

export const FindAllAnagramsVisualizer: React.FC<FindAllAnagramsVisualizerProps> = ({
    steps,
}) => {
    const frame = useCurrentFrame();
    const {fps} = useVideoConfig();

    if (!steps || steps.length === 0) return null;

    const durationPerStep = 3 * fps;
    const currentStepIndex = Math.min(
        Math.floor(frame / durationPerStep),
        steps.length - 1
    );
    const step = steps[currentStepIndex];

    if (!step) return null;

    const charBoxSize = 50;
    const gap = 10;

    return (
        <AbsoluteFill className="bg-gray-900 text-white p-10 flex flex-col items-center" style={{backgroundColor: '#1e1e1e', color: 'white', fontFamily: 'sans-serif'}}>
             <h1 style={{fontSize: 40, marginBottom: 20}}>438. Find All Anagrams in a String</h1>
             
             <div style={{
                 flex: 1,
                 display: 'flex',
                 flexDirection: 'column',
                 alignItems: 'center',
                 justifyContent: 'center',
                 gap: 60,
                 width: '100%'
             }}>
                
                {/* Target P Display */}
                <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10}}>
                    <div style={{fontSize: 24, color: '#aaa'}}>Target Pattern (p): "{step.p}"</div>
                    <div style={{display: 'flex', gap: 10}}>
                         {step.p.split('').map((char, idx) => (
                             <div key={idx} style={{
                                 width: 40, height: 40, backgroundColor: '#333', 
                                 display: 'flex', alignItems: 'center', justifyContent: 'center',
                                 borderRadius: 5, border: '1px solid #555', fontWeight: 'bold'
                             }}>
                                 {char}
                             </div>
                         ))}
                    </div>
                </div>

                {/* Main String S with Window */}
                <div style={{display: 'flex', gap, position: 'relative', marginTop: 20}}>
                    {/* Window Frame Overlay */}
                     <div style={{
                        position: 'absolute',
                        left: step.windowStart * (charBoxSize + gap) - 5,
                        top: -5,
                        width: (step.windowEnd - step.windowStart) * (charBoxSize + gap) - gap + 10,
                        height: charBoxSize + 10,
                        border: `3px solid ${step.isMatch ? '#4caf50' : '#2196f3'}`,
                        borderRadius: 10,
                        transition: 'all 0.3s ease-in-out',
                        boxShadow: step.isMatch ? '0 0 15px rgba(76, 175, 80, 0.5)' : 'none',
                        zIndex: 10
                    }}>
                        <div style={{
                            position: 'absolute', top: -30, left: 0, width: '100%', 
                            textAlign: 'center', color: step.isMatch ? '#4caf50' : '#2196f3', fontWeight: 'bold'
                        }}>
                            {step.isMatch ? 'ANAGRAM FOUND!' : 'Scanning...'}
                        </div>
                    </div>

                    {step.s.split('').map((char, idx) => {
                        const isInWindow = idx >= step.windowStart && idx < step.windowEnd;
                        const isResult = step.resultIndices.includes(idx - step.p.length + 1) && idx < step.windowEnd; // Heuristic to highlight start

                        // Highlight indices that are start of anagrams found so far
                        const isStartOfAnagram = step.resultIndices.includes(idx);

                        return (
                            <div key={idx} style={{
                                width: charBoxSize, height: charBoxSize,
                                display: 'flex', flexDirection: 'column', alignItems: 'center',
                                position: 'relative'
                            }}>
                                <div style={{
                                    width: '100%', height: '100%',
                                    backgroundColor: isStartOfAnagram ? 'rgba(76, 175, 80, 0.2)' : '#333',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    borderRadius: 8,
                                    border: isStartOfAnagram ? '1px solid #4caf50' : '1px solid #444',
                                    fontSize: 24, fontWeight: 'bold',
                                    color: isInWindow ? '#fff' : '#777',
                                    transition: 'background-color 0.3s'
                                }}>
                                    {char}
                                </div>
                                <div style={{marginTop: 5, fontSize: 12, color: '#666'}}>{idx}</div>
                            </div>
                        );
                    })}
                </div>

                {/* Counts Comparison */}
                <div style={{display: 'flex', gap: 100}}>
                    {/* P Counts */}
                    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10}}>
                        <div style={{fontWeight: 'bold', color: '#aaa'}}>Target Counts</div>
                        <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10}}>
                            {Object.entries(step.pCounts).sort().map(([char, count]) => (
                                <div key={char} style={{
                                    padding: '5px 10px', backgroundColor: '#333', borderRadius: 5,
                                    border: '1px solid #555', minWidth: 60, textAlign: 'center'
                                }}>
                                    {char}: {count}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Window Counts */}
                    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10}}>
                        <div style={{fontWeight: 'bold', color: '#2196f3'}}>Window Counts</div>
                        <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10}}>
                            {Object.keys(step.pCounts).sort().map((char) => {
                                const count = step.sCounts[char] || 0;
                                const target = step.pCounts[char] || 0;
                                const isOk = count === target;
                                return (
                                    <div key={char} style={{
                                        padding: '5px 10px', 
                                        backgroundColor: isOk ? 'rgba(76, 175, 80, 0.2)' : '#333', 
                                        borderRadius: 5,
                                        border: `1px solid ${isOk ? '#4caf50' : '#555'}`, 
                                        minWidth: 60, textAlign: 'center',
                                        color: isOk ? '#4caf50' : '#fff'
                                    }}>
                                        {char}: {count}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Results Log */}
                 <div style={{
                     marginTop: 20, 
                     display: 'flex', gap: 10, alignItems: 'center',
                     backgroundColor: '#222', padding: '10px 20px', borderRadius: 10
                 }}>
                     <div>Found Indices: </div>
                     <div style={{color: '#4caf50', fontWeight: 'bold', fontSize: 20}}>
                         [{step.resultIndices.join(', ')}]
                     </div>
                 </div>

             </div>

             <div style={{
                marginTop: 30,
                backgroundColor: '#333', 
                padding: 20, 
                borderRadius: 10, 
                width: '80%', 
                textAlign: 'center',
                fontSize: 24,
                color: '#fff',
                border: '1px solid #555'
            }}>
                {step.description}
            </div>
        </AbsoluteFill>
    );
};
