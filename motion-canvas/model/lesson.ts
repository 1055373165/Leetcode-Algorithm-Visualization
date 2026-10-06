import {buildDequeTrace, type DequeEvent, type DequeTrace} from './deque';

export interface LessonBeat {
  id: string;
  kind: 'intro' | 'event' | 'predict' | 'recap' | 'transfer';
  event: DequeEvent | null;
  heading: string;
  body: string;
  detail: string;
  duration: number;
  motionSeconds: number;
}

export interface DequeLesson {
  trace: DequeTrace;
  beats: LessonBeat[];
  duration: number;
}

export function scanTransitionText(event: DequeEvent, nums: readonly number[], k: number) {
  if (event.kind !== 'scan') throw new Error('Only scan events move the window.');
  const previousRight = event.index - 1;
  const previousLeft = Math.max(0, previousRight - k + 1);
  return {
    heading: `${nums[event.index]} 即将进入，窗口正在右移。`,
    body: previousRight < 0
      ? '窗口从空状态展开；新元素到位后再检查队列。'
      : `窗口从 [${previousLeft}, ${previousRight}] → [${event.left}, ${event.index}]；移动完成后才纳入 ${nums[event.index]}。`,
  };
}

export function buildLesson(nums: readonly number[], k: number): DequeLesson {
  const trace = buildDequeTrace(nums, k);
  if (nums.length > 10 || nums.some(value => Math.abs(value) > 999)) {
    throw new RangeError('This visual lesson supports at most 10 values in [-999, 999].');
  }

  const beats: LessonBeat[] = [{
    id: 'intro', kind: 'intro', event: null,
    heading: '不必记住所有元素，只保留可能获胜的候选。',
    body: '每个窗口求最大值。先观察：一个元素会因为什么失去资格？',
    detail: '两个出口：队头处理过期，队尾淘汰被支配的候选。',
    duration: 5, motionSeconds: 0.6,
  }];
  let predictedExpiry = false;
  let explainedPruning = false;

  for (const event of trace.events) {
    const value = nums[event.index];
    const removed = nums[event.subject];
    if (event.kind === 'expire' && !predictedExpiry) {
      beats.push({
        id: 'predict-expiry', kind: 'predict', event: null,
        heading: '先暂停：旧最大值还能留在候选区吗？',
        body: `窗口左边界已到 ${event.left}，队头下标是 ${event.subject}。`,
        detail: '先判断资格，再比较大小。想好后继续播放。',
        duration: 5, motionSeconds: 0.6,
      });
      predictedExpiry = true;
    }

    let heading: string;
    let body: string;
    let detail: string;
    let duration: number;
    switch (event.kind) {
      case 'scan':
        heading = `新元素 ${value} 到达。先检查旧候选是否过期。`;
        body = `当前范围 [${event.left}, ${event.index}]，窗口${event.index < k - 1 ? '尚未满' : '已经形成'}。`;
        detail = '维护进行中：此刻不能直接把旧队头当作新窗口答案。';
        duration = 1.75;
        break;
      case 'expire':
        heading = `${removed} 曾经最大，但它已不在窗口里。`;
        body = `下标 ${event.subject} < 左边界 ${event.left}，从队头移除。`;
        detail = '过期是位置问题，与值是否足够大无关。';
        duration = 3.75;
        break;
      case 'prune':
        heading = `${value} ≥ ${removed}，更晚到达的候选更有优势。`;
        body = `下标 ${event.subject} 更早过期，值也不更大；从队尾淘汰。`;
        detail = '只要新元素还在窗口中，旧候选就不可能比它更优。';
        duration = explainedPruning ? 2.25 : 3.75;
        explainedPruning = true;
        break;
      case 'append':
        heading = `下标 ${event.index} 入队。递减候选序列恢复。`;
        body = `队列存下标，比较时才读取值 ${value}。`;
        detail = event.index < k - 1 ? '队头是当前已扫描范围的最大值；窗口未满，暂不输出。' : '维护完成：候选都在窗口内，队头对应值最大。';
        duration = 1.75;
        break;
      case 'collect':
        heading = `窗口 [${event.left}, ${event.index}] 的答案是 ${removed}。`;
        body = `直接读取队头下标 ${event.subject}，不必重新扫描窗口。`;
        detail = '答案复制到结果区；候选仍留在队列中，等待下一轮。';
        duration = 2.25;
        break;
    }
    beats.push({id: event.id, kind: 'event', event, heading, body, detail, duration, motionSeconds: 0.6});
  }

  beats.push({
    id: 'recap', kind: 'recap', event: null,
    heading: '每个下标入队一次，最多出队一次。',
    body: `答案 [${trace.result.join(', ')}]。算法时间 O(n)，候选空间 O(k)。`,
    detail: '教学快照另有存储开销，不计入被讲解算法的空间复杂度。',
    duration: 5, motionSeconds: 0.6,
  }, {
    id: 'transfer', kind: 'transfer', event: null,
    heading: '迁移自测：同样是弹出，含义真的一样吗？',
    body: '对照 739「每日温度」：出栈是在结算谁的答案？',
    detail: '本题弹出的是失去资格的候选；每日温度是在结算等待更高温度的位置。',
    duration: 7, motionSeconds: 0.6,
  });
  return {trace, beats, duration: beats.reduce((sum, beat) => sum + beat.duration, 0)};
}
