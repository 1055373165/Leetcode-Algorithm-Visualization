import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import React from 'react';

export type TrieNodeSnapshot = {
    char: string;
    isEnd: boolean;
    children: TrieNodeSnapshot[];
    depth: number;
    highlighted: boolean; // currently traversing this node
};

export type ImplementTrieStep = {
    operation: 'insert' | 'search' | 'startsWith';
    word: string;
    currentCharIndex: number; // -1 means done
    trieSnapshot: TrieNodeSnapshot;
    result: boolean | null; // null = in progress
    reason: string;
    phase: 'traverse' | 'create' | 'check' | 'done';
};

interface ImplementTrieVisualizerProps {
    steps: ImplementTrieStep[];
    title: string;
}

const NODE_COLORS = {
    default: '#2a2a4a',
    highlighted: '#ff9800',
    endNode: '#4caf50',
    endHighlighted: '#ffeb3b',
    notFound: '#ef5350',
};

const TrieNodeView: React.FC<{node: TrieNodeSnapshot; x: number; y: number; parentX?: number; parentY?: number; totalWidth: number}> = ({
    node, x, y, parentX, parentY, totalWidth
}) => {
    const isRoot = node.char === 'root';
    const nodeRadius = 22;
    const levelHeight = 80;

    let bgColor = NODE_COLORS.default;
    if (node.highlighted && node.isEnd) bgColor = NODE_COLORS.endHighlighted;
    else if (node.highlighted) bgColor = NODE_COLORS.highlighted;
    else if (node.isEnd) bgColor = NODE_COLORS.endNode;

    const childCount = node.children.length;
    const childSpacing = Math.min(totalWidth / Math.max(childCount, 1), 120);
    const childrenTotalWidth = childSpacing * childCount;
    const startX = x - childrenTotalWidth / 2 + childSpacing / 2;

    return (
        <>
            {/* Edge from parent */}
            {parentX !== undefined && parentY !== undefined && (
                <line
                    x1={parentX}
                    y1={parentY + nodeRadius}
                    x2={x}
                    y2={y - nodeRadius}
                    stroke={node.highlighted ? '#ff9800' : '#555'}
                    strokeWidth={node.highlighted ? 3 : 1.5}
                />
            )}

            {/* Node circle */}
            <circle
                cx={x}
                cy={y}
                r={nodeRadius}
                fill={bgColor}
                stroke={node.highlighted ? '#fff' : (node.isEnd ? '#4caf50' : '#666')}
                strokeWidth={node.highlighted ? 3 : 1.5}
            />

            {/* Node label */}
            <text
                x={x}
                y={y + 6}
                textAnchor="middle"
                fill="white"
                fontSize={isRoot ? 12 : 18}
                fontFamily="'Fira Code', monospace"
                fontWeight="bold"
            >
                {isRoot ? 'root' : node.char}
            </text>

            {/* isEnd marker */}
            {node.isEnd && (
                <text
                    x={x + nodeRadius + 4}
                    y={y + 5}
                    fill="#4caf50"
                    fontSize={12}
                    fontFamily="'Fira Code', monospace"
                    fontWeight="bold"
                >
                    ★
                </text>
            )}

            {/* Children */}
            {node.children.map((child, idx) => (
                <TrieNodeView
                    key={child.char + idx}
                    node={child}
                    x={startX + idx * childSpacing}
                    y={y + levelHeight}
                    parentX={x}
                    parentY={y}
                    totalWidth={childSpacing}
                />
            ))}
        </>
    );
};

export const ImplementTrieVisualizer: React.FC<ImplementTrieVisualizerProps> = ({
    steps,
    title,
}) => {
    const frame = useCurrentFrame();
    const {fps} = useVideoConfig();

    if (!steps || steps.length === 0) return null;

    const durationPerStep = 2 * fps; // 2 seconds per step
    const currentStepIndex = Math.min(
        Math.floor(frame / durationPerStep),
        steps.length - 1
    );
    const step = steps[currentStepIndex];
    if (!step) return null;

    const phaseColor: Record<string, string> = {
        traverse: '#ff9800',
        create: '#2196f3',
        check: '#9c27b0',
        done: step.result === true ? '#4caf50' : (step.result === false ? '#ef5350' : '#9e9e9e'),
    };

    const opLabel: Record<string, string> = {
        insert: 'INSERT',
        search: 'SEARCH',
        startsWith: 'STARTS WITH',
    };

    return (
        <AbsoluteFill style={{
            backgroundColor: '#1a1a2e',
            color: 'white',
            fontFamily: "'Fira Code', monospace",
            padding: 40,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
        }}>
            {/* Title */}
            <h1 style={{fontSize: 32, marginBottom: 16, color: '#e0e0e0', margin: 0}}>{title}</h1>

            {/* Operation + Word */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                marginTop: 12,
                marginBottom: 16,
            }}>
                <div style={{
                    padding: '6px 16px',
                    backgroundColor: phaseColor[step.phase] || '#555',
                    borderRadius: 6,
                    fontSize: 20,
                    fontWeight: 'bold',
                }}>
                    {opLabel[step.operation]}
                </div>

                {/* Word with highlighted current char */}
                <div style={{display: 'flex', gap: 3}}>
                    {step.word.split('').map((ch, idx) => (
                        <div key={idx} style={{
                            width: 36,
                            height: 42,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: idx === step.currentCharIndex ? '#ff9800' :
                                (idx < step.currentCharIndex ? '#4caf5088' : '#2a2a4a'),
                            borderRadius: 4,
                            fontSize: 22,
                            border: idx === step.currentCharIndex ? '2px solid #fff' : '1px solid #444',
                            fontWeight: idx === step.currentCharIndex ? 'bold' : 'normal',
                        }}>
                            {ch}
                        </div>
                    ))}
                </div>

                {/* Result badge */}
                {step.result !== null && (
                    <div style={{
                        padding: '6px 14px',
                        backgroundColor: step.result ? '#4caf50' : '#ef5350',
                        borderRadius: 6,
                        fontSize: 20,
                        fontWeight: 'bold',
                    }}>
                        {step.result ? 'TRUE' : 'FALSE'}
                    </div>
                )}
            </div>

            {/* Trie visualization */}
            <div style={{
                flex: 1,
                width: '100%',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'center',
                paddingTop: 10,
            }}>
                <svg width={900} height={380} viewBox="0 0 900 380">
                    <TrieNodeView
                        node={step.trieSnapshot}
                        x={450}
                        y={30}
                        totalWidth={800}
                    />
                </svg>
            </div>

            {/* Legend */}
            <div style={{
                display: 'flex',
                gap: 24,
                marginBottom: 10,
                fontSize: 14,
                color: '#aaa',
            }}>
                <span>● <span style={{color: '#ff9800'}}>Current</span></span>
                <span>● <span style={{color: '#4caf50'}}>End of Word ★</span></span>
                <span>● <span style={{color: '#ffeb3b'}}>End + Current</span></span>
            </div>

            {/* Description */}
            <div style={{
                backgroundColor: '#2a2a4a',
                padding: '14px 24px',
                borderRadius: 10,
                width: '85%',
                textAlign: 'center',
                fontSize: 22,
                color: '#e0e0e0',
                border: `2px solid ${phaseColor[step.phase] || '#555'}`,
                marginBottom: 10,
            }}>
                {step.reason}
            </div>
        </AbsoluteFill>
    );
};
