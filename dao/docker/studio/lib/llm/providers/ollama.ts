import type { LLMProvider, GenerateResult } from '../types';
import { LLMError } from '../types';
import { SYSTEM_PROMPT, buildUserPrompt } from '../prompt';
import { parseTopicScript } from '../parse';

/**
 * Ollama Provider · 本地模型，通过 HTTP 调用
 *
 * 默认 endpoint 是 http://localhost:11434。
 * 支持本地跑的任意模型（例 llama3.2, qwen2.5, deepseek-coder-v2）。
 *
 * 质量预期：比 Anthropic/OpenAI 低，但离线、免费。
 */
export const ollamaProvider: LLMProvider = {
  id: 'ollama',
  async generate(topic, config) {
    const endpoint = (config.baseURL ?? 'http://localhost:11434') + '/api/chat';
    const userPrompt = buildUserPrompt(topic);

    const body = {
      model: config.model,
      stream: false,
      format: 'json', // Ollama 的 JSON 模式
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      options: {
        temperature: 0.6,
      },
    };

    let response: Response;
    try {
      response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
    } catch (e) {
      throw new LLMError(
        `无法连接 Ollama。确认 ollama serve 正在运行且端口 11434 可达。`,
        'ollama',
        e,
      );
    }

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new LLMError(
        `HTTP ${response.status}: ${errText.slice(0, 300)}`,
        'ollama',
      );
    }

    const data = (await response.json()) as {
      message?: { content?: string };
      prompt_eval_count?: number;
      eval_count?: number;
    };

    const rawText = data.message?.content ?? '';
    if (!rawText) {
      throw new LLMError('响应 message.content 为空', 'ollama', data);
    }

    const script = parseTopicScript(rawText, 'ollama');
    script.meta.generatedBy = { provider: 'ollama', model: config.model };

    const result: GenerateResult = {
      script,
      rawResponse: rawText,
      usage: {
        inputTokens: data.prompt_eval_count,
        outputTokens: data.eval_count,
      },
    };
    return result;
  },
};
