'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  listPrompts,
  createPrompt,
  updatePrompt,
  deletePrompt,
  duplicatePrompt,
  renderTemplate,
  TEMPLATE_VARIABLES,
  type PromptTemplate,
} from '@/lib/prompts';

/**
 * /prompts · 提示词模板管理
 *
 * 布局：左侧列表（内置 + 自定义），右侧编辑器。
 *   - 内置模板：只能查看 + 复制。尝试编辑时按钮是禁用态
 *   - 自定义模板：可改名 / 改正文 / 删除
 *   - 新建：列表底部有 "+ 新建模板" 按钮，弹一个空白编辑器
 *   - 预览：编辑器底部输入示例 topic，实时看占位符填充效果
 *
 * 这一页所有操作都是本地 localStorage，没有服务端调用——
 * 刷新不会丢数据，但换浏览器或清缓存会丢。个人工具可以接受。
 */

type Draft = {
  name: string;
  description: string;
  userPromptTemplate: string;
};

const EMPTY_DRAFT: Draft = {
  name: '',
  description: '',
  userPromptTemplate: [
    '主题：{{topic}}',
    '目标观众：{{audience}}',
    '语言：{{language}}',
    '时长：{{duration}}',
    '',
    '请为这个主题生成一份深度讲解 TopicScript JSON。',
    '',
    '（在这里写你希望的叙事骨架、场景偏好、硬性规则……',
    '占位符可用 {{topic}} / {{duration}} / {{language}} / {{audience}}，',
    '未用到的占位符在生成时会原样保留，方便发现拼写错误）',
    '',
    '直接输出 TopicScript JSON，不要任何其他文字。',
  ].join('\n'),
};

/** 预览区用的初始变量值：topic 用举例，其余用元数据默认值 */
function initialPreviewVars(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const v of TEMPLATE_VARIABLES) {
    out[v.key] = v.key === 'topic' ? 'B+ 树' : v.defaultValue;
  }
  return out;
}

