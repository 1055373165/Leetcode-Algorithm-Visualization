'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { listTopics, type TopicEntry } from '@/lib/storage';
import { decayScore } from '@/lib/review';
import { TopicCard } from '@/components/TopicCard';

/**
 * 首页 · 主题库
 *
 * 默认排序：衰减分数升序（最需要复习的在前）。
 * 用户可切换成"最近更新"。
 * 空态时引导用户去 /new 创建第一个主题。
 */
export default function HomePage() {
  const [entries, setEntries] = useState<TopicEntry[] | null>(null);
  const [sortBy, setSortBy] = useState<'decay' | 'recent'>('decay');

  useEffect(() => {
    const refresh = () => setEntries(listTopics());
    refresh();
    window.addEventListener('dao-studio:changed', refresh);
    return () => window.removeEventListener('dao-studio:changed', refresh);
  }, []);

  if (entries === null) {
    return <div className="text-paper-inkMuted text-sm">加载中…</div>;
  }

  if (entries.length === 0) {
    return <EmptyState />;
  }

  const sorted = [...entries].sort((a, b) => {
    if (sortBy === 'decay') {
      return decayScore(a.review) - decayScore(b.review);
    }
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  const needReview = sorted.filter((e) => decayScore(e.review) < 0.5);

  return (
    <div>
      <div className="flex items-baseline justify-between mb-8">
        <div>
          <h1 className="font-serif text-4xl font-semibold text-paper-ink tracking-tight">
            你的主题库
          </h1>
          <p className="text-paper-inkMuted mt-2">
            {entries.length} 个主题
            {needReview.length > 0 && (
              <>
                {' · '}
                <span className="text-paper-accentWarm font-semibold">
                  {needReview.length} 个需要复习
                </span>
              </>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <SortButton active={sortBy === 'decay'} onClick={() => setSortBy('decay')}>
            按衰减
          </SortButton>
          <SortButton active={sortBy === 'recent'} onClick={() => setSortBy('recent')}>
            按更新
          </SortButton>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sorted.map((entry) => (
          <TopicCard key={entry.script.id} entry={entry} />
        ))}
      </div>
    </div>
  );
}

const SortButton: React.FC<{
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={
      'px-3 py-1.5 rounded-md text-sm font-medium transition-colors ' +
      (active
        ? 'bg-paper-ink text-paper-raised'
        : 'text-paper-inkSoft hover:bg-paper-surface')
    }
  >
    {children}
  </button>
);

const EmptyState: React.FC = () => (
  <div className="flex flex-col items-center justify-center py-24 text-center">
    <div className="font-serif text-4xl font-semibold text-paper-ink mb-3">
      还没有主题
    </div>
    <p className="text-paper-inkMuted max-w-md mb-8 leading-relaxed">
      输入任意技术主题（例 <code className="font-mono text-paper-accentCool">epoll</code>、
      <code className="font-mono text-paper-accentCool">B+ 树</code>、
      <code className="font-mono text-paper-accentCool">RAFT</code>），
      AI 会生成一份 30-60 秒的视频解析。
    </p>
    <Link
      href="/new"
      className="px-6 py-3 bg-paper-accentWarm text-white rounded-lg font-medium hover:bg-paper-accentWarm/90 shadow-paper transition-all"
    >
      创建第一个主题 →
    </Link>
    <Link
      href="/settings"
      className="mt-4 text-sm text-paper-inkMuted hover:text-paper-ink"
    >
      或先配置 AI Provider
    </Link>
  </div>
);
