import React from 'react';
import {
	LRUCacheNodeView,
	LRUCacheStep,
	LRUCacheVisualizer,
} from '../components/LRUCacheVisualizer';

type ScriptOperation =
	| {
			type: 'put';
			key: number;
			value: number;
	  }
	| {
			type: 'get';
			key: number;
	  };

class Node {
	key: number;
	value: number;
	prev: Node | null = null;
	next: Node | null = null;

	constructor(key: number, value: number) {
		this.key = key;
		this.value = value;
	}
}

class LRUSim {
	capacity: number;
	cache = new Map<number, Node>();
	head = new Node(-1, -1);
	tail = new Node(-1, -1);

	constructor(capacity: number) {
		this.capacity = capacity;
		this.head.next = this.tail;
		this.tail.prev = this.head;
	}

	addFirst(node: Node) {
		node.prev = this.head;
		node.next = this.head.next;
		this.head.next!.prev = node;
		this.head.next = node;
	}

	remove(node: Node) {
		node.prev!.next = node.next;
		node.next!.prev = node.prev;
		node.prev = null;
		node.next = null;
	}

	moveToFront(node: Node) {
		this.remove(node);
		this.addFirst(node);
	}

	removeLast(): Node {
		const node = this.tail.prev!;
		this.remove(node);
		return node;
	}

	snapshot(): LRUCacheNodeView[] {
		const nodes: LRUCacheNodeView[] = [];
		let cur = this.head.next;
		while (cur && cur !== this.tail) {
			nodes.push({key: cur.key, value: cur.value});
			cur = cur.next;
		}
		return nodes;
	}
}

const CAPACITY = 2;
const SCRIPT: ScriptOperation[] = [
	{type: 'put', key: 1, value: 1},
	{type: 'put', key: 2, value: 2},
	{type: 'get', key: 1},
	{type: 'put', key: 3, value: 3},
	{type: 'get', key: 2},
	{type: 'put', key: 4, value: 4},
	{type: 'get', key: 1},
	{type: 'get', key: 3},
	{type: 'get', key: 4},
];

const INVARIANT =
	'map 负责 O(1) 定位节点，链表从前到后表示 MRU -> LRU；命中或更新后移到头部，超容量时淘汰尾部。';
const DURATION_PER_STEP = 75;

const lru = new LRUSim(CAPACITY);
const steps: LRUCacheStep[] = [];

const opLabel = (op: ScriptOperation) =>
	op.type === 'put' ? `put(${op.key}, ${op.value})` : `get(${op.key})`;

const pushStep = (step: LRUCacheStep) => {
	steps.push(step);
};

pushStep({
	phase: 'intro',
	operation: 'init',
	capacity: CAPACITY,
	size: 0,
	nodes: lru.snapshot(),
	activeKey: null,
	victimKey: null,
	newKey: null,
	result: null,
	actionLabel: '先建立 LRU 的认知骨架',
	what: '这题要同时做到两件事：按 key O(1) 找节点，以及按最近使用顺序 O(1) 重排节点。',
	why: '单独用 map 只能找，单独用链表只能排。必须把“定位”和“顺序”拆给两个结构。',
	invariant: INVARIANT,
	progress: '样例：capacity = 2',
});

