'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  getTopic,
  updateNotes,
  updateScript,
  deleteTopic,
  type TopicEntry,
} from '@/lib/storage';
import type { TopicScript } from '@/lib/schema';
import { ReviewPanel } from '@/components/ReviewPanel';

// Player 需要 window，禁用 SSR
const ScriptPlayer = dynamic(
  () => import('@/components/ScriptPlayer').then((m) => m.ScriptPlayer),
  { ssr: false, loading: () => <PlayerSkeleton /> },
);

type Tab = 'player' | 'script' | 'notes';

/**
 * 主题详情页 · 三 tab 布局
 *
 * 默认 tab 是 player；script 让用户编辑 JSON 并看实时变化；notes 是学习笔记。
 * 右侧固定 ReviewPanel。
 */
export default function TopicDetailPage() {
  const params = useParams<{ topicId: string }>();
  const router = useRouter();
  const [entry, setEntry] = useState<TopicEntry | null | undefined>(undefined);
  const [tab, setTab] = useState<Tab>('player');

  useEffect(() => {
    if (!params.topicId) return;
    const e = getTopic(params.topicId);
    setEntry(e);
  }, [params.topicId]);

  if (entry === undefined) {
    return <div className="text-paper-inkMuted text-sm">加载中…</div>;
  }

  if (entry === null) {
    return (
      <div className="text-center py-24">
        <div className="text-xl mb-2 text-paper-ink">主题不存在</div>
        <Link href="/" className="text-paper-accentCool underline">
          返回主题库
        </Link>
      </div>
    );
  }

  function refresh() {
    const e = getTopic(entry!.script.id);
    setEntry(e);
  }

  function handleDelete() {
    if (!confirm('确认删除这个主题？笔记和复习历史都会丢失。')) return;
    deleteTopic(entry!.script.id);
    router.push('/');
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
      {/* 左侧：主要内容 */}
      <div>
        {/* 标题区 */}
        <div className="mb-6">
          {entry.script.kicker && (
            <div className="text-xs uppercase tracking-[0.12em] text-paper-accentWarm font-semibold mb-2">
              {entry.script.kicker}
            </div>
          )}
          <h1 className="font-serif text-4xl font-semibold text-paper-ink tracking-tight leading-tight">
            {entry.script.title}
          </h1>
          {entry.script.subtitle && (
            <p className="mt-2 text-lg text-paper-inkSoft italic">
              {entry.script.subtitle}
            </p>
          )}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-paper-rule mb-5">
          {(['player', 'script', 'notes'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={
                'px-4 py-2 text-sm font-medium border-b-2 transition-colors ' +
                (tab === t
                  ? 'border-paper-accentWarm text-paper-ink'
                  : 'border-transparent text-paper-inkMuted hover:text-paper-ink')
              }
            >
              {t === 'player' ? '播放' : t === 'script' ? '编辑脚本' : '笔记'}
            </button>
          ))}
          <div className="flex-1" />
          <button
            onClick={handleDelete}
            className="text-xs text-paper-inkFaint hover:text-paper-blocked transition-colors px-3 py-1.5"
          >
            删除
          </button>
        </div>

        {/* Tab 内容 */}
        {tab === 'player' && <ScriptPlayer script={entry.script} />}
        {tab === 'script' && (
          <ScriptEditor script={entry.script} onChange={refresh} />
        )}
        {tab === 'notes' && <NotesEditor entry={entry} onChange={refresh} />}
      </div>

      {/* 右侧：复习面板 + 元信息 */}
      <div className="space-y-4">
        <ReviewPanel entry={entry} onChange={refresh} />

        <div className="bg-paper-raised border border-paper-rule rounded-xl p-5 text-sm">
          <h3 className="font-semibold text-paper-ink mb-3">元信息</h3>
          <div className="space-y-2 text-paper-inkSoft">
            <Row label="ID">
              <code className="font-mono text-xs">{entry.script.id}</code>
            </Row>
            <Row label="场景数">{entry.script.scenes.length}</Row>
            <Row label="总时长">
              {Math.round(
                3 + entry.script.scenes.reduce((s, c) => s + c.duration, 0),
              )}
              s
            </Row>
            {entry.script.meta.generatedBy && (
              <Row label="生成者">
                {entry.script.meta.generatedBy.provider} ·{' '}
                <code className="font-mono text-xs">
                  {entry.script.meta.generatedBy.model}
                </code>
              </Row>
            )}
            <Row label="创建">
              {new Date(entry.createdAt).toLocaleString('zh-CN')}
            </Row>
            <Row label="更新">
              {new Date(entry.updatedAt).toLocaleString('zh-CN')}
            </Row>
          </div>
        </div>
      </div>
    </div>
  );
}

