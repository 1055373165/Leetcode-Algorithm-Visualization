import {useCurrentFrame, useVideoConfig} from 'remotion';
import React from 'react';
import {HiDpiCanvas} from './HiDpiCanvas';

export type SlidingWindowMaxStep = {
	phase: 'intro' | 'consider' | 'expire' | 'prune' | 'append' | 'collect' | 'summary';
	nums: number[];
	k: number;
	currentIndex: number;
	focusIndex: number | null;
	windowLeft: number;
	windowRight: number;
	deque: number[];
	result: (number | null)[];
	removedIndex: number | null;
	resultIndex: number | null;
	actionLabel: string;
	what: string;
	why: string;
	delta: string[];
	invariant: string;
	progress: string;
};

interface SlidingWindowMaxVisualizerProps {
	steps: SlidingWindowMaxStep[];
	title: string;
	durationPerStep: number;
}

const COLORS = {
	bg: '#1a1a2e',
	card: '#22243a',
	cardAlt: '#2a2d47',
	text: '#f4f7ff',
	muted: '#b4bddc',
	border: '#515b86',
	current: '#ff9800',
	window: '#355070',
	candidate: '#4fc3f7',
	max: '#4caf50',
	removed: '#ef5350',
	answer: '#ab7cff',
};

const phaseColor = (step: SlidingWindowMaxStep) => {
	if (step.phase === 'expire') return COLORS.removed;
	if (step.phase === 'prune') return '#ffd166';
	if (step.phase === 'append') return COLORS.candidate;
	if (step.phase === 'collect') return COLORS.answer;
	if (step.phase === 'summary') return '#b8a1ff';
	return COLORS.current;
};

export const SlidingWindowMaxVisualizer: React.FC<
	SlidingWindowMaxVisualizerProps
