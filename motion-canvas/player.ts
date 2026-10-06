import {Player, Stage, Vector2} from '@motion-canvas/core';
import project from '../.devin/motion-canvas/sliding-window?project';
import {PLAYBACK_RATES} from './model/learning';

export function createLearningPlayer(host: HTMLElement, callbacks: {
  frame: (frame: number) => void;
  state: (paused: boolean) => void;
  ready: () => void;
  error: (message: string) => void;
}, initialSpeed = 1) {
  if (!PLAYBACK_RATES.some(rate => rate === initialSpeed)) throw new RangeError('Unsupported playback speed.');
  const stage = new Stage();
  stage.configure({size: new Vector2(1920, 1080), resolutionScale: 1, background: '#F3F1E9'});
  stage.finalBuffer.setAttribute('aria-label', '单调队列算法动画；完整文字状态见下方静态步骤与右侧讲解。');
  stage.finalBuffer.setAttribute('role', 'img');
  host.replaceChildren(stage.finalBuffer);
  const player = new Player(project, {
    fps: 60, size: new Vector2(1920, 1080), resolutionScale: 1,
  }, {loop: false, muted: true}, 60);
  let awaitingFirstFrame = true;
  let requireWarmFrame = true;
  const render = async () => {
    await stage.render(player.playback.currentScene, player.playback.previousScene);
    if (awaitingFirstFrame) {
      if (requireWarmFrame && player.status.frame < 60) player.requestSeek(60);
      else {
        awaitingFirstFrame = false;
        requireWarmFrame = false;
        callbacks.ready();
      }
    }
  };
  const state = (value: {paused: boolean}) => callbacks.state(value.paused);
  const error = (value: {level?: string; message: string}) => {
    if (value.level === 'error') {
      player.togglePlayback(false);
      callbacks.error(value.message);
    }
  };
  player.onRender.subscribe(render);
  player.onFrameChanged.subscribe(callbacks.frame);
  player.onStateChanged.subscribe(state);
  const recalculated = () => {awaitingFirstFrame = true;};
  player.onRecalculated.subscribe(recalculated);
  project.logger.onLogged.subscribe(error);
  if (initialSpeed !== 1) player.setSpeed(initialSpeed);

  return {
    play: () => player.togglePlayback(true),
    pause: () => player.togglePlayback(false),
    seek: (frame: number) => {player.togglePlayback(false); player.requestSeek(frame);},
    setSpeed: (rate: number) => {
      if (!PLAYBACK_RATES.some(value => value === rate)) throw new RangeError('Unsupported playback speed.');
      player.setSpeed(rate);
    },
    update: (nums: number[], k: number) => {
      requireWarmFrame = true;
      player.togglePlayback(false);
      player.setVariables({nums, k});
      player.playback.reload();
      player.requestSeek(60);
    },
    dispose: () => {
      player.deactivate();
      player.onRender.unsubscribe(render);
      player.onFrameChanged.unsubscribe(callbacks.frame);
      player.onStateChanged.unsubscribe(state);
      player.onRecalculated.unsubscribe(recalculated);
      project.logger.onLogged.unsubscribe(error);
      host.replaceChildren();
    },
  };
}