const Row: React.FC<{ label: string; children: React.ReactNode }> = ({
  label,
  children,
}) => (
  <div className="flex justify-between gap-3">
    <span className="text-paper-inkMuted">{label}</span>
    <span className="text-paper-ink text-right">{children}</span>
  </div>
);

const PlayerSkeleton: React.FC = () => (
  <div className="w-full aspect-video bg-paper-surface rounded-xl border border-paper-rule flex items-center justify-center text-paper-inkMuted">
    加载播放器…
  </div>
);

// ═══════════════════════════════════════════════════════════

const ScriptEditor: React.FC<{
  script: TopicScript;
  onChange: () => void;
}> = ({ script, onChange }) => {
  const [text, setText] = useState(() => JSON.stringify(script, null, 2));
  const [error, setError] = useState<string>('');
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setText(JSON.stringify(script, null, 2));
    setDirty(false);
    setError('');
  }, [script]);

  function handleSave() {
    try {
      const parsed = JSON.parse(text) as TopicScript;
      if (!parsed.scenes || !Array.isArray(parsed.scenes)) {
        throw new Error('scenes 必须是数组');
      }
      updateScript(script.id, parsed);
      setError('');
      setDirty(false);
      onChange();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm text-paper-inkMuted">
          直接编辑 JSON。保存后可在"播放"tab 看到效果变化。
        </div>
        <div className="flex items-center gap-3">
          {dirty && <span className="text-xs text-paper-accentWarm">未保存</span>}
          <button
            onClick={handleSave}
            disabled={!dirty}
            className="px-4 py-1.5 bg-paper-accentWarm text-white rounded-md text-sm font-medium hover:bg-paper-accentWarm/90 disabled:opacity-40"
          >
            保存
          </button>
        </div>
      </div>
      {error && (
        <div className="mb-3 p-3 rounded-md bg-paper-blocked/10 border border-paper-blocked/40 text-sm text-paper-blocked font-mono">
          {error}
        </div>
      )}
      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setDirty(true);
        }}
        spellCheck={false}
        className="w-full h-[600px] p-4 bg-terminal-bg text-terminal-text font-mono text-sm rounded-lg border border-paper-rule focus:outline-none focus:border-paper-accentCool"
      />
    </div>
  );
};

// ═══════════════════════════════════════════════════════════

const NotesEditor: React.FC<{
  entry: TopicEntry;
  onChange: () => void;
}> = ({ entry, onChange }) => {
  const [text, setText] = useState(entry.notes);
  const [savedIndicator, setSavedIndicator] = useState<string>('');

  useEffect(() => {
    setText(entry.notes);
  }, [entry.notes]);

  // 自动保存：停止输入 1 秒后落盘
  useEffect(() => {
    if (text === entry.notes) return;
    const timer = setTimeout(() => {
      updateNotes(entry.script.id, text);
      onChange();
      setSavedIndicator('已保存');
      setTimeout(() => setSavedIndicator(''), 1500);
    }, 1000);
    return () => clearTimeout(timer);
  }, [text, entry.notes, entry.script.id, onChange]);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm text-paper-inkMuted">
          学习笔记 · 支持 markdown，停止输入 1 秒后自动保存
        </div>
        <span className="text-xs text-paper-running font-medium h-4">
          {savedIndicator}
        </span>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="# 我对这个主题的理解…&#10;&#10;- 关键洞见&#10;- 问面试官的反问&#10;- 我还没想清楚的地方"
        className="w-full h-[600px] p-5 bg-paper-raised text-paper-ink font-sans text-base rounded-lg border border-paper-rule focus:outline-none focus:border-paper-accentWarm leading-relaxed"
      />
    </div>
  );
};
