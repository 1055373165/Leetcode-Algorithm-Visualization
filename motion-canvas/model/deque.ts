export type DequeEventKind = 'scan' | 'expire' | 'prune' | 'append' | 'collect';

export interface DequeSnapshot {
  deque: number[];
  result: number[];
}

export interface DequeEvent {
  id: string;
  kind: DequeEventKind;
  index: number;
  left: number;
  subject: number;
  before: DequeSnapshot;
  after: DequeSnapshot;
  invariantReady: boolean;
}

export interface DequeTrace {
  schemaVersion: 1;
  nums: number[];
  k: number;
  events: DequeEvent[];
  result: number[];
}

export function buildDequeTrace(input: readonly number[], k: number): DequeTrace {
  if (!Array.isArray(input) || input.length < 1 || input.length > 256) {
    throw new RangeError('Trace input must contain between 1 and 256 integers.');
  }
  if (!Array.from(input).every(Number.isSafeInteger)) {
    throw new TypeError('Trace values must be finite safe integers.');
  }
  if (!Number.isInteger(k) || k < 1 || k > input.length) {
    throw new RangeError('Window size must be an integer between 1 and input length.');
  }

  const nums = [...input];
  const deque: number[] = [];
  const result: number[] = [];
  const events: DequeEvent[] = [];
  let head = 0;
  const snapshot = (): DequeSnapshot => ({deque: deque.slice(head), result: [...result]});

  for (let index = 0; index < nums.length; index++) {
    const left = Math.max(0, index - k + 1);
    const record = (kind: DequeEventKind, subject: number, change: () => void) => {
      const before = snapshot();
      change();
      events.push({
        id: `${index}:${kind}:${events.length}`,
        kind,
        index,
        left,
        subject,
        before,
        after: snapshot(),
        invariantReady: kind === 'append' || kind === 'collect',
      });
    };

    record('scan', index, () => {});
    if (head < deque.length && deque[head] < left) {
      record('expire', deque[head], () => {head++;});
    }
    while (head < deque.length && nums[deque[deque.length - 1]] <= nums[index]) {
      record('prune', deque[deque.length - 1], () => {deque.pop();});
    }
    record('append', index, () => {deque.push(index);});
    if (index >= k - 1) {
      record('collect', deque[head], () => {result.push(nums[deque[head]]);});
    }
    if (head >= k) {
      deque.splice(0, head);
      head = 0;
    }
  }

  return {schemaVersion: 1, nums, k, events, result: [...result]};
}
