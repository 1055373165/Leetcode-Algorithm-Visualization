import type { LLMProvider, GenerateResult } from '../types';
import { LLMError } from '../types';
import { SYSTEM_PROMPT, buildUserPrompt } from '../prompt';
import { parseTopicScript } from '../parse';
import { streamOpenAiCompat } from './openai_compat';

/**
 * OpenAI Provider · 使用 Chat Completions API（流式）
 *
 * 支持的模型（示例）：
 *   - gpt-4o
 *   - gpt-4o-mini
 *   - gpt-4-turbo
 *
 * 请求 JSON 模式（response_format: json_object）让 LLM 更可能输出合法 JSON；
 * stream=true 让 token 边产边回，避免浏览器 fetch 在长请求下被中途掐断。
 *
 * 注意：OpenAI 官方 API 在流式模式下需要在组织/项目设置里允许 usage 输出，
 * 否则 usage 字段会是 undefined——对我们来说不影响主流程。
 */
export const openaiProvider: LLMProvider = {
  id: 'openai',
  async generateStream(topic, config, onToken) {
    if (!config.apiKey) {
      throw new LLMError('OpenAI API key 未配置', 'openai');
    }

    const endpoint =
      (config.baseURL ?? 'https://api.openai.com') + '/v1/chat/completions';
    const userPrompt = buildUserPrompt(topic);

    const { rawText, usage } = await streamOpenAiCompat({
      provider: 'openai',
      endpoint,
      apiKey: config.apiKey,
      body: {
        model: config.model,
        max_tokens: 4096,
        response_format: { type: 'json_object' },
        stream: true,
        // stream_options.include_usage=true 让最后一条 chunk 带上 usage
        stream_options: { include_usage: true },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
      },
      onToken,
    });

    const script = parseTopicScript(rawText, 'openai');
    script.meta.generatedBy = { provider: 'openai', model: config.model };

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
