import type { TopicScript } from '../schema';
import { LLMError, type ProviderId } from './types';

/**
 * 把 LLM 的原始文本响应解析并验证为 TopicScript。
 *
 * LLM 经常会"不老实"：
 *   - 在 JSON 外面包一层 markdown 代码块
 *   - 加几句解释性前言
 *   - 偶尔最后多一个逗号
 *
 * 这个函数负责把这些"污染"清理掉，拿到纯 JSON，再做基础校验。
 */
export function parseTopicScript(
  rawText: string,
  provider: ProviderId,
): TopicScript {
  const json = extractJson(rawText);
  if (!json) {
    throw new LLMError(
      'LLM 响应里找不到有效 JSON',
      provider,
      { rawText: rawText.slice(0, 500) },
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch (e) {
    throw new LLMError('JSON.parse 失败', provider, { json: json.slice(0, 500) });
  }

  const validated = validateAsTopicScript(parsed, provider);
  return validated;
}

/**
 * 从文本中抽取 JSON 对象。处理三种常见情况：
 *   1. 整个 text 就是 JSON → 直接用
 *   2. 被 ```json ... ``` 包裹 → 去掉围栏
 *   3. 前后有解释文字 → 找第一个 { 和最后一个 } 之间的内容
 */
function extractJson(text: string): string | null {
  const trimmed = text.trim();

  // Case 1: 整个 text 就是 JSON
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    return trimmed;
  }

  // Case 2: ```json ... ``` 代码块
  const codeBlockMatch = trimmed.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1];
  }

  // Case 3: 找第一个 { 和最后一个 }
  const first = trimmed.indexOf('{');
  const last = trimmed.lastIndexOf('}');
  if (first >= 0 && last > first) {
    return trimmed.slice(first, last + 1);
  }

  return null;
}

/**
 * 最小化的结构校验——不追求完整的 schema 验证（那交给 zod 另写），
 * 只拦截明显破损的输出。
 */
function validateAsTopicScript(obj: unknown, provider: ProviderId): TopicScript {
  if (!obj || typeof obj !== 'object') {
    throw new LLMError('响应不是对象', provider);
  }
  const o = obj as Record<string, unknown>;

  const required: (keyof TopicScript)[] = ['id', 'topic', 'title', 'scenes'];
  for (const key of required) {
    if (!(key in o)) {
      throw new LLMError(`缺字段 ${String(key)}`, provider);
    }
  }

  if (!Array.isArray(o.scenes)) {
    throw new LLMError('scenes 必须是数组', provider);
  }

  if (o.scenes.length === 0) {
    throw new LLMError('scenes 不能为空', provider);
  }

  // 为每个 scene 补上 type 检查
  const validTypes = new Set([
    'counterfactual',
    'timeline',
    'data_structure',
    'decision_flow',
    'gauge',
    'layered_stack',
    'kernel_journey',
    'insight',
  ]);

  for (let i = 0; i < o.scenes.length; i++) {
    const s = o.scenes[i] as Record<string, unknown>;
    if (!s.type || !validTypes.has(s.type as string)) {
      throw new LLMError(`scene[${i}] 的 type 非法：${s.type}`, provider);
    }
    if (typeof s.duration !== 'number' || s.duration <= 0) {
      throw new LLMError(`scene[${i}] 的 duration 必须是正数`, provider);
    }
  }

  // 补上 meta，如果 LLM 忘了加
  if (!o.meta || typeof o.meta !== 'object') {
    o.meta = { createdAt: new Date().toISOString(), schemaVersion: 1 };
  } else {
    const meta = o.meta as Record<string, unknown>;
    if (!meta.createdAt) meta.createdAt = new Date().toISOString();
    if (!meta.schemaVersion) meta.schemaVersion = 1;
  }

  return o as unknown as TopicScript;
}
