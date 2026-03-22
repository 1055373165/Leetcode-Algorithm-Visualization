import {useCurrentFrame, useVideoConfig} from 'remotion';
import React from 'react';
import {HiDpiCanvas} from './HiDpiCanvas';
import {
	createEmptyBounds,
	includePointInBounds,
	toPaddedViewBox,
} from './svgBounds';

export type TrieNodeSnapshot = {
	char: string;
	path: string;
	depth: number;
	isEnd: boolean;
	children: TrieNodeSnapshot[];
	state: 'normal' | 'path' | 'current' | 'new';
};

export type TrieScriptOperation = {
	type: 'insert' | 'search' | 'startsWith';
	word: string;
};

export type ImplementTrieStep = {
	phase:
		| 'intro'
		| 'start'
		| 'traverse'
		| 'create'
		| 'mark-end'
		| 'check'
		| 'result'
		| 'summary';
	operationIndex: number;
	operationType: 'insert' | 'search' | 'startsWith' | 'summary';
	word: string;
	currentCharIndex: number;
	currentChar: string | null;
	currentPath: string;
	trieSnapshot: TrieNodeSnapshot;
	actionLabel: string;
	what: string;
	why: string;
	delta: string[];
	invariant: string;
	progress: string;
	resultText: string | null;
	scriptResults: (string | null)[];
};

interface ImplementTrieVisualizerProps {
	steps: ImplementTrieStep[];
	title: string;
	script: TrieScriptOperation[];
	durationPerStep: number;
}

const COLORS = {
	bg: '#1a1a2e',
	card: '#22243a',
	cardAlt: '#2a2d47',
	text: '#f3f5ff',
	muted: '#b4bddc',
	border: '#515b86',
	current: '#ff9800',
	path: '#4fc3f7',
	newNode: '#26c6da',
	valid: '#4caf50',
	invalid: '#ef5350',
	summary: '#ab7cff',
	history: '#62719a',
};

const FRAME_PADDING = 20;
const LAYOUT_GAP = 14;
const RIGHT_COLUMN_WIDTH = 392;

const OP_LABEL: Record<TrieScriptOperation['type'], string> = {
	insert: 'INSERT',
	search: 'SEARCH',
	startsWith: 'STARTS WITH',
};

const phaseColor = (step: ImplementTrieStep) => {
	if (step.phase === 'create') return COLORS.newNode;
	if (step.phase === 'mark-end') return COLORS.valid;
	if (step.phase === 'summary') return COLORS.summary;
	if (step.phase === 'result') {
		if (step.resultText === 'TRUE' || step.resultText === 'OK') return COLORS.valid;
		if (step.resultText === 'FALSE') return COLORS.invalid;
	}
	if (step.phase === 'check') return '#ffd166';
	return COLORS.current;
};

const resultChipStyle = (value: string | null) => {
	if (value === 'TRUE' || value === 'OK') {
		return {
			backgroundColor: '#173626',
			border: `1px solid ${COLORS.valid}`,
			color: '#ccffda',
		};
	}
	if (value === 'FALSE') {
		return {
			backgroundColor: '#3b2028',
			border: `1px solid ${COLORS.invalid}`,
			color: '#ffd7dd',
		};
	}
	return {
		backgroundColor: '#252941',
		border: `1px solid ${COLORS.border}`,
		color: '#c6cee7',
	};
};

const nodeStyle = (node: TrieNodeSnapshot) => {
	if (node.state === 'current') {
		return {fill: COLORS.current, stroke: '#ffffff'};
	}
	if (node.state === 'new') {
		return {fill: COLORS.newNode, stroke: '#d5fbff'};
	}
	if (node.state === 'path') {
		return {fill: '#29568a', stroke: COLORS.path};
	}
	return {fill: '#252941', stroke: '#586181'};
};

type TrieLayoutTree = {
	snapshot: TrieNodeSnapshot;
	xUnit: number;
	children: TrieLayoutTree[];
};

type TrieRenderNode = {
	id: string;
	char: string;
	path: string;
	isEnd: boolean;
	state: TrieNodeSnapshot['state'];
	x: number;
	y: number;
	radius: number;
	parentX?: number;
	parentY?: number;
	parentRadius?: number;
};

