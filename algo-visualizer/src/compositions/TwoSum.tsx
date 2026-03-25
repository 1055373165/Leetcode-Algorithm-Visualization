import React from 'react';
import {
	TwoSumSeenEntry,
	TwoSumStep,
	TwoSumVisualizer,
} from '../components/TwoSumVisualizer';

const nums = [2, 7, 11, 15];
const target = 9;
const DURATION_PER_STEP = 105;

const INVARIANT =
	'seen 里只保存当前下标左边已经出现过的数字及其下标，所以当前元素只需要检查 target - nums[i] 是否已经出现过。';

const steps: TwoSumStep[] = [];
const seen = new Map<number, number>();

const snapshotSeen = ({
	matchValue = null,
	newValue = null,
}: {
	matchValue?: number | null;
	newValue?: number | null;
} = {}): TwoSumSeenEntry[] => {
	return Array.from(seen.entries()).map(([value, index]) => {
		let state: TwoSumSeenEntry['state'] = 'normal';
		if (matchValue !== null && value === matchValue) {
			state = 'match';
		} else if (newValue !== null && value === newValue) {
			state = 'new';
		}
		return {value, index, state};
	});
};

const pushStep = (step: TwoSumStep) => {
	steps.push(step);
};

pushStep({
	phase: 'intro',
	nums,
	target,
	currentIndex: -1,
	currentValue: null,
	neededValue: null,
	seenEntries: snapshotSeen(),
	matchedIndex: null,
	result: null,
	actionLabel: '先建立题目的认知骨架',
	what: '这道题不是在找“哪两个数”，而是在扫描当前数时，查“它缺的补数之前出现过没有”。',
	why: '一旦把问题改写成“补数查询”，哈希表就能把双重循环压成一遍扫描。',
	invariant: INVARIANT,
	progress: '样例：nums = [2,7,11,15], target = 9',
});

let answer: [number, number] | null = null;

for (let i = 0; i < nums.length; i++) {
	const currentValue = nums[i];
	const neededValue = target - currentValue;
	const matchedIndex = seen.has(neededValue) ? seen.get(neededValue)! : null;

	pushStep({
		phase: 'check',
		nums,
		target,
		currentIndex: i,
		currentValue,
		neededValue,
		seenEntries: snapshotSeen({
			matchValue: matchedIndex !== null ? neededValue : null,
		}),
		matchedIndex,
		result: null,
		actionLabel: `检查 nums[${i}] = ${currentValue}`,
		what: `当前值是 ${currentValue}，它需要的补数是 ${neededValue}。`,
		why:
			matchedIndex !== null
				? `补数 ${neededValue} 已经在 seen 中，说明答案在这一刻闭合。`
				: `补数 ${neededValue} 还没出现，所以当前值还不能组成答案。`,
		invariant: INVARIANT,
		progress: `扫描到索引 ${i}，先查补数，再决定是否存自己`,
	});

	if (matchedIndex !== null) {
		answer = [matchedIndex, i];
		pushStep({
			phase: 'found',
			nums,
			target,
			currentIndex: i,
			currentValue,
			neededValue,
			seenEntries: snapshotSeen({matchValue: neededValue}),
			matchedIndex,
			result: answer,
			actionLabel: `命中答案 [${matchedIndex}, ${i}]`,
			what: `因为 seen[${neededValue}] = ${matchedIndex}，所以 nums[${matchedIndex}] + nums[${i}] = ${target}。`,
			why: '答案对里的第二个数一出现，第一个数已经在表里，所以可以立即返回，不用再看后面元素。',
			invariant: INVARIANT,
			progress: `返回下标 [${matchedIndex}, ${i}]`,
		});
		break;
	}

	seen.set(currentValue, i);
	pushStep({
		phase: 'store',
		nums,
		target,
		currentIndex: i,
		currentValue,
		neededValue,
		seenEntries: snapshotSeen({newValue: currentValue}),
		matchedIndex: null,
		result: null,
		actionLabel: `把 ${currentValue} 存入 seen`,
		what: `记录 ${currentValue} -> ${i}，让它成为后续元素的候选补数。`,
		why: '只有左侧元素能放进 seen，这样才能保证不会把当前元素和自己配对。',
		invariant: INVARIANT,
		progress: `seen 新增一项：${currentValue} -> ${i}`,
	});
}

pushStep({
	phase: 'summary',
	nums,
	target,
	currentIndex: answer ? answer[1] : -1,
	currentValue: answer ? nums[answer[1]] : null,
	neededValue: answer ? nums[answer[0]] : null,
	seenEntries: snapshotSeen({
		matchValue: answer ? nums[answer[0]] : null,
	}),
	matchedIndex: answer ? answer[0] : null,
	result: answer,
	actionLabel: '复盘最关键的一句话',
	what: '这题的最优解不是“记住哈希表模板”，而是记住一句话：扫描当前数时，去左边已见元素里找补数。',
	why: '你一旦能稳定复述这个不变量，这题和它的相邻题都会变得好迁移。',
	invariant: INVARIANT,
	progress: answer ? `最终答案：[${answer[0]}, ${answer[1]}]` : '样例结束',
});

export const TWO_SUM_TOTAL_FRAMES = steps.length * DURATION_PER_STEP;

export const TwoSumComposition: React.FC = () => {
	return (
		<TwoSumVisualizer
			steps={steps}
			title="1. Two Sum: One-Pass Hash Map"
			durationPerStep={DURATION_PER_STEP}
		/>
	);
};
