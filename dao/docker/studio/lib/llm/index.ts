import type { LLMProvider, ProviderId } from './types';
import { anthropicProvider } from './providers/anthropic';
import { openaiProvider } from './providers/openai';
import { ollamaProvider } from './providers/ollama';
import { nvidiaProvider } from './providers/nvidia';

export * from './types';
export { SYSTEM_PROMPT } from './prompt';

const REGISTRY: Record<ProviderId, LLMProvider> = {
  anthropic: anthropicProvider,
  openai: openaiProvider,
  ollama: ollamaProvider,
  nvidia: nvidiaProvider,
};

export function getProvider(id: ProviderId): LLMProvider {
  const p = REGISTRY[id];
  if (!p) throw new Error(`Unknown provider: ${id}`);
  return p;
}

/**
 * 各 provider 的默认建议模型。
 * 用户可以在设置页覆盖，但这是首次配置时的合理起点。
 *
 * NVIDIA 选 deepseek-v3.2 的原因：
 *   - DeepSeek 在 NIM 上的现役版本（v3.1 已于 2026-04-15 EOL）
 *   - 是 hybrid 模型，支持 think / non-think 切换
 *   - 我们在 nvidia.ts 里显式关掉 thinking，token 立即流
 *   - 长上下文、强指令跟随，拿来吐 JSON 脚本很合适
 *
 * 之前默认 z-ai/glm-5.1 在流式下默认开 thinking，浏览器
 * 要等几分钟才看到第一个 token，体验很差——已下线这个默认。
 */
export const DEFAULT_MODELS: Record<ProviderId, string> = {
  anthropic: 'claude-3-5-sonnet-20241022',
  openai: 'gpt-4o',
  ollama: 'qwen2.5:14b',
  nvidia: 'deepseek-ai/deepseek-v3.2',
};

/**
 * 已知会在流式下表现奇怪或已下架的"遗留"默认值 → 新默认值映射。
 * 在 settings.ts 里用来做一次性自动迁移，省得用户手动去设置页改。
 *
 * 旧 key 必须是我们自己曾经发布过的默认值，不覆盖用户手填的值。
 */
export const LEGACY_MODEL_MIGRATIONS: Partial<Record<ProviderId, Record<string, string>>> = {
  nvidia: {
    'z-ai/glm-5.1': DEFAULT_MODELS.nvidia,
    // v3.1 在 2026-04-15 被 NVIDIA NIM 下线（HTTP 410 Gone）
    'deepseek-ai/deepseek-v3.1': DEFAULT_MODELS.nvidia,
  },
};

export const PROVIDER_DISPLAY_NAMES: Record<ProviderId, string> = {
  anthropic: 'Anthropic Claude',
  openai: 'OpenAI GPT',
  ollama: 'Ollama（本地）',
  nvidia: 'NVIDIA',
};
