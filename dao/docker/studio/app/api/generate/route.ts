import { NextRequest, NextResponse } from 'next/server';
import { getProvider } from '@/lib/llm';
import type { ProviderConfig } from '@/lib/llm/types';
import { LLMError } from '@/lib/llm/types';
import { slugify } from '@/lib/slugify';

/**
 * POST /api/generate
 *
 * Body: { topic: string, providerConfig: ProviderConfig }
 *
 * 注意：providerConfig 里带 apiKey，从客户端发来。
 * 这不是"最安全"的做法——理想是 key 只在服务端，但 v1 为了让用户 BYOK 灵活配置，
 * 采用前端发送方式。只要流量走 https 到自己的服务器就可以接受。
 *
 * 响应：{ script: TopicScript, rawResponse: string, usage?: {...} }
 * 错误：{ error: string, provider?: string }
 */

export const runtime = 'nodejs';

type GenerateRequestBody = {
  topic?: unknown;
  providerConfig?: unknown;
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

  const provider = getProvider(providerConfig.id);

  try {
    const result = await provider.generate(topic, providerConfig);

    // 若 LLM 给的 id 不太合适（比如重复或太长），我们重新 slug 一下
    if (!result.script.id || result.script.id.length > 60) {
      result.script.id = slugify(topic);
    }

    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof LLMError) {
      return NextResponse.json(
        { error: e.message, provider: e.provider },
        { status: 502 },
      );
    }
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: `内部错误：${msg}` }, { status: 500 });
  }
}
