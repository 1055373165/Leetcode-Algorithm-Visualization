import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import React from 'react';

export type LFUBucketNode = {
	key: number;
	value: number;
};

export type LFUFreqBucket = {
	freq: number;
	nodes: LFUBucketNode[];
};

export type LFUCacheStep = {
	phase: 'intro' | 'put' | 'get-hit' | 'get-miss' | 'evict' | 'promote' | 'summary';
	operation: string;
	capacity: number;
	size: number;
	freqBuckets: LFUFreqBucket[];
	minFreq: number;
	activeKey: number | null;
	victimKey: number | null;
	newKey: number | null;
	result: number | null;
	actionLabel: string;
	what: string;
	why: string;
	invariant: string;
	progress: string;
};

interface LFUCacheVisualizerProps {
	steps: LFUCacheStep[];
	title: string;
	durationPerStep: number;
}

const COLORS = {
	bg: '#1a1a2e',
	panel: '#22243a',
	panelAlt: '#2a2d47',
	border: '#4f5a84',
	text: '#f4f6ff',
	muted: '#b4bddc',
	intro: '#ff9f1c',
	put: '#4fc3f7',
	hit: '#4caf50',
	miss: '#ffb74d',
	evict: '#ef5350',
	promote: '#ab7cff',
	summary: '#ce93d8',
	minFreqArrow: '#ef5350',
	freqLabel: '#ffa726',
	head: '#26c6da',
	tail: '#ffa726',
};

const phaseAccent = (phase: LFUCacheStep['phase']) => {
	if (phase === 'put') return COLORS.put;
	if (phase === 'get-hit') return COLORS.hit;
	if (phase === 'get-miss') return COLORS.miss;
	if (phase === 'evict') return COLORS.evict;
	if (phase === 'promote') return COLORS.promote;
	if (phase === 'summary') return COLORS.summary;
	return COLORS.intro;
};

