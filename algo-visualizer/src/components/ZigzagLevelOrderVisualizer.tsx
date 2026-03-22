import {useCurrentFrame, useVideoConfig} from 'remotion';
import React from 'react';
import {HiDpiCanvas} from './HiDpiCanvas';
import {
	createEmptyBounds,
	includePointInBounds,
	toPaddedViewBox,
} from './svgBounds';

export type TreeNodeInfo = {
	val: number;
	x: number;
	y: number;
	parentX?: number;
	parentY?: number;
	state: 'normal' | 'current-layer' | 'queued' | 'visited' | 'current';
};

export type ZigzagStep = {
	phase:
		| 'intro'
		| 'start-layer'
		| 'dequeue'
		| 'write'
		| 'enqueue'
		| 'finish-layer'
		| 'summary';
	layer: number;
	leftToRight: boolean;
	queue: number[];
	levelArray: (number | null)[];
	ans: number[][];
	currentNode: number | null;
	currentIndexInLayer: number | null;
	writeIndex: number | null;
	treeNodes: TreeNodeInfo[];
	enqueued: number[];
	actionLabel: string;
	what: string;
	why: string;
	delta: string[];
	invariant: string;
	progress: string;
};

interface ZigzagLevelOrderVisualizerProps {
	steps: ZigzagStep[];
	title: string;
	durationPerStep: number;
}

const COLORS = {
	bg: '#1a1a2e',
	card: '#22243a',
	cardAlt: '#2a2d47',
	text: '#f5f7ff',
	muted: '#b4bddc',
	border: '#515b86',
	current: '#ff9800',
	currentLayer: '#ffd166',
	queued: '#4fc3f7',
	visited: '#4caf50',
	write: '#ab7cff',
};

const FRAME_PADDING = 24;
const LAYOUT_GAP = 16;
const RIGHT_COLUMN_WIDTH = 352;

const phaseColor = (step: ZigzagStep) => {
	if (step.phase === 'write') return COLORS.write;
	if (step.phase === 'enqueue') return COLORS.queued;
	if (step.phase === 'finish-layer') return COLORS.visited;
	if (step.phase === 'summary') return '#b8a1ff';
	return COLORS.current;
};

const nodeAppearance = (state: TreeNodeInfo['state']) => {
	switch (state) {
		case 'current':
			return {fill: COLORS.current, stroke: '#ffffff'};
		case 'current-layer':
			return {fill: '#4a3f2a', stroke: COLORS.currentLayer};
		case 'queued':
			return {fill: '#214661', stroke: COLORS.queued};
		case 'visited':
			return {fill: '#1f4b2d', stroke: COLORS.visited};
		default:
			return {fill: '#262a43', stroke: '#596180'};
	}
};

