import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import React from 'react';

export type SlidingWindowStep = {
	left: number;
	right: number;
	map: Record<string, number>;
	description: string;
	maxLen: number;
	conflict?: boolean;
};

interface SlidingWindowVisualizerProps {
    inputString: string;
    steps: SlidingWindowStep[];
    title: string;
}

export const SlidingWindowVisualizer: React.FC<SlidingWindowVisualizerProps> = ({
    inputString,
    steps,
    title
}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();

	// Calculate which step we are in
	// Each step takes 1.5 seconds (45 frames at 30fps)
	const durationPerStep = 1.5 * fps;
	const currentStepIndex = Math.min(
		Math.floor(frame / durationPerStep),
		steps.length - 1
	);
	const step = steps[currentStepIndex];

    const chars = inputString.split("");

	return (
		<AbsoluteFill className="bg-gray-900 text-white p-10 flex flex-col items-center justify-center" style={{backgroundColor: '#1e1e1e', color: 'white'}}>
			<div className="container">
				<h1 className="title">{title}</h1>
				
				<div className="array-container">
					{chars.map((char, index) => {
						const isLeft = index === step.left;
						const isRight = index === step.right;
						const isInWindow = index >= step.left && index <= step.right;
                        const isConflictChar = step.conflict && index === step.right;

                        // Basic Style
                        let style: React.CSSProperties = {};
                        if (isInWindow) style.backgroundColor = '#2e7d32'; // Green
                        if (isConflictChar) style.backgroundColor = '#c62828'; // Red click
                        
                        // Highlight borders for pointers
                        if (isLeft) style.borderLeftColor = '#ffeb3b';
                        if (isRight) style.borderRightColor = '#ffeb3b';

						return (
							<div key={index} className="cell" style={style}>
								{char}
								{isLeft && <div className="pointer" style={{left: '20%', fontSize: '16px'}}>L</div>}
								{isRight && <div className="pointer" style={{left: '80%', fontSize: '16px'}}>R</div>}
                                <div style={{position: 'absolute', top: -20, fontSize: 12, color: '#888'}}>{index}</div>
							</div>
						);
					})}
				</div>

				<div className="info-panel">
					<div className="info-row">
						<span>Left: {step.left}</span>
						<span>Right: {step.right}</span>
						<span>Max Len: {step.maxLen}</span>
					</div>
					<div className="info-row" style={{borderTop: '1px solid #555', paddingTop: 10, marginTop: 10, fontSize: 28, color: '#4fc3f7'}}>
						{step.description}
					</div>
                    <div className="map-view">
                        {Object.entries(step.map).filter(([k]) => k.length === 1).map(([k, v]) => (
                            <div key={k} className="map-item">
                                {k}: {v}
                            </div>
                        ))}
                    </div>
				</div>
			</div>
		</AbsoluteFill>
	);
};
