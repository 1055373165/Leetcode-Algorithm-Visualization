import assert from 'node:assert/strict';
import {test} from 'node:test';
import {buildDequeTrace} from './deque';
import {buildLesson} from './lesson';

const oracle = (nums: number[], k: number) =>
  Array.from({length: nums.length - k + 1}, (_, i) => Math.max(...nums.slice(i, i + k)));

test('classic example and terminal checkpoint', () => {
  const trace = buildDequeTrace([1, 3, -1, -3, 5, 3, 6, 7], 3);
  assert.deepEqual(trace.result, [3, 3, 5, 5, 6, 7]);
  assert.equal(trace.events.at(-1)?.kind, 'collect');
  assert.deepEqual(trace.events.at(-1)?.after.result, trace.result);
});

test('exhaustive differential checks and invariants at valid checkpoints', () => {
  let cases = 0;
  for (let n = 1; n <= 6; n++) {
    for (let encoded = 0; encoded < 3 ** n; encoded++) {
      let remaining = encoded;
      const nums = Array.from({length: n}, () => {
        const value = remaining % 3 - 1;
        remaining = Math.floor(remaining / 3);
        return value;
      });
      for (let k = 1; k <= n; k++) {
        const trace = buildDequeTrace(nums, k);
        assert.deepEqual(trace.result, oracle(nums, k));
        for (const event of trace.events) {
          if (!event.invariantReady) continue;
          const deque = event.after.deque;
          assert.ok(deque.every(i => i >= event.left && i <= event.index));
          assert.ok(deque.every((i, j) => j === 0 || deque[j - 1] < i));
          assert.ok(deque.every((i, j) => j === 0 || nums[deque[j - 1]] > nums[i]));
          assert.equal(nums[deque[0]], Math.max(...nums.slice(event.left, event.index + 1)));
        }
        cases++;
      }
    }
  }
  assert.equal(cases, 6015);
});

test('expired maximum is removed before pruning and appending', () => {
  const trace = buildDequeTrace([1, 3, -1, -3, 5, 3, 6, 7], 3);
  const events = trace.events.filter(event => event.index === 4);
  assert.deepEqual(events.map(event => event.kind), ['scan', 'expire', 'prune', 'prune', 'append', 'collect']);
  assert.deepEqual(events[1].before.deque, [1, 2, 3]);
  assert.deepEqual(events[1].after.deque, [2, 3]);
  assert.equal(events[1].subject, 1);
  assert.equal(events[0].invariantReady, false);
});

test('equal values keep the newer index without confusing object identities', () => {
  const trace = buildDequeTrace([5, 5, 5], 2);
  assert.deepEqual(trace.result, [5, 5]);
  assert.deepEqual(trace.events.filter(event => event.kind === 'prune').map(event => event.subject), [0, 1]);
});

test('snapshots chain, never alias one another, and survive JSON round trips', () => {
  const input = [9, 8, 7, 6];
  const trace = buildDequeTrace(input, 2);
  input[0] = 0;
  assert.equal(trace.nums[0], 9);
  for (let i = 1; i < trace.events.length; i++) {
    assert.deepEqual(trace.events[i].before, trace.events[i - 1].after);
    assert.notEqual(trace.events[i].before.deque, trace.events[i - 1].after.deque);
  }
  assert.deepEqual(JSON.parse(JSON.stringify(trace)), trace);
});

test('each index enters once and leaves at most once', () => {
  const trace = buildDequeTrace([7, 6, 5, 4, 3, 2, 1, 9], 3);
  const inserted = trace.events.filter(event => event.kind === 'append').map(event => event.subject);
  const removed = trace.events.filter(event => event.kind === 'expire' || event.kind === 'prune').map(event => event.subject);
  assert.equal(new Set(inserted).size, trace.nums.length);
  assert.equal(new Set(removed).size, removed.length);
});

test('invalid inputs fail explicitly instead of silently producing a video', () => {
  for (const [nums, k] of [[[], 1], [[1], 0], [[1], 2], [[1], 0.5], [[NaN], 1], [[Infinity], 1], [[1.5], 1], [[Number.MAX_SAFE_INTEGER + 1], 1]] as [number[], number][]) {
    assert.throws(() => buildDequeTrace(nums, k));
  }
  assert.throws(() => buildDequeTrace(Array(257).fill(1), 3));
  assert.throws(() => buildDequeTrace(Array(3), 2));
});

test('lesson contains every event once, prediction before reveal, and final recap', () => {
  const lesson = buildLesson([1, 3, -1, -3, 5, 3, 6, 7], 3);
  assert.deepEqual(lesson.beats.filter(beat => beat.event !== null).map(beat => beat.event), lesson.trace.events);
  assert.equal(lesson.beats[0].kind, 'intro');
  assert.equal(lesson.beats.at(-1)?.kind, 'transfer');
  assert.ok(lesson.beats.some(beat => beat.kind === 'recap'));
  const prediction = lesson.beats.findIndex(beat => beat.kind === 'predict');
  assert.ok(prediction > 0);
  assert.equal(lesson.beats[prediction + 1].event?.kind, 'expire');
  assert.ok(lesson.beats.every(beat => beat.duration > beat.motionSeconds && beat.motionSeconds > 0));
  assert.equal(lesson.duration, lesson.beats.reduce((sum, beat) => sum + beat.duration, 0));
  assert.deepEqual(JSON.parse(JSON.stringify(lesson)), lesson);
});

test('lesson adapts to different inputs and enforces its visual capacity', () => {
  const lesson = buildLesson([1, 2, 3, 4], 2);
  assert.deepEqual(lesson.trace.result, [2, 3, 4]);
  assert.ok(!lesson.beats.some(beat => beat.kind === 'predict'));
  assert.throws(() => buildLesson(Array(11).fill(1), 3));
  assert.throws(() => buildLesson([10000], 1));
});
