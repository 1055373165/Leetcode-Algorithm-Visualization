import React from 'react';
import {
	LFUBucketNode,
	LFUFreqBucket,
	LFUCacheStep,
	LFUCacheVisualizer,
} from '../components/LFUCacheVisualizer';

// --- LFU Simulation ---

type ScriptOp =
	| {type: 'put'; key: number; value: number}
	| {type: 'get'; key: number};

class DLNode {
	key: number;
	value: number;
	freq: number;
	prev: DLNode | null = null;
	next: DLNode | null = null;
	constructor(key: number, value: number) {
		this.key = key;
		this.value = value;
		this.freq = 1;
	}
}

class DLList {
	head: DLNode;
	tail: DLNode;
	size = 0;
	constructor() {
		this.head = new DLNode(-1, -1);
		this.tail = new DLNode(-1, -1);
		this.head.next = this.tail;
		this.tail.prev = this.head;
	}
	addFirst(node: DLNode) {
		node.prev = this.head;
		node.next = this.head.next;
		this.head.next!.prev = node;
		this.head.next = node;
		this.size++;
	}
	remove(node: DLNode) {
		node.prev!.next = node.next;
		node.next!.prev = node.prev;
		node.prev = null;
		node.next = null;
		this.size--;
	}
	removeLast(): DLNode {
		const node = this.tail.prev!;
		this.remove(node);
		return node;
	}
	snapshot(): LFUBucketNode[] {
		const result: LFUBucketNode[] = [];
		let cur = this.head.next;
		while (cur && cur !== this.tail) {
			result.push({key: cur.key, value: cur.value});
			cur = cur.next;
		}
		return result;
	}
}

class LFUSim {
	cap: number;
	minFreq = 0;
	keyMap = new Map<number, DLNode>();
	freqMap = new Map<number, DLList>();

	constructor(cap: number) {
		this.cap = cap;
	}

	getOrCreateList(freq: number): DLList {
		let list = this.freqMap.get(freq);
		if (!list) {
			list = new DLList();
			this.freqMap.set(freq, list);
		}
		return list;
	}

	promote(node: DLNode) {
		const oldList = this.freqMap.get(node.freq)!;
		oldList.remove(node);
		if (oldList.size === 0 && node.freq === this.minFreq) {
			this.minFreq++;
		}
		node.freq++;
		const newList = this.getOrCreateList(node.freq);
		newList.addFirst(node);
	}

	snapshotBuckets(): LFUFreqBucket[] {
		const buckets: LFUFreqBucket[] = [];
		this.freqMap.forEach((list, freq) => {
			if (list.size > 0) {
				buckets.push({freq, nodes: list.snapshot()});
			}
		});
		return buckets.sort((a, b) => a.freq - b.freq);
	}
}

// --- Script & Steps ---

const CAPACITY = 2;
const SCRIPT: ScriptOp[] = [
	{type: 'put', key: 1, value: 10},
	{type: 'put', key: 2, value: 20},
	{type: 'get', key: 1},
	{type: 'put', key: 3, value: 30},
	{type: 'get', key: 2},
	{type: 'get', key: 3},
];

const INVARIANT =
	'keyMap 定位节点，freqMap[f] 按 LRU 排列同频次节点，minFreq 锁定淘汰桶';

const DURATION_PER_STEP = 75;

const lfu = new LFUSim(CAPACITY);
const steps: LFUCacheStep[] = [];

const opLabel = (op: ScriptOp) =>
	op.type === 'put' ? `put(${op.key}, ${op.value})` : `get(${op.key})`;

// Intro step
steps.push({
	phase: 'intro',
	operation: 'init',
	capacity: CAPACITY,
	size: 0,
	freqBuckets: [],
	minFreq: 0,
	activeKey: null,
	victimKey: null,
	newKey: null,
	result: null,
	actionLabel: '建立 LFU 的认知骨架：keyMap + freqMap + minFreq',
	what: 'LFU 用三层结构：keyMap O(1) 定位，freqMap 按频次分桶且桶内 LRU，minFreq 追踪淘汰目标。',
	why: '和 LRU 的区别：LRU 只有一条链表管时间顺序，LFU 有 N 条链表按频次分桶。',
	invariant: INVARIANT,
	progress: `样例：capacity = ${CAPACITY}`,
});

