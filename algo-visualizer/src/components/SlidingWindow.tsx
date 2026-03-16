import {AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate} from 'remotion';
import React from 'react';

const INPUT_STRING = "abcabcbb";

type Step = {
	left: number;
	right: number;
	map: Record<string, number>;
	description: string;
	maxLen: number;
	conflict?: boolean;
};

// Define the steps of the algorithm
// Based on the blog post logic
const STEPS: Step[] = [
	{left: 0, right: 0, map: {a: 0}, description: "Init: Expand R to 'a'", maxLen: 1},
	{left: 0, right: 1, map: {a: 0, b: 1}, description: "Expand R to 'b'", maxLen: 2},
	{left: 0, right: 2, map: {a: 0, b: 1, c: 2}, description: "Expand R to 'c'", maxLen: 3},
	{left: 0, right: 3, map: {a: 0, b: 1, c: 2}, description: "Conflict! 'a' seen at 0", maxLen: 3, conflict: true},
	{left: 1, right: 3, map: {a: 3, b: 1, c: 2}, description: "Jump L to 0+1=1, Update 'a'", maxLen: 3},
	{left: 1, right: 4, map: {a: 3, b: 4, c: 2}, description: "Expand R to 'b' (Update 'b')", maxLen: 3}, // b at 1, valid
    {left: 2, right: 4, map: {a: 3, b: 4, c: 2}, description: "Conflict! 'b' seen at 1. Jump L", maxLen: 3, conflict: true},
    {left: 2, right: 5, map: {a: 3, b: 4, c: 5}, description: "Expand R to 'c' (Update 'c')", maxLen: 3},
    {left: 3, right: 5, map: {a: 3, b: 4, c: 5}, description: "Conflict! 'c' seen at 2. Jump L", maxLen: 3, conflict: true},
	{left: 3, right: 6, map: {a: 3, b: 4, c: 5, b_new: 6}, description: "Expand R to 'b'", maxLen: 3}, // b seen at 4
    {left: 5, right: 6, map: {a: 3, b: 6, c: 5}, description: "Conflict! 'b' seen at 4. Jump L", maxLen: 3, conflict: true},
	{left: 5, right: 7, map: {a: 3, b: 6, c: 5, b_new_2: 7}, description: "Expand R to 'b'", maxLen: 3}, // b seen at 6
    {left: 7, right: 7, map: {a: 3, b: 7, c: 5}, description: "Conflict! 'b' seen at 6. Jump L", maxLen: 3, conflict: true},
];

export const SlidingWindow: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();

	// Calculate which step we are in
	// Each step takes 1.5 seconds (45 frames at 30fps)
	const durationPerStep = 1.5 * fps;
	const currentStepIndex = Math.min(
		Math.floor(frame / durationPerStep),
		STEPS.length - 1
	);
	const step = STEPS[currentStepIndex];

    const chars = INPUT_STRING.split("");

	return (
		<AbsoluteFill className="bg-gray-900 text-white p-10 flex flex-col items-center justify-center" style={{backgroundColor: '#1e1e1e', color: 'white'}}>
			<div className="container">
				<h1 className="title">Sliding Window: Longest Substring</h1>
				
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