const buildTrieLayoutTree = (
	node: TrieNodeSnapshot,
	nextLeafRef: {value: number},
): TrieLayoutTree => {
	const children = node.children.map((child) =>
		buildTrieLayoutTree(child, nextLeafRef),
	);
	const xUnit =
		children.length === 0
			? nextLeafRef.value++
			: children.reduce((sum, child) => sum + child.xUnit, 0) / children.length;

	return {
		snapshot: node,
		xUnit,
		children,
	};
};

const buildTrieGraph = (
	root: TrieNodeSnapshot,
): {
	nodes: TrieRenderNode[];
	viewBox: string;
} => {
	const getMaxDepth = (node: TrieNodeSnapshot): number => {
		if (!node.children.length) {
			return node.depth;
		}
		return Math.max(...node.children.map((child) => getMaxDepth(child)));
	};

	const nextLeafRef = {value: 0};
	const layoutRoot = buildTrieLayoutTree(root, nextLeafRef);
	const leafCount = Math.max(nextLeafRef.value, 1);
	const maxDepth = getMaxDepth(root);
	const horizontalGap = Math.max(74, 108 - Math.max(0, leafCount - 3) * 5);
	const verticalGap = Math.max(50, 72 - Math.max(0, maxDepth - 4) * 4);
	const leftInset = 48;
	const topInset = 36;
	const nodes: TrieRenderNode[] = [];
	const bounds = createEmptyBounds();

	const visit = (
		node: TrieLayoutTree,
		parent?: TrieRenderNode,
	) => {
		const radius = node.snapshot.char === 'root' ? 24 : 22;
		const x = leftInset + node.xUnit * horizontalGap;
		const y = topInset + node.snapshot.depth * verticalGap;
		const renderNode: TrieRenderNode = {
			id: node.snapshot.path || 'root',
			char: node.snapshot.char,
			path: node.snapshot.path,
			isEnd: node.snapshot.isEnd,
			state: node.snapshot.state,
			x,
			y,
			radius,
			parentX: parent?.x,
			parentY: parent?.y,
			parentRadius: parent?.radius,
		};

		nodes.push(renderNode);
		includePointInBounds(bounds, {
			x,
			y,
			radius,
			extraRight: node.snapshot.isEnd ? 42 : 0,
			extraBottom: 10,
		});

		node.children.forEach((child) => visit(child, renderNode));
	};

	visit(layoutRoot);

	return {
		nodes,
		viewBox: toPaddedViewBox(bounds, {
			padding: 28,
			minWidth: Math.max(leafCount * horizontalGap + 120, 320),
			minHeight: Math.max(maxDepth * verticalGap + 120, 240),
		}),
	};
};

const TrieGraph: React.FC<{root: TrieNodeSnapshot}> = ({root}) => {
	const {nodes, viewBox} = buildTrieGraph(root);

	return (
		<svg
			width="100%"
			height="100%"
			viewBox={viewBox}
			preserveAspectRatio="xMidYMid meet"
			shapeRendering="geometricPrecision"
			textRendering="geometricPrecision"
			style={{display: 'block'}}
		>
			{nodes.map((node) => (
				<React.Fragment key={node.id}>
					{node.parentX !== undefined &&
						node.parentY !== undefined &&
						node.parentRadius !== undefined && (
							<line
								x1={node.parentX}
								y1={node.parentY + node.parentRadius}
								x2={node.x}
								y2={node.y - node.radius}
								stroke={
									node.state === 'current'
										? '#ffffff'
										: node.state === 'new'
											? COLORS.newNode
											: node.state === 'path'
												? COLORS.path
												: '#46506c'
								}
								strokeWidth={node.state === 'normal' ? 1.5 : 3}
							/>
						)}

					<circle
						cx={node.x}
						cy={node.y}
						r={node.radius}
						fill={nodeStyle({
							char: node.char,
							path: node.path,
							depth: 0,
							isEnd: node.isEnd,
							children: [],
							state: node.state,
						}).fill}
						stroke={
							node.isEnd
								? COLORS.valid
								: nodeStyle({
										char: node.char,
										path: node.path,
										depth: 0,
										isEnd: node.isEnd,
										children: [],
										state: node.state,
								  }).stroke
						}
						strokeWidth={node.state === 'normal' ? 1.5 : 3}
					/>
					<text
						x={node.x}
						y={node.y + 6}
						textAnchor="middle"
						fill="white"
						fontSize={node.char === 'root' ? 12 : 18}
						fontWeight="bold"
						fontFamily="'Fira Code', monospace"
					>
						{node.char === 'root' ? 'root' : node.char}
					</text>
					{node.isEnd && (
						<text
							x={node.x + node.radius + 5}
							y={node.y + 4}
							fill={COLORS.valid}
							fontSize={12}
							fontWeight="bold"
							fontFamily="'Fira Code', monospace"
						>
							END
						</text>
					)}
				</React.Fragment>
			))}
		</svg>
	);
};

