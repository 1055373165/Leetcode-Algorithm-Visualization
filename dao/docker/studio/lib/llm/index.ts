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
 * NVIDIA 选 moonshotai/kimi-k2-instruct 的原因：
 *   - 2026-04 curl 实测在 NIM 上健康：首字 1.3s、总 2.5s（对比 DeepSeek 家族当前全军覆没）
 *   - 是 **非 thinking** 的 instruct 变体，delta.content 直接出正式答案，不需要关 thinking
 *   - 1T 参数的 MoE 开源模型，指令跟随 + 长 JSON 输出质量够用
 *   - 走标准 OpenAI 流式协议（data: {...} / data: [DONE]），和我们的 streamOpenAiCompat 天生兼容
 *
 * 历史教训：
 *   - z-ai/glm-5.1：流式默认开 thinking，浏览器等几分钟才看到第一个 token
 *   - deepseek-ai/deepseek-v3.1：2026-04-15 EOL
 *   - deepseek-ai/deepseek-v3.2：文档页存在，但 integrate.api.nvidia.com 上
 *     curl 30 秒黑洞不回一个字节（既不是 404 也不是 410，就是纯粹挂死）。
 *     我们的 fetch await 就永远挂在这里。
 */
export const DEFAULT_MODELS: Record<ProviderId, string> = {
  anthropic: 'claude-3-5-sonnet-20241022',
  openai: 'gpt-4o',
  ollama: 'qwen2.5:14b',
  nvidia: 'moonshotai/kimi-k2-instruct',
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
    // v3.2 在 integrate.api.nvidia.com 上 30 秒黑洞，fetch 永远挂
    'deepseek-ai/deepseek-v3.2': DEFAULT_MODELS.nvidia,
  },
};

export const PROVIDER_DISPLAY_NAMES: Record<ProviderId, string> = {
  anthropic: 'Anthropic Claude',
  openai: 'OpenAI GPT',
  ollama: 'Ollama（本地）',
  nvidia: 'NVIDIA',
};
