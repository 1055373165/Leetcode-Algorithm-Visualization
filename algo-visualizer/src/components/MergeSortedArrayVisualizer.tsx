import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import React from 'react';

export type MergeStep = {
    nums1: number[]; // Current state of nums1 (including 0s)
    nums2: number[]; // Constant state of nums2
    p1: number; // Pointer for nums1 valid end
    p2: number; // Pointer for nums2 end
    p: number; // Pointer for merge position
    description: string;
    highlightP1?: boolean; // Highlight element at p1
    highlightP2?: boolean; // Highlight element at p2
    highlightP?: boolean; // Highlight element at p (just placed)
};

interface MergeSortedArrayVisualizerProps {
    steps: MergeStep[];
    title: string;
}

export const MergeSortedArrayVisualizer: React.FC<MergeSortedArrayVisualizerProps> = ({
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

    const renderArrayBlock = (
        arr: number[], 
        label: string, 
        pointers: {index: number, name: string, color: string, position: 'top' | 'bottom'}[],
        highlightCurrent: (idx: number) => boolean
    ) => (
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10}}>
            <div style={{fontSize: 24, color: '#aaa'}}>{label}</div>
            <div style={{display: 'flex', gap: 15, padding: '20px 0'}}> {/* Padding for pointers */}
                {arr.map((val, i) => {
                    // Check if this index should be highlighted
                    // We can check if any pointer is here AND if that pointer is supposed to be highlighted in this step?
                    // actually the prop passed is `highlightCurrent` which checks index
                    const isHi = highlightCurrent(i);

                    // Check which pointers are on this index
                    const activePointers = pointers.filter(p => p.index === i);
                    
                    const borderColor = activePointers.length > 0 ? activePointers[0].color : '#555';
                    const bgColor = isHi ? `${borderColor}44` : '#333'; // transparent version of border or dark
                    
                    return (
                        <div key={i} style={{
                            width: 80,
                            height: 80,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: `3px solid ${borderColor}`,
                            backgroundColor: bgColor,
                            color: '#fff',
                            fontSize: 32,
                            borderRadius: 12,
                            position: 'relative'
                        }}>
                            {val}
                            {activePointers.map((p, pIdx) => (
                                <div key={p.name} style={{
                                    position: 'absolute',
                                    [p.position === 'top' ? 'top' : 'bottom']: -35 - (pIdx * 20), // Stagger if multiple on same side? (Unlikely here)
                                    color: p.color,
                                    fontWeight: 'bold',
                                    fontSize: 20
                                }}>
                                    {p.name}
                                </div>
                            ))}
                        </div>
                    );
                })}
            </div>
        </div>
    );

    return (
        <AbsoluteFill className="bg-gray-900 text-white p-10 flex flex-col items-center" style={{backgroundColor: '#1e1e1e', color: 'white', fontFamily: 'sans-serif'}}>
            {/* Header */}
            <h1 style={{fontSize: 40, marginBottom: 20, textAlign: 'center'}}>{title}</h1>
            
            {/* Main Content Area - Flex Column */}
            <div style={{
                display: 'flex', 
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                flex: 1, // Take up remaining space
                width: '100%',
                gap: 60 // Space between nums1 and nums2 blocks
            }}>
                {/* nums1 Block */}
                {renderArrayBlock(
                    step.nums1, 
                    'nums1 (Size: m+n)', 
                    [
                        {index: step.p1, name: 'p1', color: '#4caf50', position: 'top'},
                        {index: step.p, name: 'p', color: '#f44336', position: 'bottom'}
                    ],
                    (i) => (!!step.highlightP1 && i === step.p1) || (!!step.highlightP && i === step.p)
                )}

                {/* nums2 Block */}
                {renderArrayBlock(
                    step.nums2, 
                    'nums2 (Size: n)', 
                    [
                        {index: step.p2, name: 'p2', color: '#ff9800', position: 'top'}
                    ],
                    (i) => (!!step.highlightP2 && i === step.p2)
                )}
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
                border: '1px solid #555'
            }}>
                <div style={{fontSize: 28, color: '#fff'}}>
                    {step.description}
                </div>
            </div>

        </AbsoluteFill>
    );
};
