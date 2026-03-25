import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import React from 'react';

export type LRUCacheNodeView = {
	key: number;
	value: number;
};

export type LRUCacheStep = {
	phase: 'intro' | 'put' | 'get-hit' | 'get-miss' | 'evict' | 'summary';
	operation: string;
	capacity: number;
	size: number;
	nodes: LRUCacheNodeView[];
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

interface LRUCacheVisualizerProps {
	steps: LRUCacheStep[];
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
	summary: '#ab7cff',
	head: '#26c6da',
	tail: '#ffa726',
};

const phaseAccent = (phase: LRUCacheStep['phase']) => {
	if (phase === 'put') return COLORS.put;
	if (phase === 'get-hit') return COLORS.hit;
	if (phase === 'get-miss') return COLORS.miss;
	if (phase === 'evict') return COLORS.evict;
	if (phase === 'summary') return COLORS.summary;
	return COLORS.intro;
};

const sortedMapEntries = (nodes: LRUCacheNodeView[]) => {
	return [...nodes].sort((a, b) => a.key - b.key);
};

export const LRUCacheVisualizer: React.FC<LRUCacheVisualizerProps> = ({
	steps,
	title,
	durationPerStep,
}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();

	if (!steps.length) {
		return null;
	}

	const framesPerStep = durationPerStep || Math.round(2.5 * fps);
	const stepIndex = Math.min(
		Math.floor(frame / framesPerStep),
		steps.length - 1,
	);
	const step = steps[stepIndex];

	if (!step) {
		return null;
	}

	const frameInStep = frame % framesPerStep;
	const pulse = 1 + 0.035 * Math.sin((frameInStep / framesPerStep) * Math.PI);
	const mapEntries = sortedMapEntries(step.nodes);

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
					`op = ${step.operation}`,
					`capacity = ${step.capacity}`,
					`size = ${step.size}`,
					step.result !== null ? `ret = ${step.result}` : 'ret = -',
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
						gap: 18,
					}}
				>
					<div style={{fontSize: 26, color: COLORS.muted}}>
						Doubly Linked List
					</div>
					<div style={{fontSize: 20, color: COLORS.muted}}>
						Front = MRU, Back = LRU
					</div>

					<div
						style={{
							flex: 1,
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							gap: 14,
							flexWrap: 'nowrap',
						}}
					>
						<div
							style={{
								padding: '18px 16px',
								borderRadius: 18,
								border: `2px solid ${COLORS.head}`,
								backgroundColor: '#15344f',
								color: '#d9f6ff',
								fontSize: 22,
								fontWeight: 700,
								minWidth: 110,
								textAlign: 'center',
							}}
						>
							HEAD
						</div>
						<div style={{fontSize: 28, color: COLORS.muted}}>⇄</div>

						{step.nodes.length === 0 ? (
							<div
								style={{
									padding: '24px 28px',
									borderRadius: 20,
									border: `1px dashed ${COLORS.border}`,
									backgroundColor: '#1f2238',
									color: COLORS.muted,
									fontSize: 24,
								}}
							>
								(Empty)
							</div>
						) : (
							step.nodes.map((node, index) => {
								const isActive = step.activeKey === node.key;
								const isVictim = step.victimKey === node.key;
								const isNew = step.newKey === node.key;
								let borderColor = COLORS.border;
								let backgroundColor = '#252941';
								let label = index === 0 ? 'MRU' : index === step.nodes.length - 1 ? 'LRU' : 'warm';

								if (isVictim) {
									borderColor = COLORS.evict;
									backgroundColor = '#3b2028';
									label = 'victim';
								} else if (isNew) {
									borderColor = COLORS.put;
									backgroundColor = '#15344f';
									label = 'new';
								} else if (isActive) {
									borderColor = step.phase === 'get-hit' ? COLORS.hit : COLORS.intro;
									backgroundColor = step.phase === 'get-hit' ? '#173626' : '#3c2a15';
									label = 'active';
								}

								return (
									<React.Fragment key={node.key}>
										<div
											style={{
												width: 170,
												borderRadius: 22,
												padding: '18px 16px',
												backgroundColor,
												border: `2px solid ${borderColor}`,
												display: 'flex',
												flexDirection: 'column',
												alignItems: 'center',
												gap: 10,
												transform:
													isActive || isNew || isVictim
														? `scale(${pulse})`
														: 'scale(1)',
											}}
										>
											<div style={{fontSize: 18, color: COLORS.muted}}>
												{label}
											</div>
											<div style={{fontSize: 34, fontWeight: 700}}>
												key {node.key}
											</div>
											<div style={{fontSize: 24}}>val {node.value}</div>
										</div>
										{index < step.nodes.length - 1 && (
											<div style={{fontSize: 28, color: COLORS.muted}}>
												⇄
											</div>
										)}
									</React.Fragment>
								);
							})
						)}

						<div style={{fontSize: 28, color: COLORS.muted}}>⇄</div>
						<div
							style={{
								padding: '18px 16px',
								borderRadius: 18,
								border: `2px solid ${COLORS.tail}`,
								backgroundColor: '#3c2a15',
								color: '#ffe2b7',
								fontSize: 22,
								fontWeight: 700,
								minWidth: 110,
								textAlign: 'center',
							}}
						>
							TAIL
						</div>
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
						gap: 18,
					}}
				>
					<div style={{fontSize: 26, color: COLORS.muted}}>
						Hash Map
					</div>
					<div style={{fontSize: 20, color: COLORS.muted}}>
						key -&gt; node
					</div>

					<div
						style={{
							display: 'grid',
							gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
							gap: 16,
							flex: 1,
						}}
					>
						{mapEntries.length === 0 ? (
							<div
								style={{
									gridColumn: '1 / -1',
									borderRadius: 20,
									border: `1px dashed ${COLORS.border}`,
									backgroundColor: '#1f2238',
									color: COLORS.muted,
									fontSize: 24,
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
								}}
							>
								map = {'{}'}
							</div>
						) : (
							mapEntries.map((node) => {
								const isActive = step.activeKey === node.key;
								const isVictim = step.victimKey === node.key;
								const isNew = step.newKey === node.key;

								let borderColor = COLORS.border;
								let backgroundColor = '#252941';

								if (isVictim) {
									borderColor = COLORS.evict;
									backgroundColor = '#3b2028';
								} else if (isNew) {
									borderColor = COLORS.put;
									backgroundColor = '#15344f';
								} else if (isActive) {
									borderColor = step.phase === 'get-hit' ? COLORS.hit : COLORS.intro;
									backgroundColor = step.phase === 'get-hit' ? '#173626' : '#3c2a15';
								}

								return (
									<div
										key={node.key}
										style={{
											borderRadius: 20,
											border: `2px solid ${borderColor}`,
											backgroundColor,
											padding: '16px 14px',
											display: 'flex',
											flexDirection: 'column',
											gap: 10,
										}}
									>
										<div style={{fontSize: 20, color: COLORS.muted}}>
											key {node.key}
										</div>
										<div style={{fontSize: 24, fontWeight: 700}}>
											node({node.key}, {node.value})
										</div>
									</div>
								);
							})
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
						<div style={{fontSize: 22, color: COLORS.muted}}>Key Idea</div>
						<div style={{fontSize: 24, lineHeight: 1.5}}>
							map 解决“能找到”，链表解决“能重排”。两者缺一不可。
						</div>
					</div>
				</div>
			</div>

			<div style={{display: 'flex', gap: 24}}>
				<div
					style={{
						flex: 1.05,
						backgroundColor: COLORS.panel,
						borderRadius: 24,
						border: `1px solid ${COLORS.border}`,
						padding: 24,
						display: 'flex',
						flexDirection: 'column',
						gap: 12,
					}}
				>
					<div style={{fontSize: 22, color: COLORS.muted}}>What</div>
					<div style={{fontSize: 25, lineHeight: 1.5}}>{step.what}</div>
				</div>
				<div
					style={{
						flex: 1.05,
						backgroundColor: COLORS.panel,
						borderRadius: 24,
						border: `1px solid ${COLORS.border}`,
						padding: 24,
						display: 'flex',
						flexDirection: 'column',
						gap: 12,
					}}
				>
					<div style={{fontSize: 22, color: COLORS.muted}}>Why</div>
					<div style={{fontSize: 25, lineHeight: 1.5}}>{step.why}</div>
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
						gap: 12,
					}}
				>
					<div style={{fontSize: 22, color: COLORS.muted}}>Invariant</div>
					<div style={{fontSize: 23, lineHeight: 1.5}}>{step.invariant}</div>
				</div>
			</div>
		</AbsoluteFill>
	);
};
