import assert from 'node:assert/strict';
import {test} from 'node:test';
import {buildLesson, scanTransitionText} from './lesson';
import {createTimeline, locateBeat, parseLessonInput, readAttempts, recordAttempt, QUESTIONS, stateAtFrame, PLAYBACK_RATES} from './learning';

const lesson = buildLesson([1, 3, -1, -3, 5, 3, 6, 7], 3);

test('accepts JSON arrays and comma-separated integers without evaluating code', () => {
  assert.deepEqual(parseLessonInput('[1,3,-1]', '2'), {nums: [1, 3, -1], k: 2});
  assert.deepEqual(parseLessonInput('1，3，-1', '2'), {nums: [1, 3, -1], k: 2});
  assert.deepEqual(parseLessonInput('1 3 -1', '1'), {nums: [1, 3, -1], k: 1});
  for (const value of ['', '[]', '[null]', '[true]', '1,,2', '1.5,2', '[1000]', 'alert(1)', '1,'.repeat(200)]) {
    assert.throws(() => parseLessonInput(value, '1'));
  }
  for (const value of ['', '0', '4', '1.5', '2abc']) assert.throws(() => parseLessonInput('[1,2,3]', value));
});

test('timeline preserves duration and gives each beat a stable seek point', () => {
  const timeline = createTimeline(lesson);
  assert.equal(timeline[0].startFrame, 0);
  assert.equal(timeline.at(-1)?.endFrame, Math.round(lesson.duration * 60));
  for (const [i, entry] of timeline.entries()) {
    assert.ok(entry.seekFrame >= entry.startFrame && entry.seekFrame < entry.endFrame);
    assert.equal(locateBeat(timeline, entry.seekFrame), i);
    if (i) assert.equal(entry.startFrame, timeline[i - 1].endFrame);
  }
  assert.equal(locateBeat(timeline, -1), 0);
  assert.equal(locateBeat(timeline, Infinity), timeline.length - 1);
});

test('state table does not claim after-state invariants during an animation', () => {
  const timeline = createTimeline(lesson);
  const entry = timeline.find(row => row.beat.event?.kind === 'append')!;
  const before = stateAtFrame(lesson, timeline, entry.startFrame + 10);
  const after = stateAtFrame(lesson, timeline, entry.seekFrame);
  assert.equal(before.ready, false);
  assert.deepEqual(before.deque, []);
  assert.equal(after.ready, true);
  assert.deepEqual(after.deque, [0]);
  const summary = timeline.find(row => row.beat.kind === 'recap')!;
  assert.deepEqual(stateAtFrame(lesson, timeline, summary.seekFrame).result, lesson.trace.result);
});

test('prediction checkpoints retain state without revealing the next removal', () => {
  const timeline = createTimeline(lesson);
  const prediction = timeline.find(row => row.beat.kind === 'predict')!;
  const state = stateAtFrame(lesson, timeline, prediction.seekFrame);
  assert.deepEqual(state.deque, [1, 2, 3]);
  assert.equal(state.left, 2);
  assert.equal(state.ready, false);
});

test('incoming 7 is described as a transition until the window actually reaches [5, 7]', () => {
  const timeline = createTimeline(lesson);
  const row = timeline.find(entry => entry.beat.event?.kind === 'scan' && entry.beat.event.index === 7)!;
  const event = row.beat.event!;
  const transition = scanTransitionText(event, lesson.trace.nums, lesson.trace.k);
  assert.match(transition.heading, /即将/);
  assert.match(transition.body, /\[4, 6\].*\[5, 7\]/);
  assert.deepEqual({index: stateAtFrame(lesson, timeline, row.startFrame + 5).index, left: stateAtFrame(lesson, timeline, row.startFrame + 5).left}, {index: 6, left: 4});
  assert.deepEqual({index: stateAtFrame(lesson, timeline, row.seekFrame).index, left: stateAtFrame(lesson, timeline, row.seekFrame).left}, {index: 7, left: 5});
  const first = timeline.find(entry => entry.beat.event?.kind === 'scan' && entry.beat.event.index === 0)!;
  assert.match(scanTransitionText(first.beat.event!, lesson.trace.nums, lesson.trace.k).body, /空状态/);
});

test('personal playback rates stay within supported options', () => {
  assert.deepEqual(PLAYBACK_RATES, [0.5, 1, 1.5, 2]);
});

test('attempts preserve the first answer and distinguish hinted retries', () => {
  const question = QUESTIONS[0];
  const wrong = question.options.find(option => option.id !== question.answer)!;
  const first = recordAttempt([], question.id, wrong.id, false, '2026-09-30T10:00:00.000Z');
  const next = recordAttempt(first, question.id, question.answer, true, '2026-09-30T10:01:00.000Z');
  assert.equal(next[0].correct, false);
  assert.equal(next[0].first, true);
  assert.equal(next[1].correct, true);
  assert.equal(next[1].first, false);
  assert.equal(next[1].hinted, true);
  assert.throws(() => recordAttempt(next, 'unknown', 'a', false));
  assert.throws(() => recordAttempt(next, question.id, 'unknown', false));
});

test('corrupt, oversized, or inconsistent local records are not mistaken for empty valid history', () => {
  assert.deepEqual(readAttempts(null), {attempts: [], error: null});
  const valid = recordAttempt([], QUESTIONS[0].id, QUESTIONS[0].answer, false);
  assert.deepEqual(readAttempts(JSON.stringify({version: 1, attempts: valid})).attempts, valid);
  for (const raw of ['{', '{}', 'null', JSON.stringify({version: 2, attempts: []}), JSON.stringify({version: 1, attempts: [{...valid[0], correct: false}]}), JSON.stringify({version: 1, attempts: Array(201).fill(valid[0])})]) {
    const result = readAttempts(raw);
    assert.ok(result.error);
    assert.deepEqual(result.attempts, []);
  }
});

test('record cap refuses further writes without silently discarding first attempts', () => {
  let attempts = recordAttempt([], QUESTIONS[0].id, QUESTIONS[0].answer, false);
  for (let i = 1; i < 200; i++) attempts = recordAttempt(attempts, QUESTIONS[0].id, QUESTIONS[0].answer, false);
  assert.equal(attempts.length, 200);
  assert.equal(attempts[0].first, true);
  assert.throws(() => recordAttempt(attempts, QUESTIONS[0].id, QUESTIONS[0].answer, false));
});
