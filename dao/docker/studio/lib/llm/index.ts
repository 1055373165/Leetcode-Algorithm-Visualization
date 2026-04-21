import type { LLMProvider, ProviderId } from './types';
import { anthropicProvider } from './providers/anthropic';
import { openaiProvider } from './providers/openai';
import { ollamaProvider } from './providers/ollama';

export * from './types';
export { SYSTEM_PROMPT } from './prompt';

const REGISTRY: Record<ProviderId, LLMProvider> = {
  anthropic: anthropicProvider,
  openai: openaiProvider,
  ollama: ollamaProvider,
};

export function getProvider(id: ProviderId): LLMProvider {
  const p = REGISTRY[id];
  if (!p) throw new Error(`Unknown provider: ${id}`);
  return p;
}

/**
 * 各 provider 的默认建议模型。
 * 用户可以在设置页覆盖，但这是首次配置时的合理起点。
 */
export const DEFAULT_MODELS: Record<ProviderId, string> = {
  anthropic: 'claude-3-5-sonnet-20241022',
  openai: 'gpt-4o',
  ollama: 'qwen2.5:14b',
};

export const PROVIDER_DISPLAY_NAMES: Record<ProviderId, string> = {
  anthropic: 'Anthropic Claude',
  openai: 'OpenAI GPT',
  ollama: 'Ollama（本地）',
};
