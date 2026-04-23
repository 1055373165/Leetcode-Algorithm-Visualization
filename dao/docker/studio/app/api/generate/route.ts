import { NextRequest, NextResponse } from 'next/server';
import { getProvider } from '@/lib/llm';
import type { ProviderConfig } from '@/lib/llm/types';
import { LLMError } from '@/lib/llm/types';
import { slugify } from '@/lib/slugify';
import { encodeSseEvent } from '@/lib/sse';

/**
 * POST /api/generate
 *
 * Body: { topic: string, providerConfig: ProviderConfig }
 *
 * 注意：providerConfig 里带 apiKey，从客户端发来。
 * 这不是"最安全"的做法——理想是 key 只在服务端，但 v1 为了让用户 BYOK 灵活配置，
 * 采用前端发送方式。只要流量走 https 到自己的服务器就可以接受。
 *
 * 响应（流式 SSE，content-type: text/event-stream）：
 *   event: token     → { delta: string, accumulated: string }
 *   event: done      → { script, rawResponse, usage }
 *   event: error     → { error: string, provider?: string }
 *
 * 改成流式的原因：上游 LLM 有时要跑 1-3 分钟才返回完，
 * 非流式的话前端 fetch 会被 dev HMR reload / 浏览器空闲超时 / 代理 idle timeout 打断，
 * 即便后端最终返回 200，客户端也只看得到 "Failed to fetch"。
 * SSE 让连接一直有数据流动，又能顺便做打字机效果的进度反馈。
 *
 * 参数校验错误仍走普通 JSON（HTTP 4xx），避免前端还要先试着流式读再 fallback。
 */

// 切回 nodejs runtime，主要是为了 console.log 在 Next dev 下能立即 flush
// 到我们的终端（Edge runtime 有时会把日志憋到请求结束才一起打）。
// 为了防止 Node 把 SSE 响应 buffer 住，我们靠两件事：
//   1. 头一个 SSE event 后跟一个 2KB 的 :padding 注释行，强制 flush
//   2. 每 2 秒发一次 :heartbeat 注释行，保持连接活跃
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * 把 LLMError.cause 序列化成前端能安全展示的形状。
 * cause 在 parse.ts 里是 plain object（含 rawHead/rawTail/jsonHead/stage 等），
 * 但也可能是 Error（网络错）或 undefined。统一一下：
 *   - plain object → 过滤掉 undefined、长字符串截断到 1KB（避免 SSE 事件过大）
 *   - Error        → { errorMessage, stack 前 500 字 }
 *   - 其他         → { value: String(x) } 或 undefined
 */
function serializeCause(cause: unknown): Record<string, unknown> | undefined {
  if (cause == null) return undefined;
  if (cause instanceof Error) {
    return {
      errorMessage: cause.message,
      errorStack: cause.stack?.slice(0, 500),
    };
  }
  if (typeof cause !== 'object') {
    return { value: String(cause) };
  }
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(cause as Record<string, unknown>)) {
    if (v === undefined) continue;
    if (typeof v === 'string' && v.length > 1024) {
      out[k] = v.slice(0, 1024) + '…[truncated]';
    } else {
      out[k] = v;
    }
  }
  return out;
}

type GenerateRequestBody = {
  topic?: unknown;
  providerConfig?: unknown;
  /**
   * 前端渲染完占位符后的 user prompt。可选——没传的话 provider fallback 到
   * 内置 buildUserPrompt 分支，保持向后兼容。
   */
  userPrompt?: unknown;
};