SCRIPT.forEach((op, index) => {
	if (op.type === 'put') {
		const existing = lru.cache.get(op.key);

		if (existing) {
			existing.value = op.value;
			lru.moveToFront(existing);
			pushStep({
				phase: 'put',
				operation: opLabel(op),
				capacity: CAPACITY,
				size: lru.cache.size,
				nodes: lru.snapshot(),
				activeKey: op.key,
				victimKey: null,
				newKey: null,
				result: null,
				actionLabel: `更新 key=${op.key} 并移到头部`,
				what: `key=${op.key} 已存在，更新 value=${op.value} 后刷新为 MRU。`,
				why: '对已有 key 的 put 也算一次“使用”，所以必须更新冷热顺序。',
				invariant: INVARIANT,
				progress: `脚本 ${index + 1}/${SCRIPT.length}`,
			});
			return;
		}

		if (lru.cache.size === lru.capacity) {
			const victim = lru.tail.prev!;
			pushStep({
				phase: 'evict',
				operation: opLabel(op),
				capacity: CAPACITY,
				size: lru.cache.size,
				nodes: lru.snapshot(),
				activeKey: op.key,
				victimKey: victim.key,
				newKey: null,
				result: null,
				actionLabel: `容量已满，准备淘汰 key=${victim.key}`,
				what: `执行 ${opLabel(op)} 前缓存已满，尾部节点 key=${victim.key} 是当前 LRU。`,
				why: '链表尾部永远代表最久未使用，所以淘汰目标可以 O(1) 直接确定。',
				invariant: INVARIANT,
				progress: `脚本 ${index + 1}/${SCRIPT.length}`,
			});

			const removed = lru.removeLast();
			lru.cache.delete(removed.key);
		}

		const node = new Node(op.key, op.value);
		lru.addFirst(node);
		lru.cache.set(op.key, node);
		pushStep({
			phase: 'put',
			operation: opLabel(op),
			capacity: CAPACITY,
			size: lru.cache.size,
			nodes: lru.snapshot(),
			activeKey: op.key,
			victimKey: null,
			newKey: op.key,
			result: null,
			actionLabel: `插入 key=${op.key} 到头部`,
			what: `把新节点 (${op.key}, ${op.value}) 挂到头部，它现在是最新访问的数据。`,
			why: '新插入本身就算最近使用，所以默认进入 MRU 位置。',
			invariant: INVARIANT,
			progress: `脚本 ${index + 1}/${SCRIPT.length}`,
		});
		return;
	}

	const node = lru.cache.get(op.key);
	if (!node) {
		pushStep({
			phase: 'get-miss',
			operation: opLabel(op),
			capacity: CAPACITY,
			size: lru.cache.size,
			nodes: lru.snapshot(),
			activeKey: op.key,
			victimKey: null,
			newKey: null,
			result: -1,
			actionLabel: `查询 key=${op.key} 失败`,
			what: `map 中没有 key=${op.key}，所以返回 -1，链表顺序保持不变。`,
			why: 'miss 不会引入新节点，也不会刷新任何冷热状态。',
			invariant: INVARIANT,
			progress: `脚本 ${index + 1}/${SCRIPT.length}`,
		});
		return;
	}

	lru.moveToFront(node);
	pushStep({
		phase: 'get-hit',
		operation: opLabel(op),
		capacity: CAPACITY,
		size: lru.cache.size,
		nodes: lru.snapshot(),
		activeKey: op.key,
		victimKey: null,
		newKey: null,
		result: node.value,
		actionLabel: `命中 key=${op.key}，并移到头部`,
		what: `返回 value=${node.value}，同时把 key=${op.key} 提升为 MRU。`,
		why: 'LRU 的“使用”不仅影响返回值，还会立刻改变冷热顺序。',
		invariant: INVARIANT,
		progress: `脚本 ${index + 1}/${SCRIPT.length}`,
	});
});

pushStep({
	phase: 'summary',
	operation: 'summary',
	capacity: CAPACITY,
	size: lru.cache.size,
	nodes: lru.snapshot(),
	activeKey: null,
	victimKey: null,
	newKey: null,
	result: null,
	actionLabel: '复盘最关键的一句话',
	what: 'LRU 不难在“存值”，难在“命中后刷新 + 满了时删尾”这两个顺序动作必须和 map 完全同步。',
	why: '只要你记住“map 找节点，双链表排冷热，命中移头，超容删尾”，这题就能闭卷复现。',
	invariant: INVARIANT,
	progress: `最终顺序：${lru
		.snapshot()
		.map((node) => node.key)
		.join(' -> ')}`,
});

export const LRU_CACHE_TOTAL_FRAMES = steps.length * DURATION_PER_STEP;

export const LRUCacheComposition: React.FC = () => {
	return (
		<LRUCacheVisualizer
			steps={steps}
			title="146. LRU Cache: Hash Map + Doubly Linked List"
			durationPerStep={DURATION_PER_STEP}
		/>
	);
};