> = ({steps, title, durationPerStep}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();

	if (!steps.length) {
		return null;
	}

	const currentStepIndex = Math.min(
		Math.floor(frame / durationPerStep),
		steps.length - 1,
	);
	const step = steps[currentStepIndex];

	const cellWidth = 66;
	const cellGap = 8;
	const windowVisible = step.windowRight >= step.windowLeft;
	const windowWidth = windowVisible
		? (step.windowRight - step.windowLeft + 1) * (cellWidth + cellGap) - cellGap
		: 0;
	const windowLeftOffset = step.windowLeft * (cellWidth + cellGap);
	const dequeSet = new Set(step.deque);

	return (
		<HiDpiCanvas
			backgroundColor={COLORS.bg}
		>
			<div
			style={{
				color: COLORS.text,
				fontFamily: "'Fira Code', monospace",
				padding: 28,
				display: 'flex',
				flexDirection: 'column',
				gap: 18,
				boxSizing: 'border-box',
				width: '100%',
				height: '100%',
			}}
		>
			<div style={{display: 'flex', justifyContent: 'space-between', gap: 16}}>
				<div>
					<h1 style={{fontSize: 33, margin: 0, lineHeight: 1.08, fontWeight: 800}}>{title}</h1>
					<div style={{fontSize: 15, color: COLORS.muted, marginTop: 8, fontWeight: 500}}>
						目标：看懂为什么递减 deque 可以同时处理“过期删除”和“最大值维护”。
					</div>
				</div>
				<div
					style={{
						padding: '10px 14px',
						borderRadius: 12,
						backgroundColor: COLORS.card,
						border: `1px solid ${COLORS.border}`,
						minWidth: 220,
					}}
				>
					<div style={{fontSize: 13, color: COLORS.muted}}>当前进度</div>
					<div style={{fontSize: 18, marginTop: 6, fontWeight: 700}}>{step.progress}</div>
					<div style={{fontSize: 12, color: COLORS.muted, marginTop: 8}}>
						{fps} fps | 每步 {durationPerStep / fps}s
					</div>
				</div>
			</div>

			<div style={{display: 'flex', gap: 18, flex: 1}}>
				<div style={{flex: 1.25, display: 'flex', flexDirection: 'column', gap: 16}}>
					<div
						style={{
							backgroundColor: COLORS.card,
							borderRadius: 16,
							border: `1px solid ${COLORS.border}`,
							padding: 18,
							display: 'flex',
							justifyContent: 'space-between',
							gap: 16,
						}}
					>
						<div>
							<div style={{fontSize: 13, color: COLORS.muted}}>输入 / 目标提示</div>
							<div style={{fontSize: 19, marginTop: 6, fontWeight: 600}}>
								nums = [1, 3, -1, -3, 5, 3, 6, 7], k = 3
							</div>
							<div style={{fontSize: 14, color: COLORS.muted, marginTop: 8}}>
								每个完整窗口都要输出最大值，但不重新扫描窗口。
							</div>
						</div>
						<div
							style={{
								padding: '8px 12px',
								borderRadius: 999,
								backgroundColor: `${phaseColor(step)}22`,
								border: `1.5px solid ${phaseColor(step)}`,
								color: phaseColor(step),
								fontSize: 15,
								fontWeight: 700,
								alignSelf: 'flex-start',
							}}
						>
							{step.actionLabel}
						</div>
					</div>

					<div
						style={{
							backgroundColor: COLORS.card,
							borderRadius: 16,
							border: `1px solid ${COLORS.border}`,
							padding: 18,
							display: 'flex',
							flexDirection: 'column',
							gap: 18,
						}}
					>
						<div style={{fontSize: 13, color: COLORS.muted}}>
							核心数据结构可视化：数组窗口 + 单调双端队列
						</div>

						<div style={{display: 'flex', flexDirection: 'column', gap: 12}}>
							<div style={{fontSize: 14, color: COLORS.muted}}>nums[]</div>
							<div style={{position: 'relative', paddingBottom: 18}}>
								<div style={{display: 'flex', gap: cellGap}}>
									{step.nums.map((value, index) => {
										const inWindow =
											index >= step.windowLeft && index <= step.windowRight && windowVisible;
										const isCurrent = index === step.currentIndex;
										const isFocus = index === step.focusIndex;
										const isRemoved = index === step.removedIndex;
										const isHead = step.deque[0] === index;
										const isDequeMember = dequeSet.has(index);

										let backgroundColor = '#262a43';
										let border = `1px solid ${COLORS.border}`;

										if (isRemoved) {
											backgroundColor = '#4b202a';
											border = `2px solid ${COLORS.removed}`;
										} else if (isCurrent) {
											backgroundColor = COLORS.current;
											border = '2px solid white';
										} else if (isHead && inWindow) {
											backgroundColor = '#1f4b2d';
											border = `2px solid ${COLORS.max}`;
										} else if (isDequeMember && inWindow) {
											backgroundColor = '#24486c';
											border = `2px solid ${COLORS.candidate}`;
										} else if (inWindow) {
											backgroundColor = COLORS.window;
										}

										return (
											<div
												key={`${value}-${index}`}
												style={{display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center'}}
											>
												<div
													style={{
														width: cellWidth,
														height: 58,
														borderRadius: 12,
														backgroundColor,
														border,
														display: 'flex',
														alignItems: 'center',
														justifyContent: 'center',
														fontSize: 24,
														fontWeight: isCurrent || isFocus || isHead ? 700 : 500,
														boxSizing: 'border-box',
													}}
												>
													{value}
												</div>
												<div style={{fontSize: 12.5, color: COLORS.muted, fontWeight: 500}}>
													[{index}]
												</div>
												{isHead && inWindow && (
													<div style={{fontSize: 11.5, color: COLORS.max, fontWeight: 700}}>
														MAX
													</div>
												)}
												{isRemoved && (
													<div style={{fontSize: 11.5, color: COLORS.removed, fontWeight: 700}}>
														OUT
													</div>
												)}
											</div>
										);
									})}
								</div>
								{windowVisible && (
									<>
										<div
											style={{
												position: 'absolute',
												top: -10,
												left: windowLeftOffset,
												width: windowWidth,
												height: 4,
												backgroundColor: '#ffc857',
												borderRadius: 999,
											}}
										/>
										<div
											style={{
												position: 'absolute',
												bottom: 2,
												left: windowLeftOffset,
												width: windowWidth,
												height: 4,
												backgroundColor: '#ffc857',
												borderRadius: 999,
											}}
										/>
										<div
											style={{
												position: 'absolute',
												top: -4,
												left: windowLeftOffset,
												fontSize: 12,
												color: '#ffc857',
											}}
										>
											L={step.windowLeft}
										</div>
										<div
											style={{
												position: 'absolute',
												top: -4,
												left: windowLeftOffset + windowWidth - 24,
												fontSize: 12,
												color: '#ffc857',
											}}
										>
											R={step.windowRight}
										</div>
									</>
								)}
							</div>
						</div>

						<div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16}}>
							<div
								style={{
									backgroundColor: COLORS.cardAlt,
									borderRadius: 14,
									border: `1px solid ${COLORS.border}`,
									padding: 14,
									display: 'flex',
									flexDirection: 'column',
									gap: 10,
								}}
							>
								<div style={{fontSize: 14, color: COLORS.muted}}>
									Monotonic deque
								</div>
								<div style={{display: 'flex', gap: 8, flexWrap: 'wrap', minHeight: 62}}>
									{step.deque.length === 0 && (
										<div style={{fontSize: 15, color: COLORS.muted}}>
											当前为空，等待候选入队
										</div>
									)}
									{step.deque.map((index, dequeIndex) => {
										const isHead = dequeIndex === 0;
										const isCurrent = index === step.currentIndex;
										return (
											<div
												key={`deque-${index}-${dequeIndex}`}
												style={{
													padding: '10px 12px',
													borderRadius: 12,
													backgroundColor: isHead ? '#1f4b2d' : '#223754',
													border: isHead
														? `2px solid ${COLORS.max}`
														: isCurrent
															? `2px solid ${COLORS.current}`
															: `1px solid ${COLORS.border}`,
													display: 'flex',
													flexDirection: 'column',
													gap: 4,
													minWidth: 72,
												}}
											>
												<div style={{fontSize: 12, color: COLORS.muted}}>
													{isHead ? 'front' : 'candidate'}
												</div>
												<div style={{fontSize: 17, fontWeight: 700}}>
													{index}({step.nums[index]})
												</div>
											</div>
										);
									})}
								</div>
							</div>

							<div
								style={{
									backgroundColor: COLORS.cardAlt,
									borderRadius: 14,
									border: `1px solid ${COLORS.border}`,
									padding: 14,
									display: 'flex',
									flexDirection: 'column',
									gap: 10,
								}}
							>
								<div style={{fontSize: 14, color: COLORS.muted}}>result[]</div>
								<div style={{display: 'flex', gap: 8, flexWrap: 'wrap'}}>
									{step.result.map((value, index) => {
										const isActive = step.resultIndex === index;
										return (
											<div
												key={`result-${index}`}
												style={{
													width: 56,
													height: 50,
													borderRadius: 12,
													backgroundColor: value === null ? '#262a43' : '#35274f',
													border: isActive
														? `2px solid ${COLORS.answer}`
														: `1px solid ${COLORS.border}`,
													display: 'flex',
													alignItems: 'center',
													justifyContent: 'center',
													fontSize: 20,
													fontWeight: 700,
													color: value === null ? COLORS.muted : '#efe2ff',
												}}
											>
												{value ?? '_'}
											</div>
										);
									})}
								</div>
							</div>
						</div>

						<div style={{display: 'flex', gap: 10, flexWrap: 'wrap'}}>
							{[
								{label: '当前元素', color: COLORS.current},
								{label: '窗口范围', color: COLORS.window},
								{label: 'deque 候选', color: COLORS.candidate},
								{label: '窗口最大值', color: COLORS.max},
								{label: '被移除 / 过期', color: COLORS.removed},
								{label: '写入答案', color: COLORS.answer},
							].map((item) => (
								<div
									key={item.label}
									style={{
										display: 'flex',
										alignItems: 'center',
										gap: 8,
										padding: '8px 10px',
										borderRadius: 999,
										backgroundColor: '#262a43',
										border: `1px solid ${COLORS.border}`,
										fontSize: 13,
										color: COLORS.muted,
									}}
								>
									<span
										style={{
											width: 10,
											height: 10,
											borderRadius: 999,
											backgroundColor: item.color,
											display: 'inline-block',
										}}
									/>
									{item.label}
								</div>
							))}
						</div>
					</div>
				</div>

				<div style={{width: 390, display: 'flex', flexDirection: 'column', gap: 16}}>
					<div
						style={{
							backgroundColor: COLORS.card,
							borderRadius: 16,
							border: `1px solid ${COLORS.border}`,
							padding: 16,
							display: 'flex',
							flexDirection: 'column',
							gap: 12,
						}}
					>
						<div style={{fontSize: 13, color: COLORS.muted}}>当前操作说明</div>
						<div
							style={{
								padding: '8px 10px',
								borderRadius: 10,
								backgroundColor: COLORS.cardAlt,
								border: `1px solid ${phaseColor(step)}`,
								color: phaseColor(step),
								fontSize: 15,
								fontWeight: 700,
							}}
						>
							{step.actionLabel}
						</div>
						<div style={{fontSize: 13, color: COLORS.muted}}>现在在做什么？</div>
						<div style={{fontSize: 16, lineHeight: 1.55}}>{step.what}</div>
						<div style={{fontSize: 13, color: COLORS.muted}}>为什么现在要这么做？</div>
						<div style={{fontSize: 16, lineHeight: 1.55}}>{step.why}</div>
						<div style={{display: 'flex', gap: 8, flexWrap: 'wrap'}}>
							{step.delta.map((item) => (
								<div
									key={item}
									style={{
										padding: '7px 10px',
										borderRadius: 999,
										backgroundColor: COLORS.cardAlt,
										border: `1px solid ${COLORS.border}`,
										fontSize: 13,
									}}
								>
									{item}
								</div>
							))}
						</div>
					</div>

					<div
						style={{
							backgroundColor: COLORS.card,
							borderRadius: 16,
							border: `1px solid ${COLORS.border}`,
							padding: 16,
							display: 'flex',
							flexDirection: 'column',
							gap: 12,
						}}
					>
						<div style={{fontSize: 13, color: COLORS.muted}}>不变量提示</div>
						<div
							style={{
								padding: 12,
								borderRadius: 12,
								backgroundColor: COLORS.cardAlt,
								border: `1px solid ${COLORS.border}`,
								fontSize: 15,
								lineHeight: 1.6,
							}}
						>
							{step.invariant}
						</div>
						<div style={{fontSize: 13, color: COLORS.muted}}>答案推进</div>
						<div
							style={{
								padding: 12,
								borderRadius: 12,
								backgroundColor: '#20263e',
								border: `1px solid ${COLORS.border}`,
								fontSize: 15,
								color: COLORS.text,
							}}
						>
							当前已收集 {step.result.filter((value) => value !== null).length} /{' '}
							{step.result.length} 个窗口答案
						</div>
					</div>
				</div>
			</div>
		</div>
		</HiDpiCanvas>
	);
};
