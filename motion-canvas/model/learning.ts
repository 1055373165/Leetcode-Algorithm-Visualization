import {buildLesson, type DequeLesson, type LessonBeat} from './lesson';

export const PLAYBACK_RATES = [0.5, 1, 1.5, 2] as const;

export interface TimelineEntry {
  beat: LessonBeat;
  startFrame: number;
  endFrame: number;
  seekFrame: number;
}

export function parseLessonInput(raw: string, rawK: string) {
  if (raw.length > 160) throw new Error('数组输入过长，请使用 1–10 个整数。');
  const text = raw.trim().replace(/，/g, ',');
  let value: unknown;
  try {
    value = text.startsWith('[') ? JSON.parse(text) : text.split(text.includes(',') ? ',' : /\s+/).map(token => {
      if (!/^-?\d+$/.test(token.trim())) throw new Error();
      return Number(token.trim());
    });
  } catch {
    throw new Error('请输入整数数组，例如 1, 3, -1, -3, 5；不要留空项。');
  }
  if (!Array.isArray(value) || value.length < 1 || value.length > 10 || !value.every(n => typeof n === 'number' && Number.isSafeInteger(n) && Math.abs(n) <= 999)) {
    throw new Error('演示支持 1–10 个整数，每个值在 -999 到 999 之间。');
  }
  if (!/^\d+$/.test(rawK.trim())) throw new Error('窗口大小必须是正整数。');
  const k = Number(rawK);
  if (k < 1 || k > value.length) throw new Error(`窗口大小必须在 1 到 ${value.length} 之间。`);
  const nums = value.map(n => Object.is(n, -0) ? 0 : n) as number[];
  buildLesson(nums, k);
  return {nums, k};
}

export function createTimeline(lesson: DequeLesson): TimelineEntry[] {
  let seconds = 0;
  return lesson.beats.map(beat => {
    const startFrame = Math.round(seconds * 60);
    seconds += beat.duration;
    const endFrame = Math.round(seconds * 60);
    return {beat, startFrame, endFrame, seekFrame: Math.min(endFrame - 1, startFrame + 60)};
  });
}

export function locateBeat(timeline: TimelineEntry[], frame: number) {
  for (let i = timeline.length - 1; i >= 0; i--) if (frame >= timeline[i].startFrame) return i;
  return 0;
}

export function stateAtFrame(lesson: DequeLesson, timeline: TimelineEntry[], frame: number) {
  const index = locateBeat(timeline, frame);
  const entry = timeline[index];
  const event = entry.beat.event;
  const previous = timeline.slice(0, index).reverse().find(row => row.beat.event)?.beat.event;
  const settled = frame >= entry.startFrame + 51;
  const state = event ? (settled ? event.after : event.before) : previous?.after;
  const movingWindow = event?.kind === 'scan' && !settled;
  const currentIndex = movingWindow ? event.index - 1 : event?.index ?? previous?.index ?? -1;
  return {
    deque: state?.deque ?? [],
    result: state?.result ?? [],
    index: currentIndex,
    left: movingWindow ? Math.max(0, currentIndex - lesson.trace.k + 1) : event?.left ?? previous?.left ?? 0,
    ready: event ? settled && event.invariantReady : previous?.invariantReady ?? false,
    nums: lesson.trace.nums,
    k: lesson.trace.k,
  };
}

