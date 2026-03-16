import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import React from 'react';

export type ListNode = {
    id: string;
    val: number;
    nextId: string | null;
};

// A "ListSegment" represents a portion of the list at a specific recursion depth
export type ListSegment = {
    nodes: ListNode[];
    depth: number;
    offsetX: number; // Horizontal position for visualization
    label: string; // "Left", "Right", "Merged"
};

export type SortListStep = {
    segments: ListSegment[];
    activeSegmentId: string | null; // ID of segment being processed
    action: 'split' | 'base_case' | 'merge_start' | 'merge_process' | 'finish';
    description: string;
};

interface SortListVisualizerProps {
    steps: SortListStep[];
    title: string;
}

export const SortListVisualizer: React.FC<SortListVisualizerProps> = ({
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
                position: 'relative',
                marginTop: 20
            }}>
                {step.segments.map((seg, idx) => {
                    // Calculate position based on depth and offset
                    const top = 100 + (seg.depth * 120);
                    const left = 640 + seg.offsetX; // 640 is center

                    return (
                        <div key={idx} style={{
                            position: 'absolute',
                            top,
                            left,
                            transform: 'translateX(-50%)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            transition: 'all 0.5s'
                        }}>
                            <div style={{fontSize: 14, color: '#aaa', marginBottom: 5}}>{seg.label}</div>
                            <div style={{
                                display: 'flex',
                                padding: 10,
                                backgroundColor: '#333',
                                borderRadius: 10,
                                border: '1px solid #555',
                                gap: 10
                            }}>
                                {seg.nodes.map((node, nIdx) => (
                                    <div key={node.id} style={{
                                        width: 50, height: 50,
                                        borderRadius: '50%',
                                        backgroundColor: '#7b1fa2',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontWeight: 'bold', fontSize: 20
                                    }}>
                                        {node.val}
                                    </div>
                                ))}
                                {seg.nodes.length === 0 && <div style={{color:'#666', fontStyle:'italic'}}>null</div>}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Description Panel */}
            <div style={{
                marginBottom: 40,
                backgroundColor: '#333', 
                padding: 20, 
                borderRadius: 10, 
                width: '80%', 
                textAlign: 'center',
                fontSize: 24,
                color: '#fff',
                border: '1px solid #555',
                zIndex: 100
            }}>
                {step.description}
            </div>
        </AbsoluteFill>
    );
};
