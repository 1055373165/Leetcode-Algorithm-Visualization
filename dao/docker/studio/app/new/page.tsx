'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSettings, type Settings } from '@/lib/settings';
import { PROVIDER_DISPLAY_NAMES } from '@/lib/llm';
import { saveTopic } from '@/lib/storage';
import type { TopicScript } from '@/lib/schema';

/**
 * 新建主题页
 *
 * 流程：
 *   1. 用户输入主题词
 *   2. 选择 provider（默认用 settings.activeProvider）
 *   3. 点"生成" → 调 /api/generate
 *   4. 成功后保存到 storage，跳转到 /[topicId]
 *
 * 阻塞期间显示"阶段指示"——让用户知道 LLM 大概要等 30-60 秒。
 */
export default function NewTopicPage() {
  const router = useRouter();
  const [topic, setTopic] = useState('');
  const [settings, setSettings] = useState<Settings | null>(null);
  const [stage, setStage] = useState<
    'idle' | 'generating' | 'saving' | 'error'
  >('idle');
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    setSettings(getSettings());
  }, []);

  async function handleGenerate() {
    if (!topic.trim() || !settings) return;
    setStage('generating');
    setErrorMsg('');

    try {
      const providerConfig = settings.providers[settings.activeProvider];
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ topic: topic.trim(), providerConfig }),
      });

      if (!response.ok) {
        const errData = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(errData.error ?? `HTTP ${response.status}`);
      }

      const data = (await response.json()) as { script: TopicScript };
      setStage('saving');
      const entry = saveTopic(data.script);
      router.push(`/${entry.script.id}`);
    } catch (e) {
      setStage('error');
      setErrorMsg(e instanceof Error ? e.message : String(e));
    }
  }

  if (!settings) {
    return <div className="text-paper-inkMuted text-sm">加载设置中…</div>;
  }

  const activeProvider = settings.providers[settings.activeProvider];
  const hasApiKey =
    settings.activeProvider === 'ollama' || !!activeProvider.apiKey;

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="font-serif text-4xl font-semibold text-paper-ink tracking-tight mb-2">
        新建主题
      </h1>
      <p className="text-paper-inkMuted mb-8">
        输入一个技术主题，AI 会用{' '}
        <span className="font-semibold text-paper-ink">
          8 种场景原语
        </span>{' '}
        拼出一份 30-60 秒的视频解析脚本。
      </p>

      {!hasApiKey && (
        <div className="mb-6 p-4 rounded-lg bg-paper-highlight/20 border border-paper-highlight text-paper-ink text-sm">
          当前 provider（{PROVIDER_DISPLAY_NAMES[settings.activeProvider]}）
          未配置 API key。
          <Link href="/settings" className="underline ml-2 font-semibold">
            去设置
          </Link>
        </div>
      )}

      <div className="bg-paper-raised rounded-xl border border-paper-rule shadow-paper p-6">
        <label className="block mb-2 text-sm font-semibold text-paper-inkSoft uppercase tracking-[0.08em]">
          技术主题
        </label>
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          disabled={stage === 'generating' || stage === 'saving'}
          placeholder="例：epoll / B+ 树 / RAFT / Linux 调度器 / JVM GC"
          className="w-full px-4 py-3 bg-paper-bg border border-paper-rule rounded-lg text-paper-ink text-lg focus:outline-none focus:border-paper-accentWarm focus:ring-2 focus:ring-paper-accentWarm/20"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && hasApiKey) handleGenerate();
          }}
        />

        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-paper-inkMuted">
            用{' '}
            <span className="font-semibold text-paper-ink">
              {PROVIDER_DISPLAY_NAMES[settings.activeProvider]}
            </span>{' '}
            · 模型{' '}
            <code className="font-mono text-paper-accentCool">
              {activeProvider.model}
            </code>
            <Link
              href="/settings"
              className="ml-3 text-xs underline text-paper-inkFaint hover:text-paper-inkSoft"
            >
              更改
            </Link>
          </div>
          <button
            disabled={!topic.trim() || !hasApiKey || stage === 'generating' || stage === 'saving'}
            onClick={handleGenerate}
            className="px-5 py-2.5 bg-paper-accentWarm text-white rounded-lg font-medium hover:bg-paper-accentWarm/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {stage === 'generating' ? '生成中…' : stage === 'saving' ? '保存中…' : '生成 →'}
          </button>
        </div>
      </div>

      {stage === 'generating' && <StageIndicator />}

      {stage === 'error' && (
        <div className="mt-6 p-4 rounded-lg bg-paper-blocked/10 border border-paper-blocked text-paper-ink">
          <div className="font-semibold text-paper-blocked mb-1">生成失败</div>
          <div className="text-sm font-mono text-paper-inkSoft">{errorMsg}</div>
          <button
            onClick={() => setStage('idle')}
            className="mt-3 text-sm underline text-paper-inkMuted hover:text-paper-ink"
          >
            重试
          </button>
        </div>
      )}
    </div>
  );
}

const StageIndicator: React.FC = () => (
  <div className="mt-6 p-6 rounded-xl bg-paper-raised border border-paper-rule">
    <div className="flex items-center gap-3 mb-3">
      <div className="w-2 h-2 rounded-full bg-paper-accentWarm animate-pulse" />
      <span className="text-sm font-semibold text-paper-ink">
        AI 正在把你的主题拆解成场景……
      </span>
    </div>
    <p className="text-sm text-paper-inkMuted leading-relaxed">
      通常需要 20-60 秒。AI 会依次思考：
      没有它之前是什么样 → 核心机制 → 设计决策 → 洞见金句。
      这一步是质量的关键，不会让它偷懒。
    </p>
  </div>
);
