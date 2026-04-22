import type { TopicScript } from '../schema';

export type ProviderId = 'anthropic' | 'openai' | 'ollama' | 'nvidia';

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

/**
 * 流式回调：每次 LLM 产出一段新 token 时被 provider 调用。
 *   delta        —— 这一次新增的文本
 *   accumulated  —— 从流开始到现在累计的完整文本
 *   kind         —— 'content' = 正式答案（默认）；'reasoning' = 思考过程
 *
 * reasoning 是推理型模型（DeepSeek V3.2 / GLM / R1 系列）吐 `<thinking>`
 * 阶段流出的字段（OpenAI-compat 层 delta.reasoning_content）。我们单独
 * 回调出去是为了：
 *   1. UI 能把思考过程和最终答案分区显示（半透明 vs 主区）
 *   2. rawText 只由 content 累积构成，parse JSON 不会被 reasoning 污染
 *   3. 上游如果 thinking 阶段很久没吐 content，至少浏览器能看到思考在流
 */
export type StreamCallback = (chunk: {
  delta: string;
  accumulated: string;
  kind?: 'content' | 'reasoning';
}) => void;

export type LLMProvider = {
  id: ProviderId;
  /**
   * 以流式方式调用 LLM：
   *   - 边收上游 token 边通过 onToken 回调冒出去
   *   - 流结束后把累计文本解析成 TopicScript，返回完整 GenerateResult
   *
   * 这样做的目的是让我们的 /api/generate 可以实时写 SSE 给浏览器，
   * 避免长请求在 dev 的 HMR reload / idle timeout 下被中途掐断。
   */
  generateStream(
    topic: string,
    config: ProviderConfig,
    onToken: StreamCallback,
  ): Promise<GenerateResult>;
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
