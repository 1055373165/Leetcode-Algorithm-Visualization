import type { TopicScript } from '../schema';

export type ProviderId = 'anthropic' | 'openai' | 'ollama';

export type ProviderConfig = {
  id: ProviderId;
  /** 人类可读名 */
  name: string;
  /** API key（本地 provider 可为空） */
  apiKey?: string;
  /** 模型名 */
  model: string;
  /** 自定义 endpoint，用于中转服务 / 本地 Ollama */
  baseURL?: string;
};

export type GenerateResult = {
  script: TopicScript;
  /** 原始 LLM 响应文本（用于调试） */
  rawResponse: string;
  /** 模型自报的 tokens 使用（可选） */
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
  };
};

export type LLMProvider = {
  id: ProviderId;
  generate(topic: string, config: ProviderConfig): Promise<GenerateResult>;
};

export class LLMError extends Error {
  constructor(
    message: string,
    public provider: ProviderId,
    public cause?: unknown,
  ) {
    super(message);
    this.name = 'LLMError';
  }
}