export const ZigzagLevelOrderVisualizer: React.FC<
	ZigzagLevelOrderVisualizerProps
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
	const treeBounds = createEmptyBounds();

	step.treeNodes.forEach((node) => {
		includePointInBounds(treeBounds, {
			x: node.x,
			y: node.y,
			radius: 24,
			extraBottom: 8,
		});
	});

	const treeViewBox = toPaddedViewBox(treeBounds, {
		padding: 28,
		minWidth: 420,
		minHeight: 220,
	});

	return (
		<HiDpiCanvas
			backgroundColor={COLORS.bg}
		>
			<div
			style={{
				color: COLORS.text,
				fontFamily: "'Fira Code', monospace",
				padding: FRAME_PADDING,
				display: 'flex',
				flexDirection: 'column',
				gap: LAYOUT_GAP,
				boxSizing: 'border-box',
				width: '100%',
				height: '100%',
			}}
		>
			<div
				style={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'flex-start',
					gap: 16,
					flex: '0 0 auto',
				}}
			>
				<div>
					<h1 style={{fontSize: 33, margin: 0, lineHeight: 1.08, fontWeight: 800}}>{title}</h1>
					<div style={{fontSize: 15, color: COLORS.muted, marginTop: 8, fontWeight: 500}}>
						目标：看懂“遍历顺序不变，写入位置翻转”为什么能得到锯齿形层序遍历。
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
					<div style={{fontSize: 13, color: COLORS.muted}}>当前节奏</div>
					<div style={{fontSize: 18, marginTop: 6, fontWeight: 700}}>{step.progress}</div>
					<div style={{fontSize: 12, color: COLORS.muted, marginTop: 8}}>
						{fps} fps | 每步 {durationPerStep / fps}s
					</div>
				</div>
			</div>

			<div
				style={{
					display: 'grid',
					gridTemplateColumns: `minmax(0, 1.5fr) ${RIGHT_COLUMN_WIDTH}px`,
					gap: LAYOUT_GAP,
					flex: 1,
					minHeight: 0,
				}}
			>
				<div
					style={{
						display: 'flex',
						flexDirection: 'column',
						gap: 14,
						minHeight: 0,
					}}
				>
					<div
						style={{
							backgroundColor: COLORS.card,
							borderRadius: 16,
							border: `1px solid ${COLORS.border}`,
							padding: 16,
							display: 'flex',
							justifyContent: 'space-between',
							gap: 16,
							flex: '0 0 auto',
						}}
					>
						<div>
							<div style={{fontSize: 13, color: COLORS.muted}}>输入 / 目标提示</div>
							<div style={{fontSize: 19, marginTop: 6, fontWeight: 600}}>
								示例树：[3, 9, 20, null, null, 15, 7]
							</div>
							<div style={{fontSize: 14, color: COLORS.muted, marginTop: 8}}>
								方向 {step.leftToRight ? '→ 左到右' : '← 右到左'}，层号 {step.layer}
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
							padding: 16,
							display: 'flex',
							flexDirection: 'column',
							gap: 14,
							minHeight: 0,
						}}
					>
						<div style={{fontSize: 13, color: COLORS.muted}}>核心数据结构可视化：树 + 队列 + level[]</div>
						<div
							style={{
								flex: 1,
								minHeight: 0,
								background:
									'radial-gradient(circle at top, rgba(255,209,102,0.15), transparent 45%)',
								borderRadius: 14,
								border: `1px solid ${COLORS.border}`,
								padding: 10,
								overflow: 'hidden',
							}}
						>
							<svg
								width="100%"
								height="100%"
								viewBox={treeViewBox}
								preserveAspectRatio="xMidYMid meet"
								shapeRendering="geometricPrecision"
								textRendering="geometricPrecision"
								style={{display: 'block'}}
							>
								{step.treeNodes.map((node) => {
									const style = nodeAppearance(node.state);
									return (
										<React.Fragment key={node.val}>
											{node.parentX !== undefined && node.parentY !== undefined && (
												<line
													x1={node.parentX}
													y1={node.parentY + 24}
													x2={node.x}
													y2={node.y - 24}
													stroke={style.stroke}
													strokeWidth={node.state === 'normal' ? 2 : 3}
												/>
											)}
											<circle
												cx={node.x}
												cy={node.y}
												r={24}
												fill={style.fill}
												stroke={style.stroke}
												strokeWidth={node.state === 'normal' ? 2 : 3}
											/>
											<text
												x={node.x}
												y={node.y + 7}
												textAnchor="middle"
												fill="white"
												fontSize={18}
												fontWeight="bold"
											>
												{node.val}
											</text>
										</React.Fragment>
									);
								})}
							</svg>
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
								<div style={{fontSize: 14, color: COLORS.muted}}>Queue</div>
								<div style={{display: 'flex', gap: 8, flexWrap: 'wrap', minHeight: 58}}>
									{step.queue.length === 0 && (
										<div style={{fontSize: 15, color: COLORS.muted}}>当前队列为空</div>
									)}
									{step.queue.map((value, index) => (
										<div
											key={`${value}-${index}`}
											style={{
												padding: '10px 12px',
												borderRadius: 12,
												backgroundColor: index === 0 ? '#2e3d57' : '#244661',
												border: index === 0
													? `2px solid ${COLORS.queued}`
													: `1px solid ${COLORS.border}`,
												fontSize: 18,
												fontWeight: 700,
											}}
										>
											{value}
										</div>
									))}
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
								<div style={{fontSize: 14, color: COLORS.muted}}>
									level[] ({step.leftToRight ? '→ 顺序写入' : '← 反向写入'})
								</div>
								<div style={{display: 'flex', gap: 8, flexWrap: 'wrap', minHeight: 58}}>
									{step.levelArray.length === 0 && (
										<div style={{fontSize: 15, color: COLORS.muted}}>当前还没有 level[]</div>
									)}
									{step.levelArray.map((value, index) => (
										<div
											key={`level-${index}`}
											style={{
												width: 58,
												height: 56,
												borderRadius: 12,
												backgroundColor: value === null ? '#262a43' : '#34274f',
												border: step.writeIndex === index
													? `2px solid ${COLORS.write}`
													: `1px solid ${COLORS.border}`,
												display: 'flex',
												flexDirection: 'column',
												alignItems: 'center',
												justifyContent: 'center',
												fontSize: 20,
												fontWeight: 700,
											}}
										>
											<span>{value ?? '_'}</span>
											<span style={{fontSize: 10, color: COLORS.muted}}>
												[{index}]
											</span>
										</div>
									))}
								</div>
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
							<div style={{fontSize: 14, color: COLORS.muted}}>答案累积 ans</div>
							<div style={{fontSize: 17.5, lineHeight: 1.6, color: '#eef3ff', fontWeight: 500}}>
								[
								{step.ans.map((row) => `[${row.join(', ')}]`).join(', ')}
								]
							</div>
						</div>

						<div style={{display: 'flex', gap: 10, flexWrap: 'wrap'}}>
							{[
								{label: '当前节点', color: COLORS.current},
								{label: '当前层', color: COLORS.currentLayer},
								{label: '已入下一层队列', color: COLORS.queued},
								{label: '已写入答案', color: COLORS.visited},
								{label: '当前写入位置', color: COLORS.write},
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
										fontSize: 13.5,
										color: COLORS.muted,
										fontWeight: 500,
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

				<div
					style={{
						display: 'flex',
						flexDirection: 'column',
						gap: 14,
						minHeight: 0,
					}}
				>
					<div
						style={{
							backgroundColor: COLORS.card,
							borderRadius: 16,
							border: `1px solid ${COLORS.border}`,
							padding: 14,
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
								border: `1.5px solid ${phaseColor(step)}`,
								color: phaseColor(step),
								fontSize: 15,
								fontWeight: 700,
							}}
						>
							{step.actionLabel}
						</div>
						<div style={{fontSize: 13, color: COLORS.muted}}>现在在做什么？</div>
						<div style={{fontSize: 15.5, lineHeight: 1.5, fontWeight: 500}}>{step.what}</div>
						<div style={{fontSize: 13, color: COLORS.muted}}>为什么现在要这么做？</div>
						<div style={{fontSize: 15.5, lineHeight: 1.5, fontWeight: 500}}>{step.why}</div>
						<div style={{display: 'flex', gap: 8, flexWrap: 'wrap'}}>
							{step.delta.map((item) => (
								<div
									key={item}
									style={{
										padding: '7px 10px',
										borderRadius: 999,
										backgroundColor: COLORS.cardAlt,
										border: `1px solid ${COLORS.border}`,
										fontSize: 13.5,
										fontWeight: 600,
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
							padding: 14,
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
								fontSize: 15.5,
								lineHeight: 1.6,
								fontWeight: 500,
							}}
						>
							{step.invariant}
						</div>
						<div style={{fontSize: 13, color: COLORS.muted}}>阶段 / 进度</div>
						<div
							style={{
								padding: 12,
								borderRadius: 12,
								backgroundColor: '#20263e',
								border: `1px solid ${COLORS.border}`,
								fontSize: 15.5,
								color: COLORS.text,
								fontWeight: 500,
							}}
						>
							当前已完成 {step.ans.length} 层结果，层方向为{' '}
							{step.leftToRight ? '左 → 右' : '右 → 左'}
						</div>
					</div>
				</div>
			</div>
		</div>
		</HiDpiCanvas>
	);
};
