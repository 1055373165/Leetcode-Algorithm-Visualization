import React from 'react';
import {
	SlidingWindowMaxStep,
	SlidingWindowMaxVisualizer,
} from '../components/SlidingWindowMaxVisualizer';

const nums = [1, 3, -1, -3, 5, 3, 6, 7];
const k = 3;
const result: (number | null)[] = new Array(nums.length - k + 1).fill(null);
const deque: number[] = [];
const steps: SlidingWindowMaxStep[] = [];

const INVARIANT =
	'deque 里存的是下标，而且对应值从队头到队尾严格递减；队头永远是当前窗口最大值。';

const pushStep = (step: SlidingWindowMaxStep) => {
	steps.push(step);
};

pushStep({
	phase: 'intro',
	nums,
	k,
	currentIndex: -1,
	focusIndex: null,
	windowLeft: 0,
	windowRight: -1,
	deque: [],
	result: [...result],
	removedIndex: null,
	resultIndex: null,
	actionLabel: '先看单调双端队列要维护什么',
	what:
		'我们会用一个递减 deque 存“仍可能成为最大值”的下标，窗口每右移一格，只处理新进和过期的元素。',
	why:
		'这样每个元素最多入队一次、出队一次，就能把暴力 O(nk) 降到 O(n)。',
	delta: ['示例输入 nums=[1,3,-1,-3,5,3,6,7]', '窗口大小 k=3'],
	invariant: INVARIANT,
	progress: `准备开始，共 ${nums.length} 个元素要扫描`,
});

for (let i = 0; i < nums.length; i++) {
	const windowLeft = Math.max(0, i - k + 1);

	pushStep({
		phase: 'consider',
		nums,
		k,
		currentIndex: i,
		focusIndex: i,
		windowLeft,
		windowRight: i,
		deque: [...deque],
		result: [...result],
		removedIndex: null,
		resultIndex: null,
		actionLabel: `把 nums[${i}] = ${nums[i]} 纳入当前窗口`,
		what: `扫描指针来到下标 ${i}，把新元素 ${nums[i]} 放进窗口考虑。`,
		why:
			'滑动窗口每次只新增一个元素，所以所有更新都只围绕这个新元素以及可能过期的旧元素展开。',
		delta: [`当前窗口候选范围是 [${windowLeft}, ${i}]`],
		invariant: INVARIANT,
		progress: `扫描进度 ${i + 1}/${nums.length}`,
	});

	if (deque.length > 0 && deque[0] < windowLeft) {
		const expired = deque[0];
		pushStep({
			phase: 'expire',
			nums,
			k,
			currentIndex: i,
			focusIndex: expired,
			windowLeft,
			windowRight: i,
			deque: [...deque],
			result: [...result],
			removedIndex: expired,
			resultIndex: null,
			actionLabel: `删除过期队头 ${expired}(${nums[expired]})`,
			what: `队头下标 ${expired} 已经离开窗口 [${windowLeft}, ${i}]。`,
			why:
				'队头即使曾经是最大值，只要不在当前窗口里，就再也不能参与这一轮答案计算。',
			delta: [`过期元素 ${expired} 必须从队头移除`],
			invariant: INVARIANT,
			progress: `扫描进度 ${i + 1}/${nums.length}`,
		});
		deque.shift();

		if (i === 4) {
			pushStep({
				phase: 'expire',
				nums,
				k,
				currentIndex: i,
				focusIndex: i,
				windowLeft,
				windowRight: i,
				deque: [...deque],
				result: [...result],
				removedIndex: null,
				resultIndex: null,
				actionLabel: '关键转折：旧最大值也会过期',
				what: '这里被删掉的是之前窗口的最大值 3，但它已经不属于新窗口了。',
				why:
					'窗口最大值必须同时满足两个条件：值够大，而且下标还在窗口内。这就是双端队列必须能从队头删元素的原因。',
				delta: ['“大”不够，还要“没过期”'],
				invariant: INVARIANT,
				progress: `扫描进度 ${i + 1}/${nums.length}`,
			});
		}
	}

	while (deque.length > 0 && nums[deque[deque.length - 1]] <= nums[i]) {
		const removed = deque[deque.length - 1];
		pushStep({
			phase: 'prune',
			nums,
			k,
			currentIndex: i,
			focusIndex: i,
			windowLeft,
			windowRight: i,
			deque: [...deque],
			result: [...result],
			removedIndex: removed,
			resultIndex: null,
			actionLabel: `从队尾淘汰 ${removed}(${nums[removed]})`,
			what: `当前值 ${nums[i]} 大于或等于队尾值 ${nums[removed]}。`,
			why:
				`${removed} 更早过期、值还不更大，只要 ${i} 还活在窗口里，它就永远不可能重新成为最大值。`,
			delta: [`删除队尾候选 ${removed}(${nums[removed]})`],
			invariant: INVARIANT,
			progress: `扫描进度 ${i + 1}/${nums.length}`,
		});
		deque.pop();
	}

	deque.push(i);
	pushStep({
		phase: 'append',
		nums,
		k,
		currentIndex: i,
		focusIndex: i,
		windowLeft,
		windowRight: i,
		deque: [...deque],
		result: [...result],
		removedIndex: null,
		resultIndex: null,
		actionLabel: `把下标 ${i} 压入队尾`,
		what: `现在把当前元素 ${nums[i]} 作为新的候选最大值放入 deque。`,
		why:
			'在删掉所有不可能再赢的旧候选后，deque 仍保持递减，队头自然就是当前窗口的最大候选。',
		delta: [`deque = [${deque.map((idx) => `${idx}(${nums[idx]})`).join(', ')}]`],
		invariant: INVARIANT,
		progress: `扫描进度 ${i + 1}/${nums.length}`,
	});

	if (i >= k - 1) {
		const resultIndex = i - k + 1;
		const maxIndex = deque[0];
		result[resultIndex] = nums[maxIndex];
		pushStep({
			phase: 'collect',
			nums,
			k,
			currentIndex: i,
			focusIndex: maxIndex,
			windowLeft,
			windowRight: i,
			deque: [...deque],
			result: [...result],
			removedIndex: null,
			resultIndex,
			actionLabel: `收集窗口 [${windowLeft}, ${i}] 的最大值`,
			what: `窗口已经满了，直接读取队头 ${maxIndex}(${nums[maxIndex]}) 作为答案。`,
			why:
				'不变量保证队头对应值最大，而且它还没过期，所以无需重新扫描整个窗口。',
			delta: [`result[${resultIndex}] = ${nums[maxIndex]}`],
			invariant: INVARIANT,
			progress: `已得到 ${resultIndex + 1}/${result.length} 个窗口答案`,
		});
	}
}

