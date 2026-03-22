import React from 'react';
import {
	TreeNodeInfo,
	ZigzagLevelOrderVisualizer,
	ZigzagStep,
} from '../components/ZigzagLevelOrderVisualizer';

interface TNode {
	val: number;
	left: TNode | null;
	right: TNode | null;
}

const root: TNode = {
	val: 3,
	left: {val: 9, left: null, right: null},
	right: {
		val: 20,
		left: {val: 15, left: null, right: null},
		right: {val: 7, left: null, right: null},
	},
};

const computeTreeLayout = (node: TNode): TreeNodeInfo[] => {
	const nodes: TreeNodeInfo[] = [];
	const traverse = (
		current: TNode | null,
		x: number,
		y: number,
		spread: number,
		parentX?: number,
		parentY?: number,
	) => {
		if (!current) {
			return;
		}
		nodes.push({
			val: current.val,
			x,
			y,
			parentX,
			parentY,
			state: 'normal',
		});
		traverse(current.left, x - spread, y + 86, spread / 2, x, y);
		traverse(current.right, x + spread, y + 86, spread / 2, x, y);
	};

	traverse(node, 360, 40, 150);
	return nodes;
};

const baseTreeLayout = computeTreeLayout(root);
const INVARIANT =
	'队列始终按标准 BFS 的左子节点、右子节点入队；锯齿效果只通过本层写入下标翻转来实现。';

const makeTreeSnapshot = ({
	visited,
	currentLayer,
	queued,
	currentNode,
}: {
	visited: Set<number>;
	currentLayer: Set<number>;
	queued: Set<number>;
	currentNode: number | null;
}): TreeNodeInfo[] =>
	baseTreeLayout.map((node) => ({
		...node,
		state:
			currentNode === node.val
				? 'current'
				: currentLayer.has(node.val)
					? 'current-layer'
					: queued.has(node.val)
						? 'queued'
						: visited.has(node.val)
							? 'visited'
							: 'normal',
	}));

const steps: ZigzagStep[] = [];
const ans: number[][] = [];
const queue: TNode[] = [root];
const visited = new Set<number>();
let layer = 0;
let leftToRight = true;

const pushStep = (step: ZigzagStep) => {
	steps.push(step);
};

pushStep({
	phase: 'intro',
	layer: 0,
	leftToRight: true,
	queue: [root.val],
	levelArray: [],
	ans: [],
	currentNode: null,
	currentIndexInLayer: null,
	writeIndex: null,
	treeNodes: makeTreeSnapshot({
		visited,
		currentLayer: new Set([root.val]),
		queued: new Set(),
		currentNode: null,
	}),
	enqueued: [],
	actionLabel: '先锁定这题真正的关键点',
	what:
		'这不是“改入队顺序”的题，而是“BFS 顺序不变，只翻转本层写入位置”的题。',
	why:
		'如果改了入队顺序，就会连带影响下一层节点的排列；正确做法是把遍历顺序和输出顺序分离。',
	delta: ['示例树：[3,9,20,null,null,15,7]', '第 0 层从左到右，第 1 层从右到左'],
	invariant: INVARIANT,
	progress: '准备开始层序遍历',
});

