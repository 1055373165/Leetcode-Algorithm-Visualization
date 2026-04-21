'use client';

import Link from 'next/link';
import type { TopicEntry } from '@/lib/storage';
import { decayScore, formatNextReview } from '@/lib/review';

/**
 * TopicCard · 主题卡片
 *
 * 左侧一个衰减条（越靠近左侧=越需要复习），主体显示标题+副标题+场景类型徽章。
 * 底部显示复习状态和上次更新时间。
 */
export const TopicCard: React.FC<{ entry: TopicEntry }> = ({ entry }) => {
  const decay = decayScore(entry.review);
  const decayColor = decayColorAt(decay);
  const sceneTypes = Array.from(
    new Set(entry.script.scenes.map((s) => s.type)),
  );

  return (
    <Link
      href={`/${entry.script.id}`}
      className="group block relative bg-paper-raised rounded-xl border border-paper-rule hover:border-paper-ruleStrong shadow-paper hover:shadow-paperDeep transition-all overflow-hidden"
    >
      {/* 左侧衰减条 */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1"
        style={{ backgroundColor: decayColor }}
      />

      <div className="p-5 pl-6">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1 min-w-0">
            {entry.script.kicker && (
              <div className="text-[10px] uppercase tracking-[0.12em] text-paper-inkMuted font-semibold mb-1">
                {entry.script.kicker}
              </div>
            )}
            <div className="font-serif text-xl font-semibold text-paper-ink leading-tight">
              {entry.script.title}
            </div>
            {entry.script.subtitle && (
              <div className="text-sm text-paper-inkSoft italic mt-1 line-clamp-1">
                {entry.script.subtitle}
              </div>
            )}
          </div>
        </div>

        {/* 场景类型徽章 */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {sceneTypes.map((t) => (
            <span
              key={t}
              className="text-[10px] px-2 py-0.5 rounded-full bg-paper-surface text-paper-inkMuted font-mono"
            >
              {t}
            </span>
          ))}
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-paper-surface text-paper-inkMuted font-mono">
            {entry.script.scenes.length} 场景
          </span>
        </div>

        {/* 底栏 */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-paper-rule/60">
          <div className="text-xs text-paper-inkMuted">
            {entry.review.reviewCount === 0 ? (
              <span className="text-paper-accentWarm">首次复习</span>
            ) : (
              <>
                复习 {entry.review.reviewCount} 次 ·{' '}
                <span style={{ color: decayColor }}>
                  {formatNextReview(entry.review)}
                </span>
              </>
            )}
          </div>
          <div className="text-xs text-paper-inkFaint font-mono">
            {entry.script.id}
          </div>
        </div>
      </div>
    </Link>
  );
};

/** 衰减分数 → 颜色：越低越红（越需要复习）；越高越绿（稳定） */
function decayColorAt(decay: number): string {
  if (decay < 0.25) return '#B14A36';   // blocked
  if (decay < 0.5) return '#C5572A';    // accentWarm
  if (decay < 0.75) return '#E8B94A';   // highlight
  return '#5A7F3D';                      // running
}
