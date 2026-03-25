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
    const cellSize = Math.min(64, Math.floor(1600 / Math.max(numCols, 1)));
    const fontSize = Math.min(28, cellSize - 10);

    return (
        <AbsoluteFill style={{
            backgroundColor: '#1a1a2e',
            color: 'white',
            fontFamily: "'Fira Code', monospace",
            padding: 60,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
        }}>
            {/* Title */}
            <h1 style={{fontSize: 48, marginBottom: 24, color: '#e0e0e0'}}>{title}</h1>

            {/* Input string */}
            <div style={{display: 'flex', gap: 5, alignItems: 'center', marginBottom: 30}}>
                <span style={{color: '#aaa', fontSize: 24, marginRight: 16}}>Input:</span>
                {input.split('').map((ch, idx) => (
                    <div key={idx} style={{
                        width: 42,
                        height: 48,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: step.phase === 'place' && idx === step.charIndex
                            ? '#ff9800'
                            : idx <= (step.phase === 'place' ? step.charIndex : input.length)
                                ? '#2a2a4a'
                                : '#1e1e3a',
                        borderRadius: 5,
                        fontSize: 22,
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
                gap: 5,
            }}>
                <span style={{color: '#888', fontSize: 20, marginBottom: 12}}>
                    Z-shape Grid (numRows={numRows}, cycle={2 * (numRows - 1)})
                </span>
                {step.grid.map((row, r) => (
                    <div key={r} style={{
                        display: 'flex',
                        gap: 5,
                        alignItems: 'center',
                        backgroundColor: step.phase === 'read' && r === step.currentRow
                            ? 'rgba(76, 175, 80, 0.1)'
                            : 'transparent',
                        borderRadius: 6,
                        padding: '3px 8px',
                        border: step.phase === 'read' && r === step.currentRow
                            ? '2px solid rgba(76, 175, 80, 0.5)'
                            : '2px solid transparent',
                    }}>
                        <span style={{
                            color: step.phase === 'read' && r === step.currentRow ? '#4caf50' : '#555',
                            fontSize: 18,
                            width: 30,
                            textAlign: 'right',
                            marginRight: 8,
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
                                    borderRadius: 5,
                                    fontSize,
                                    border: isCurrent
                                        ? '3px solid #fff'
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
                marginTop: 24,
                marginBottom: 12,
                display: 'flex',
                gap: 5,
                alignItems: 'center',
                minHeight: 56,
            }}>
                <span style={{color: '#aaa', fontSize: 24, marginRight: 16}}>Result:</span>
                {step.result.split('').map((ch, idx) => (
                    <div key={idx} style={{
                        width: 42,
                        height: 48,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: idx === step.result.length - 1 && step.phase === 'read'
                            ? '#4caf50'
                            : '#1b3a4b',
                        borderRadius: 5,
                        fontSize: 22,
                        color: '#4fc3f7',
                        border: '1px solid #2196f3',
                    }}>
                        {ch}
                    </div>
                ))}
                {step.result.length === 0 && (
                    <span style={{color: '#555', fontSize: 20}}>Empty</span>
                )}
            </div>

            {/* Description */}
            <div style={{
                marginBottom: 24,
                backgroundColor: '#2a2a4a',
                padding: '16px 32px',
                borderRadius: 10,
                width: '90%',
                textAlign: 'center',
                fontSize: 28,
                color: '#e0e0e0',
                border: `2px solid ${phaseColor[step.phase] || '#555'}`,
            }}>
                {step.reason}
            </div>
        </AbsoluteFill>
    );
};