while (queue.length > 0) {
	const size = queue.length;
	const currentLayer = new Set(queue.map((node) => node.val));
	const levelArray: (number | null)[] = new Array(size).fill(null);

	pushStep({
		phase: 'start-layer',
		layer,
		leftToRight,
		queue: queue.map((node) => node.val),
		levelArray: [...levelArray],
		ans: ans.map((row) => [...row]),
		currentNode: null,
		currentIndexInLayer: null,
		writeIndex: null,
		treeNodes: makeTreeSnapshot({
			visited,
			currentLayer,
			queued: new Set(),
			currentNode: null,
		}),
		enqueued: [],
		actionLabel: `开始处理第 ${layer} 层`,
		what: `当前层共有 ${size} 个节点，方向是 ${
			leftToRight ? '从左到右' : '从右到左'
		}。`,
		why:
			'我们会先锁定当前层大小，再逐个出队；这样可以确保只处理这一层，不让下一层混进来。',
		delta: [`level[] 预分配 ${size} 个位置`],
		invariant: INVARIANT,
		progress: `准备处理第 ${layer} 层`,
	});

	for (let i = 0; i < size; i++) {
		const node = queue.shift()!;

		pushStep({
			phase: 'dequeue',
			layer,
			leftToRight,
			queue: queue.map((item) => item.val),
			levelArray: [...levelArray],
			ans: ans.map((row) => [...row]),
			currentNode: node.val,
			currentIndexInLayer: i,
			writeIndex: null,
			treeNodes: makeTreeSnapshot({
				visited,
				currentLayer,
				queued: new Set(queue.map((item) => item.val).filter((val) => !currentLayer.has(val))),
				currentNode: node.val,
			}),
			enqueued: [],
			actionLabel: `出队当前节点 ${node.val}`,
			what: `按照标准 BFS 顺序，当前处理的是本层第 ${i + 1} 个节点 ${node.val}。`,
			why:
				'无论最终要不要“锯齿”，当前层的访问顺序都必须保持 BFS 的从左到右，这样下一层队列才不会乱。',
			delta: [`当前层索引 i = ${i}`],
			invariant: INVARIANT,
			progress: `第 ${layer} 层，正在处理第 ${i + 1}/${size} 个节点`,
		});

		const writeIndex = leftToRight ? i : size - 1 - i;
		levelArray[writeIndex] = node.val;
		visited.add(node.val);

		pushStep({
			phase: 'write',
			layer,
			leftToRight,
			queue: queue.map((item) => item.val),
			levelArray: [...levelArray],
			ans: ans.map((row) => [...row]),
			currentNode: node.val,
			currentIndexInLayer: i,
			writeIndex,
			treeNodes: makeTreeSnapshot({
				visited,
				currentLayer,
				queued: new Set(queue.map((item) => item.val).filter((val) => !currentLayer.has(val))),
				currentNode: node.val,
			}),
			enqueued: [],
			actionLabel: `把 ${node.val} 写入 level[${writeIndex}]`,
			what:
				leftToRight
					? `当前层方向为左到右，所以第 ${i + 1} 个出队节点直接写到 level[${i}]。`
					: `当前层方向为右到左，所以第 ${i + 1} 个出队节点写到 level[${size - 1 - i}]。`,
			why:
				leftToRight
					? '偶数层直接顺序写入即可。'
					: '我们不改变出队顺序，只翻转写入位置，就能得到锯齿效果而不干扰下一层的队列。',
			delta: [`level = [${levelArray.map((value) => value ?? '_').join(', ')}]`],
			invariant: INVARIANT,
			progress: `第 ${layer} 层，正在处理第 ${i + 1}/${size} 个节点`,
		});

		if (!leftToRight && i === 0) {
			pushStep({
				phase: 'write',
				layer,
				leftToRight,
				queue: queue.map((item) => item.val),
				levelArray: [...levelArray],
				ans: ans.map((row) => [...row]),
				currentNode: node.val,
				currentIndexInLayer: i,
				writeIndex,
				treeNodes: makeTreeSnapshot({
					visited,
					currentLayer,
					queued: new Set(queue.map((item) => item.val).filter((val) => !currentLayer.has(val))),
					currentNode: node.val,
				}),
				enqueued: [],
				actionLabel: '关键点：出队顺序不变，写入位置翻转',
				what: `节点 ${node.val} 仍然是这一层第一个出队的节点，但它被写到了最右侧位置 level[${writeIndex}]。`,
				why:
					'这正是本题的核心思想：BFS 的访问顺序保持稳定，锯齿只出现在输出数组的下标计算里。',
				delta: ['不要改子节点入队顺序', '只改 writeIndex'],
				invariant: INVARIANT,
				progress: `第 ${layer} 层关键转折`,
			});
		}

		const enqueued: number[] = [];
		if (node.left) {
			queue.push(node.left);
			enqueued.push(node.left.val);
		}
		if (node.right) {
			queue.push(node.right);
			enqueued.push(node.right.val);
		}

		if (enqueued.length > 0) {
			pushStep({
				phase: 'enqueue',
				layer,
				leftToRight,
				queue: queue.map((item) => item.val),
				levelArray: [...levelArray],
				ans: ans.map((row) => [...row]),
				currentNode: node.val,
				currentIndexInLayer: i,
				writeIndex,
				treeNodes: makeTreeSnapshot({
					visited,
					currentLayer,
					queued: new Set(queue.map((item) => item.val).filter((val) => !currentLayer.has(val))),
					currentNode: node.val,
				}),
				enqueued,
				actionLabel: `把 ${enqueued.join(', ')} 加入下一层队列`,
				what: `节点 ${node.val} 的子节点按“左、右”顺序入队：[${
					enqueued.join(', ')
				}]。`,
				why:
					'无论当前层方向如何，下一层的队列顺序都必须保持标准 BFS，这样层与层之间的逻辑才不会串掉。',
				delta: [`queue = [${queue.map((item) => item.val).join(', ')}]`],
				invariant: INVARIANT,
				progress: `第 ${layer} 层，已处理 ${i + 1}/${size} 个节点`,
			});
		}
	}

	const completedLevel = levelArray.map((value) => value as number);
	ans.push(completedLevel);

	pushStep({
		phase: 'finish-layer',
		layer,
		leftToRight,
		queue: queue.map((node) => node.val),
		levelArray: [...levelArray],
		ans: ans.map((row) => [...row]),
		currentNode: null,
		currentIndexInLayer: null,
		writeIndex: null,
		treeNodes: makeTreeSnapshot({
			visited,
			currentLayer: new Set(),
			queued: new Set(queue.map((node) => node.val)),
			currentNode: null,
		}),
		enqueued: [],
		actionLabel: `第 ${layer} 层完成，准备翻转方向`,
		what: `本层结果是 [${completedLevel.join(', ')}]，它已经追加到答案里。`,
		why:
			'锯齿要求相邻层方向交替，所以处理完一层后要把 leftToRight 翻转，供下一层使用。',
		delta: [`ans = [${ans.map((row) => `[${row.join(', ')}]`).join(', ')}]`],
		invariant: INVARIANT,
		progress: `第 ${layer} 层处理完成`,
	});

	leftToRight = !leftToRight;
	layer++;
}

