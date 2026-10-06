import {buildLesson, scanTransitionText} from './model/lesson';
import {createTimeline, locateBeat, parseLessonInput, PLAYBACK_RATES, QUESTIONS, readAttempts, recordAttempt, stateAtFrame, type Attempt} from './model/learning';
import {SOLUTIONS, type Language} from './model/code';
import type {createLearningPlayer} from './player';

const element = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const form = element<HTMLFormElement>('input-form');
const numsInput = element<HTMLInputElement>('nums');
const kInput = element<HTMLInputElement>('window-size');
const applyButton = element<HTMLButtonElement>('apply-input');
const inputError = element<HTMLParagraphElement>('input-error');
const playButton = element<HTMLButtonElement>('play');
const slider = element<HTMLInputElement>('timeline');
const playbackSpeed = element<HTMLSelectElement>('playback-speed');
const staticToggle = element<HTMLInputElement>('static-mode');
const pauseQuestions = element<HTMLInputElement>('pause-questions');
const runtimeError = element<HTMLParagraphElement>('runtime-error');
const languageSelect = element<HTMLSelectElement>('language');
const attemptKey = 'algorithm-studio:attempts:v1';
const preferencesKey = 'algorithm-studio:preferences:v1';
let lesson = buildLesson([1, 3, -1, -3, 5, 3, 6, 7], 3);
let timeline = createTimeline(lesson);
let currentFrame = 60;
let paused = true;
let busy = true;
let player: ReturnType<typeof createLearningPlayer> | undefined;
let signature = '';
let questionIndex = 0;
let hinted = false;
let answered = false;
let attempts: Attempt[] = [];
let writable = true;
let noticeTimer: ReturnType<typeof setTimeout> | undefined;
let loadingTimer: ReturnType<typeof setTimeout> | undefined;
const pausedAt = new Set<string>();
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
staticToggle.checked = motionPreference.matches || window.innerWidth < 520;

function notify(message: string) {
  const notice = element('notice');
  notice.textContent = message;
  notice.hidden = false;
  clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => {notice.hidden = true;}, 3500);
}

function setStorageStatus(message: string) {
  element('storage-status').textContent = message;
}

try {
  const saved = readAttempts(localStorage.getItem(attemptKey));
  attempts = saved.attempts;
  writable = !saved.error;
  if (saved.error) setStorageStatus(saved.error);
  const preferences = JSON.parse(localStorage.getItem(preferencesKey) ?? 'null');
  if (preferences?.version === 1 && typeof preferences.nums === 'string' && typeof preferences.k === 'string') {
    const values = parseLessonInput(preferences.nums, preferences.k);
    numsInput.value = values.nums.join(', ');
    kInput.value = String(values.k);
    lesson = buildLesson(values.nums, values.k);
    timeline = createTimeline(lesson);
    if (preferences.language in SOLUTIONS) languageSelect.value = preferences.language;
    if (PLAYBACK_RATES.some(rate => rate === Number(preferences.speed))) playbackSpeed.value = String(preferences.speed);
  }
} catch {
  setStorageStatus('浏览器存储不可用或偏好格式有误；请检查输入。本次可继续学习。');
}

function savePreferences() {
  try {
    localStorage.setItem(preferencesKey, JSON.stringify({version: 1, nums: numsInput.value, k: kInput.value, language: languageSelect.value, speed: Number(playbackSpeed.value)}));
  } catch {
    notify('偏好无法保存，当前演示不受影响。');
  }
}

