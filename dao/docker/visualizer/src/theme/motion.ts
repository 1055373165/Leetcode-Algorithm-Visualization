import { SpringConfig } from 'remotion';

/**
 * 弹簧配置梯度：
 *   - weighty  → 慢、重、有惯性（重要结构出现）
 *   - standard → 常规动画（元素移动、值变化）
 *   - snappy   → 快、灵敏（小调整、数字跳动）
 *   - bouncy   → 有弹跳（强调、吸引注意）
 *
 * 原则：没有东西应该"硬切"。所有状态变化都要有惯性。
 *       这是 Ciechanowski 美学的物理化感觉的来源。
 */
export const springs: Record<string, Partial<SpringConfig>> = {
  weighty: {
    mass: 1.2,
    damping: 180,
    stiffness: 80,
  },
  standard: {
    mass: 0.7,
    damping: 120,
    stiffness: 140,
  },
  snappy: {
    mass: 0.4,
    damping: 80,
    stiffness: 220,
  },
  bouncy: {
    mass: 0.6,
    damping: 12,
    stiffness: 120,
  },
};

/**
 * 动画阶段长度（帧数，基于 30fps）。
 * 命名按用途，方便后续统一调节节奏。
 */
export const durations = {
  instant: 5,     // ~0.17s — 微反馈
  quick: 12,      // ~0.4s  — 值变化
  normal: 24,     // ~0.8s  — 元素出现
  slow: 45,       // ~1.5s  — 重要结构登场
  dwell: 60,      // ~2s    — 停留观察
  breath: 90,     // ~3s    — 给观众思考
};

/**
 * 缓动曲线（用于 interpolate，不是 spring 的场合）。
 */
export const easings = {
  // 进入：从快到慢（让目标"被吸引"到位）
  enter: (t: number): number => 1 - Math.pow(1 - t, 3),
  // 退出：从慢到快（让元素"逃离"）
  exit: (t: number): number => t * t * t,
  // 标准：两端慢中间快
  smooth: (t: number): number =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  // 线性（仅用于时间本身）
  linear: (t: number): number => t,
};