pushStep({
	phase: 'summary',
	layer: layer - 1,
	leftToRight,
	queue: [],
	levelArray: [],
	ans: ans.map((row) => [...row]),
	currentNode: null,
	currentIndexInLayer: null,
	writeIndex: null,
	treeNodes: makeTreeSnapshot({
		visited,
		currentLayer: new Set(),
		queued: new Set(),
		currentNode: null,
	}),
	enqueued: [],
	actionLabel: '总结 1：真正的锯齿来自哪里',
	what:
		'真正翻转的是本层 level[] 的写入下标，而不是 BFS 遍历顺序或子节点入队顺序。',
	why:
		'这样做既保留了层序遍历的稳定性，又能在 O(1) 时间内为每个节点决定正确的输出位置。',
	delta: ['左到右：writeIndex = i', '右到左：writeIndex = size - 1 - i'],
	invariant: INVARIANT,
	progress: '总结 1/2',
});

pushStep({
	phase: 'summary',
	layer: layer - 1,
	leftToRight,
	queue: [],
	levelArray: [],
	ans: ans.map((row) => [...row]),
	currentNode: null,
	currentIndexInLayer: null,
	writeIndex: null,
	treeNodes: makeTreeSnapshot({
		visited,
		currentLayer: new Set(),
		queued: new Set(),
		currentNode: null,
	}),
	enqueued: [],
	actionLabel: '总结 2：复杂度与正确性',
	what: `最终答案是 [${ans.map((row) => `[${row.join(', ')}]`).join(', ')}]。每个节点只入队一次、出队一次。`,
	why:
		'所以时间复杂度是 O(n)，空间复杂度是 O(n)。正确性来自 BFS 分层不变，加上每层按方向计算 writeIndex。',
	delta: ['时间复杂度 O(n)', '空间复杂度 O(n)'],
	invariant: INVARIANT,
	progress: '总结 2/2',
});

export const ZIGZAG_LEVEL_ORDER_DURATION_PER_STEP = 42;
export const ZIGZAG_LEVEL_ORDER_TOTAL_FRAMES =
	steps.length * ZIGZAG_LEVEL_ORDER_DURATION_PER_STEP;

export const ZigzagLevelOrderComposition: React.FC = () => {
	return (
		<ZigzagLevelOrderVisualizer
			steps={steps}
			title="103. Binary Tree Zigzag Level Order Traversal"
			durationPerStep={ZIGZAG_LEVEL_ORDER_DURATION_PER_STEP}
		/>
	);
};