function timecode(frame: number) {
  const seconds = Math.floor(frame / 60);
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

function updatePlayButton() {
  playButton.disabled = busy || !player || staticToggle.checked;
  playButton.textContent = staticToggle.checked ? '静态查看' : paused ? '播放' : '暂停';
  playButton.setAttribute('aria-label', staticToggle.checked ? '静态查看，请使用上一步和下一步' : paused ? '播放动画' : '暂停动画');
}

function syncFrame(frame: number) {
  currentFrame = Math.max(0, Math.min(frame, timeline.at(-1)!.endFrame - 1));
  const index = locateBeat(timeline, currentFrame);
  const row = timeline[index];
  slider.max = String(timeline.at(-1)!.endFrame - 1);
  slider.value = String(currentFrame);
  element('timecode').textContent = `${timecode(currentFrame)} / ${timecode(timeline.at(-1)!.endFrame)}`;
  element('step-count').textContent = `步骤 ${index + 1} / ${timeline.length}`;
  const settled = currentFrame >= row.startFrame + 51;
  const reveal = row.beat.kind !== 'transfer' || currentFrame >= row.startFrame + 240;
  const nextSignature = `${index}:${settled}:${reveal}`;
  if (signature !== nextSignature) {
    signature = nextSignature;
    const beat = row.beat;
    const transition = beat.event?.kind === 'scan' && !settled ? scanTransitionText(beat.event, lesson.trace.nums, lesson.trace.k) : null;
    element('focus-heading').textContent = transition?.heading ?? beat.heading;
    element('focus-body').textContent = transition?.body ?? beat.body;
    element('focus-detail').textContent = reveal ? beat.detail : '先口述：弹出动作的含义是什么，答案在什么时候写入？';
    element('step-kind').textContent = beat.kind === 'predict' ? '停下来，先做判断' : beat.kind === 'recap' ? '回顾复杂度' : beat.kind === 'transfer' ? '从操作迁移到语义' : beat.event ? ({scan: '观察 · 扫描', expire: '队头 · 过期', prune: '队尾 · 淘汰', append: '操作 · 入队', collect: '验证 · 输出'}[beat.event.kind]) : '建立直觉';
    const state = stateAtFrame(lesson, timeline, currentFrame);
    const status = state.ready ? '维护完成 · 此时可验证不变量' : beat.event && !settled ? '动画过渡中 · 暂不判定不变量' : '维护进行中 · 先处理候选';
    element('checkpoint').textContent = status;
    element('state-invariant').textContent = status;
    element('snapshot-heading').textContent = transition?.heading ?? beat.heading;
    element('state-input').textContent = `[${state.nums.join(', ')}]`;
    element('state-window').textContent = state.index < 0 ? '尚未扫描' : `[${state.left}, ${state.index}] · k = ${state.k}`;
    element('state-deque').textContent = state.deque.length ? state.deque.map(i => `${i} / ${state.nums[i]}`).join('  →  ') : '空队列';
    element('state-result').textContent = state.result.length ? `[${state.result.join(', ')}]` : '尚无完整窗口答案';
    document.querySelectorAll<HTMLButtonElement>('[data-beat]').forEach(button => {
      button.setAttribute('aria-current', String(Number(button.dataset.beat) === index));
    });
  }
  if (!paused && pauseQuestions.checked && row.beat.kind === 'predict' && !pausedAt.has(row.beat.id)) {
    pausedAt.add(row.beat.id);
    player?.seek(row.seekFrame);
    notify('已停在思考点。想好后按播放继续。');
  }
  if (!paused && currentFrame >= timeline.at(-1)!.endFrame - 2) player?.pause();
}

function seekBeat(index: number) {
  const target = timeline[Math.max(0, Math.min(index, timeline.length - 1))];
  player?.seek(target.seekFrame);
  if (!player || staticToggle.checked) syncFrame(target.seekFrame);
}

function renderChapters() {
  const host = element('chapters');
  host.replaceChildren();
  const definitions = [
    {label: '建立直觉', index: 0},
    {label: '第一次淘汰', index: timeline.findIndex(row => row.beat.event?.kind === 'prune')},
    {label: '旧最大值过期', index: timeline.findIndex(row => row.beat.kind === 'predict')},
    {label: '复杂度', index: timeline.findIndex(row => row.beat.kind === 'recap')},
    {label: '迁移问题', index: timeline.findIndex(row => row.beat.kind === 'transfer')},
  ];
  for (const item of definitions.filter(item => item.index >= 0)) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = item.label;
    button.dataset.beat = String(item.index);
    button.addEventListener('click', () => seekBeat(item.index));
    host.append(button);
  }
}

function setStaticMode() {
  if (staticToggle.checked) player?.pause();
  element('canvas-host').hidden = staticToggle.checked;
  element('static-state').hidden = !staticToggle.checked;
  element('stage').classList.toggle('static', staticToggle.checked);
  updatePlayButton();
}

function failPlayer(message: string) {
  clearTimeout(loadingTimer);
  busy = false;
  applyButton.disabled = false;
  player?.pause();
  runtimeError.textContent = `动画加载遇到问题，已切换为静态步骤。${message}`;
  runtimeError.hidden = false;
  element('player-status').textContent = '静态回退';
  staticToggle.checked = true;
  setStaticMode();
}

