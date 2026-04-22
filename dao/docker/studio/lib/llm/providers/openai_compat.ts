import type { ProviderId, StreamCallback } from '../types';
import { LLMError } from '../types';
import { iterSse } from '../../sse';

/**
 * 消费一个 OpenAI-兼容的 Chat Completions 流式响应。
 *
 * 兼容该协议的 provider：OpenAI、NVIDIA、DeepSeek、Together、Groq 等等。
 * 协议要点：
 *   - 请求里 stream: true
 *   - 响应是 text/event-stream
 *   - 每个 SSE 事件 data 是一个 JSON chunk：
 *       { choices: [{ delta: { content?: string } }], usage?: {...} }
 *   - 流结束会收到一条 data: [DONE]
 *
 * 函数内负责：
 *   - 发 HTTP 请求（带 Bearer 鉴权，如果 apiKey 非空）
 *   - 解析 SSE、按 delta 累积纯文本
 *   - 每来一段 delta 就回调 onToken({ delta, accumulated })
 *   - 流结束后返回最终 rawText 和 usage
 */
export async function streamOpenAiCompat(args: {
  provider: ProviderId;
  endpoint: string;
  apiKey?: string;
  body: Record<string, unknown>;
  onToken: StreamCallback;
  extraHeaders?: Record<string, string>;
}): Promise<{
  rawText: string;
  usage?: { prompt_tokens?: number; completion_tokens?: number };
}> {
  const { provider, endpoint, apiKey, body, onToken, extraHeaders } = args;

  const headers: Record<string, string> = {
    'content-type': 'application/json',
    accept: 'text/event-stream',
    ...extraHeaders,
  };
  if (apiKey) headers['authorization'] = `Bearer ${apiKey}`;

  const fetchStart = Date.now();
  console.log(
    `[${provider}] fetch start endpoint=${endpoint} body.stream=${String(body.stream)}`,
  );

  // 上游挂死保护：60s 拿不到 response headers 就 abort + 抛错。
  // 真实场景下健康的推理请求首字在几百 ms ~ 几秒之间，60s 不回 header
  // 一定不是"慢"，是"死"（之前 deepseek-v3.2 在 NIM 就是这种黑洞）。
  // 拿到 headers 后就 clear 这个 timer —— 后续流式 token 可以慢慢吐，不受此限。
  const HEADERS_TIMEOUT_MS = 60_000;
  const ac = new AbortController();
  const headersDeadline = setTimeout(() => {
    console.warn(
      `[${provider}] upstream没在 ${HEADERS_TIMEOUT_MS}ms 内返回 response headers，abort`,
    );
    ac.abort();
  }, HEADERS_TIMEOUT_MS);

  // 还没拿到 headers 之前，每 10s 打一条"still waiting"日志，
  // 方便开发时判断是彻底死了还是只是慢。拿到 headers 就关。
  const waitingTimer = setInterval(() => {
    console.log(
      `[${provider}] still waiting upstream headers, elapsed=${Date.now() - fetchStart}ms`,
    );
  }, 10_000);

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: ac.signal,
    });
  } catch (e) {
    clearTimeout(headersDeadline);
    clearInterval(waitingTimer);
    if (ac.signal.aborted) {
      throw new LLMError(
        `上游 ${HEADERS_TIMEOUT_MS / 1000}s 内没返回任何响应头（可能模型已下线或走了黑洞）。` +
          `检查 provider 模型名是否有效，或换一个模型。endpoint=${endpoint}`,
        provider,
        e,
      );
    }
    throw new LLMError('网络请求失败', provider, e);
  }
  clearTimeout(headersDeadline);
  clearInterval(waitingTimer);

  console.log(
    `[${provider}] fetch headers back after ${Date.now() - fetchStart}ms status=${response.status}`,
  );

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new LLMError(
      `HTTP ${response.status}: ${errText.slice(0, 300)}`,
      provider,
    );
  }

  if (!response.body) {
    throw new LLMError('上游没有返回流式响应体', provider);
  }

  // 调试钩子：看看上游到底有没有按流式吐。
  // 如果 content-type 不是 text/event-stream，说明上游忽略了 stream:true，
  // 或者模型不支持流式——我们会在下面抛一个描述性错误。
  const upstreamCt = response.headers.get('content-type') ?? '';
  console.log(
    `[${provider}] upstream status=${response.status} content-type=${upstreamCt}`,
  );

  if (!upstreamCt.includes('text/event-stream')) {
    // 上游没按流式回，说明请求参数没被接受（常见原因：
    // 模型不支持 stream+response_format 组合）。
    // 把上游响应原样读完，给出明确错误。
    const fallbackText = await response.text().catch(() => '');
    throw new LLMError(
      `上游没有用 text/event-stream 响应（content-type=${upstreamCt}）。` +
        `可能是模型不支持流式或者 response_format:json_object 的组合。` +
        `前 300 字：${fallbackText.slice(0, 300)}`,
      provider,
    );
  }

  // content 走的是正式答案（会累积成 rawText，给 parse JSON 用）
  // reasoning 走的是思考过程（只回调给前端展示，不进 rawText）
  // 分别累积是为了：
  //   - 前端可以各发各的 SSE 事件
  //   - 如果 reasoning 把 JSON 片段写进去，我们不会把它误当成最终结果
  let contentAccum = '';
  let reasoningAccum = '';
  let contentCount = 0;
  let reasoningCount = 0;
  let usage: { prompt_tokens?: number; completion_tokens?: number } | undefined;
  const startedAt = Date.now();
  let firstAt = 0;

  for await (const evt of iterSse(response.body)) {
    const data = evt.data;
    if (!data || data === '[DONE]') continue;

    let chunk: {
      choices?: {
        delta?: { content?: string; reasoning_content?: string };
        finish_reason?: string;
      }[];
      usage?: { prompt_tokens?: number; completion_tokens?: number };
    };
    try {
      chunk = JSON.parse(data);
    } catch {
      // 某些 provider 会在 keepalive 行发非 JSON（例如 ": ping"），跳过
      continue;
    }

    const delta = chunk.choices?.[0]?.delta;
    const contentDelta = delta?.content ?? '';
    const reasoningDelta = delta?.reasoning_content ?? '';

    if (reasoningDelta) {
      if (firstAt === 0) {
        firstAt = Date.now();
        console.log(
          `[${provider}] first REASONING token after ${firstAt - startedAt}ms, sample=${JSON.stringify(reasoningDelta.slice(0, 60))}`,
        );
      }
      reasoningAccum += reasoningDelta;
      reasoningCount++;
      onToken({
        delta: reasoningDelta,
        accumulated: reasoningAccum,
        kind: 'reasoning',
      });
    }

    if (contentDelta) {
      if (firstAt === 0) {
        firstAt = Date.now();
        console.log(
          `[${provider}] first CONTENT token after ${firstAt - startedAt}ms, sample=${JSON.stringify(contentDelta.slice(0, 60))}`,
        );
      } else if (contentCount === 0) {
        // 从 reasoning 切到 content 的关键时刻，单独标记
        console.log(
          `[${provider}] reasoning→content switch after ${Date.now() - startedAt}ms (reasoning chars=${reasoningAccum.length})`,
        );
      }
      contentAccum += contentDelta;
      contentCount++;
      onToken({
        delta: contentDelta,
        accumulated: contentAccum,
        kind: 'content',
      });
    }

    if (chunk.usage) usage = chunk.usage;
  }

  console.log(
    `[${provider}] stream done: content=${contentCount}ck/${contentAccum.length}ch, ` +
      `reasoning=${reasoningCount}ck/${reasoningAccum.length}ch, total ${Date.now() - startedAt}ms`,
  );

  if (!contentAccum) {
    // 有时候模型只吐 reasoning 就结束（很罕见，通常是 max_tokens 被 thinking 耗光）。
    // 给出具体的描述性错误，方便排查。
    const hint = reasoningAccum
      ? `模型只产出了 reasoning（${reasoningAccum.length} 字），没有给出正式答案。可能是 max_tokens 太小被 thinking 耗光，或模型被提示词绕进死胡同。`
      : `流读完了但 content / reasoning_content 都是空的。`;
    throw new LLMError(hint, provider);
  }

  return { rawText: contentAccum, usage };
}
