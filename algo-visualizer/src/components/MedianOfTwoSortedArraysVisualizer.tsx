import {AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate} from 'remotion';
import React from 'react';

// null encodes ±∞ sentinel (JSON-safe per project convention).
export type MedianStep = {
    nums1: number[];
    nums2: number[];
    halfLeft: number;
    lo: number;
    hi: number;
    i1: number;      // current cut in nums1 (-1 if not yet picked)
    i2: number;      // current cut in nums2 (-1 if not yet picked)
    l1: number | null;
    r1: number | null;
    l2: number | null;
    r2: number | null;
    // ternary check results: null = not yet evaluated
    l1LeR2: boolean | null;
    l2LeR1: boolean | null;
    status: 'init' | 'pick' | 'check' | 'shrink-left' | 'shrink-right' | 'found';
    median: number | null;
    reason: string;
};

interface Props {
    steps: MedianStep[];
    title: string;
}

const COLORS = {
    bg: '#1a1a2e',
    leftHalf: '#1e3a5f',
    rightHalf: '#5f1e1e',
    cut: {
        pending: '#ffca28',
        valid: '#4caf50',
        invalid: '#ef5350',
    },
    text: '#e0e0e0',
    dim: '#888',
    accent: '#4fc3f7',
    panel: '#2a2a4a',
    border: '#444',
};

const fmt = (v: number | null): string => {
    if (v === null) return '';
    return String(v);
};

const sentinelLabel = (v: number | null, side: 'min' | 'max'): string => {
    if (v !== null) return String(v);
    return side === 'min' ? '−∞' : '+∞';
};

