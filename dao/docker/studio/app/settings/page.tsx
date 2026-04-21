'use client';

import { useEffect, useState } from 'react';
import {
  getSettings,
  updateActiveProvider,
  updateProviderConfig,
  type Settings,
} from '@/lib/settings';
import { PROVIDER_DISPLAY_NAMES, DEFAULT_MODELS } from '@/lib/llm';
import type { ProviderId } from '@/lib/llm/types';
import { exportAll, importAll } from '@/lib/storage';

const PROVIDERS: ProviderId[] = ['anthropic', 'openai', 'ollama'];

/**
 * 设置页 · AI Provider 配置 + 数据导入导出
 *
 * Provider 配置全部在 localStorage，key 明文存储（个人工具可接受）。
 */
export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    setSettings(getSettings());
    const refresh = () => setSettings(getSettings());
    window.addEventListener('dao-studio:settings-changed', refresh);
    return () =>
      window.removeEventListener('dao-studio:settings-changed', refresh);
  }, []);

  if (!settings) {
    return <div className="text-paper-inkMuted text-sm">加载中…</div>;
  }

  function handleSelect(id: ProviderId) {
    updateActiveProvider(id);
    setSettings(getSettings());
  }

  function handleUpdate(
    id: ProviderId,
    field: 'apiKey' | 'model' | 'baseURL',
    value: string,
  ) {
    updateProviderConfig(id, { [field]: value });
    setSettings(getSettings());
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="font-serif text-4xl font-semibold text-paper-ink tracking-tight mb-2">
        设置
      </h1>
      <p className="text-paper-inkMuted mb-8">
        配置一个或多个 AI Provider，选一个作为当前使用的。
        API key 存在浏览器本地，不会上传到任何服务器。
      </p>

      {/* 当前 Provider 切换 */}
      <div className="bg-paper-raised border border-paper-rule rounded-xl p-6 mb-6">
        <h2 className="font-semibold text-paper-ink mb-4">当前使用</h2>
        <div className="grid grid-cols-3 gap-3">
          {PROVIDERS.map((id) => {
            const isActive = settings.activeProvider === id;
            const hasKey = id === 'ollama' || !!settings.providers[id].apiKey;
            return (
              <button
                key={id}
                onClick={() => handleSelect(id)}
                className={
                  'p-4 rounded-lg border-2 text-left transition-all ' +
                  (isActive
                    ? 'border-paper-accentWarm bg-paper-accentWarm/5'
                    : 'border-paper-rule hover:border-paper-ruleStrong bg-paper-bg')
                }
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-paper-ink">
                    {PROVIDER_DISPLAY_NAMES[id]}
                  </span>
                  <span
                    className={
                      'w-2 h-2 rounded-full ' +
                      (hasKey ? 'bg-paper-running' : 'bg-paper-inkFaint')
                    }
                  />
                </div>
                <div className="text-xs text-paper-inkMuted font-mono">
                  {settings.providers[id].model}
                </div>
                {!hasKey && (
                  <div className="text-[10px] text-paper-blocked mt-1">
                    未配置
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 每个 Provider 的详细配置 */}
      {PROVIDERS.map((id) => (
        <ProviderCard
          key={id}
          id={id}
          config={settings.providers[id]}
          onChange={handleUpdate}
        />
      ))}

      {/* 数据导入导出 */}
      <div className="bg-paper-raised border border-paper-rule rounded-xl p-6 mt-6">
        <h2 className="font-semibold text-paper-ink mb-2">数据</h2>
        <p className="text-sm text-paper-inkMuted mb-4">
          导出你所有的主题、笔记和复习状态为 JSON 备份。
          从另一台机器导入时会合并（同 ID 覆盖）。
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => {
              const json = exportAll();
              const blob = new Blob([json], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `dao-studio-backup-${new Date()
                .toISOString()
                .slice(0, 10)}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="px-4 py-2 border border-paper-rule rounded-md text-sm hover:bg-paper-surface"
          >
            导出全部
          </button>
          <label className="px-4 py-2 border border-paper-rule rounded-md text-sm hover:bg-paper-surface cursor-pointer">
            导入 JSON
            <input
              type="file"
              accept="application/json"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const text = await file.text();
                try {
                  const result = importAll(text);
                  alert(`成功导入 ${result.imported} 条`);
                } catch (err) {
                  alert(`导入失败：${err instanceof Error ? err.message : String(err)}`);
                }
              }}
            />
          </label>
        </div>
      </div>
    </div>
  );
}

const ProviderCard: React.FC<{
  id: ProviderId;
  config: Settings['providers'][ProviderId];
  onChange: (id: ProviderId, field: 'apiKey' | 'model' | 'baseURL', value: string) => void;
}> = ({ id, config, onChange }) => {
  const [showKey, setShowKey] = useState(false);
  const needsKey = id !== 'ollama';

  return (
    <div className="bg-paper-raised border border-paper-rule rounded-xl p-6 mb-4">
      <h3 className="font-semibold text-paper-ink mb-1">
        {PROVIDER_DISPLAY_NAMES[id]}
      </h3>
      <p className="text-xs text-paper-inkMuted mb-4 font-mono">{id}</p>

      {needsKey && (
        <div className="mb-4">
          <label className="block text-xs font-semibold text-paper-inkSoft uppercase tracking-[0.08em] mb-1">
            API Key
          </label>
          <div className="flex gap-2">
            <input
              type={showKey ? 'text' : 'password'}
              value={config.apiKey ?? ''}
              onChange={(e) => onChange(id, 'apiKey', e.target.value)}
              placeholder={id === 'anthropic' ? 'sk-ant-...' : 'sk-...'}
              className="flex-1 px-3 py-2 bg-paper-bg border border-paper-rule rounded-md text-sm font-mono focus:outline-none focus:border-paper-accentCool"
            />
            <button
              onClick={() => setShowKey(!showKey)}
              className="px-3 py-2 text-sm text-paper-inkMuted hover:text-paper-ink border border-paper-rule rounded-md"
            >
              {showKey ? '隐藏' : '显示'}
            </button>
          </div>
        </div>
      )}

      <div className="mb-4">
        <label className="block text-xs font-semibold text-paper-inkSoft uppercase tracking-[0.08em] mb-1">
          模型
        </label>
        <input
          type="text"
          value={config.model}
          onChange={(e) => onChange(id, 'model', e.target.value)}
          placeholder={DEFAULT_MODELS[id]}
          className="w-full px-3 py-2 bg-paper-bg border border-paper-rule rounded-md text-sm font-mono focus:outline-none focus:border-paper-accentCool"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-paper-inkSoft uppercase tracking-[0.08em] mb-1">
          Base URL（可选，用于中转 / 本地服务）
        </label>
        <input
          type="text"
          value={config.baseURL ?? ''}
          onChange={(e) => onChange(id, 'baseURL', e.target.value)}
          placeholder={
            id === 'ollama' ? 'http://localhost:11434' : 'https://api.example.com'
          }
          className="w-full px-3 py-2 bg-paper-bg border border-paper-rule rounded-md text-sm font-mono focus:outline-none focus:border-paper-accentCool"
        />
      </div>
    </div>
  );
};
