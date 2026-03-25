import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import React from 'react';

export type TwoSumSeenEntry = {
	value: number;
	index: number;
	state: 'normal' | 'match' | 'new';
};

export type TwoSumStep = {
	phase: 'intro' | 'check' | 'store' | 'found' | 'summary';
	nums: number[];
	target: number;
	currentIndex: number;
	currentValue: number | null;
	neededValue: number | null;
	seenEntries: TwoSumSeenEntry[];
	matchedIndex: number | null;
	result: [number, number] | null;
	actionLabel: string;
	what: string;
	why: string;
	invariant: string;
	progress: string;
};

interface TwoSumVisualizerProps {
	steps: TwoSumStep[];
	title: string;
	durationPerStep: number;
}

const COLORS = {
	bg: '#1a1a2e',
	panel: '#22243a',
	panelAlt: '#2a2d47',
	border: '#4d567e',
	text: '#f4f6ff',
	muted: '#aeb7d8',
	current: '#ff9f1c',
	match: '#4caf50',
	newEntry: '#4fc3f7',
	answer: '#26c6da',
	empty: '#69739b',
};

const phaseAccent = (phase: TwoSumStep['phase']) => {
	if (phase === 'found') return COLORS.match;
	if (phase === 'store') return COLORS.newEntry;
	if (phase === 'summary') return COLORS.answer;
	return COLORS.current;
};

const mapCardStyle = (state: TwoSumSeenEntry['state']) => {
	if (state === 'match') {
		return {
			backgroundColor: '#173626',
			border: `2px solid ${COLORS.match}`,
			color: '#d7ffe2',
		};
	}
	if (state === 'new') {
		return {
			backgroundColor: '#15344f',
			border: `2px solid ${COLORS.newEntry}`,
			color: '#d9f6ff',
		};
	}
	return {
		backgroundColor: '#252941',
		border: `1px solid ${COLORS.border}`,
		color: COLORS.text,
	};
};

