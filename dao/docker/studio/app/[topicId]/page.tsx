'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  getTopic,
  updateNotes,
  updateScript,
  deleteTopic,
  type TopicEntry,
} from '@/lib/storage';
import type { TopicScript } from '@/lib/schema';
import { ReviewPanel } from '@/components/ReviewPanel';
import { RenderedVideo } from '@/components/RenderedVideo';

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

  const [renderStage, setRenderStage] = useState<
    'idle' | 'rendering' | 'done' | 'error'
  >('idle');
  const [renderError, setRenderError] = useState<string>('');
  const [renderUrl, setRenderUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!params.topicId) return;
    const e = getTopic(params.topicId);
    setEntry(e);

    // 页面载入时探测已存在的 MP4。renders/<topicId>.mp4 由 /api/render 生成，
    // Next.js 会自动通过 public/ 静态路由 serve。HEAD 200 → 直接展示；
    // HEAD 404 → 维持 idle 状态等用户点渲染。
    // 用 HEAD 避免把 MP4 实际下一遍到内存里。
    let cancelled = false;
    const probeUrl = `/renders/${params.topicId}.mp4`;
    fetch(probeUrl, { method: 'HEAD' })
      .then((res) => {
        if (cancelled) return;
        if (res.ok) {
          setRenderUrl(probeUrl);
          setRenderStage('done');
        }
      })
      .catch(() => {
        /* 离线或网络异常时忽略，让用户手动触发渲染 */
      });
    return () => {
      cancelled = true;
    };
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

  async function handleRenderMp4() {
    if (renderStage === 'rendering') return;
    setRenderStage('rendering');
    setRenderError('');
    setRenderUrl(null);

    try {
      const res = await fetch('/api/render', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          script: entry!.script,
          topicId: entry!.script.id,
        }),
      });

      const data = (await res.json()) as {
        url?: string;
        error?: string;
      };

      if (!res.ok || data.error) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      // 附加 ?t=<当前时间戳> 作 cache-buster：
      // URL 路径里的 topicId 永远相同，但 MP4 内容每次重渲染都会变。
      // 没有这个后缀，浏览器和 <video> 元素会继续播放旧缓存版本。
      setRenderUrl(data.url ? `${data.url}?t=${Date.now()}` : null);
      setRenderStage('done');
    } catch (e) {
      setRenderError(e instanceof Error ? e.message : String(e));
      setRenderStage('error');
    }
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
          {renderStage === 'done' && renderUrl ? (
            <a
              href={renderUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs bg-paper-accentWarm text-white rounded-md px-3 py-1.5 font-medium hover:bg-paper-accentWarm/90 transition-colors mr-2"
            >
              下载 MP4
            </a>
          ) : (
            <button
              onClick={handleRenderMp4}
              disabled={renderStage === 'rendering'}
              className={
                'text-xs rounded-md px-3 py-1.5 font-medium transition-colors mr-2 ' +
                (renderStage === 'rendering'
                  ? 'bg-paper-surface text-paper-inkMuted cursor-wait'
                  : renderStage === 'error'
                    ? 'bg-paper-blocked/10 text-paper-blocked hover:bg-paper-blocked/20'
                    : 'bg-paper-accentCool text-white hover:bg-paper-accentCool/90')
              }
            >
              {renderStage === 'rendering'
                ? '渲染中…'
                : renderStage === 'error'
                  ? '重试导出'
                  : '导出 MP4'}
            </button>
          )}
          <button
            onClick={handleDelete}
            className="text-xs text-paper-inkFaint hover:text-paper-blocked transition-colors px-3 py-1.5"
          >
            删除
          </button>
        </div>

        {/* Tab 内容 */}
        {renderError && (
          <div className="mb-4 p-3 rounded-md bg-paper-blocked/10 border border-paper-blocked/40 text-sm text-paper-blocked font-mono">
            {renderError}
          </div>
        )}
        {tab === 'player' && (
          <RenderedVideo
            script={entry.script}
            videoUrl={renderUrl}
            renderStage={renderStage}
            onRequestRender={handleRenderMp4}
          />
        )}
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
          直接编辑 JSON。保存后切到"播放"tab 重新渲染 MP4 即可看到变化。
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