pushStep({
	phase: 'summary',
	nums,
	k,
	currentIndex: nums.length - 1,
	focusIndex: deque[0],
	windowLeft: nums.length - k,
	windowRight: nums.length - 1,
	deque: [...deque],
	result: [...result],
	removedIndex: null,
	resultIndex: result.length - 1,
	actionLabel: '总结 1：为什么可以 O(1) 取最大值',
	what:
		'因为 deque 只保留“还在窗口里、且仍可能成为最大值”的候选人，队头始终是当前窗口最大值。',
	why:
		'更小且更老的元素会被队尾永久淘汰；过期元素会从队头剔除，所以剩下的第一个候选就是答案。',
	delta: ['队尾淘汰小值', '队头删除过期值'],
	invariant: INVARIANT,
	progress: '总结 1/2',
});

pushStep({
	phase: 'summary',
	nums,
	k,
	currentIndex: nums.length - 1,
	focusIndex: null,
	windowLeft: nums.length - k,
	windowRight: nums.length - 1,
	deque: [...deque],
	result: [...result],
	removedIndex: null,
	resultIndex: result.length - 1,
	actionLabel: '总结 2：复杂度与正确性',
	what: `最终结果是 [${result.join(', ')}]。每个下标最多进 deque 一次、出 deque 一次。`,
	why:
		'所以总时间复杂度是 O(n)，空间复杂度是 O(k)。正确性来自递减队列不变量和过期删除规则。',
	delta: ['时间复杂度 O(n)', '空间复杂度 O(k)'],
	invariant: INVARIANT,
	progress: '总结 2/2',
});

export const SLIDING_WINDOW_MAX_DURATION_PER_STEP = 42;
export const SLIDING_WINDOW_MAX_TOTAL_FRAMES =
	steps.length * SLIDING_WINDOW_MAX_DURATION_PER_STEP;

export const SlidingWindowMaxComposition: React.FC = () => {
	return (
		<SlidingWindowMaxVisualizer
			steps={steps}
			title="239. Sliding Window Maximum (Monotonic Deque)"
			durationPerStep={SLIDING_WINDOW_MAX_DURATION_PER_STEP}
		/>
	);
};
