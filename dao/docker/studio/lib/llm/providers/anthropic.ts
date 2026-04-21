import type { LLMProvider, ProviderConfig, GenerateResult } from '../types';
import { LLMError } from '../types';
import { SYSTEM_PROMPT, buildUserPrompt } from '../prompt';
import { parseTopicScript } from '../parse';

/**
 * Anthropic Claude Provider · 使用 Messages API
 *
 * 支持的模型（示例）：
 *   - claude-3-5-sonnet-20241022
 *   - claude-3-5-haiku-20241022
 *   - claude-3-opus-20240229
 *
 * 用 fetch 直接调用而非 SDK，避免 SDK 版本锁带来的困扰。
 */
export const anthropicProvider: LLMProvider = {
  id: 'anthropic',
  async generate(topic, config) {
    const endpoint = (config.baseURL ?? 'https://api.anthropic.com') + '/v1/messages';
    const userPrompt = buildUserPrompt(topic);

    if (!config.apiKey) {
      throw new LLMError('Anthropic API key 未配置', 'anthropic');
    }

    const body = {
      model: config.model,
      max_tokens: 4096,
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

    const data = (await response.json()) as {
      content?: { type: string; text: string }[];
      usage?: { input_tokens?: number; output_tokens?: number };
    };

    const rawText =
      data.content
        ?.filter((c) => c.type === 'text')
        .map((c) => c.text)
        .join('\n') ?? '';

    if (!rawText) {
      throw new LLMError('响应 content 为空', 'anthropic', data);
    }

    const script = parseTopicScript(rawText, 'anthropic');
    script.meta.generatedBy = { provider: 'anthropic', model: config.model };

    const result: GenerateResult = {
      script,
      rawResponse: rawText,
      usage: {
        inputTokens: data.usage?.input_tokens,
        outputTokens: data.usage?.output_tokens,
      },
    };
    return result;
  },
};
