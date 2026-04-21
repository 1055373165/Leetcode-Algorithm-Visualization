'use client';

import type { ProviderConfig, ProviderId } from './llm/types';
import { DEFAULT_MODELS } from './llm';

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
    return {
      activeProvider: parsed.activeProvider ?? def.activeProvider,
      providers: {
        anthropic: { ...def.providers.anthropic, ...parsed.providers?.anthropic },
        openai: { ...def.providers.openai, ...parsed.providers?.openai },
        ollama: { ...def.providers.ollama, ...parsed.providers?.ollama },
      },
    };
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