export async function POST(req: NextRequest) {
  let body: GenerateRequestBody;
  try {
    body = (await req.json()) as GenerateRequestBody;
  } catch {
    return NextResponse.json({ error: '请求体不是合法 JSON' }, { status: 400 });
  }

  const topic = typeof body.topic === 'string' ? body.topic.trim() : '';
  if (!topic) {
    return NextResponse.json({ error: 'topic 不能为空' }, { status: 400 });
  }

  const providerConfig = body.providerConfig as ProviderConfig | undefined;
  if (!providerConfig || !providerConfig.id) {
    return NextResponse.json(
      { error: 'providerConfig 缺失或格式错误' },
      { status: 400 },
    );
  }

  // userPrompt 是前端渲染完占位符后的最终文本。留空合法，provider 会 fallback。
  // 做一次长度上限检查，避免被投毒塞 100MB 进来。
  const MAX_USER_PROMPT_LEN = 64 * 1024;
  let userPrompt: string | undefined;
  if (typeof body.userPrompt === 'string') {
    if (body.userPrompt.length > MAX_USER_PROMPT_LEN) {
      return NextResponse.json(
        { error: `userPrompt 过长（${body.userPrompt.length} > ${MAX_USER_PROMPT_LEN} chars）` },
        { status: 400 },
      );
    }
    userPrompt = body.userPrompt;
  }

  const provider = getProvider(providerConfig.id);
  const encoder = new TextEncoder();
  const t0 = Date.now();
  const tag = `[route ${providerConfig.id}/${providerConfig.model}]`;

  // 2KB padding 注释，绑在第一条事件后面用来强制 flush 掉
  // 代理/Node 的默认 buffer。SSE 规范里 ':' 打头的行是注释，客户端忽略。
  const INITIAL_PADDING = ':' + ' '.repeat(2048) + '\n\n';

  console.log(`${tag} POST received, topic="${topic}"`);

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      // 有时 controller 在客户端断开后被 enqueue 会抛 TypeError，包一下
      let closed = false;
      const enqueueRaw = (text: string) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(text));
        } catch {
          closed = true;
        }
      };
      const emit = (event: string, data: unknown) => {
        enqueueRaw(encodeSseEvent(event, data));
      };

      // 1. 头一条 open 事件，让浏览器立刻确认连接打开
      emit('open', { provider: providerConfig.id, model: providerConfig.model });
      // 2. 紧跟 2KB padding，冲破任何默认缓冲
      enqueueRaw(INITIAL_PADDING);

      // 3. 每 2 秒一次 ping 事件，浏览器侧能直接看到连接在活、
      //    服务端还在工作；上游不响应时心跳也能独立跳。
      //    用 event: ping 而不是 SSE 注释，这样客户端好计数展示。
      let hbCount = 0;
      const hbTimer = setInterval(() => {
        hbCount++;
        emit('ping', { seq: hbCount, elapsedMs: Date.now() - t0 });
      }, 2000);

      try {
        console.log(
          `${tag} calling provider.generateStream after ${Date.now() - t0}ms, ` +
            `userPromptLen=${userPrompt?.length ?? 'fallback'}`,
        );
        const result = await provider.generateStream(
          topic,
          providerConfig,
          (chunk) => {
            // reasoning 走独立 event，客户端展示在半透明"思考"区域；
            // content 走 token event，维持原有 UI 合同。
            if (chunk.kind === 'reasoning') {
              emit('reasoning', chunk);
            } else {
              emit('token', chunk);
            }
          },
          { userPrompt },
        );

        // 若 LLM 给的 id 不太合适（比如重复或太长），我们重新 slug 一下
        if (!result.script.id || result.script.id.length > 60) {
          result.script.id = slugify(topic);
        }

        console.log(
          `${tag} generateStream finished after ${Date.now() - t0}ms, ` +
            `rawLen=${result.rawResponse.length}`,
        );
        emit('done', result);
      } catch (e) {
        // 日志：把 LLMError 的 cause（里面有 rawHead/rawTail/jsonHead 等片段）
        // 一起打出来，这样 parse 失败可以直接看到 Kimi/DeepSeek 实际吐了什么。
        // 没有这层日志，"JSON.parse 失败" 就是一句空话，完全没法诊断。
        const elapsed = Date.now() - t0;
        if (e instanceof LLMError) {
          console.error(
            `${tag} generateStream failed after ${elapsed}ms: ${e.message}`,
            e.cause ? { cause: e.cause } : '',
          );
          // 把 cause 里的 snippet 也带给前端，前端错误面板要显示给用户
          emit('error', {
            error: e.message,
            provider: e.provider,
            details: serializeCause(e.cause),
          });
        } else {
          const msg = e instanceof Error ? e.message : String(e);
          console.error(`${tag} generateStream failed after ${elapsed}ms:`, e);
          emit('error', { error: `内部错误：${msg}` });
        }
      } finally {
        clearInterval(hbTimer);
        if (!closed) {
          try {
            controller.close();
          } catch {
            /* already closed */
          }
        }
        console.log(`${tag} stream closed after ${Date.now() - t0}ms, heartbeats=${hbCount}`);
      }
    },

    cancel() {
      console.log(`${tag} client cancelled after ${Date.now() - t0}ms`);
      // 浏览器侧取消/断开；目前就让 upstream 自行跑完——费用小、代价可接受。
      // 如果将来想省钱，给 streamOpenAiCompat 加 AbortSignal 即可。
    },
  });

  return new Response(stream, {
    headers: {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-cache, no-transform',
      connection: 'keep-alive',
      // nginx 等代理不要缓冲
      'x-accel-buffering': 'no',
    },
  });
}
