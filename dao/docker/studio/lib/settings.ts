'use client';

import type { ProviderConfig, ProviderId } from './llm/types';
import { DEFAULT_MODELS, LEGACY_MODEL_MIGRATIONS } from './llm';

/**
 * 用户设置 · 本地存储
 *
 * 存储结构（单一 key）：
 *   dao-studio:settings → Settings
 *
 * API key 明文存在 localStorage。
 * 这是个人学习工具，可接受；若要上生产必须换成后端管理 + 加密。
 */

export type Settings = {
  /** 当前激活的 provider */
  activeProvider: ProviderId;
  /** 每个 provider 的配置（key/model/baseURL） */
  providers: Record<ProviderId, ProviderConfig>;
};

const SETTINGS_KEY = 'dao-studio:settings';

export function defaultSettings(): Settings {
  return {
    activeProvider: 'anthropic',
    providers: {
      anthropic: {
        id: 'anthropic',
        name: 'Anthropic Claude',
        model: DEFAULT_MODELS.anthropic,
      },
      openai: {
        id: 'openai',
        name: 'OpenAI GPT',
        model: DEFAULT_MODELS.openai,
      },
      ollama: {
        id: 'ollama',
        name: 'Ollama',
        model: DEFAULT_MODELS.ollama,
        baseURL: 'http://localhost:11434',
      },
      nvidia: {
        id: 'nvidia',
        name: 'NVIDIA',
        model: DEFAULT_MODELS.nvidia,
        baseURL: 'https://integrate.api.nvidia.com',
      },
    },
  };
}

export function getSettings(): Settings {
  if (typeof window === 'undefined') return defaultSettings();
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return defaultSettings();
    const parsed = JSON.parse(raw) as Partial<Settings>;
    // 合并默认值，防止旧版本缺字段
    const def = defaultSettings();
    const merged: Settings = {
      activeProvider: parsed.activeProvider ?? def.activeProvider,
      providers: {
        anthropic: { ...def.providers.anthropic, ...parsed.providers?.anthropic },
        openai: { ...def.providers.openai, ...parsed.providers?.openai },
        ollama: { ...def.providers.ollama, ...parsed.providers?.ollama },
        nvidia: { ...def.providers.nvidia, ...parsed.providers?.nvidia },
      },
    };

    // 一次性迁移：把已知有问题的旧默认值替换成新默认值。
    // 典型例子：nvidia 从 z-ai/glm-5.1 换成 deepseek-ai/deepseek-v3.1。
    // 只迁移"恰好是旧默认"的 case，用户自己手动填过的模型保持不动。
    let migrated = false;
    for (const [providerId, mapping] of Object.entries(LEGACY_MODEL_MIGRATIONS)) {
      if (!mapping) continue;
      const pid = providerId as ProviderId;
      const currentModel = merged.providers[pid].model;
      const replacement = mapping[currentModel];
      if (replacement) {
        merged.providers[pid].model = replacement;
        migrated = true;
      }
    }
    if (migrated) {
      // 写回去，防止下次加载又被同样迁移一遍
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(merged));
    }

    return merged;
  } catch {
    return defaultSettings();
  }
}

export function saveSettings(settings: Settings): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  window.dispatchEvent(new Event('dao-studio:settings-changed'));
}

export function updateActiveProvider(id: ProviderId): void {
  const s = getSettings();
  s.activeProvider = id;
  saveSettings(s);
}

export function updateProviderConfig(
  id: ProviderId,
  partial: Partial<ProviderConfig>,
): void {
  const s = getSettings();
  s.providers[id] = { ...s.providers[id], ...partial };
  saveSettings(s);
}
