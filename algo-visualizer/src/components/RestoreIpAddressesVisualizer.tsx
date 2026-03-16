import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import React from 'react';

export type RestoreIpStep = {
    segments: string[];       // Current segments chosen so far
    remaining: string;        // Remaining string
    trying: string;           // Substring currently being tried
    status: 'try' | 'valid' | 'invalid' | 'found' | 'prune';
    foundIPs: string[];       // Collected valid IPs
    reason: string;           // Description of what's happening
};

interface RestoreIpVisualizerProps {
    steps: RestoreIpStep[];
    title: string;
}

export const RestoreIpAddressesVisualizer: React.FC<RestoreIpVisualizerProps> = ({
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

    const statusColor: Record<string, string> = {
        try: '#ff9800',
        valid: '#4caf50',
        invalid: '#ef5350',
        found: '#2196f3',
        prune: '#9e9e9e',
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
            <h1 style={{fontSize: 36, marginBottom: 30, color: '#e0e0e0'}}>{title}</h1>

            <div style={{
                flex: 1,
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 35,
            }}>
                {/* Current IP segments */}
                <div style={{display: 'flex', gap: 8, alignItems: 'center', minHeight: 70}}>
                    <span style={{color: '#aaa', fontSize: 22, marginRight: 16}}>Building IP:</span>
                    {step.segments.map((seg, idx) => (
                        <React.Fragment key={idx}>
                            {idx > 0 && <span style={{fontSize: 28, color: '#fff', fontWeight: 'bold'}}>.</span>}
                            <div style={{
                                padding: '8px 16px',
                                backgroundColor: '#4caf50',
                                borderRadius: 6,
                                fontSize: 26,
                                fontWeight: 'bold',
                                minWidth: 40,
                                textAlign: 'center',
                            }}>
                                {seg}
                            </div>
                        </React.Fragment>
                    ))}
                    {step.trying && (
                        <>
                            {step.segments.length > 0 && (
                                <span style={{fontSize: 28, color: '#666', fontWeight: 'bold'}}>.</span>
                            )}
                            <div style={{
                                padding: '8px 16px',
                                backgroundColor: statusColor[step.status] || '#ff9800',
                                borderRadius: 6,
                                fontSize: 26,
                                fontWeight: 'bold',
                                border: '2px dashed #fff',
                                minWidth: 40,
                                textAlign: 'center',
                                opacity: 0.9,
                            }}>
                                {step.trying}?
                            </div>
                        </>
                    )}
                </div>

                {/* Remaining string */}
                <div style={{display: 'flex', gap: 4, alignItems: 'center', minHeight: 50}}>
                    <span style={{color: '#aaa', fontSize: 20, marginRight: 16}}>Remaining:</span>
                    {step.remaining.split('').map((ch, idx) => (
                        <div key={idx} style={{
                            width: 36,
                            height: 42,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: '#2a2a4a',
                            borderRadius: 4,
                            fontSize: 24,
                            border: '1px solid #444',
                        }}>
                            {ch}
                        </div>
                    ))}
                    {step.remaining.length === 0 && (
                        <span style={{color: '#666', fontSize: 20}}>(empty)</span>
                    )}
                </div>

                {/* Found IPs */}
                <div style={{
                    borderTop: '1px solid #444',
                    paddingTop: 20,
                    width: '85%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 10,
                }}>
                    <span style={{color: '#aaa', fontSize: 20}}>Valid IPs Found:</span>
                    <div style={{display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center'}}>
                        {step.foundIPs.map((ip, idx) => (
                            <div key={idx} style={{
                                padding: '6px 14px',
                                backgroundColor: '#1b3a4b',
                                borderRadius: 6,
                                fontSize: 22,
                                color: '#4fc3f7',
                                border: '1px solid #2196f3',
                            }}>
                                {ip}
                            </div>
                        ))}
                        {step.foundIPs.length === 0 && (
                            <span style={{color: '#555', fontSize: 18}}>None yet...</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Description */}
            <div style={{
                marginBottom: 30,
                backgroundColor: '#2a2a4a',
                padding: '16px 24px',
                borderRadius: 10,
                width: '85%',
                textAlign: 'center',
                fontSize: 24,
                color: '#e0e0e0',
                border: `2px solid ${statusColor[step.status] || '#555'}`,
            }}>
                {step.reason}
            </div>
        </AbsoluteFill>
    );
};