const WordTrack: React.FC<{step: ImplementTrieStep}> = ({step}) => {
	if (!step.word) {
		return (
			<div
				style={{
					padding: '12px 14px',
					borderRadius: 12,
					backgroundColor: COLORS.cardAlt,
					border: `1px solid ${COLORS.border}`,
					color: COLORS.muted,
					fontSize: 16,
				}}
			>
				当前不是字符遍历步骤，正在做概念总结。
			</div>
		);
	}

	return (
		<div style={{display: 'flex', gap: 8, flexWrap: 'wrap'}}>
			{step.word.split('').map((char, index) => {
				const isCurrent = index === step.currentCharIndex;
				const isPath = index < step.currentCharIndex;
				return (
					<div
						key={`${char}-${index}`}
						style={{
							width: 42,
							height: 46,
							borderRadius: 10,
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							backgroundColor: isCurrent
								? COLORS.current
								: isPath
									? '#29568a'
									: '#262a43',
							border: isCurrent
								? '2px solid white'
								: `1px solid ${isPath ? COLORS.path : COLORS.border}`,
							fontSize: 22,
							fontWeight: isCurrent ? 700 : 500,
						}}
					>
						{char}
					</div>
				);
			})}
		</div>
	);
};

export const ImplementTrieVisualizer: React.FC<ImplementTrieVisualizerProps> = ({
	steps,
	title,
	script,
	durationPerStep,
}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();

	if (!steps.length) {
		return null;
	}

	const defaultDuration = durationPerStep || Math.max(fps * 1.5, 1);
	const currentStepIndex = Math.min(
		Math.floor(frame / defaultDuration),
		steps.length - 1,
	);
	const step = steps[currentStepIndex];

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
					<h1 style={{fontSize: 31, margin: 0, lineHeight: 1.08, fontWeight: 800}}>{title}</h1>
					<div style={{fontSize: 15, color: COLORS.muted, marginTop: 6, fontWeight: 500}}>
						目标：看懂 Trie 如何复用公共前缀，以及为什么 search 与
						startsWith 只差最后一次 isEnd 检查。
					</div>
				</div>
				<div
					style={{
						padding: '9px 13px',
						borderRadius: 12,
						backgroundColor: COLORS.card,
						border: `1px solid ${COLORS.border}`,
						minWidth: 188,
						flexShrink: 0,
					}}
				>
					<div style={{fontSize: 13, color: COLORS.muted}}>当前节奏</div>
					<div style={{fontSize: 18, marginTop: 5, fontWeight: 700}}>{step.progress}</div>
					<div style={{fontSize: 12, color: COLORS.muted, marginTop: 6}}>
						{fps} fps | 每步 {durationPerStep / fps}s
					</div>
				</div>
			</div>

			<div
				style={{
					display: 'grid',
					gridTemplateColumns: `minmax(0, 1.6fr) ${RIGHT_COLUMN_WIDTH}px`,
					gap: LAYOUT_GAP,
					flex: 1,
					minHeight: 0,
				}}
			>
				<div
					style={{
						display: 'flex',
						flexDirection: 'column',
						gap: 12,
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
							gap: 10,
							flex: '0 0 auto',
						}}
					>
						<div style={{display: 'flex', justifyContent: 'space-between', gap: 12}}>
							<div>
								<div style={{fontSize: 13, color: COLORS.muted}}>输入 / 目标</div>
								<div style={{fontSize: 17, marginTop: 4, lineHeight: 1.35, fontWeight: 600}}>
									脚本围绕 `"apple"` 与 `"app"`，专门比较路径存在和单词存在的区别。
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

						<WordTrack step={step} />
					</div>

					<div
						style={{
							flex: 1,
							minHeight: 0,
							backgroundColor: COLORS.card,
							borderRadius: 16,
							border: `1px solid ${COLORS.border}`,
							padding: 14,
							display: 'flex',
							flexDirection: 'column',
							gap: 12,
						}}
					>
						<div style={{fontSize: 13, color: COLORS.muted}}>
							核心数据结构可视化
						</div>
						<div
							style={{
								flex: 1,
								minHeight: 0,
								background:
									'radial-gradient(circle at top, rgba(79,195,247,0.12), transparent 45%)',
								borderRadius: 14,
								border: `1px solid ${COLORS.border}`,
								padding: 10,
								overflow: 'hidden',
							}}
						>
							<TrieGraph root={step.trieSnapshot} />
						</div>

						<div style={{display: 'flex', gap: 10, flexWrap: 'wrap'}}>
							{[
								{label: '当前焦点', color: COLORS.current},
								{label: '当前路径', color: COLORS.path},
								{label: '新建节点', color: COLORS.newNode},
								{label: '词尾 isEnd', color: COLORS.valid},
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
						display: 'grid',
						gridTemplateRows: 'minmax(0, 0.78fr) minmax(0, 1.22fr)',
						gap: 12,
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
							gap: 8,
							minHeight: 0,
						}}
					>
						<div style={{fontSize: 13, color: COLORS.muted}}>脚本 / 结果推进</div>
						<div
							style={{
								display: 'grid',
								gridTemplateColumns: '1fr 1fr',
								gap: 6,
							}}
						>
							{script.map((item, index) => {
								const isActive = step.operationIndex === index;
								const result = step.scriptResults[index];
								return (
									<div
										key={`${item.type}-${item.word}-${index}`}
										style={{
											display: 'flex',
											flexDirection: 'column',
											gap: 6,
											padding: '8px 9px',
											borderRadius: 11,
											backgroundColor: isActive ? '#2d3354' : '#262a43',
											border: isActive
												? `1px solid ${phaseColor(step)}`
												: `1px solid ${COLORS.border}`,
										}}
									>
										<div
											style={{
												display: 'flex',
												justifyContent: 'space-between',
												alignItems: 'center',
												gap: 8,
											}}
										>
											<span style={{fontSize: 11, color: COLORS.muted}}>
												{OP_LABEL[item.type]}
											</span>
											<div
												style={{
													padding: '4px 7px',
													borderRadius: 999,
													fontSize: 10.5,
													fontWeight: 700,
													...resultChipStyle(result),
												}}
											>
												{result ?? 'PENDING'}
											</div>
										</div>
										<span style={{fontSize: 13.5, lineHeight: 1.25, fontWeight: 600}}>
											{item.type}("{item.word}")
										</span>
									</div>
								);
							})}
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
							gap: 9,
							minHeight: 0,
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
						<div style={{fontSize: 14.5, lineHeight: 1.48, fontWeight: 500}}>
							<span style={{fontSize: 12, color: COLORS.muted}}>现在在做什么：</span>{' '}
							{step.what}
						</div>
						<div style={{fontSize: 14.5, lineHeight: 1.48, fontWeight: 500}}>
							<span style={{fontSize: 12, color: COLORS.muted}}>为什么现在要这么做：</span>{' '}
							{step.why}
						</div>
						{step.delta.length > 0 && (
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
											color: COLORS.text,
											fontWeight: 600,
										}}
									>
										{item}
									</div>
								))}
							</div>
						)}
						{step.resultText && (
							<div
								style={{
									padding: '8px 12px',
									borderRadius: 999,
									alignSelf: 'flex-start',
									fontSize: 13.5,
									fontWeight: 700,
									...resultChipStyle(step.resultText),
								}}
							>
								结果：{step.resultText}
							</div>
						)}
						<div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10}}>
							<div
								style={{
									padding: 10,
									borderRadius: 12,
									backgroundColor: COLORS.cardAlt,
									border: `1px solid ${COLORS.border}`,
									display: 'flex',
									flexDirection: 'column',
									gap: 5,
								}}
							>
								<div style={{fontSize: 12, color: COLORS.muted}}>不变量</div>
								<div style={{fontSize: 13.5, lineHeight: 1.42, fontWeight: 500}}>
									{step.invariant}
								</div>
							</div>
							<div
								style={{
									padding: 10,
									borderRadius: 12,
									backgroundColor: '#20263e',
									border: `1px solid ${COLORS.border}`,
									display: 'flex',
									flexDirection: 'column',
									gap: 5,
								}}
							>
								<div style={{fontSize: 12, color: COLORS.muted}}>当前路径 / 结果推进</div>
								<div style={{fontSize: 13.5, lineHeight: 1.35, color: COLORS.text, fontWeight: 600}}>
									{step.currentPath || 'root'}
								</div>
								<div style={{fontSize: 12.5, color: COLORS.muted, fontWeight: 500}}>{step.progress}</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
		</HiDpiCanvas>
	);
};
