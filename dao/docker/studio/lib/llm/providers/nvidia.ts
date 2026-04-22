import type { LLMProvider, GenerateResult } from '../types';
import { LLMError } from '../types';
import { SYSTEM_PROMPT, buildUserPrompt } from '../prompt';
import { parseTopicScript } from '../parse';
import { streamOpenAiCompat } from './openai_compat';

/**
 * NVIDIA AI Provider · 兼容 OpenAI SDK 的 NVIDIA 集成端点
 *
 * 端点: https://integrate.api.nvidia.com/v1/chat/completions
 * 支持模型（示例）:
 *   - deepseek-ai/deepseek-v3.1   （默认，非 thinking 模式流式最顺）
 *   - nvidia/llama-3.1-nemotron-70b-instruct
 *   - z-ai/glm-5.1                （需要关 thinking 才能流）
 *
 * NVIDIA 端点 100% 兼容 OpenAI 的 stream=true 格式，
 * 所以借用 streamOpenAiCompat 帮助器。
 */

/**
 * 按模型名推断应该用哪种"关掉 thinking"的参数。
 * NVIDIA NIM 只是透传这些字段给底层模型，不同厂商字段名不同。
 */
function buildThinkingDisableBody(model: string): Record<string, unknown> {
  const m = model.toLowerCase();
  if (m.includes('glm')) {
    // Z.AI 官方参数（NIM 透传）
    return { thinking: { type: 'disabled' } };
  }
  if (m.includes('deepseek')) {
    // DeepSeek V3.1 通过 chat_template_kwargs 切 non-thinking 模式
    return { chat_template_kwargs: { thinking: false } };
  }
  // 其他模型（如 nemotron / llama）没有 hybrid-thinking 概念，不用管
  return {};
}
export const nvidiaProvider: LLMProvider = {
  id: 'nvidia',
  async generateStream(topic, config, onToken) {
    if (!config.apiKey) {
      throw new LLMError('NVIDIA API key 未配置', 'nvidia');
    }

    const endpoint =
      (config.baseURL ?? 'https://integrate.api.nvidia.com') +
      '/v1/chat/completions';
    const userPrompt = buildUserPrompt(topic);

    // NVIDIA integrate 上不少模型是 hybrid reasoning 模型，
    // 默认开启 thinking。而 thinking 阶段的 token 走的是
    //   delta.reasoning_content  （而不是 delta.content）
    // OpenAI-compat 客户端只消费 delta.content，这样 UI 会
    // "好几分钟一片空白"——上一轮 glm-5.1 就是这个现象。
    //
    // 不同厂商关 thinking 的参数名不一样：
    //   z-ai/glm-*        → thinking: { type: "disabled" }        （Z.AI 原生）
    //   deepseek-ai/*     → chat_template_kwargs: { thinking: false } （NIM 透传）
    // 保留 thinking 对质量略有帮助，但对"拆 8 个场景吐 JSON"
    // 这种结构化任务收益不大，远不如换来的流式 UX。
    //
    // 若将来想保留 thinking 质量 + 展示"思考过程"：把这里改成
    // enabled，并在 openai_compat 里新增一个 reasoning_content
    // 分支，单独 emit 一个 event 给前端做半透明预览。
    //
    // 参考：
    //   https://docs.z.ai/guides/llm/glm-5.1
    //   https://build.nvidia.com/deepseek-ai/deepseek-v3_1
    const extraBody = buildThinkingDisableBody(config.model);

    const { rawText, usage } = await streamOpenAiCompat({
      provider: 'nvidia',
      endpoint,
      apiKey: config.apiKey,
      body: {
        model: config.model,
        max_tokens: 8192,
        temperature: 1,
        top_p: 1,
        stream: true,
        ...extraBody,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
      },
      onToken,
    });

    const script = parseTopicScript(rawText, 'nvidia');
    script.meta.generatedBy = { provider: 'nvidia', model: config.model };

    const result: GenerateResult = {
      script,
      rawResponse: rawText,
      usage: {
        inputTokens: usage?.prompt_tokens,
        outputTokens: usage?.completion_tokens,
      },
    };
    return result;
  },
};
