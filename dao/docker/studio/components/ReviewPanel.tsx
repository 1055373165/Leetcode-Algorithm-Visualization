'use client';

import type { TopicEntry } from '@/lib/storage';
import { updateReview } from '@/lib/storage';
import {
  applyReview,
  formatNextReview,
  GRADE_LABELS,
  type ReviewGrade,
} from '@/lib/review';

/**
 * ReviewPanel · 打分并推进复习调度
 */
export const ReviewPanel: React.FC<{
  entry: TopicEntry;
  onChange?: () => void;
}> = ({ entry, onChange }) => {
  function handleGrade(grade: ReviewGrade) {
    const newReview = applyReview(entry.review, grade);
    updateReview(entry.script.id, newReview);
    onChange?.();
  }

  return (
    <div className="bg-paper-raised border border-paper-rule rounded-xl p-5 shadow-paper">
      <div className="flex items-baseline justify-between mb-4">
        <h3 className="font-semibold text-paper-ink">
          复习调度
        </h3>
        <div className="text-xs text-paper-inkMuted font-mono">
          下次：{formatNextReview(entry.review)}
        </div>
      </div>

      <div className="text-sm text-paper-inkSoft mb-4 leading-relaxed">
        刚才你看完这个视频。
        <span className="text-paper-ink font-semibold"> 能给别人讲清楚吗？</span>
        按下面的按钮打分——系统会自动安排下次复习时间。
      </div>

      <div className="grid grid-cols-5 gap-2">
        {([1, 2, 3, 4, 5] as ReviewGrade[]).map((g) => (
          <button
            key={g}
            onClick={() => handleGrade(g)}
            className={
              'py-3 px-2 rounded-lg border text-xs font-medium transition-all hover:scale-[1.02] active:scale-[0.98] ' +
              getGradeColor(g)
            }
          >
            <div className="text-2xl font-bold mb-1">{g}</div>
            <div className="text-[10px] leading-tight">
              {GRADE_LABELS[g].split('·')[1]?.trim()}
            </div>
          </button>
        ))}
      </div>

      {entry.review.lastGrade !== null && (
        <div className="mt-4 pt-4 border-t border-paper-rule/60 text-xs text-paper-inkMuted">
          上次打分：
          <span className="font-semibold">
            {GRADE_LABELS[entry.review.lastGrade as ReviewGrade]}
          </span>
          {' · '}
          累计 {entry.review.reviewCount} 次
          {' · '}
          当前间隔 {entry.review.intervalDays} 天
        </div>
      )}
    </div>
  );
};

function getGradeColor(grade: ReviewGrade): string {
  switch (grade) {
    case 1:
      return 'bg-paper-blocked/10 border-paper-blocked/40 text-paper-blocked hover:bg-paper-blocked/20';
    case 2:
      return 'bg-paper-accentWarm/10 border-paper-accentWarm/40 text-paper-accentWarm hover:bg-paper-accentWarm/20';
    case 3:
      return 'bg-paper-highlight/20 border-paper-highlight/50 text-paper-ink hover:bg-paper-highlight/30';
    case 4:
      return 'bg-paper-accentCool/10 border-paper-accentCool/40 text-paper-accentCool hover:bg-paper-accentCool/20';
    case 5:
      return 'bg-paper-running/10 border-paper-running/40 text-paper-running hover:bg-paper-running/20';
  }
}
