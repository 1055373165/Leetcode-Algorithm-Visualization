import type { LLMProvider, GenerateResult } from '../types';
import { LLMError } from '../types';
import { SYSTEM_PROMPT, buildUserPrompt } from '../prompt';
import { parseTopicScript } from '../parse';
import { iterLines } from '../../sse';

/**
 * Ollama Provider · 本地模型，通过 HTTP 调用（流式 NDJSON）
 *
 * 默认 endpoint 是 http://localhost:11434。
 * 支持本地跑的任意模型（例 llama3.2, qwen2.5, deepseek-coder-v2）。
 *
 * Ollama 的流式格式：每行一条 JSON：
 *   { "message": { "content": "<chunk>" }, "done": false }
 *   ...
 *   { "done": true, "prompt_eval_count": N, "eval_count": M }
 *
 * 质量预期：比 Anthropic/OpenAI 低，但离线、免费。
 */
export const ollamaProvider: LLMProvider = {
  id: 'ollama',
  async generateStream(topic, config, onToken, options) {
    const endpoint = (config.baseURL ?? 'http://localhost:11434') + '/api/chat';
    const userPrompt = options?.userPrompt ?? buildUserPrompt(topic);

    const body = {
      model: config.model,
      stream: true,
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

    if (!response.body) {
      throw new LLMError('Ollama 没有返回流式响应体', 'ollama');
    }

    let accumulated = '';
    let promptEvalCount: number | undefined;
    let evalCount: number | undefined;

    for await (const line of iterLines(response.body)) {
      let chunk: {
        message?: { content?: string };
        done?: boolean;
        prompt_eval_count?: number;
        eval_count?: number;
        error?: string;
      };
      try {
        chunk = JSON.parse(line);
      } catch {
        continue;
      }

      if (chunk.error) {
        throw new LLMError(`Ollama 错误：${chunk.error}`, 'ollama');
      }

      const delta = chunk.message?.content ?? '';
      if (delta) {
        accumulated += delta;
        onToken({ delta, accumulated });
      }
      if (chunk.done) {
        promptEvalCount = chunk.prompt_eval_count;
        evalCount = chunk.eval_count;
      }
    }

    if (!accumulated) {
      throw new LLMError('响应 message.content 为空', 'ollama');
    }

    const script = parseTopicScript(accumulated, 'ollama');
    script.meta.generatedBy = { provider: 'ollama', model: config.model };

    const result: GenerateResult = {
      script,
      rawResponse: accumulated,
      usage: {
        inputTokens: promptEvalCount,
        outputTokens: evalCount,
      },
    };
    return result;
  },
};
