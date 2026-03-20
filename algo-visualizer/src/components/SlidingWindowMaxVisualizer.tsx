import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import React from 'react';

export type SlidingWindowMaxStep = {
    nums: number[];
    k: number;
    currentIndex: number;
    deque: number[];           // indices stored in deque (front=max)
    windowLeft: number;        // left boundary of current window
    result: (number | null)[]; // collected results so far
    action: 'remove_front' | 'remove_back' | 'push' | 'collect' | 'init' | 'done';
    removedIndex: number | null; // index being removed this step
    reason: string;
};

interface SlidingWindowMaxVisualizerProps {
    steps: SlidingWindowMaxStep[];
    title: string;
}

const COLORS = {
    bg: '#1a1a2e',
    normal: '#2a2a4a',
    current: '#ff9800',
    inWindow: '#3a5a7a',
    dequeHead: '#4caf50',
    removing: '#ef5350',
    collected: '#2196f3',
};

export const SlidingWindowMaxVisualizer: React.FC<SlidingWindowMaxVisualizerProps> = ({steps, title}) => {
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

    const actionColor: Record<string, string> = {
        remove_front: '#ef5350',
        remove_back: '#ff9800',
        push: '#4caf50',
        collect: '#2196f3',
        init: '#9e9e9e',
        done: '#4caf50',
    };

    const dequeSet = new Set(step.deque);

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

            <div style={{
                flex: 1,
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 20,
            }}>
                {/* nums array with window highlight */}
                <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6}}>
                    <span style={{fontSize: 16, color: '#aaa'}}>nums[]  (k={step.k})</span>
                    <div style={{display: 'flex', gap: 4, alignItems: 'flex-end', position: 'relative'}}>
                        {step.nums.map((val, idx) => {
                            const isCurrent = idx === step.currentIndex;
                            const inWindow = idx >= step.windowLeft && idx <= step.currentIndex && step.currentIndex >= 0;
                            const isInDeque = dequeSet.has(idx);
                            const isDequeHead = step.deque.length > 0 && step.deque[0] === idx;
                            const isRemoving = idx === step.removedIndex;

                            let bg = COLORS.normal;
                            if (isRemoving) bg = COLORS.removing;
                            else if (isDequeHead && inWindow) bg = COLORS.dequeHead;
                            else if (isCurrent) bg = COLORS.current;
                            else if (inWindow) bg = COLORS.inWindow;

                            let border = '1px solid #444';
                            if (isInDeque && inWindow) border = '2px solid #4caf50';
                            if (isCurrent) border = '2px solid #fff';

                            return (
                                <div key={idx} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2}}>
                                    {/* Value box */}
                                    <div style={{
                                        width: 52,
                                        height: 52,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        backgroundColor: bg,
                                        borderRadius: 6,
                                        fontSize: 22,
                                        fontWeight: isCurrent || isDequeHead ? 'bold' : 'normal',
                                        border,
                                    }}>
                                        {val}
                                    </div>
                                    {/* Index */}
                                    <span style={{fontSize: 11, color: '#666'}}>{idx}</span>
                                    {/* Markers */}
                                    {isDequeHead && inWindow && (
                                        <span style={{fontSize: 10, color: '#4caf50', fontWeight: 'bold'}}>MAX</span>
                                    )}
                                </div>
                            );
                        })}

                        {/* Window bracket */}
                        {step.currentIndex >= 0 && step.windowLeft >= 0 && (
                            <div style={{
                                position: 'absolute',
                                bottom: -18,
                                left: step.windowLeft * 56,
                                width: (Math.min(step.currentIndex, step.nums.length - 1) - step.windowLeft + 1) * 56 - 4,
                                height: 4,
                                backgroundColor: '#ff980088',
                                borderRadius: 2,
                            }} />
                        )}
                    </div>
                </div>

                {/* Monotonic Deque visualization */}
                <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6}}>
                    <span style={{fontSize: 16, color: '#aaa'}}>
                        Monotonic Deque (indices) — front=max, back=newest
                    </span>
                    <div style={{display: 'flex', gap: 4, alignItems: 'center', minHeight: 52}}>
                        {step.deque.length > 0 && (
                            <span style={{fontSize: 14, color: '#4caf50', marginRight: 6}}>front→</span>
                        )}
                        {step.deque.map((idx, pos) => {
                            const isHead = pos === 0;
                            const isTail = pos === step.deque.length - 1;
                            const isRemoving = idx === step.removedIndex;

                            return (
                                <div key={pos} style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: 2,
                                }}>
                                    <div style={{
                                        width: 56,
                                        height: 48,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        backgroundColor: isRemoving ? COLORS.removing :
                                            isHead ? '#2a5a3a' : '#2a2a4a',
                                        borderRadius: 6,
                                        fontSize: 18,
                                        fontWeight: isHead ? 'bold' : 'normal',
                                        border: isHead ? '2px solid #4caf50' :
                                            isTail ? '2px solid #ff9800' : '1px solid #444',
                                    }}>
                                        {idx}
                                        <span style={{fontSize: 12, color: '#aaa', marginLeft: 4}}>
                                            ({step.nums[idx]})
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                        {step.deque.length > 0 && (
                            <span style={{fontSize: 14, color: '#ff9800', marginLeft: 6}}>←back</span>
                        )}
                        {step.deque.length === 0 && (
                            <span style={{color: '#555', fontSize: 16}}>(empty)</span>
                        )}
                    </div>
                </div>

                {/* Result array */}
                <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6}}>
                    <span style={{fontSize: 16, color: '#aaa'}}>result[]</span>
                    <div style={{display: 'flex', gap: 4}}>
                        {step.result.map((val, idx) => (
                            <div key={idx} style={{
                                width: 52,
                                height: 44,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: val !== null ? '#1b3a4b' : '#222',
                                borderRadius: 6,
                                fontSize: 20,
                                fontWeight: 'bold',
                                color: val !== null ? '#4fc3f7' : '#444',
                                border: val !== null ? '1px solid #2196f3' : '1px solid #333',
                            }}>
                                {val !== null ? val : '_'}
                            </div>
                        ))}
                        {step.result.length === 0 && (
                            <span style={{color: '#555', fontSize: 16}}>(empty)</span>
                        )}
                    </div>
                </div>
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
                marginBottom: 12,
            }}>
                {step.reason}
            </div>
        </AbsoluteFill>
    );
};
