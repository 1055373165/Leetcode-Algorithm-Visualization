import type { LLMProvider, GenerateResult } from '../types';
import { LLMError } from '../types';
import { SYSTEM_PROMPT, buildUserPrompt } from '../prompt';
import { parseTopicScript } from '../parse';

/**
 * OpenAI Provider · 使用 Chat Completions API
 *
 * 支持的模型（示例）：
 *   - gpt-4o
 *   - gpt-4o-mini
 *   - gpt-4-turbo
 *
 * 请求 JSON 模式（response_format: json_object）让 LLM 更可能输出合法 JSON。
 */
export const openaiProvider: LLMProvider = {
  id: 'openai',
  async generate(topic, config) {
    const endpoint = (config.baseURL ?? 'https://api.openai.com') + '/v1/chat/completions';
    const userPrompt = buildUserPrompt(topic);

    if (!config.apiKey) {
      throw new LLMError('OpenAI API key 未配置', 'openai');
    }

    const body = {
      model: config.model,
      max_tokens: 4096,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
    };

    let response: Response;
    try {
      response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify(body),
      });
    } catch (e) {
      throw new LLMError('网络请求失败', 'openai', e);
    }

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new LLMError(
        `HTTP ${response.status}: ${errText.slice(0, 300)}`,
        'openai',
      );
    }

    const data = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
      usage?: { prompt_tokens?: number; completion_tokens?: number };
    };

    const rawText = data.choices?.[0]?.message?.content ?? '';
    if (!rawText) {
      throw new LLMError('响应 content 为空', 'openai', data);
    }

    const script = parseTopicScript(rawText, 'openai');
    script.meta.generatedBy = { provider: 'openai', model: config.model };

    const result: GenerateResult = {
      script,
      rawResponse: rawText,
      usage: {
        inputTokens: data.usage?.prompt_tokens,
        outputTokens: data.usage?.completion_tokens,
      },
    };
    return result;
  },
};
