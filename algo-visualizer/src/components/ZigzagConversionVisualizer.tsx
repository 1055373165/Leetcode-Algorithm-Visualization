import {AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate} from 'remotion';
import React from 'react';

export type ZigzagConversionStep = {
    phase: 'place' | 'read' | 'done';
    charIndex: number;        // index in original string being placed/read
    row: number;              // Z-shape row
    col: number;              // Z-shape col
    currentRow: number;       // which row is being read (read phase)
    grid: (string | null)[][]; // current zigzag grid state
    result: string;           // collected result so far
    highlighted: number[];    // indices in grid currently highlighted
    reason: string;
};

interface ZigzagConversionVisualizerProps {
    steps: ZigzagConversionStep[];
    title: string;
    input: string;
    numRows: number;
}

export const ZigzagConversionVisualizer: React.FC<ZigzagConversionVisualizerProps> = ({
    steps, title, input, numRows,
}) => {
    const frame = useCurrentFrame();
    const {fps} = useVideoConfig();

    if (!steps || steps.length === 0) return null;

    const durationPerStep = Math.round(1.5 * fps);
    const currentStepIndex = Math.min(
        Math.floor(frame / durationPerStep),
        steps.length - 1
    );
    const step = steps[currentStepIndex];
    if (!step) return null;

    const progress = interpolate(
        frame % durationPerStep,
        [0, durationPerStep],
        [0, 1],
        {extrapolateRight: 'clamp'}
    );

    const phaseColor: Record<string, string> = {
        place: '#ff9800',
        read: '#4caf50',
        done: '#2196f3',
    };

    const numCols = step.grid[0]?.length || 0;
    const cellSize = Math.min(44, Math.floor(1100 / Math.max(numCols, 1)));
    const fontSize = Math.min(20, cellSize - 8);

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
            <h1 style={{fontSize: 32, marginBottom: 16, color: '#e0e0e0'}}>{title}</h1>

            {/* Input string */}
            <div style={{display: 'flex', gap: 3, alignItems: 'center', marginBottom: 20}}>
                <span style={{color: '#aaa', fontSize: 16, marginRight: 10}}>Input:</span>
                {input.split('').map((ch, idx) => (
                    <div key={idx} style={{
                        width: 28,
                        height: 32,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: step.phase === 'place' && idx === step.charIndex
                            ? '#ff9800'
                            : idx <= (step.phase === 'place' ? step.charIndex : input.length)
                                ? '#2a2a4a'
                                : '#1e1e3a',
                        borderRadius: 3,
                        fontSize: 15,
                        border: step.phase === 'place' && idx === step.charIndex
                            ? '2px solid #fff'
                            : '1px solid #333',
                        color: step.phase === 'place' && idx === step.charIndex ? '#000' : '#ccc',
                        fontWeight: step.phase === 'place' && idx === step.charIndex ? 'bold' : 'normal',
                    }}>
                        {ch}
                    </div>
                ))}
            </div>

            {/* Z-shape grid */}
            <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 3,
            }}>
                <span style={{color: '#888', fontSize: 14, marginBottom: 8}}>
                    Z-shape Grid (numRows={numRows})
                </span>
                {step.grid.map((row, r) => (
                    <div key={r} style={{
                        display: 'flex',
                        gap: 3,
                        alignItems: 'center',
                        backgroundColor: step.phase === 'read' && r === step.currentRow
                            ? 'rgba(76, 175, 80, 0.1)'
                            : 'transparent',
                        borderRadius: 4,
                        padding: '2px 4px',
                        border: step.phase === 'read' && r === step.currentRow
                            ? '1px solid rgba(76, 175, 80, 0.4)'
                            : '1px solid transparent',
                    }}>
                        <span style={{
                            color: step.phase === 'read' && r === step.currentRow ? '#4caf50' : '#555',
                            fontSize: 12,
                            width: 20,
                            textAlign: 'right',
                            marginRight: 4,
                        }}>
                            {r}
                        </span>
                        {row.map((cell, c) => {
                            const isHighlighted = step.highlighted.some(
                                h => h === r * numCols + c
                            );
                            const isCurrent = step.phase === 'place'
                                && r === step.row && c === step.col;

                            return (
                                <div key={c} style={{
                                    width: cellSize,
                                    height: cellSize,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: isCurrent
                                        ? '#ff9800'
                                        : isHighlighted
                                            ? '#4caf50'
                                            : cell !== null
                                                ? '#2a2a4a'
                                                : '#1a1a2e',
                                    borderRadius: 3,
                                    fontSize,
                                    border: isCurrent
                                        ? '2px solid #fff'
                                        : cell !== null
                                            ? '1px solid #444'
                                            : '1px solid #222',
                                    color: isCurrent ? '#000' : isHighlighted ? '#fff' : '#ccc',
                                    fontWeight: isCurrent || isHighlighted ? 'bold' : 'normal',
                                    opacity: cell !== null ? 1 : 0.3,
                                    transform: isCurrent
                                        ? `scale(${interpolate(progress, [0, 0.3], [0.8, 1], {extrapolateRight: 'clamp'})})`
                                        : undefined,
                                }}>
                                    {cell || ''}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>

            {/* Result */}
            <div style={{
                marginTop: 16,
                marginBottom: 8,
                display: 'flex',
                gap: 3,
                alignItems: 'center',
                minHeight: 42,
            }}>
                <span style={{color: '#aaa', fontSize: 16, marginRight: 10}}>Result:</span>
                {step.result.split('').map((ch, idx) => (
                    <div key={idx} style={{
                        width: 28,
                        height: 32,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: idx === step.result.length - 1 && step.phase === 'read'
                            ? '#4caf50'
                            : '#1b3a4b',
                        borderRadius: 3,
                        fontSize: 15,
                        color: '#4fc3f7',
                        border: '1px solid #2196f3',
                    }}>
                        {ch}
                    </div>
                ))}
                {step.result.length === 0 && (
                    <span style={{color: '#555', fontSize: 14}}>Empty</span>
                )}
            </div>

            {/* Description */}
            <div style={{
                marginBottom: 20,
                backgroundColor: '#2a2a4a',
                padding: '12px 20px',
                borderRadius: 8,
                width: '90%',
                textAlign: 'center',
                fontSize: 20,
                color: '#e0e0e0',
                border: `2px solid ${phaseColor[step.phase] || '#555'}`,
            }}>
                {step.reason}
            </div>
        </AbsoluteFill>
    );
};