function applyInput() {
  inputError.hidden = true;
  numsInput.removeAttribute('aria-invalid');
  kInput.removeAttribute('aria-invalid');
  try {
    const {nums, k} = parseLessonInput(numsInput.value, kInput.value);
    lesson = buildLesson(nums, k);
    timeline = createTimeline(lesson);
    signature = '';
    pausedAt.clear();
    renderChapters();
    syncFrame(60);
    if (player) {
      busy = true;
      applyButton.disabled = true;
      element('player-status').textContent = '重新计算事件';
      clearTimeout(loadingTimer);
      loadingTimer = setTimeout(() => failPlayer('请刷新页面重试。'), 15000);
      player.update(nums, k);
    }
    updatePlayButton();
    savePreferences();
  } catch (error) {
    inputError.textContent = error instanceof Error ? error.message : '输入无法解析。';
    inputError.hidden = false;
    numsInput.setAttribute('aria-invalid', 'true');
    kInput.setAttribute('aria-invalid', 'true');
  }
}

form.addEventListener('submit', event => {event.preventDefault(); if (!busy) applyInput();});
const presets = {
  classic: {nums: '1, 3, -1, -3, 5, 3, 6, 7', k: 3},
  decreasing: {nums: '9, 8, 7, 6, 5, 4', k: 3},
  duplicates: {nums: '4, 4, 2, 4, 1, 5', k: 3},
};
document.querySelectorAll<HTMLButtonElement>('[data-preset]').forEach(button => button.addEventListener('click', () => {
  if (busy) return;
  const preset = presets[button.dataset.preset as keyof typeof presets];
  numsInput.value = preset.nums;
  kInput.value = String(preset.k);
  applyInput();
}));
playButton.addEventListener('click', () => paused ? player?.play() : player?.pause());
element('previous').addEventListener('click', () => seekBeat(locateBeat(timeline, currentFrame) - 1));
element('next').addEventListener('click', () => seekBeat(locateBeat(timeline, currentFrame) + 1));
slider.addEventListener('input', () => {
  const frame = Number(slider.value);
  player?.seek(frame);
  if (!player || staticToggle.checked) syncFrame(frame);
});
playbackSpeed.addEventListener('change', () => {
  const rate = Number(playbackSpeed.value);
  if (!PLAYBACK_RATES.some(value => value === rate)) {playbackSpeed.value = '1'; return;}
  player?.setSpeed(rate);
  if (!busy) element('player-status').textContent = `实时场景 · ${rate}× 播放`;
  savePreferences();
});
staticToggle.addEventListener('change', setStaticMode);
motionPreference.addEventListener('change', event => {if (event.matches) {staticToggle.checked = true; setStaticMode();}});
element('fullscreen').addEventListener('click', async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await element('stage').requestFullscreen();
  } catch {notify('此浏览器暂不支持全屏，可以使用静态步骤查看完整状态。');}
});
document.addEventListener('visibilitychange', () => {if (document.hidden) player?.pause();});

const tabs = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-tab]'));
function selectTab(name: string, focus = false) {
  for (const tab of tabs) {
    const selected = tab.dataset.tab === name;
    tab.setAttribute('aria-selected', String(selected));
    tab.tabIndex = selected ? 0 : -1;
    element(`panel-${tab.dataset.tab}`).hidden = !selected;
    if (selected && focus) tab.focus();
  }
}
tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectTab(tab.dataset.tab!));
  tab.addEventListener('keydown', event => {
    const next = event.key === 'ArrowRight' ? (index + 1) % tabs.length : event.key === 'ArrowLeft' ? (index + tabs.length - 1) % tabs.length : event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : -1;
    if (next < 0) return;
    event.preventDefault();
    selectTab(tabs[next].dataset.tab!, true);
  });
});
element('practice-nav').addEventListener('click', () => selectTab('practice'));
function renderCode() {
  const solution = SOLUTIONS[languageSelect.value as Language];
  element('code-content').textContent = solution.code;
  element('code-note').textContent = solution.note;
}
languageSelect.addEventListener('change', () => {renderCode(); savePreferences();});
element('copy-code').addEventListener('click', async () => {
  try {await navigator.clipboard.writeText(SOLUTIONS[languageSelect.value as Language].code); notify('参考代码已复制。');}
  catch {notify('无法访问剪贴板，请在代码区选中后复制。');}
});

function renderAttemptSummary() {
  const summary = element('attempt-summary');
  summary.replaceChildren();
  for (const question of QUESTIONS) {
    const first = attempts.find(attempt => attempt.questionId === question.id && attempt.first);
    const row = document.createElement('li');
    const skill = document.createElement('span');
    skill.textContent = question.skill;
    const status = document.createElement('b');
    status.textContent = !first ? '尚未作答' : first.hinted ? '首次借助提示' : first.correct ? '首次独立答对' : '首次待纠正';
    row.append(skill, status);
    summary.append(row);
  }
  element('practice-count').textContent = `${new Set(attempts.map(attempt => attempt.questionId)).size} / ${QUESTIONS.length}`;
}