export const QUESTIONS = [
  {
    id: 'expiry-v1', skill: '区分位置与大小',
    prompt: '队头仍然最大，就一定可以保留吗？',
    context: 'nums = [8, 7, 6, 5]，k = 2。扫描到 i = 2，窗口变为 [1, 2]，旧候选下标为 [0, 1]。下一步先做什么？',
    options: [{id: 'keep', text: '保留 0，因为 8 比新元素 6 大'}, {id: 'expire', text: '移除队头 0，因为它不在新窗口内'}, {id: 'prune', text: '移除队尾 1，为新元素腾位置'}],
    answer: 'expire',
    hint: '先比较下标与窗口左边界，不要先比较数值。',
    explanation: '下标 0 < 左边界 1。8 即使更大，也已失去参与本轮答案的资格。淘汰过期候选与淘汰较小候选是两件事。',
  },
  {
    id: 'equal-v1', skill: '识别等价实现',
    prompt: '把队尾淘汰条件从 ≤ 改成 <，答案一定会错吗？',
    context: '其他逻辑不变，队列仍保存下标并正确处理过期；输入可以包含重复值。',
    options: [{id: 'wrong', text: '一定错误，因为相同值不能同时出现'}, {id: 'equivalent', text: '答案仍正确，只是不再保证值严格递减'}, {id: 'quadratic', text: '答案正确，但算法一定退化为 O(n²)'}],
    answer: 'equivalent',
    hint: '相同值都留下时，旧值过期之后，较新的相同值是否仍可提供答案？',
    explanation: '两种条件都能正确求最大值。使用 < 会保留相同值，队列非严格递减；每个下标仍最多入队和出队一次。不要把模板写法当成唯一正确答案。',
  },
  {
    id: 'transfer-v1', skill: '迁移操作含义',
    prompt: '迁移到「每日温度」，弹出元素代表什么？',
    context: '观察温度 [73, 71, 74]。74 到来，栈中等待的 71 与 73 被依次弹出。',
    options: [{id: 'discard', text: '它们失去成为窗口最大值的资格，直接丢弃'}, {id: 'settle', text: '它们等到了更高温度，弹出时结算等待天数'}, {id: 'expire', text: '它们超过固定窗口长度，所以过期'}],
    answer: 'settle',
    hint: '这道题要返回每个位置等待多久，不是返回窗口极值。',
    explanation: '每日温度弹出的是已经找到答案的位置：71 等 1 天，73 等 2 天。本题弹出的是被支配或过期的候选。共用单调结构，不代表弹出动作的含义和答案时机相同。',
  },
] as const;

export interface Attempt {
  questionId: string;
  optionId: string;
  correct: boolean;
  hinted: boolean;
  first: boolean;
  at: string;
}

export function recordAttempt(attempts: Attempt[], questionId: string, optionId: string, hinted: boolean, at = new Date().toISOString()): Attempt[] {
  const question = QUESTIONS.find(item => item.id === questionId);
  if (!question || !question.options.some(option => option.id === optionId)) throw new Error('这道练习或所选答案已失效，请重新打开练习。');
  if (attempts.length >= 200) throw new Error('本地记录已达 200 条，请先导出保存；当前不会覆盖旧记录。');
  return [...attempts, {questionId, optionId, correct: optionId === question.answer, hinted, first: !attempts.some(item => item.questionId === questionId), at}];
}

export function readAttempts(raw: string | null): {attempts: Attempt[]; error: string | null} {
  if (raw === null) return {attempts: [], error: null};
  try {
    if (raw.length > 100_000) throw new Error();
    const parsed = JSON.parse(raw);
    if (parsed?.version !== 1 || !Array.isArray(parsed.attempts) || parsed.attempts.length > 200) throw new Error();
    const seen = new Set<string>();
    for (const value of parsed.attempts) {
      const question = QUESTIONS.find(item => item.id === value?.questionId);
      if (!question || !question.options.some(option => option.id === value.optionId)
        || value.correct !== (question.answer === value.optionId) || typeof value.hinted !== 'boolean'
        || value.first !== !seen.has(value.questionId) || typeof value.at !== 'string' || !Number.isFinite(Date.parse(value.at))) throw new Error();
      seen.add(value.questionId);
    }
    return {attempts: parsed.attempts, error: null};
  } catch {
    return {attempts: [], error: '旧学习记录无法读取。本次仅使用内存记录，不会覆盖原数据。'};
  }
}
