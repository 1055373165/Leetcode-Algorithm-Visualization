/**
 * 简化 SM-2 间隔复习
 *
 * 用户每次复习后给自己打一个 1-5 的分：
 *   1 · 完全忘记了
 *   2 · 记得一点，但很难讲
 *   3 · 能讲清楚但不流畅
 *   4 · 流畅讲清楚
 *   5 · 轻松讲清楚，有自己的补充
 *
 * 算法把分数转成"下次复习的间隔"：
 *   分数低 → 间隔短（明天再看）
 *   分数高 → 间隔长（一周、半月、一月……指数级拉开）
 *
 * 这不是完整 SM-2（没有 easiness factor 微调），是它的简化版本。
 * 足够支撑个人学习场景。
 */

export type ReviewGrade = 1 | 2 | 3 | 4 | 5;

export type ReviewState = {
  /** 已复习次数（不算首次创建） */
  reviewCount: number;
  /** 上次复习的分数（null 表示从未复习） */
  lastGrade: ReviewGrade | null;
  /** 上次复习时间（ISO 字符串，null 表示从未复习） */
  lastReviewedAt: string | null;
  /** 距下次复习的当前间隔（天） */
  intervalDays: number;
  /** 下次该复习的时间 */
  nextReviewAt: string;
};

export function initialReviewState(): ReviewState {
  return {
    reviewCount: 0,
    lastGrade: null,
    lastReviewedAt: null,
    intervalDays: 1,
    // 刚创建的主题：今天就可以先复习一遍
    nextReviewAt: new Date().toISOString(),
  };
}

/**
 * 根据分数计算新的 review state。
 *
 * 简化算法：
 *   grade = 1 → 间隔重置为 1 天
 *   grade = 2 → 间隔 = max(1, prev * 0.5)
 *   grade = 3 → 间隔 = max(2, prev * 1.0)
 *   grade = 4 → 间隔 = prev * 2.0
 *   grade = 5 → 间隔 = prev * 3.0
 */
export function applyReview(prev: ReviewState, grade: ReviewGrade): ReviewState {
  const now = new Date();
  let newInterval: number;

  switch (grade) {
    case 1:
      newInterval = 1;
      break;
    case 2:
      newInterval = Math.max(1, Math.round(prev.intervalDays * 0.5));
      break;
    case 3:
      newInterval = Math.max(2, prev.intervalDays);
      break;
    case 4:
      newInterval = Math.max(3, Math.round(prev.intervalDays * 2));
      break;
    case 5:
      newInterval = Math.max(7, Math.round(prev.intervalDays * 3));
      break;
  }

  const next = new Date(now);
  next.setDate(next.getDate() + newInterval);

  return {
    reviewCount: prev.reviewCount + 1,
    lastGrade: grade,
    lastReviewedAt: now.toISOString(),
    intervalDays: newInterval,
    nextReviewAt: next.toISOString(),
  };
}

/**
 * 计算"记忆衰减"得分，0-1。越接近 0 表示越需要复习。
 *
 * 规则：
 *   未复习过 → 0（最需要复习）
 *   过了 nextReviewAt → 线性衰减（每过一个 intervalDays 下降 0.3）
 *   还没到 nextReviewAt → 线性上升（越接近时间越低）
 *
 * UI 用这个做首页排序：衰减低的排前面，优先提醒。
 */
export function decayScore(review: ReviewState): number {
  if (!review.lastReviewedAt) return 0;

  const now = Date.now();
  const next = new Date(review.nextReviewAt).getTime();
  const last = new Date(review.lastReviewedAt).getTime();
  const intervalMs = review.intervalDays * 24 * 60 * 60 * 1000;

  if (now < next) {
    // 还在间隔内：分数从 1 线性下降到 0.5
    const progress = (now - last) / (next - last);
    return Math.max(0.5, 1 - progress * 0.5);
  }

  // 已过期：分数从 0.5 继续下降
  const overdue = (now - next) / intervalMs;
  return Math.max(0, 0.5 - overdue * 0.3);
}

/**
 * 友好地显示"下次该复习"的相对时间。
 */
export function formatNextReview(review: ReviewState): string {
  if (!review.lastReviewedAt) return '从未复习';

  const now = Date.now();
  const next = new Date(review.nextReviewAt).getTime();
  const diffMs = next - now;
  const diffDays = Math.round(diffMs / (24 * 60 * 60 * 1000));

  if (diffDays < -1) return `逾期 ${-diffDays} 天`;
  if (diffDays === -1) return '昨天就该复习';
  if (diffDays === 0) return '今天该复习';
  if (diffDays === 1) return '明天';
  if (diffDays < 7) return `${diffDays} 天后`;
  if (diffDays < 30) return `${Math.round(diffDays / 7)} 周后`;
  return `${Math.round(diffDays / 30)} 月后`;
}

export const GRADE_LABELS: Record<ReviewGrade, string> = {
  1: '1 · 完全忘记',
  2: '2 · 记得一点',
  3: '3 · 能讲清楚',
  4: '4 · 流畅讲清楚',
  5: '5 · 轻松讲清楚',
};
