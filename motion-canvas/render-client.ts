import {Renderer, RendererResult, Vector2} from '@motion-canvas/core';
import project from '../.devin/motion-canvas/sliding-window?project';
import {buildLesson} from './model/lesson';

const renderer = new Renderer(project);
const lesson = buildLesson(project.variables?.nums as number[], project.variables?.k as number);
const settings = () => ({
  ...project.meta.getFullRenderingSettings(),
  name: 'sliding-window',
  size: new Vector2(1920, 1080),
  fps: 60,
  resolutionScale: 1,
  range: [0, lesson.duration] as [number, number],
  exporter: {name: '@motion-canvas/ffmpeg', options: {fastStart: true, includeAudio: false}},
});

export function getReviewPoints() {
  let time = 0;
  const points = [{name: 'opening', time: 1}];
  for (const beat of lesson.beats) {
    if (beat.kind === 'predict') points.push({name: 'prediction', time: time + 1});
    if (beat.event?.kind === 'expire' && !points.some(point => point.name === 'expiry-motion')) {
      points.push({name: 'expiry-motion', time: time + 0.42});
    }
    if (beat.event?.kind === 'append' && beat.event.index === 1) {
      points.push({name: 'append-motion', time: time + 0.42});
    }
    if (beat.event?.kind === 'scan' && beat.event.index === lesson.trace.nums.length - 1) {
      points.push({name: 'last-window-entering', time: time + 0.25});
      points.push({name: 'last-window-settled', time: time + 1});
    }
    if (beat.kind === 'recap') points.push({name: 'recap', time: time + 1});
    if (beat.kind === 'transfer') points.push({name: 'transfer', time: time + 5});
    time += beat.duration;
  }
  return {points, duration: lesson.duration, result: lesson.trace.result};
}

export async function snapshot(time: number) {
  await document.fonts.ready;
  const start = project.logger.history.length;
  await renderer.renderFrame(settings(), time);
  const errors = project.logger.history.slice(start).filter(entry => entry.level === 'error');
  if (errors.length) throw new Error(errors.map(entry => entry.message).join('\n'));
  return renderer.stage.finalBuffer.toDataURL('image/png');
}

export async function renderVideo(onProgress: (frame: number) => void, outputName: string) {
  if (!/^sliding-window-[A-Za-z0-9_-]+$/.test(outputName)) throw new Error('Invalid export name.');
  await document.fonts.ready;
  let result: RendererResult | undefined;
  const done = (value: RendererResult) => {result = value;};
  renderer.onFinished.subscribe(done);
  renderer.onFrameChanged.subscribe(onProgress);
  const start = project.logger.history.length;
  try {
    await renderer.render({...settings(), name: outputName});
    const errors = project.logger.history.slice(start).filter(entry => entry.level === 'error');
    if (result !== RendererResult.Success || errors.length) {
      throw new Error(`Video export failed (${result}): ${errors.map(entry => entry.message).join('\n')}`);
    }
    return {duration: lesson.duration, fps: 60, result: lesson.trace.result};
  } finally {
    renderer.onFinished.unsubscribe(done);
    renderer.onFrameChanged.unsubscribe(onProgress);
  }
}
