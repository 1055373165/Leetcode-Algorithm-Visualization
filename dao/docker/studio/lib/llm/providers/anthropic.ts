import type { LLMProvider, GenerateResult } from '../types';
import { LLMError } from '../types';
import { SYSTEM_PROMPT, buildUserPrompt } from '../prompt';
import { parseTopicScript } from '../parse';
import { iterSse } from '../../sse';

/**
 * Anthropic Claude Provider · 使用 Messages API（流式）
 *
 * 支持的模型（示例）：
 *   - claude-3-5-sonnet-20241022
 *   - claude-3-5-haiku-20241022
 *   - claude-3-opus-20240229
 *
 * Anthropic 的 SSE 事件流和 OpenAI 不兼容，自己有一套事件名：
 *   - message_start          → usage.input_tokens 在这里
 *   - content_block_start
 *   - content_block_delta    → delta.text 就是增量文本
 *   - content_block_stop
 *   - message_delta          → 最终 usage.output_tokens
 *   - message_stop
 *
 * 用 fetch 直接调用而非 SDK，避免 SDK 版本锁带来的困扰。
 */
export const anthropicProvider: LLMProvider = {
  id: 'anthropic',
  async generateStream(topic, config, onToken) {
    if (!config.apiKey) {
      throw new LLMError('Anthropic API key 未配置', 'anthropic');
    }

    const endpoint =
      (config.baseURL ?? 'https://api.anthropic.com') + '/v1/messages';
    const userPrompt = buildUserPrompt(topic);

    const body = {
      model: config.model,
      max_tokens: 4096,
      stream: true,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    };

    let response: Response;
    try {
      response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'x-api-key': config.apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
          accept: 'text/event-stream',
        },
        body: JSON.stringify(body),
      });
    } catch (e) {
      throw new LLMError('网络请求失败', 'anthropic', e);
    }

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new LLMError(
        `HTTP ${response.status}: ${errText.slice(0, 300)}`,
        'anthropic',
      );
    }

    if (!response.body) {
      throw new LLMError('上游没有返回流式响应体', 'anthropic');
    }

    let accumulated = '';
    let inputTokens: number | undefined;
    let outputTokens: number | undefined;

    for await (const evt of iterSse(response.body)) {
      if (!evt.data) continue;

      let data: {
        type?: string;
        delta?: { type?: string; text?: string };
        message?: { usage?: { input_tokens?: number; output_tokens?: number } };
        usage?: { output_tokens?: number };
        error?: { type?: string; message?: string };
      };
      try {
        data = JSON.parse(evt.data);
      } catch {
        continue;
      }

      if (evt.event === 'error' || data.type === 'error') {
        const msg = data.error?.message ?? 'unknown error';
        throw new LLMError(`Anthropic 错误：${msg}`, 'anthropic');
      }

      if (evt.event === 'content_block_delta' && data.delta?.type === 'text_delta') {
        const delta = data.delta.text ?? '';
        if (delta) {
          accumulated += delta;
          onToken({ delta, accumulated });
        }
      } else if (evt.event === 'message_start') {
        inputTokens = data.message?.usage?.input_tokens;
      } else if (evt.event === 'message_delta') {
        outputTokens = data.usage?.output_tokens ?? outputTokens;
      }
    }

    if (!accumulated) {
      throw new LLMError('响应 content 为空', 'anthropic');
    }

    const script = parseTopicScript(accumulated, 'anthropic');
    script.meta.generatedBy = { provider: 'anthropic', model: config.model };

    const result: GenerateResult = {
      script,
      rawResponse: accumulated,
      usage: {
        inputTokens,
        outputTokens,
      },
    };
    return result;
  },
};