export const MedianOfTwoSortedArraysVisualizer: React.FC<Props> = ({steps, title}) => {
    const frame = useCurrentFrame();
    const {fps} = useVideoConfig();
    if (!steps || steps.length === 0) return null;

    const durationPerStep = Math.round(2.5 * fps);
    const idx = Math.min(Math.floor(frame / durationPerStep), steps.length - 1);
    const step = steps[idx];

    // Smooth cut line position within a step
    const stepFrame = frame - idx * durationPerStep;
    const ease = interpolate(stepFrame, [0, 10], [0, 1], {extrapolateRight: 'clamp'});

    const cutColor =
        step.status === 'found'
            ? COLORS.cut.valid
            : step.status === 'shrink-left' || step.status === 'shrink-right'
                ? COLORS.cut.invalid
                : COLORS.cut.pending;

    const CELL = 64;
    const GAP = 8;

    const renderArray = (
        arr: number[],
        cut: number,
        arrLabel: string,
        cutLabel: string,
        isUpper: boolean,
    ) => {
        return (
            <div style={{position: 'relative', display: 'flex', alignItems: 'center', gap: 16}}>
                <div style={{
                    width: 80,
                    color: COLORS.dim,
                    fontSize: 22,
                    textAlign: 'right',
                    fontFamily: "'Fira Code', monospace",
                }}>
                    {arrLabel}
                </div>
                <div style={{position: 'relative', display: 'flex', gap: GAP, padding: '20px 0'}}>
                    {arr.map((v, i) => {
                        const inLeft = i < cut;
                        return (
                            <div
                                key={i}
                                style={{
                                    width: CELL,
                                    height: CELL,
                                    borderRadius: 8,
                                    backgroundColor: inLeft ? COLORS.leftHalf : COLORS.rightHalf,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: 28,
                                    fontWeight: 'bold',
                                    color: COLORS.text,
                                    fontFamily: "'Fira Code', monospace",
                                    border: `2px solid ${inLeft ? '#3a6ea5' : '#a53a3a'}`,
                                }}
                            >
                                {v}
                            </div>
                        );
                    })}

                    {/* Cut line */}
                    {cut >= 0 && (
                        <div
                            style={{
                                position: 'absolute',
                                left: cut * (CELL + GAP) - GAP / 2,
                                top: 0,
                                bottom: 0,
                                width: 4,
                                backgroundColor: cutColor,
                                boxShadow: `0 0 12px ${cutColor}`,
                                opacity: 0.4 + 0.6 * ease,
                                transition: 'left 0.3s ease',
                            }}
                        />
                    )}
                    {cut >= 0 && (
                        <div
                            style={{
                                position: 'absolute',
                                left: cut * (CELL + GAP) - 16,
                                top: isUpper ? -36 : CELL + 28,
                                color: cutColor,
                                fontSize: 20,
                                fontWeight: 'bold',
                                fontFamily: "'Fira Code', monospace",
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {cutLabel}={cut}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const EdgeBox: React.FC<{label: string; value: number | null; side: 'min' | 'max'; bg: string}> = ({label, value, side, bg}) => (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
            padding: '10px 14px',
            backgroundColor: bg,
            borderRadius: 8,
            minWidth: 70,
        }}>
            <div style={{fontSize: 16, color: COLORS.dim, fontFamily: "'Fira Code', monospace"}}>{label}</div>
            <div style={{fontSize: 26, fontWeight: 'bold', color: value === null ? COLORS.dim : COLORS.text, fontFamily: "'Fira Code', monospace"}}>
                {sentinelLabel(value, side)}
            </div>
        </div>
    );

    const CheckBadge: React.FC<{label: string; pass: boolean | null}> = ({label, pass}) => {
        const color = pass === null ? COLORS.dim : pass ? '#4caf50' : '#ef5350';
        const symbol = pass === null ? '?' : pass ? '✓' : '✗';
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 16px',
                backgroundColor: COLORS.panel,
                borderRadius: 8,
                border: `2px solid ${color}`,
                fontFamily: "'Fira Code', monospace",
            }}>
                <span style={{fontSize: 28, fontWeight: 'bold', color}}>{symbol}</span>
                <span style={{fontSize: 20, color: COLORS.text}}>{label}</span>
            </div>
        );
    };

    return (
        <AbsoluteFill style={{
            backgroundColor: COLORS.bg,
            color: COLORS.text,
            fontFamily: "'Fira Code', monospace",
            padding: 36,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
        }}>
            <h1 style={{fontSize: 32, margin: 0, marginBottom: 8, color: COLORS.text}}>{title}</h1>
            <div style={{fontSize: 18, color: COLORS.dim, marginBottom: 18}}>
                halfLeft = (m+n+1)/2 = {step.halfLeft} &nbsp;|&nbsp; binary search i1 in [{step.lo}, {step.hi}]
            </div>

            <div style={{
                flex: 1,
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 24,
            }}>
                {/* Two arrays with cuts */}
                <div style={{display: 'flex', flexDirection: 'column', gap: 18}}>
                    {renderArray(step.nums1, step.i1, 'nums1:', 'i1', true)}
                    {renderArray(step.nums2, step.i2, 'nums2:', 'i2', false)}
                </div>

                {/* Edge values panel */}
                <div style={{
                    display: 'flex',
                    gap: 12,
                    padding: 14,
                    backgroundColor: COLORS.panel,
                    borderRadius: 12,
                    border: `1px solid ${COLORS.border}`,
                }}>
                    <EdgeBox label="l1" value={step.l1} side="min" bg={COLORS.leftHalf} />
                    <EdgeBox label="r1" value={step.r1} side="max" bg={COLORS.rightHalf} />
                    <div style={{width: 2, backgroundColor: COLORS.border, margin: '0 4px'}} />
                    <EdgeBox label="l2" value={step.l2} side="min" bg={COLORS.leftHalf} />
                    <EdgeBox label="r2" value={step.r2} side="max" bg={COLORS.rightHalf} />
                </div>

                {/* Two check badges */}
                <div style={{display: 'flex', gap: 16}}>
                    <CheckBadge label={`l1 ≤ r2  (${sentinelLabel(step.l1, 'min')} ≤ ${sentinelLabel(step.r2, 'max')})`} pass={step.l1LeR2} />
                    <CheckBadge label={`l2 ≤ r1  (${sentinelLabel(step.l2, 'min')} ≤ ${sentinelLabel(step.r1, 'max')})`} pass={step.l2LeR1} />
                </div>

                {/* Median result, only when found */}
                {step.status === 'found' && step.median !== null && (
                    <div style={{
                        marginTop: 4,
                        padding: '12px 28px',
                        backgroundColor: '#1b3a4b',
                        borderRadius: 10,
                        border: `2px solid ${COLORS.accent}`,
                        fontSize: 28,
                        color: COLORS.accent,
                        fontFamily: "'Fira Code', monospace",
                    }}>
                        median = {step.median}
                    </div>
                )}
            </div>

            {/* Reason panel */}
            <div style={{
                marginTop: 20,
                backgroundColor: COLORS.panel,
                padding: '14px 22px',
                borderRadius: 10,
                width: '88%',
                textAlign: 'center',
                fontSize: 22,
                color: COLORS.text,
                border: `2px solid ${cutColor}`,
                fontFamily: "'Fira Code', monospace",
                minHeight: 32,
            }}>
                {step.reason}
            </div>
        </AbsoluteFill>
    );
};