export const TwoSumVisualizer: React.FC<TwoSumVisualizerProps> = ({
	steps,
	title,
	durationPerStep,
}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();

	if (!steps.length) {
		return null;
	}

	const framesPerStep = durationPerStep || Math.round(3.5 * fps);
	const stepIndex = Math.min(
		Math.floor(frame / framesPerStep),
		steps.length - 1,
	);
	const step = steps[stepIndex];

	if (!step) {
		return null;
	}

	const frameInStep = frame % framesPerStep;
	const pulse = 1 + 0.04 * Math.sin((frameInStep / framesPerStep) * Math.PI);

	return (
		<AbsoluteFill
			style={{
				backgroundColor: COLORS.bg,
				color: COLORS.text,
				fontFamily: "'Fira Code', monospace",
				padding: 40,
				boxSizing: 'border-box',
				display: 'flex',
				flexDirection: 'column',
				gap: 24,
			}}
		>
			<div
				style={{
					border: `2px solid ${phaseAccent(step.phase)}`,
					borderRadius: 24,
					padding: '22px 28px',
					backgroundColor: COLORS.panel,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
				}}
			>
				<div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
					<div style={{fontSize: 38, fontWeight: 700}}>{title}</div>
					<div style={{fontSize: 22, color: COLORS.muted}}>
						{step.actionLabel}
					</div>
				</div>
				<div
					style={{
						padding: '12px 18px',
						borderRadius: 16,
						backgroundColor: COLORS.panelAlt,
						border: `1px solid ${COLORS.border}`,
						fontSize: 22,
					}}
				>
					{step.progress}
				</div>
			</div>

			<div style={{display: 'flex', gap: 24}}>
				{[
					`target = ${step.target}`,
					step.currentIndex >= 0
						? `i = ${step.currentIndex}`
						: 'i = -',
					step.currentValue !== null
						? `nums[i] = ${step.currentValue}`
						: 'nums[i] = -',
					step.neededValue !== null
						? `need = ${step.neededValue}`
						: 'need = -',
				].map((text) => (
					<div
						key={text}
						style={{
							padding: '14px 18px',
							borderRadius: 16,
							backgroundColor: COLORS.panelAlt,
							border: `1px solid ${COLORS.border}`,
							fontSize: 22,
						}}
					>
						{text}
					</div>
				))}
			</div>

			<div style={{display: 'flex', gap: 24, flex: 1}}>
				<div
					style={{
						flex: 1.3,
						backgroundColor: COLORS.panel,
						borderRadius: 24,
						border: `1px solid ${COLORS.border}`,
						padding: 28,
						display: 'flex',
						flexDirection: 'column',
						gap: 22,
					}}
				>
					<div style={{fontSize: 26, color: COLORS.muted}}>
						Array Scan
					</div>
					<div
						style={{
							display: 'flex',
							justifyContent: 'space-between',
							gap: 20,
							marginTop: 12,
						}}
					>
						{step.nums.map((value, index) => {
							const isCurrent = index === step.currentIndex;
							const isMatched = index === step.matchedIndex;
							const isAnswer =
								step.result !== null &&
								(index === step.result[0] || index === step.result[1]);

							let borderColor = COLORS.border;
							let backgroundColor = '#252941';
							let label = `idx ${index}`;

							if (isAnswer) {
								borderColor = COLORS.match;
								backgroundColor = '#173626';
								label = 'answer';
							} else if (isCurrent) {
								borderColor = COLORS.current;
								backgroundColor = '#3c2a15';
								label = 'current';
							} else if (isMatched) {
								borderColor = COLORS.answer;
								backgroundColor = '#15344f';
								label = 'match';
							}

							return (
								<div
									key={`${value}-${index}`}
									style={{
										flex: 1,
										borderRadius: 22,
										padding: '22px 14px',
										backgroundColor,
										border: `2px solid ${borderColor}`,
										display: 'flex',
										flexDirection: 'column',
										alignItems: 'center',
										gap: 16,
										transform: isCurrent ? `scale(${pulse})` : 'scale(1)',
									}}
								>
									<div style={{fontSize: 22, color: COLORS.muted}}>
										{label}
									</div>
									<div style={{fontSize: 58, fontWeight: 700}}>{value}</div>
									<div
										style={{
											padding: '8px 12px',
											borderRadius: 999,
											backgroundColor: COLORS.panelAlt,
											border: `1px solid ${COLORS.border}`,
											fontSize: 20,
										}}
									>
										index {index}
									</div>
								</div>
							);
						})}
					</div>

					<div
						style={{
							marginTop: 10,
							borderRadius: 18,
							padding: '18px 20px',
							backgroundColor: COLORS.panelAlt,
							border: `1px solid ${COLORS.border}`,
							fontSize: 26,
							color: COLORS.text,
						}}
					>
						{step.currentValue !== null && step.neededValue !== null
							? `need = target - nums[i] = ${step.target} - ${step.currentValue} = ${step.neededValue}`
							: '先建立“补数查询”这句核心表达'}
					</div>
				</div>

				<div
					style={{
						flex: 1,
						backgroundColor: COLORS.panel,
						borderRadius: 24,
						border: `1px solid ${COLORS.border}`,
						padding: 28,
						display: 'flex',
						flexDirection: 'column',
						gap: 20,
					}}
				>
					<div style={{fontSize: 26, color: COLORS.muted}}>
						Hash Map Snapshot
					</div>
					<div
						style={{
							display: 'grid',
							gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
							gap: 16,
							minHeight: 220,
						}}
					>
						{step.seenEntries.length === 0 ? (
							<div
								style={{
									gridColumn: '1 / -1',
									borderRadius: 20,
									border: `1px dashed ${COLORS.empty}`,
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									fontSize: 24,
									color: COLORS.empty,
									backgroundColor: '#1f2238',
								}}
							>
								seen = {'{}'}
							</div>
						) : (
							step.seenEntries.map((entry) => (
								<div
									key={`${entry.value}-${entry.index}`}
									style={{
										...mapCardStyle(entry.state),
										borderRadius: 20,
										padding: '18px 16px',
										display: 'flex',
										flexDirection: 'column',
										gap: 12,
									}}
								>
									<div style={{fontSize: 20, color: COLORS.muted}}>
										value
									</div>
									<div style={{fontSize: 34, fontWeight: 700}}>
										{entry.value}
									</div>
									<div style={{fontSize: 22}}>
										index -&gt; {entry.index}
									</div>
								</div>
							))
						)}
					</div>

					<div
						style={{
							borderRadius: 18,
							padding: '18px 20px',
							backgroundColor: COLORS.panelAlt,
							border: `1px solid ${COLORS.border}`,
							display: 'flex',
							flexDirection: 'column',
							gap: 10,
						}}
					>
						<div style={{fontSize: 22, color: COLORS.muted}}>Result</div>
						<div style={{fontSize: 30, fontWeight: 700}}>
							{step.result
								? `[${step.result[0]}, ${step.result[1]}]`
								: 'Not found yet'}
						</div>
						<div style={{fontSize: 22, color: COLORS.muted}}>
							{step.result
								? `nums[${step.result[0]}] + nums[${step.result[1]}] = ${step.target}`
								: '答案会在第二个配对元素出现时闭合'}
						</div>
					</div>
				</div>
			</div>

			<div style={{display: 'flex', gap: 24}}>
				<div
					style={{
						flex: 1.1,
						backgroundColor: COLORS.panel,
						borderRadius: 24,
						border: `1px solid ${COLORS.border}`,
						padding: 24,
						display: 'flex',
						flexDirection: 'column',
						gap: 14,
					}}
				>
					<div style={{fontSize: 22, color: COLORS.muted}}>What</div>
					<div style={{fontSize: 26, lineHeight: 1.5}}>{step.what}</div>
				</div>
				<div
					style={{
						flex: 1.1,
						backgroundColor: COLORS.panel,
						borderRadius: 24,
						border: `1px solid ${COLORS.border}`,
						padding: 24,
						display: 'flex',
						flexDirection: 'column',
						gap: 14,
					}}
				>
					<div style={{fontSize: 22, color: COLORS.muted}}>Why</div>
					<div style={{fontSize: 26, lineHeight: 1.5}}>{step.why}</div>
				</div>
				<div
					style={{
						flex: 1,
						backgroundColor: COLORS.panel,
						borderRadius: 24,
						border: `1px solid ${COLORS.border}`,
						padding: 24,
						display: 'flex',
						flexDirection: 'column',
						gap: 14,
					}}
				>
					<div style={{fontSize: 22, color: COLORS.muted}}>Invariant</div>
					<div style={{fontSize: 24, lineHeight: 1.5}}>{step.invariant}</div>
				</div>
			</div>
		</AbsoluteFill>
	);
};