SCRIPT.forEach((op, index) => {
	const prog = `脚本 ${index + 1}/${SCRIPT.length}`;

	if (op.type === 'put') {
		const existing = lfu.keyMap.get(op.key);

		if (existing) {
			existing.value = op.value;
			lfu.promote(existing);
			steps.push({
				phase: 'put',
				operation: opLabel(op),
				capacity: CAPACITY,
				size: lfu.keyMap.size,
				freqBuckets: lfu.snapshotBuckets(),
				minFreq: lfu.minFreq,
				activeKey: op.key,
				victimKey: null,
				newKey: null,
				result: null,
				actionLabel: `更新 key=${op.key}，频次+1`,
				what: `key=${op.key} 已存在，更新 value=${op.value} 并 promote（频次升级）。`,
				why: '对已有 key 的 put 也算一次"使用"，必须增加频次并移到新频次桶头部。',
				invariant: INVARIANT,
				progress: prog,
			});
			return;
		}

		// Eviction needed
		if (lfu.keyMap.size === lfu.cap) {
			const minList = lfu.freqMap.get(lfu.minFreq)!;
			// Find victim (tail of minFreq list) before removal
			let victimNode = minList.tail.prev!;
			const victimKey = victimNode.key;

			steps.push({
				phase: 'evict',
				operation: opLabel(op),
				capacity: CAPACITY,
				size: lfu.keyMap.size,
				freqBuckets: lfu.snapshotBuckets(),
				minFreq: lfu.minFreq,
				activeKey: null,
				victimKey: victimKey,
				newKey: null,
				result: null,
				actionLabel: `容量满，淘汰 freqMap[${lfu.minFreq}] 尾部 key=${victimKey}`,
				what: `缓存已满，从 minFreq=${lfu.minFreq} 桶的尾部淘汰 key=${victimKey}（最不常用且最久未用）。`,
				why: 'minFreq 精准锁定了频次最低的桶，桶内尾部就是同频次中最久未使用的节点。',
				invariant: INVARIANT,
				progress: prog,
			});

			const removed = minList.removeLast();
			lfu.keyMap.delete(removed.key);
		}

		// Insert new key
		const node = new DLNode(op.key, op.value);
		lfu.keyMap.set(op.key, node);
		const list = lfu.getOrCreateList(1);
		list.addFirst(node);
		lfu.minFreq = 1;

		steps.push({
			phase: 'put',
			operation: opLabel(op),
			capacity: CAPACITY,
			size: lfu.keyMap.size,
			freqBuckets: lfu.snapshotBuckets(),
			minFreq: lfu.minFreq,
			activeKey: null,
			victimKey: null,
			newKey: op.key,
			result: null,
			actionLabel: `插入 key=${op.key} 到 freq=1 桶头部，minFreq=1`,
			what: `新节点 (${op.key}, ${op.value}) 频次初始化为 1，插入 freq=1 桶头部。`,
			why: '新 key 频次一定是 1，所以 minFreq 无条件重置为 1。',
			invariant: INVARIANT,
			progress: prog,
		});
		return;
	}

	// GET operation
	const node = lfu.keyMap.get(op.key);
	if (!node) {
		steps.push({
			phase: 'get-miss',
			operation: opLabel(op),
			capacity: CAPACITY,
			size: lfu.keyMap.size,
			freqBuckets: lfu.snapshotBuckets(),
			minFreq: lfu.minFreq,
			activeKey: op.key,
			victimKey: null,
			newKey: null,
			result: -1,
			actionLabel: `查询 key=${op.key} 失败，返回 -1`,
			what: `keyMap 中没有 key=${op.key}，已被淘汰或从未插入，返回 -1。`,
			why: 'miss 不会改变任何频次或链表状态。',
			invariant: INVARIANT,
			progress: prog,
		});
		return;
	}

	const oldFreq = node.freq;
	lfu.promote(node);
	steps.push({
		phase: 'get-hit',
		operation: opLabel(op),
		capacity: CAPACITY,
		size: lfu.keyMap.size,
		freqBuckets: lfu.snapshotBuckets(),
		minFreq: lfu.minFreq,
		activeKey: op.key,
		victimKey: null,
		newKey: null,
		result: node.value,
		actionLabel: `命中 key=${op.key}，频次 ${oldFreq}→${node.freq}`,
		what: `返回 value=${node.value}，同时把 key=${op.key} 从 freq=${oldFreq} 升到 freq=${node.freq} 桶头部。`,
		why: oldFreq === lfu.minFreq - 1 || (lfu.freqMap.get(oldFreq)?.size === 0 && oldFreq === lfu.minFreq - 1)
			? `旧桶 freq=${oldFreq} 变空且等于原 minFreq，所以 minFreq 升到 ${lfu.minFreq}。`
			: `旧桶 freq=${oldFreq} 还有其他节点（或不是 minFreq），minFreq 不变。`,
		invariant: INVARIANT,
		progress: prog,
	});
});

// Summary
steps.push({
	phase: 'summary',
	operation: 'summary',
	capacity: CAPACITY,
	size: lfu.keyMap.size,
	freqBuckets: lfu.snapshotBuckets(),
	minFreq: lfu.minFreq,
	activeKey: null,
	victimKey: null,
	newKey: null,
	result: null,
	actionLabel: '复盘：LFU 的核心就是 promote + minFreq 联动',
	what: 'LFU 的全部复杂性集中在 promote：从旧频次桶摘出 → freq++ → 挂入新频次桶 → 检查 minFreq。',
	why: '只要记住 "keyMap 找，freqMap 按频分桶桶内 LRU，promote 是唯一核心操作，minFreq 两条规则"，就能闭卷复现。',
	invariant: INVARIANT,
	progress: `最终状态：${lfu
		.snapshotBuckets()
		.map((b) => `f${b.freq}:[${b.nodes.map((n) => n.key).join(',')}]`)
		.join(' ')}`,
});

export const LFU_CACHE_TOTAL_FRAMES = steps.length * DURATION_PER_STEP;

export const LFUCacheComposition: React.FC = () => {
	return (
		<LFUCacheVisualizer
			steps={steps}
			title="460. LFU Cache: keyMap + freqMap + minFreq"
			durationPerStep={DURATION_PER_STEP}
		/>
	);
};
