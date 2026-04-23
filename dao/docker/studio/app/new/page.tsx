'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSettings, type Settings } from '@/lib/settings';
import { PROVIDER_DISPLAY_NAMES } from '@/lib/llm';
import { saveTopic } from '@/lib/storage';
import type { TopicScript } from '@/lib/schema';
import { iterSse } from '@/lib/sse';
import {
  listPrompts,
  getActivePromptId,
  setActivePromptId,
  renderTemplate,
  getPromptVars,
  savePromptVars,
  ADVANCED_VARIABLES,
  type PromptTemplate,
  type PromptVars,
} from '@/lib/prompts';

/**
 * 新建主题页
 *
 * 流程：
 *   1. 用户输入主题词
 *   2. 选择 provider（默认用 settings.activeProvider）
 *   3. 点"生成" → 调 /api/generate（SSE 流式）
 *   4. 边收 token 边实时显示打字机效果预览
 *   5. 收到 done 事件后保存到 storage，跳转到 /[topicId]
 *
 * 流式让用户看见"AI 在打字"，避免 1-3 分钟的黑屏等待。
 */

type DoneEvent = {
  script: TopicScript;
  rawResponse: string;
  usage?: { inputTokens?: number; outputTokens?: number };
};

export default function NewTopicPage() {
  const router = useRouter();
  const [topic, setTopic] = useState('');
  const [settings, setSettings] = useState<Settings | null>(null);
  // 模板列表 + 当前选中。每次 /prompts 页改动会触发 prompts-changed 事件，
  // 这里监听着自动刷新。避免用户改完回来还看到旧数据。
  const [prompts, setPrompts] = useState<PromptTemplate[]>([]);
  const [activePromptId, setActivePromptIdState] = useState<string>('');
  // 高级变量（duration / language / audience 等）。持久化到 localStorage，
  // 这样用户一次设定后不用每次重填。默认折叠，避免干扰主流程。
  const [promptVars, setPromptVars] = useState<PromptVars>({});
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [stage, setStage] = useState<
    'idle' | 'generating' | 'saving' | 'error'
  >('idle');
  const [errorMsg, setErrorMsg] = useState<string>('');
  // 错误细节：后端 parse 失败时会带 { stage, rawHead, rawTail, jsonHead... }
  // 直接展示给用户，比干瘪的 "JSON.parse 失败" 有用得多
  const [errorDetails, setErrorDetails] = useState<Record<string, unknown> | null>(
    null,
  );
  const [streamText, setStreamText] = useState<string>('');
  // 推理型模型（DeepSeek V3.2 / GLM 等）会先吐 reasoning 再吐 content；
  // 我们单独展示 reasoning，让用户看到"它在思考什么"。
  const [reasoningText, setReasoningText] = useState<string>('');
  const [pingInfo, setPingInfo] = useState<{ seq: number; elapsedMs: number } | null>(
    null,
  );
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setSettings(getSettings());
    const refreshPrompts = () => {
      setPrompts(listPrompts());
      setActivePromptIdState(getActivePromptId());
    };
    const refreshVars = () => setPromptVars(getPromptVars());
    refreshPrompts();
    refreshVars();
    // /prompts 页面做增删改时会 dispatch 这两个事件，我们同步更新 UI
    window.addEventListener('dao-studio:prompts-changed', refreshPrompts);
    window.addEventListener('dao-studio:prompt-vars-changed', refreshVars);
    return () => {
      window.removeEventListener('dao-studio:prompts-changed', refreshPrompts);
      window.removeEventListener('dao-studio:prompt-vars-changed', refreshVars);
      abortRef.current?.abort();
    };
  }, []);

  function handleSelectPrompt(id: string) {
    setActivePromptIdState(id);
    setActivePromptId(id); // 持久化到 localStorage
  }

  function handleVarChange(key: string, value: string) {
    setPromptVars((prev) => {
      const next = { ...prev, [key]: value };
      savePromptVars(next);
      return next;
    });
  }

  async function handleGenerate() {
    if (!topic.trim() || !settings) return;
    setStage('generating');
    setErrorMsg('');
    setErrorDetails(null);
    setStreamText('');
    setReasoningText('');
    setPingInfo(null);

    const abort = new AbortController();
    abortRef.current = abort;

    try {
      const providerConfig = settings.providers[settings.activeProvider];
      // 前端负责占位符渲染——把选中模板里的所有 {{xxx}} 填成实际值。
      // 这样后端 provider 只需把字符串原样发给 LLM，职责清晰。
      // 变量字典：高级变量 + topic（topic 覆盖，因为它永远从主输入框来）
      const activeTpl = prompts.find((p) => p.id === activePromptId) ?? prompts[0];
      const vars = { ...promptVars, topic: topic.trim() };
      const userPrompt = activeTpl
        ? renderTemplate(activeTpl.userPromptTemplate, vars)
        : undefined;

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          topic: topic.trim(),
          providerConfig,
          userPrompt,
        }),
        signal: abort.signal,
      });

      if (!response.ok) {
        // 参数校验错误（4xx）仍走 JSON
        const errData = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(errData.error ?? `HTTP ${response.status}`);
      }

      if (!response.body) {
        throw new Error('服务器没有返回流式响应体');
      }

      let final: DoneEvent | null = null;
      let sawError: string | null = null;

      for await (const evt of iterSse(response.body)) {
        if (!evt.event) continue;

        switch (evt.event) {
          case 'open':
            // 连接已建立，已在 "generating" 状态，不做额外处理
            break;

          case 'ping': {
            // 服务端每 2 秒发一次心跳；我们在 UI 上显示，
            // 让用户一眼看出 SSE 连接本身是活的
            try {
              const p = JSON.parse(evt.data) as {
                seq: number;
                elapsedMs: number;
              };
              setPingInfo(p);
            } catch {
              /* ignore */
            }
            break;
          }

          case 'token': {
            // token 事件体量大、频繁，解析失败时跳过而非抛错
            try {
              const chunk = JSON.parse(evt.data) as {
                delta: string;
                accumulated: string;
              };
              setStreamText(chunk.accumulated);
            } catch {
              /* ignore malformed token */
            }
            break;
          }

          case 'reasoning': {
            // 思考过程流：同样解析失败跳过
            try {
              const chunk = JSON.parse(evt.data) as {
                delta: string;
                accumulated: string;
              };
              setReasoningText(chunk.accumulated);
            } catch {
              /* ignore malformed reasoning */
            }
            break;
          }

          case 'done':
            final = JSON.parse(evt.data) as DoneEvent;
            break;

          case 'error': {
            const errData = JSON.parse(evt.data) as {
              error?: string;
              provider?: string;
              details?: Record<string, unknown>;
            };
            sawError = errData.error ?? '未知错误';
            // 保存 details 供错误面板展示。用 ref-free 的办法：直接 setState，
            // 因为错误事件后 for-loop 会 break，setState 时机来得及。
            if (errData.details) setErrorDetails(errData.details);
            break;
          }
        }
      }

      if (sawError) throw new Error(sawError);
      if (!final) throw new Error('流式响应结束但未收到完整结果');

      setStage('saving');
      const entry = saveTopic(final.script);
      router.push(`/${entry.script.id}`);
    } catch (e) {
      if ((e as { name?: string })?.name === 'AbortError') {
        // 主动取消，不当作错误
        setStage('idle');
        return;
      }
      setStage('error');
      setErrorMsg(e instanceof Error ? e.message : String(e));
    } finally {
      abortRef.current = null;
    }
  }

  function handleCancel() {
    abortRef.current?.abort();
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
        拼出一份 3-5 分钟的深度视频解析脚本。
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
        {/* 模板选择：决定用哪套 user prompt 框架去讲这个主题。
            内置的"算法题深度解析"/"系统技术深度讲解"是历史行为复刻；
            用户在 /prompts 新增的自定义模板会排在内置之后。 */}
        <div className="mb-5 pb-5 border-b border-paper-rule">
          <div className="flex items-center justify-between mb-2">
            <label
              htmlFor="prompt-select"
              className="text-sm font-semibold text-paper-inkSoft uppercase tracking-[0.08em]"
            >
              提示词模板
            </label>
            <Link
              href="/prompts"
              className="text-xs underline text-paper-inkFaint hover:text-paper-inkSoft"
            >
              管理模板 →
            </Link>
          </div>
          <select
            id="prompt-select"
            value={activePromptId}
            onChange={(e) => handleSelectPrompt(e.target.value)}
            disabled={stage === 'generating' || stage === 'saving'}
            className="w-full px-3 py-2.5 bg-paper-bg border border-paper-rule rounded-lg text-paper-ink text-sm focus:outline-none focus:border-paper-accentWarm focus:ring-2 focus:ring-paper-accentWarm/20"
          >
            {prompts.map((p) => (
              <option key={p.id} value={p.id}>
                {p.builtin ? '◆ ' : '✎ '}
                {p.name}
              </option>
            ))}
          </select>
          {(() => {
            const active = prompts.find((p) => p.id === activePromptId);
            return active?.description ? (
              <p className="mt-2 text-xs text-paper-inkMuted leading-relaxed">
                {active.description}
              </p>
            ) : null;
          })()}
        </div>

        <label
          htmlFor="topic-input"
          className="block mb-2 text-sm font-semibold text-paper-inkSoft uppercase tracking-[0.08em]"
        >
          技术主题
        </label>
        <input
          id="topic-input"
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

        {/* 高级变量 · 折叠区。默认折叠避免挤主流程；用户一次填好长期持久化 */}
        {ADVANCED_VARIABLES.length > 0 && (
          <div className="mt-4 pt-4 border-t border-paper-rule">
            <button
              type="button"
              onClick={() => setShowAdvanced((s) => !s)}
              className="flex items-center gap-2 text-xs text-paper-inkMuted hover:text-paper-ink"
            >
              <span className="inline-block w-3 text-paper-inkFaint">
                {showAdvanced ? '▾' : '▸'}
              </span>
              高级变量（{ADVANCED_VARIABLES.map((v) => `{{${v.key}}}`).join(' · ')}）
              <span className="text-paper-inkFaint">
                · 仅当模板里用到时才生效
              </span>
            </button>
            {showAdvanced && (
              <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                {ADVANCED_VARIABLES.map((v) => (
                  <div key={v.key}>
                    <label
                      htmlFor={`var-${v.key}`}
                      className="block text-xs text-paper-inkSoft mb-1"
                    >
                      {v.label}{' '}
                      <code className="font-mono text-[10px] text-paper-inkFaint">
                        {`{{${v.key}}}`}
                      </code>
                    </label>
                    <input
                      id={`var-${v.key}`}
                      type="text"
                      value={promptVars[v.key] ?? ''}
                      onChange={(e) => handleVarChange(v.key, e.target.value)}
                      disabled={stage === 'generating' || stage === 'saving'}
                      placeholder={v.placeholder}
                      className="w-full px-2.5 py-1.5 bg-paper-bg border border-paper-rule rounded text-paper-ink text-sm focus:outline-none focus:border-paper-accentWarm focus:ring-1 focus:ring-paper-accentWarm/30"
                    />
                    {v.hint && (
                      <p className="mt-1 text-[11px] text-paper-inkFaint leading-snug">
                        {v.hint}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

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
          <div className="flex items-center gap-2">
            {(stage === 'generating' || stage === 'saving') && (
              <button
                onClick={handleCancel}
                className="px-3 py-2.5 text-sm text-paper-inkMuted hover:text-paper-ink underline"
              >
                取消
              </button>
            )}
            <button
              disabled={
                !topic.trim() ||
                !hasApiKey ||
                stage === 'generating' ||
                stage === 'saving'
              }
              onClick={handleGenerate}
              className="px-5 py-2.5 bg-paper-accentWarm text-white rounded-lg font-medium hover:bg-paper-accentWarm/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {stage === 'generating'
                ? '生成中…'
                : stage === 'saving'
                ? '保存中…'
                : '生成 →'}
            </button>
          </div>
        </div>
      </div>

      {stage === 'generating' && (
        <StageIndicator
          streamText={streamText}
          reasoningText={reasoningText}
          pingInfo={pingInfo}
        />
      )}

      {stage === 'error' && (
        <div className="mt-6 p-4 rounded-lg bg-paper-blocked/10 border border-paper-blocked text-paper-ink">
          <div className="font-semibold text-paper-blocked mb-1">生成失败</div>
          <div className="text-sm font-mono text-paper-inkSoft">{errorMsg}</div>

          {/* 细节：后端 parse 失败会带原始片段，直接展出比藏起来有用得多。
              用折叠的 <details> 避免长文本把失败区撑得太高。 */}
          {errorDetails && (
            <details className="mt-3 text-xs">
              <summary className="cursor-pointer text-paper-inkMuted hover:text-paper-ink select-none">
                展开诊断信息（模型实际返回的片段）
              </summary>
              <div className="mt-2 space-y-2 font-mono">
                {errorDetails.stage != null && (
                  <div>
                    <span className="text-paper-inkFaint">stage: </span>
                    <span className="text-paper-ink">
                      {String(errorDetails.stage)}
                    </span>
                  </div>
                )}
                {errorDetails.parseError != null && (
                  <div>
                    <span className="text-paper-inkFaint">parseError: </span>
                    <span className="text-paper-ink">
                      {String(errorDetails.parseError)}
                    </span>
                  </div>
                )}
                {typeof errorDetails.errorContext === 'string' && (
                  <div>
                    <div className="text-paper-inkFaint mb-1">
                      errorContext（▶X◀ 是报错位置）：
                    </div>
                    <pre className="p-2 bg-paper-bg border border-paper-rule rounded whitespace-pre-wrap break-words max-h-40 overflow-auto">
                      {errorDetails.errorContext}
                    </pre>
                  </div>
                )}
                {errorDetails.rawLen != null && (
                  <div>
                    <span className="text-paper-inkFaint">rawLen: </span>
                    <span className="text-paper-ink">
                      {String(errorDetails.rawLen)}
                    </span>
                  </div>
                )}
                {typeof errorDetails.rawHead === 'string' && (
                  <div>
                    <div className="text-paper-inkFaint mb-1">rawHead:</div>
                    <pre className="p-2 bg-paper-bg border border-paper-rule rounded whitespace-pre-wrap break-words max-h-40 overflow-auto">
                      {errorDetails.rawHead}
                    </pre>
                  </div>
                )}
                {typeof errorDetails.rawTail === 'string' && (
                  <div>
                    <div className="text-paper-inkFaint mb-1">rawTail:</div>
                    <pre className="p-2 bg-paper-bg border border-paper-rule rounded whitespace-pre-wrap break-words max-h-40 overflow-auto">
                      {errorDetails.rawTail}
                    </pre>
                  </div>
                )}
                {typeof errorDetails.jsonHead === 'string' && (
                  <div>
                    <div className="text-paper-inkFaint mb-1">jsonHead:</div>
                    <pre className="p-2 bg-paper-bg border border-paper-rule rounded whitespace-pre-wrap break-words max-h-40 overflow-auto">
                      {errorDetails.jsonHead}
                    </pre>
                  </div>
                )}
                {typeof errorDetails.jsonTail === 'string' && (
                  <div>
                    <div className="text-paper-inkFaint mb-1">jsonTail:</div>
                    <pre className="p-2 bg-paper-bg border border-paper-rule rounded whitespace-pre-wrap break-words max-h-40 overflow-auto">
                      {errorDetails.jsonTail}
                    </pre>
                  </div>
                )}
              </div>
            </details>
          )}

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

/**
 * 生成阶段的"AI 在打字"面板。
 *
 * streamText 随 SSE token 事件不断增长；我们只展示末尾一段，
 * 省得 JSON 太长把版面撑得过高。字符计数让用户直观看到进度在走。
 */
const StageIndicator: React.FC<{
  streamText: string;
  reasoningText: string;
  pingInfo: { seq: number; elapsedMs: number } | null;
}> = ({ streamText, reasoningText, pingInfo }) => {
  const charCount = streamText.length;
  const reasoningCharCount = reasoningText.length;
  // 取末尾 400 字符，保留换行做简单折行
  const tail = streamText.length > 400 ? streamText.slice(-400) : streamText;
  const reasoningTail =
    reasoningText.length > 600 ? '…' + reasoningText.slice(-600) : reasoningText;
  const hasOutput = charCount > 0;
  const hasReasoning = reasoningCharCount > 0;
  const elapsedSec = pingInfo ? (pingInfo.elapsedMs / 1000).toFixed(0) : null;

  // 文案逻辑：
  //   1. content 已开始吐   → "AI 正在吐字"
  //   2. 只有 reasoning     → "AI 正在思考（已产出 N 字思考过程）"
  //   3. 只有 ping 没输出   → "AI 正在思考（连接活着，等它开口）"
  //   4. 什么都没有         → "拆解场景中"
  const statusLabel = hasOutput
    ? 'AI 正在吐字……'
    : hasReasoning
    ? `AI 正在思考（已产出 ${reasoningCharCount.toLocaleString()} 字思考过程）……`
    : pingInfo
    ? 'AI 正在思考（连接活着，等它开口）……'
    : 'AI 正在把你的主题拆解成场景……';

  return (
    <div className="mt-6 p-6 rounded-xl bg-paper-raised border border-paper-rule">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-paper-accentWarm animate-pulse" />
          <span className="text-sm font-semibold text-paper-ink">
            {statusLabel}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs font-mono text-paper-inkFaint tabular-nums">
          {pingInfo && <span>⌁ ping #{pingInfo.seq} · {elapsedSec}s</span>}
          {hasReasoning && !hasOutput && (
            <span>思考 {reasoningCharCount.toLocaleString()}</span>
          )}
          {hasOutput && <span>{charCount.toLocaleString()} chars</span>}
        </div>
      </div>

      {/* 思考过程：只在 content 还没开始时展示，节省版面。
          一旦正式答案开始吐，思考过程自动隐藏。 */}
      {hasReasoning && !hasOutput && (
        <div className="mb-3 p-3 rounded-md bg-paper-bg/60 border border-paper-rule/60">
          <div className="text-[10px] uppercase tracking-[0.1em] text-paper-inkFaint font-semibold mb-1">
            思考过程（不会出现在最终脚本里）
          </div>
          <pre className="text-xs font-mono text-paper-inkMuted whitespace-pre-wrap leading-relaxed max-h-48 overflow-hidden">
            {reasoningTail}
          </pre>
        </div>
      )}

      {!hasOutput && (
        <p className="text-sm text-paper-inkMuted leading-relaxed">
          通常需要 1-3 分钟。生成的视频目标时长是 3-5 分钟、8-14 个场景，
          AI 会依次思考：没有它之前是什么样 → 历史锚点 → 核心机制 →
          设计决策 → 洞见金句。这一步是质量的关键，不会让它偷懒。
        </p>
      )}

      {hasOutput && (
        <pre className="mt-1 max-h-64 overflow-auto text-xs font-mono text-paper-inkSoft bg-paper-bg border border-paper-rule rounded-md p-3 whitespace-pre-wrap break-words leading-relaxed">
          {tail}
          <span className="inline-block w-1.5 h-3 ml-0.5 bg-paper-accentWarm animate-pulse align-middle" />
        </pre>
      )}
    </div>
  );
};
