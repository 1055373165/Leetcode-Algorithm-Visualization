import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import React from 'react';

export type ZigzagStep = {
    action: 'init' | 'dequeue' | 'write' | 'enqueue' | 'layer_done' | 'done';
    layer: number;
    leftToRight: boolean;
    nodeVal: number | null;        // current node being processed
    i: number;                     // index within current layer
    writeIndex: number | null;     // where the value is written in level[]
    queue: number[];               // current queue state (values)
    levelArray: (number | null)[]; // current level array
    ans: number[][];               // accumulated answer
    reason: string;
    // Tree highlight: which node values are highlighted
    highlightNode: number | null;
    treeNodes: TreeNodeInfo[];
};

export type TreeNodeInfo = {
    val: number;
    x: number;
    y: number;
    parentX?: number;
    parentY?: number;
    visited: boolean;
    currentLayer: boolean;
};

interface ZigzagVisualizerProps {
    steps: ZigzagStep[];
    title: string;
}

const COLORS = {
    bg: '#1a1a2e',
    nodeBg: '#2a2a4a',
    nodeVisited: '#4caf5066',
    nodeCurrentLayer: '#ff980044',
    nodeHighlight: '#ff9800',
    queueBg: '#1b3a4b',
    writeHighlight: '#ffeb3b',
    dirLeft: '#ef5350',
    dirRight: '#4caf50',
    levelSlot: '#2a2a4a',
    levelFilled: '#3a5a7a',
};

export const ZigzagLevelOrderVisualizer: React.FC<ZigzagVisualizerProps> = ({steps, title}) => {
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

    const dirColor = step.leftToRight ? COLORS.dirRight : COLORS.dirLeft;
    const dirLabel = step.leftToRight ? '→ Left to Right' : '← Right to Left';

    return (
        <AbsoluteFill style={{
            backgroundColor: COLORS.bg,
            color: 'white',
            fontFamily: "'Fira Code', monospace",
            padding: 32,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
        }}>
            {/* Title */}
            <h1 style={{fontSize: 28, margin: 0, color: '#e0e0e0'}}>{title}</h1>

            {/* Layer + Direction */}
            <div style={{display: 'flex', gap: 20, alignItems: 'center', marginTop: 10}}>
                <div style={{
                    padding: '4px 14px',
                    backgroundColor: '#333',
                    borderRadius: 6,
                    fontSize: 18,
                }}>
                    Layer {step.layer}
                </div>
                <div style={{
                    padding: '4px 14px',
                    backgroundColor: dirColor + '33',
                    border: `2px solid ${dirColor}`,
                    borderRadius: 6,
                    fontSize: 18,
                    fontWeight: 'bold',
                    color: dirColor,
                }}>
                    {dirLabel}
                </div>
            </div>

            {/* Tree visualization */}
            <div style={{flex: 1, width: '100%', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 8}}>
                <svg width={700} height={200} viewBox="0 0 700 200">
                    {step.treeNodes.map((node, idx) => (
                        <React.Fragment key={idx}>
                            {/* Edge to parent */}
                            {node.parentX !== undefined && node.parentY !== undefined && (
                                <line
                                    x1={node.parentX} y1={node.parentY + 20}
                                    x2={node.x} y2={node.y - 20}
                                    stroke={node.currentLayer ? '#ff9800' : '#555'}
                                    strokeWidth={node.currentLayer ? 2 : 1}
                                />
                            )}
                            {/* Node circle */}
                            <circle
                                cx={node.x} cy={node.y} r={22}
                                fill={
                                    step.highlightNode === node.val && step.action !== 'done'
                                        ? COLORS.nodeHighlight
                                        : node.currentLayer
                                            ? '#3a3a5a'
                                            : node.visited
                                                ? '#2a4a3a'
                                                : COLORS.nodeBg
                                }
                                stroke={
                                    step.highlightNode === node.val
                                        ? '#fff'
                                        : node.currentLayer
                                            ? '#ff9800'
                                            : node.visited
                                                ? '#4caf50'
                                                : '#555'
                                }
                                strokeWidth={step.highlightNode === node.val ? 3 : 1.5}
                            />
                            <text
                                x={node.x} y={node.y + 6}
                                textAnchor="middle"
                                fill="white"
                                fontSize={18}
                                fontWeight="bold"
                            >
                                {node.val}
                            </text>
                        </React.Fragment>
                    ))}
                </svg>
            </div>

            {/* Level array with write positions */}
            <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, marginBottom: 8}}>
                <span style={{fontSize: 16, color: '#aaa'}}>level[] — write position matters!</span>
                <div style={{display: 'flex', gap: 4, alignItems: 'center'}}>
                    {step.levelArray.map((val, idx) => (
                        <div key={idx} style={{
                            width: 52,
                            height: 46,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexDirection: 'column',
                            backgroundColor: step.writeIndex === idx
                                ? COLORS.writeHighlight + '44'
                                : val !== null
                                    ? COLORS.levelFilled
                                    : COLORS.levelSlot,
                            borderRadius: 6,
                            fontSize: 22,
                            fontWeight: 'bold',
                            border: step.writeIndex === idx
                                ? `3px solid ${COLORS.writeHighlight}`
                                : '1px solid #444',
                        }}>
                            {val !== null ? val : ''}
                            <span style={{fontSize: 10, color: '#888'}}>[{idx}]</span>
                        </div>
                    ))}
                    {step.levelArray.length === 0 && (
                        <span style={{color: '#555', fontSize: 16}}>(empty)</span>
                    )}
                </div>
            </div>

            {/* Queue */}
            <div style={{display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8}}>
                <span style={{fontSize: 16, color: '#aaa', marginRight: 8}}>Queue:</span>
                {step.queue.map((val, idx) => (
                    <div key={idx} style={{
                        width: 42,
                        height: 42,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: idx === 0 ? '#4a3a2a' : COLORS.queueBg,
                        borderRadius: 6,
                        fontSize: 20,
                        border: idx === 0 ? '2px solid #ff9800' : '1px solid #2196f3',
                    }}>
                        {val}
                    </div>
                ))}
                {step.queue.length === 0 && (
                    <span style={{color: '#555', fontSize: 16}}>(empty)</span>
                )}
            </div>

            {/* Accumulated answer */}
            <div style={{display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8}}>
                <span style={{fontSize: 16, color: '#aaa', marginRight: 8}}>ans:</span>
                <span style={{fontSize: 18, color: '#4fc3f7'}}>
                    [{step.ans.map(a => `[${a.join(',')}]`).join(', ')}]
                </span>
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
                border: `2px solid ${
                    step.action === 'write' ? COLORS.writeHighlight :
                    step.action === 'done' ? '#4caf50' :
                    step.action === 'layer_done' ? '#2196f3' : '#555'
                }`,
                marginBottom: 8,
            }}>
                {step.reason}
            </div>
        </AbsoluteFill>
    );
};