function renderQuestion() {
  const question = QUESTIONS[questionIndex];
  hinted = false;
  answered = false;
  element('question-skill').textContent = `练习 ${questionIndex + 1} / ${QUESTIONS.length} · ${question.skill}`;
  element('question-title').textContent = question.prompt;
  element('question-context').textContent = question.context;
  const options = element<HTMLFieldSetElement>('question-options');
  options.replaceChildren();
  options.disabled = false;
  const legend = document.createElement('legend');
  legend.className = 'sr-only';
  legend.textContent = '选择你的判断';
  options.append(legend);
  for (const option of question.options) {
    const label = document.createElement('label');
    label.className = 'option';
    const radio = document.createElement('input');
    radio.type = 'radio'; radio.name = 'answer'; radio.value = option.id; radio.required = true;
    const text = document.createElement('span');
    text.textContent = option.text;
    label.append(radio, text);
    options.append(label);
  }
  element('question-hint').hidden = true;
  element('answer-feedback').hidden = true;
  element<HTMLButtonElement>('submit-answer').disabled = false;
  element<HTMLButtonElement>('show-hint').disabled = false;
  element('next-question').hidden = true;
}

element('show-hint').addEventListener('click', () => {
  hinted = true;
  const hint = element('question-hint');
  hint.textContent = QUESTIONS[questionIndex].hint;
  hint.hidden = false;
  element<HTMLButtonElement>('show-hint').disabled = true;
});
element('quiz-form').addEventListener('submit', event => {
  event.preventDefault();
  if (answered) return;
  const selected = document.querySelector<HTMLInputElement>('input[name=answer]:checked');
  if (!selected) return;
  const question = QUESTIONS[questionIndex];
  try {
    attempts = recordAttempt(attempts, question.id, selected.value, hinted);
  } catch (error) {notify(error instanceof Error ? error.message : '无法记录本次判断。'); return;}
  if (writable) {
    try {localStorage.setItem(attemptKey, JSON.stringify({version: 1, attempts}));}
    catch {writable = false; setStorageStatus('记录暂时只能保存在本次会话中，请导出保存。');}
  }
  answered = true;
  const correct = selected.value === question.answer;
  const feedback = element('answer-feedback');
  feedback.textContent = `${correct ? '这一次判断正确。' : '这里需要修正判断。'}${hinted ? '本次使用过提示。' : ''} ${question.explanation}`;
  feedback.dataset.correct = String(correct);
  feedback.hidden = false;
  element<HTMLFieldSetElement>('question-options').disabled = true;
  element<HTMLButtonElement>('submit-answer').disabled = true;
  element<HTMLButtonElement>('show-hint').disabled = true;
  const next = element<HTMLButtonElement>('next-question');
  next.textContent = questionIndex === QUESTIONS.length - 1 ? '重新练习 →' : '下一题 →';
  next.hidden = false;
  renderAttemptSummary();
});
element('next-question').addEventListener('click', () => {questionIndex = (questionIndex + 1) % QUESTIONS.length; renderQuestion(); element('question-options').querySelector('input')?.focus();});
element('export-records').addEventListener('click', () => {
  const url = URL.createObjectURL(new Blob([JSON.stringify({version: 1, exportedAt: new Date().toISOString(), attempts}, null, 2)], {type: 'application/json'}));
  const link = document.createElement('a');
  link.href = url; link.download = 'algorithm-learning-records.json';
  document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

renderChapters();
renderQuestion();
renderAttemptSummary();
renderCode();
setStaticMode();
syncFrame(60);
applyButton.disabled = true;
loadingTimer = setTimeout(() => failPlayer('请检查本地预览服务是否仍在运行。'), 15000);
void import('./player').then(({createLearningPlayer}) => {
  player = createLearningPlayer(element('canvas-host'), {
    frame: syncFrame,
    state: value => {paused = value; updatePlayButton();},
    ready: () => {
      clearTimeout(loadingTimer);
      busy = false;
      applyButton.disabled = false;
      element('player-status').textContent = `实时场景 · ${playbackSpeed.value}× 播放`;
      updatePlayButton();
    },
    error: failPlayer,
  }, Number(playbackSpeed.value));
  player.update(lesson.trace.nums, lesson.trace.k);
}).catch(error => failPlayer(error instanceof Error ? error.message : '无法载入动画模块。'));
window.addEventListener('pagehide', event => {if (event.persisted) player?.pause(); else player?.dispose();});
