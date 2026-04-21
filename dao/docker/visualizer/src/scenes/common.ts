import { SpringConfig } from 'remotion';

/**
 * 场景组件共享的 props 形态。
 *
 * GenericScenePlayer 按每一帧计算出 progress 和 sceneFrame，
 * 传给正在活动的场景组件。场景组件的唯一职责是根据这三个数字渲染画面。
 */
export type ScenePlaybackProps = {
  /** 0-1，本场景已走过的比例 */
  progress: number;
  /** 本场景内的帧索引（从 0 开始） */
  sceneFrame: number;
  /** 视频 fps */
  fps: number;
};

/**
 * 常用的阶段划分：每个场景典型的"进入-主体-出场"结构。
 *
 * 输入 progress（0-1），返回三段 0-1 的归一化阶段进度：
 *   entering  0 → 1 在 progress 0-0.15
 *   dwelling  0 → 1 在 progress 0.15-0.85
 *   exiting   0 → 1 在 progress 0.85-1.0
 */
export function phases(progress: number) {
  const entering = Math.max(0, Math.min(1, progress / 0.15));
  const dwelling =
    progress < 0.15
      ? 0
      : progress > 0.85
        ? 1
        : (progress - 0.15) / 0.7;
  const exiting = Math.max(0, Math.min(1, (progress - 0.85) / 0.15));
  return { entering, dwelling, exiting };
}

/** 常用 spring 配置的简短访问 */
export const sceneSprings: Record<string, Partial<SpringConfig>> = {
  /** 标题/卡片出现 */
  enter: { mass: 0.8, damping: 150, stiffness: 120 },
  /** 快速反馈 */
  snap: { mass: 0.4, damping: 80, stiffness: 220 },
  /** 重要元素 */
  emphasize: { mass: 0.6, damping: 14, stiffness: 110 },
};