export default function PromptsPage() {
  const [prompts, setPrompts] = useState<PromptTemplate[]>([]);
  /**
   * 当前选中的 id：
   *   - 以 'custom:...' 或 'builtin:...' 开头 → 查看/编辑现有模板
   *   - '__new__' → 新建草稿（还没落盘）
   */
  const [selectedId, setSelectedId] = useState<string>('');
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  // 预览区变量值：每个支持的占位符都有独立输入框，所见即所得
  const [previewVars, setPreviewVars] = useState<Record<string, string>>(
    initialPreviewVars,
  );
  const [dirty, setDirty] = useState<boolean>(false);

  useEffect(() => {
    const refresh = () => setPrompts(listPrompts());
    refresh();
    // 其它 tab / 页面改动时同步
    window.addEventListener('dao-studio:prompts-changed', refresh);
    return () => window.removeEventListener('dao-studio:prompts-changed', refresh);
  }, []);

  // 首次进入时默认选中第一个内置模板（一般是"算法题深度解析"）
  useEffect(() => {
    if (!selectedId && prompts.length > 0) {
      setSelectedId(prompts[0].id);
    }
  }, [prompts, selectedId]);

  // 当 selectedId 变化时，把对应模板灌进 draft
  useEffect(() => {
    if (selectedId === '__new__') {
      setDraft(EMPTY_DRAFT);
      setDirty(true);
      return;
    }
    const tpl = prompts.find((p) => p.id === selectedId);
    if (tpl) {
      setDraft({
        name: tpl.name,
        description: tpl.description ?? '',
        userPromptTemplate: tpl.userPromptTemplate,
      });
      setDirty(false);
    }
  }, [selectedId, prompts]);

  const selected = prompts.find((p) => p.id === selectedId);
  const isNew = selectedId === '__new__';
  const isBuiltin = !isNew && !!selected?.builtin;
  const canEdit = isNew || (!!selected && !selected.builtin);

  const previewText = useMemo(() => {
    // 把空值替换成占位符名自身，方便看清楚哪些变量没填
    const filled: Record<string, string> = {};
    for (const [k, v] of Object.entries(previewVars)) {
      filled[k] = v.trim() || `<${k}>`;
    }
    return renderTemplate(draft.userPromptTemplate, filled);
  }, [draft.userPromptTemplate, previewVars]);

  function updateDraft<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
    setDirty(true);
  }

  function handleSave() {
    if (isNew) {
      const created = createPrompt(draft);
      setPrompts(listPrompts());
      setSelectedId(created.id);
      setDirty(false);
      return;
    }
    if (!selected || selected.builtin) return;
    updatePrompt(selected.id, draft);
    setPrompts(listPrompts());
    setDirty(false);
  }

  function handleDelete() {
    if (!selected || selected.builtin) return;
    if (!confirm(`确定删除模板 "${selected.name}" 吗？此操作无法撤销。`)) return;
    deletePrompt(selected.id);
    const next = listPrompts();
    setPrompts(next);
    setSelectedId(next[0]?.id ?? '');
  }

  function handleDuplicate() {
    if (!selected) return;
    const copy = duplicatePrompt(selected.id);
    if (copy) {
      setPrompts(listPrompts());
      setSelectedId(copy.id);
    }
  }

  function handleNew() {
    if (dirty && !confirm('当前有未保存的改动，继续新建会丢失，确定吗？')) return;
    setSelectedId('__new__');
  }

  return (
    <div className="max-w-[1200px] mx-auto">
      <div className="flex items-baseline justify-between mb-2">
        <h1 className="font-serif text-4xl font-semibold text-paper-ink tracking-tight">
          提示词模板
        </h1>
        <Link
          href="/new"
          className="text-sm underline text-paper-inkMuted hover:text-paper-ink"
        >
          ← 返回新建
        </Link>
      </div>
      <p className="text-paper-inkMuted mb-8">
        自定义 user prompt 模板。内置模板（◆）只读，点"复制"可以得到一份可编辑的副本。
        模板里可用占位符：
        {TEMPLATE_VARIABLES.map((v, i) => (
          <span key={v.key}>
            {i > 0 && '、'}
            <code
              className="font-mono text-paper-accentCool mx-0.5"
              title={v.hint}
            >
              {`{{${v.key}}}`}
            </code>
          </span>
        ))}
        ；生成时会被替换成用户输入的值。
      </p>

      <div className="grid grid-cols-[260px_1fr] gap-6">
        {/* 左侧：模板列表 */}
        <aside className="space-y-1">
          {prompts.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                if (dirty && !confirm('当前有未保存的改动，切换会丢失，确定吗？'))
                  return;
                setSelectedId(p.id);
              }}
              className={
                'w-full text-left px-3 py-2.5 rounded-lg border transition-colors ' +
                (selectedId === p.id
                  ? 'bg-paper-accentWarm/10 border-paper-accentWarm text-paper-ink'
                  : 'border-paper-rule hover:bg-paper-surface text-paper-inkSoft')
              }
            >
              <div className="text-sm font-medium flex items-center gap-2">
                <span className={p.builtin ? 'text-paper-inkFaint' : 'text-paper-accentCool'}>
                  {p.builtin ? '◆' : '✎'}
                </span>
                <span className="truncate">{p.name}</span>
              </div>
              {p.description && (
                <div className="text-xs text-paper-inkMuted mt-1 line-clamp-2 leading-snug">
                  {p.description}
                </div>
              )}
            </button>
          ))}

          <button
            onClick={handleNew}
            className={
              'w-full text-left px-3 py-2.5 rounded-lg border border-dashed mt-2 transition-colors ' +
              (selectedId === '__new__'
                ? 'bg-paper-accentWarm/10 border-paper-accentWarm text-paper-ink'
                : 'border-paper-rule text-paper-inkMuted hover:bg-paper-surface hover:text-paper-ink')
            }
          >
            <span className="text-sm">+ 新建模板</span>
          </button>
        </aside>

        {/* 右侧：编辑器 + 预览 */}
        <section className="bg-paper-raised rounded-xl border border-paper-rule shadow-paper p-6">
          {selectedId === '' ? (
            <div className="text-paper-inkMuted">选择左侧一个模板开始编辑…</div>
          ) : (
            <>
              {isBuiltin && (
                <div className="mb-5 p-3 rounded-md bg-paper-highlight/20 border border-paper-highlight text-xs text-paper-inkSoft">
                  这是内置模板，不能直接修改。点右上角
                  <strong className="font-semibold text-paper-ink"> 复制 </strong>
                  得到一份可编辑的副本。
                </div>
              )}

              <div className="flex items-center justify-between mb-5">
                <div className="text-sm text-paper-inkFaint font-mono">
                  id: {isNew ? '（保存后生成）' : selected?.id}
                </div>
                <div className="flex items-center gap-2">
                  {!isNew && (
                    <button
                      onClick={handleDuplicate}
                      className="px-3 py-1.5 text-sm text-paper-inkSoft border border-paper-rule rounded-md hover:bg-paper-surface"
                    >
                      复制
                    </button>
                  )}
                  {canEdit && !isNew && (
                    <button
                      onClick={handleDelete}
                      className="px-3 py-1.5 text-sm text-paper-blocked border border-paper-blocked/50 rounded-md hover:bg-paper-blocked/10"
                    >
                      删除
                    </button>
                  )}
                  <button
                    onClick={handleSave}
                    disabled={!canEdit || !dirty || !draft.name.trim()}
                    className="px-4 py-1.5 text-sm bg-paper-accentWarm text-white rounded-md font-medium hover:bg-paper-accentWarm/90 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {isNew ? '创建' : '保存'}
                  </button>
                </div>
              </div>

              <label className="block mb-2 text-xs font-semibold text-paper-inkSoft uppercase tracking-[0.08em]">
                名称
              </label>
              <input
                type="text"
                value={draft.name}
                onChange={(e) => updateDraft('name', e.target.value)}
                disabled={!canEdit}
                placeholder="例：数据库优化技巧深度解析"
                className="w-full px-3 py-2 mb-4 bg-paper-bg border border-paper-rule rounded-md text-paper-ink text-sm focus:outline-none focus:border-paper-accentWarm focus:ring-2 focus:ring-paper-accentWarm/20 disabled:opacity-60"
              />

              <label className="block mb-2 text-xs font-semibold text-paper-inkSoft uppercase tracking-[0.08em]">
                描述（可选 · 在 /new 下拉下方展示）
              </label>
              <input
                type="text"
                value={draft.description}
                onChange={(e) => updateDraft('description', e.target.value)}
                disabled={!canEdit}
                placeholder="一句话说明这个模板适合什么主题"
                className="w-full px-3 py-2 mb-4 bg-paper-bg border border-paper-rule rounded-md text-paper-ink text-sm focus:outline-none focus:border-paper-accentWarm focus:ring-2 focus:ring-paper-accentWarm/20 disabled:opacity-60"
              />

              <label className="block mb-2 text-xs font-semibold text-paper-inkSoft uppercase tracking-[0.08em]">
                User prompt 模板 · 可用占位符{' '}
                {TEMPLATE_VARIABLES.map((v, i) => (
                  <span key={v.key}>
                    {i > 0 && ' · '}
                    <code
                      className="font-mono normal-case tracking-normal text-paper-accentCool cursor-help"
                      title={v.hint}
                    >
                      {`{{${v.key}}}`}
                    </code>
                  </span>
                ))}
              </label>
              <textarea
                value={draft.userPromptTemplate}
                onChange={(e) => updateDraft('userPromptTemplate', e.target.value)}
                disabled={!canEdit}
                rows={16}
                className="w-full px-3 py-2 mb-4 bg-paper-bg border border-paper-rule rounded-md text-paper-ink text-xs font-mono leading-relaxed focus:outline-none focus:border-paper-accentWarm focus:ring-2 focus:ring-paper-accentWarm/20 disabled:opacity-60"
              />

              {/* 预览：填充占位符后的效果 · 每个变量一个独立输入框 */}
              <div className="mt-6 pt-5 border-t border-paper-rule">
                <label className="block text-xs font-semibold text-paper-inkSoft uppercase tracking-[0.08em] mb-3">
                  占位符预览
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                  {TEMPLATE_VARIABLES.map((v) => (
                    <div key={v.key}>
                      <label
                        htmlFor={`preview-${v.key}`}
                        className="block text-[10px] text-paper-inkFaint mb-0.5"
                      >
                        <code className="font-mono">{`{{${v.key}}}`}</code>
                      </label>
                      <input
                        id={`preview-${v.key}`}
                        type="text"
                        value={previewVars[v.key] ?? ''}
                        onChange={(e) =>
                          setPreviewVars((p) => ({ ...p, [v.key]: e.target.value }))
                        }
                        placeholder={v.placeholder}
                        className="w-full px-2 py-1 text-xs bg-paper-bg border border-paper-rule rounded text-paper-ink focus:outline-none focus:border-paper-accentWarm"
                      />
                    </div>
                  ))}
                </div>
                <pre className="p-3 max-h-72 overflow-auto bg-paper-bg border border-paper-rule rounded-md text-xs font-mono text-paper-inkSoft whitespace-pre-wrap leading-relaxed">
                  {previewText}
                </pre>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
