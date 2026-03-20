import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import React from 'react';

export type ZigzagDualStackStep = {
    layer: number;
    leftToRight: boolean;
    action: 'init' | 'pop' | 'push_child' | 'layer_done' | 'swap' | 'done';
    nodeVal: number | null;
    curr: number[];         // curr stack (values, bottom→top)
    next: number[];         // next stack (values, bottom→top)
    level: number[];        // collected values for current layer
    ans: number[][];
    pushOrder: string;      // e.g. "left then right" or "right then left"
    reason: string;
    // Tree info
    treeNodes: DualStackTreeNode[];
    highlightNode: number | null;
};

export type DualStackTreeNode = {
    val: number;
    x: number;
    y: number;
    parentX?: number;
    parentY?: number;
    visited: boolean;
    inCurr: boolean;
    inNext: boolean;
};

interface Props {
    steps: ZigzagDualStackStep[];
    title: string;
}

const StackView: React.FC<{
    label: string;
    items: number[];
    color: string;
    borderColor: string;
    popHighlight?: boolean;
}> = ({label, items, color, borderColor, popHighlight}) => (
    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4}}>
        <span style={{fontSize: 15, color: '#aaa', marginBottom: 2}}>{label}</span>
        <div style={{
            minWidth: 80,
            minHeight: 160,
            border: `3px solid ${borderColor}`,
            borderTop: 'none',
            borderRadius: '0 0 8px 8px',
            display: 'flex',
            flexDirection: 'column-reverse',
            alignItems: 'center',
            padding: 6,
            gap: 4,
            backgroundColor: '#1a1a2e',
        }}>
            {items.map((val, i) => {
                const isTop = i === items.length - 1;
                return (
                    <div key={i} style={{
                        width: 60,
                        height: 36,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: isTop && popHighlight ? '#ff9800' : color,
                        borderRadius: 5,
                        fontSize: 20,
                        fontWeight: isTop ? 'bold' : 'normal',
                        border: isTop ? '2px solid #fff' : '1px solid #555',
                    }}>
                        {val}
                    </div>
                );
            })}
            {items.length === 0 && (
                <span style={{color: '#444', fontSize: 13}}>(empty)</span>
            )}
        </div>
        <span style={{fontSize: 12, color: '#666'}}>↑ top</span>
    </div>
);

