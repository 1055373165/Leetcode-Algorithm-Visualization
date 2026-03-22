import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import React from 'react';

export type RightSideViewStep = {
    action: 'init' | 'dequeue' | 'last_node' | 'layer_done' | 'done';
    layer: number;
    queue: number[];            // current queue values
    processing: number | null;  // node being dequeued
    isLast: boolean;            // is this the last node in the layer
    layerSize: number;          // total nodes in current layer
    layerIndex: number;         // i-th node in current layer (0-based)
    result: number[];           // collected right-side view
    reason: string;
    treeNodes: RSVTreeNode[];
    highlightNode: number | null;
};

export type RSVTreeNode = {
    val: number;
    x: number;
    y: number;
    parentX?: number;
    parentY?: number;
    visited: boolean;
    currentLayer: boolean;
    isRightmost: boolean;       // is the rightmost in its layer
};

interface Props {
    steps: RightSideViewStep[];
    title: string;
}

export const RightSideViewVisualizer: React.FC<Props> = ({steps, title}) => {
    const frame = useCurrentFrame();
    const {fps} = useVideoConfig();

    if (!steps || steps.length === 0) return null;

    const durationPerStep = 2 * fps;
    const idx = Math.min(Math.floor(frame / durationPerStep), steps.length - 1);
    const step = steps[idx];
    if (!step) return null;

    const actionColor: Record<string, string> = {
        init: '#9e9e9e',
        dequeue: '#ff9800',
        last_node: '#4caf50',
        layer_done: '#2196f3',
        done: '#4caf50',
    };

    return (
        <AbsoluteFill style={{
            backgroundColor: '#1a1a2e',
            color: 'white',
            fontFamily: "'Fira Code', monospace",
            padding: 32,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
        }}>
            {/* Title */}
            <h1 style={{fontSize: 28, margin: 0, color: '#e0e0e0'}}>{title}</h1>

            {/* Layer info */}
            <div style={{display: 'flex', gap: 16, alignItems: 'center', marginTop: 10}}>
                <div style={{padding: '4px 14px', backgroundColor: '#333', borderRadius: 6, fontSize: 17}}>
                    Layer {step.layer}
                </div>
                <div style={{padding: '4px 14px', backgroundColor: '#333', borderRadius: 6, fontSize: 17}}>
                    Node {step.layerIndex + 1} / {step.layerSize}
                </div>
                {step.isLast && step.action === 'last_node' && (
                    <div style={{
                        padding: '4px 14px',
                        backgroundColor: '#4caf5033',
                        border: '2px solid #4caf50',
                        borderRadius: 6, fontSize: 17, fontWeight: 'bold', color: '#4caf50',
                    }}>
                        ★ RIGHTMOST → collect!
                    </div>
                )}
            </div>

            {/* Tree + Right side view */}
            <div style={{
                flex: 1, width: '100%',
                display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
                gap: 40, paddingTop: 10,
            }}>
                {/* Tree */}
                <svg width={500} height={260} viewBox="0 0 500 260">
                    {step.treeNodes.map((node, i) => (
                        <React.Fragment key={i}>
                            {node.parentX !== undefined && node.parentY !== undefined && (
                                <line
                                    x1={node.parentX} y1={node.parentY + 20}
                                    x2={node.x} y2={node.y - 20}
                                    stroke={node.currentLayer ? '#ff980088' : '#444'}
                                    strokeWidth={1.5}
                                />
                            )}
                            <circle
                                cx={node.x} cy={node.y} r={22}
                                fill={
                                    step.highlightNode === node.val ? '#ff9800' :
                                    node.isRightmost ? '#2a5a3a' :
                                    node.currentLayer ? '#3a3a5a' :
                                    node.visited ? '#2a4a3a' : '#2a2a4a'
                                }
                                stroke={
                                    step.highlightNode === node.val ? '#fff' :
                                    node.isRightmost ? '#4caf50' :
                                    node.currentLayer ? '#ff9800' :
                                    node.visited ? '#4caf5066' : '#444'
                                }
                                strokeWidth={step.highlightNode === node.val || node.isRightmost ? 3 : 1.5}
                            />
                            <text x={node.x} y={node.y + 6} textAnchor="middle" fill="white" fontSize={18} fontWeight="bold">
                                {node.val}
                            </text>
                            {node.isRightmost && (
                                <text x={node.x + 28} y={node.y + 5} fill="#4caf50" fontSize={14} fontWeight="bold">
                                    ←👁
                                </text>
                            )}
                        </React.Fragment>
                    ))}

                    {/* Right-side "eye" line */}
                    <line x1={470} y1={10} x2={470} y2={250} stroke="#4caf5044" strokeWidth={2} strokeDasharray="6,4" />
                    <text x={475} y={130} fill="#4caf50" fontSize={12} writingMode="vertical-rl">
                        right view
                    </text>
                </svg>

                {/* Right side view result */}
                <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8}}>
                    <span style={{fontSize: 16, color: '#aaa'}}>Right Side View</span>
                    {step.result.map((val, i) => (
                        <div key={i} style={{
                            width: 56, height: 48,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            backgroundColor: '#1b3a4b',
                            borderRadius: 8,
                            fontSize: 22, fontWeight: 'bold',
                            color: '#4fc3f7',
                            border: '2px solid #2196f3',
                        }}>
                            {val}
                        </div>
                    ))}
                    {step.result.length === 0 && (
                        <span style={{color: '#555', fontSize: 14}}>(empty)</span>
                    )}
                </div>
            </div>

            {/* Queue */}
            <div style={{display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8}}>
                <span style={{fontSize: 16, color: '#aaa', marginRight: 8}}>Queue:</span>
                {step.queue.map((val, i) => (
                    <div key={i} style={{
                        width: 44, height: 44,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        backgroundColor: i === 0 ? '#4a3a2a' : '#1b3a4b',
                        borderRadius: 6, fontSize: 20,
                        border: i === 0 ? '2px solid #ff9800' : '1px solid #2196f3',
                    }}>
                        {val}
                    </div>
                ))}
                {step.queue.length === 0 && (
                    <span style={{color: '#555', fontSize: 16}}>(empty)</span>
                )}
            </div>

            {/* Description */}
            <div style={{
                backgroundColor: '#2a2a4a',
                padding: '12px 24px',
                borderRadius: 10,
                width: '90%',
                textAlign: 'center',
                fontSize: 20,
                color: '#e0e0e0',
                border: `2px solid ${actionColor[step.action] || '#555'}`,
                marginBottom: 10,
            }}>
                {step.reason}
            </div>
        </AbsoluteFill>
    );
};