export const LFUCacheVisualizer: React.FC<LFUCacheVisualizerProps> = ({
	steps,
	title,
	durationPerStep,
}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();

	if (!steps.length) return null;

	const framesPerStep = durationPerStep || Math.round(2.5 * fps);
	const stepIndex = Math.min(
		Math.floor(frame / framesPerStep),
		steps.length - 1,
	);
	const step = steps[stepIndex];
	if (!step) return null;

	const frameInStep = frame % framesPerStep;
	const pulse = 1 + 0.035 * Math.sin((frameInStep / framesPerStep) * Math.PI);

	const sortedBuckets = [...step.freqBuckets].sort((a, b) => b.freq - a.freq);

	return (
		<AbsoluteFill
			style={{
				backgroundColor: COLORS.bg,
				color: COLORS.text,
				fontFamily: "'Fira Code', monospace",
				padding: 36,
				boxSizing: 'border-box',
				display: 'flex',
				flexDirection: 'column',
				gap: 18,
			}}
		>
			{/* Header */}
			<div
				style={{
					border: `2px solid ${phaseAccent(step.phase)}`,
					borderRadius: 20,
					padding: '18px 24px',
					backgroundColor: COLORS.panel,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
				}}
			>
				<div style={{display: 'flex', flexDirection: 'column', gap: 6}}>
					<div style={{fontSize: 34, fontWeight: 700}}>{title}</div>
					<div style={{fontSize: 20, color: COLORS.muted}}>
						{step.actionLabel}
					</div>
				</div>
				<div
					style={{
						padding: '10px 16px',
						borderRadius: 14,
						backgroundColor: COLORS.panelAlt,
						border: `1px solid ${COLORS.border}`,
						fontSize: 20,
					}}
				>
					{step.progress}
				</div>
			</div>

			{/* Status bar */}
			<div style={{display: 'flex', gap: 18}}>
				{[
					`op = ${step.operation}`,
					`cap = ${step.capacity}`,
					`size = ${step.size}`,
					`minFreq = ${step.minFreq}`,
					step.result !== null ? `ret = ${step.result}` : 'ret = -',
				].map((text) => (
					<div
						key={text}
						style={{
							padding: '10px 16px',
							borderRadius: 14,
							backgroundColor: COLORS.panelAlt,
							border: `1px solid ${COLORS.border}`,
							fontSize: 19,
						}}
					>
						{text}
					</div>
				))}
			</div>

			{/* Main area: freq buckets + keyMap */}
			<div style={{display: 'flex', gap: 20, flex: 1, minHeight: 0}}>
				{/* Freq buckets panel */}
				<div
					style={{
						flex: 1.5,
						backgroundColor: COLORS.panel,
						borderRadius: 20,
						border: `1px solid ${COLORS.border}`,
						padding: 22,
						display: 'flex',
						flexDirection: 'column',
						gap: 12,
						overflow: 'hidden',
					}}
				>
					<div style={{fontSize: 22, color: COLORS.muted}}>
						freqMap — Frequency Buckets
					</div>

					<div
						style={{
							flex: 1,
							display: 'flex',
							flexDirection: 'column',
							justifyContent: 'center',
							gap: 14,
						}}
					>
						{sortedBuckets.length === 0 ? (
							<div
								style={{
									padding: '24px 28px',
									borderRadius: 18,
									border: `1px dashed ${COLORS.border}`,
									backgroundColor: '#1f2238',
									color: COLORS.muted,
									fontSize: 22,
									textAlign: 'center',
								}}
							>
								(Empty)
							</div>
						) : (
							sortedBuckets.map((bucket) => {
								const isMinFreq = bucket.freq === step.minFreq;
								return (
									<div
										key={bucket.freq}
										style={{
											display: 'flex',
											alignItems: 'center',
											gap: 12,
										}}
									>
										{/* minFreq arrow */}
										<div
											style={{
												width: 70,
												textAlign: 'right',
												fontSize: 16,
												color: isMinFreq
													? COLORS.minFreqArrow
													: 'transparent',
												fontWeight: 700,
											}}
										>
											{isMinFreq ? 'minF →' : ''}
										</div>

										{/* Freq label */}
										<div
											style={{
												width: 70,
												padding: '8px 0',
												borderRadius: 12,
												backgroundColor: isMinFreq
													? '#3b2028'
													: COLORS.panelAlt,
												border: `2px solid ${
													isMinFreq
														? COLORS.minFreqArrow
														: COLORS.freqLabel
												}`,
												textAlign: 'center',
												fontSize: 18,
												fontWeight: 700,
												color: isMinFreq
													? COLORS.minFreqArrow
													: COLORS.freqLabel,
											}}
										>
											f={bucket.freq}
										</div>

										{/* Linked list nodes */}
										<div
											style={{
												display: 'flex',
												alignItems: 'center',
												gap: 8,
												flex: 1,
											}}
										>
											<div
												style={{
													fontSize: 14,
													color: COLORS.head,
													fontWeight: 600,
												}}
											>
												H
											</div>
											<div
												style={{
													fontSize: 16,
													color: COLORS.muted,
												}}
											>
												⇄
											</div>

											{bucket.nodes.length === 0 ? (
												<div
													style={{
														fontSize: 16,
														color: COLORS.muted,
														fontStyle: 'italic',
													}}
												>
													(empty)
												</div>
											) : (
												bucket.nodes.map((node, ni) => {
													const isActive =
														step.activeKey === node.key;
													const isVictim =
														step.victimKey === node.key;
													const isNew =
														step.newKey === node.key;

													let borderColor = COLORS.border;
													let bgColor = '#252941';
													let label =
														ni === 0
															? 'MRU'
															: ni ===
																	bucket.nodes.length - 1
																? 'LRU'
																: '';

													if (isVictim) {
														borderColor = COLORS.evict;
														bgColor = '#3b2028';
														label = 'victim';
													} else if (isNew) {
														borderColor = COLORS.put;
														bgColor = '#15344f';
														label = 'new';
													} else if (isActive) {
														borderColor =
															step.phase === 'get-hit' ||
															step.phase === 'promote'
																? COLORS.hit
																: COLORS.intro;
														bgColor =
															step.phase === 'get-hit' ||
															step.phase === 'promote'
																? '#173626'
																: '#3c2a15';
														label = 'active';
													}

													return (
														<React.Fragment
															key={node.key}
														>
															<div
																style={{
																	minWidth: 130,
																	borderRadius: 16,
																	padding: '10px 12px',
																	backgroundColor:
																		bgColor,
																	border: `2px solid ${borderColor}`,
																	display: 'flex',
																	flexDirection:
																		'column',
																	alignItems: 'center',
																	gap: 4,
																	transform:
																		isActive ||
																		isNew ||
																		isVictim
																			? `scale(${pulse})`
																			: 'scale(1)',
																}}
															>
																{label && (
																	<div
																		style={{
																			fontSize: 13,
																			color: COLORS.muted,
																		}}
																	>
																		{label}
																	</div>
																)}
																<div
																	style={{
																		fontSize: 24,
																		fontWeight: 700,
																	}}
																>
																	{node.key}
																</div>
																<div
																	style={{
																		fontSize: 16,
																	}}
																>
																	val={node.value}
																</div>
															</div>
															{ni <
																bucket.nodes.length -
																	1 && (
																<div
																	style={{
																		fontSize: 16,
																		color: COLORS.muted,
																	}}
																>
																	⇄
																</div>
															)}
														</React.Fragment>
													);
												})
											)}

											<div
												style={{
													fontSize: 16,
													color: COLORS.muted,
												}}
											>
												⇄
											</div>
											<div
												style={{
													fontSize: 14,
													color: COLORS.tail,
													fontWeight: 600,
												}}
											>
												T
											</div>
										</div>
									</div>
								);
							})
						)}
					</div>
				</div>

				{/* keyMap panel */}
				<div
					style={{
						flex: 0.7,
						backgroundColor: COLORS.panel,
						borderRadius: 20,
						border: `1px solid ${COLORS.border}`,
						padding: 22,
						display: 'flex',
						flexDirection: 'column',
						gap: 14,
					}}
				>
					<div style={{fontSize: 22, color: COLORS.muted}}>keyMap</div>
					<div style={{fontSize: 16, color: COLORS.muted}}>
						key → node ptr
					</div>

					<div
						style={{
							display: 'flex',
							flexDirection: 'column',
							gap: 10,
							flex: 1,
						}}
					>
						{(() => {
							const allNodes: {key: number; value: number; freq: number}[] =
								[];
							step.freqBuckets.forEach((b) =>
								b.nodes.forEach((n) =>
									allNodes.push({
										key: n.key,
										value: n.value,
										freq: b.freq,
									}),
								),
							);
							allNodes.sort((a, b) => a.key - b.key);

							if (allNodes.length === 0) {
								return (
									<div
										style={{
											borderRadius: 16,
											border: `1px dashed ${COLORS.border}`,
											backgroundColor: '#1f2238',
											color: COLORS.muted,
											fontSize: 20,
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
											flex: 1,
										}}
									>
										{'{ }'}
									</div>
								);
							}

							return allNodes.map((n) => {
								const isActive = step.activeKey === n.key;
								const isVictim = step.victimKey === n.key;
								const isNew = step.newKey === n.key;

								let borderColor = COLORS.border;
								let bgColor = '#252941';

								if (isVictim) {
									borderColor = COLORS.evict;
									bgColor = '#3b2028';
								} else if (isNew) {
									borderColor = COLORS.put;
									bgColor = '#15344f';
								} else if (isActive) {
									borderColor =
										step.phase === 'get-hit' ||
										step.phase === 'promote'
											? COLORS.hit
											: COLORS.intro;
									bgColor =
										step.phase === 'get-hit' ||
										step.phase === 'promote'
											? '#173626'
											: '#3c2a15';
								}

								return (
									<div
										key={n.key}
										style={{
											borderRadius: 14,
											border: `2px solid ${borderColor}`,
											backgroundColor: bgColor,
											padding: '10px 14px',
											display: 'flex',
											justifyContent: 'space-between',
											alignItems: 'center',
										}}
									>
										<div style={{fontSize: 18, fontWeight: 700}}>
											key {n.key}
										</div>
										<div style={{fontSize: 15, color: COLORS.muted}}>
											v={n.value} f={n.freq}
										</div>
									</div>
								);
							});
						})()}
					</div>

					{/* Key idea */}
					<div
						style={{
							borderRadius: 14,
							padding: '14px 16px',
							backgroundColor: COLORS.panelAlt,
							border: `1px solid ${COLORS.border}`,
							display: 'flex',
							flexDirection: 'column',
							gap: 8,
						}}
					>
						<div style={{fontSize: 18, color: COLORS.muted}}>Core</div>
						<div style={{fontSize: 17, lineHeight: 1.5}}>
							keyMap 定位，freqMap 分桶排 LRU，minFreq 锁定淘汰目标
						</div>
					</div>
				</div>
			</div>

			{/* Bottom: What / Why / Invariant */}
			<div style={{display: 'flex', gap: 18}}>
				<div
					style={{
						flex: 1,
						backgroundColor: COLORS.panel,
						borderRadius: 18,
						border: `1px solid ${COLORS.border}`,
						padding: 20,
						display: 'flex',
						flexDirection: 'column',
						gap: 8,
					}}
				>
					<div style={{fontSize: 18, color: COLORS.muted}}>What</div>
					<div style={{fontSize: 20, lineHeight: 1.5}}>{step.what}</div>
				</div>
				<div
					style={{
						flex: 1,
						backgroundColor: COLORS.panel,
						borderRadius: 18,
						border: `1px solid ${COLORS.border}`,
						padding: 20,
						display: 'flex',
						flexDirection: 'column',
						gap: 8,
					}}
				>
					<div style={{fontSize: 18, color: COLORS.muted}}>Why</div>
					<div style={{fontSize: 20, lineHeight: 1.5}}>{step.why}</div>
				</div>
				<div
					style={{
						flex: 1,
						backgroundColor: COLORS.panel,
						borderRadius: 18,
						border: `1px solid ${COLORS.border}`,
						padding: 20,
						display: 'flex',
						flexDirection: 'column',
						gap: 8,
					}}
				>
					<div style={{fontSize: 18, color: COLORS.muted}}>Invariant</div>
					<div style={{fontSize: 18, lineHeight: 1.5}}>
						{step.invariant}
					</div>
				</div>
			</div>
		</AbsoluteFill>
	);
};