export const ZigzagDualStackVisualizer: React.FC<Props> = ({steps, title}) => {
    const frame = useCurrentFrame();
    const {fps} = useVideoConfig();

    if (!steps || steps.length === 0) return null;

    const durationPerStep = 2 * fps;
    const idx = Math.min(Math.floor(frame / durationPerStep), steps.length - 1);
    const step = steps[idx];
    if (!step) return null;

    const dirColor = step.leftToRight ? '#4caf50' : '#ef5350';
    const dirLabel = step.leftToRight ? '→ L-to-R (pop order)' : '← R-to-L (pop order)';

    const actionBorder: Record<string, string> = {
        pop: '#ff9800',
        push_child: '#9c27b0',
        layer_done: '#2196f3',
        swap: '#ffeb3b',
        done: '#4caf50',
        init: '#9e9e9e',
    };

    return (
        <AbsoluteFill style={{
            backgroundColor: '#1a1a2e',
            color: 'white',
            fontFamily: "'Fira Code', monospace",
            padding: 28,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
        }}>
            <h1 style={{fontSize: 26, margin: 0, color: '#e0e0e0'}}>{title}</h1>

            {/* Layer + Direction */}
            <div style={{display: 'flex', gap: 16, alignItems: 'center', marginTop: 8}}>
                <div style={{padding: '3px 12px', backgroundColor: '#333', borderRadius: 6, fontSize: 16}}>
                    Layer {step.layer}
                </div>
                <div style={{
                    padding: '3px 12px',
                    backgroundColor: dirColor + '22',
                    border: `2px solid ${dirColor}`,
                    borderRadius: 6, fontSize: 16, fontWeight: 'bold', color: dirColor,
                }}>
                    {dirLabel}
                </div>
                {step.pushOrder && (
                    <div style={{padding: '3px 12px', backgroundColor: '#9c27b022', border: '1px solid #9c27b0', borderRadius: 6, fontSize: 14, color: '#ce93d8'}}>
                        Push: {step.pushOrder}
                    </div>
                )}
            </div>

            {/* Tree + Stacks side by side */}
            <div style={{
                flex: 1, width: '100%',
                display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
                gap: 30, paddingTop: 10,
            }}>
                {/* Tree */}
                <svg width={420} height={200} viewBox="0 0 420 200">
                    {step.treeNodes.map((node, i) => (
                        <React.Fragment key={i}>
                            {node.parentX !== undefined && node.parentY !== undefined && (
                                <line
                                    x1={node.parentX} y1={node.parentY + 18}
                                    x2={node.x} y2={node.y - 18}
                                    stroke={node.inCurr ? '#ff9800' : node.inNext ? '#9c27b0' : '#444'}
                                    strokeWidth={1.5}
                                />
                            )}
                            <circle
                                cx={node.x} cy={node.y} r={20}
                                fill={
                                    step.highlightNode === node.val ? '#ff9800' :
                                    node.inCurr ? '#3a3a5a' :
                                    node.inNext ? '#3a2a4a' :
                                    node.visited ? '#2a4a3a' : '#2a2a4a'
                                }
                                stroke={
                                    step.highlightNode === node.val ? '#fff' :
                                    node.inCurr ? '#ff9800' :
                                    node.inNext ? '#9c27b0' :
                                    node.visited ? '#4caf50' : '#444'
                                }
                                strokeWidth={step.highlightNode === node.val ? 3 : 1.5}
                            />
                            <text x={node.x} y={node.y + 6} textAnchor="middle" fill="white" fontSize={17} fontWeight="bold">
                                {node.val}
                            </text>
                        </React.Fragment>
                    ))}
                </svg>

                {/* Two stacks */}
                <div style={{display: 'flex', gap: 24, alignItems: 'flex-start'}}>
                    <StackView
                        label="curr (processing)"
                        items={step.curr}
                        color="#3a3a5a"
                        borderColor="#ff9800"
                        popHighlight={step.action === 'pop'}
                    />
                    <div style={{
                        display: 'flex', alignItems: 'center',
                        paddingTop: 80, fontSize: 24, color: '#ffeb3b',
                    }}>
                        ⇄
                    </div>
                    <StackView
                        label="next (collecting)"
                        items={step.next}
                        color="#3a2a4a"
                        borderColor="#9c27b0"
                    />
                </div>
            </div>

            {/* Level + Ans */}
            <div style={{display: 'flex', gap: 30, alignItems: 'center', marginBottom: 6}}>
                <div style={{display: 'flex', alignItems: 'center', gap: 6}}>
                    <span style={{fontSize: 15, color: '#aaa'}}>level:</span>
                    <span style={{fontSize: 18, color: '#fff'}}>
                        [{step.level.join(', ')}]
                    </span>
                </div>
                <div style={{display: 'flex', alignItems: 'center', gap: 6}}>
                    <span style={{fontSize: 15, color: '#aaa'}}>ans:</span>
                    <span style={{fontSize: 18, color: '#4fc3f7'}}>
                        [{step.ans.map(a => `[${a.join(',')}]`).join(', ')}]
                    </span>
                </div>
            </div>

            {/* Description */}
            <div style={{
                backgroundColor: '#2a2a4a',
                padding: '10px 22px',
                borderRadius: 10,
                width: '92%',
                textAlign: 'center',
                fontSize: 19,
                color: '#e0e0e0',
                border: `2px solid ${actionBorder[step.action] || '#555'}`,
                marginBottom: 8,
            }}>
                {step.reason}
            </div>
        </AbsoluteFill>
    );
};
