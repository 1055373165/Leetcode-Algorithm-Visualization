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
    throw new LLMError('LLM 响应里找不到有效 JSON', provider, {
      stage: 'extract',
      rawLen: rawText.length,
      rawHead: rawText.slice(0, 400),
      rawTail: rawText.slice(-400),
    });
  }

  let parsed: unknown;
  let recovered = false;
  try {
    parsed = JSON.parse(json);
  } catch (firstErr) {
    // 最常见的 LLM JSON 污染：trailing comma（对象/数组末尾多一个逗号）。
    // 见过 Kimi/GPT/Claude 都生成过这种 `{"a":1,}` 或 `["x","y",]`。
    // 再加一遍 // 和 /* */ 注释的清理，这三个是 95% 的案例。
    const cleaned = sanitizeJson(json);
    if (cleaned !== json) {
      try {
        parsed = JSON.parse(cleaned);
        recovered = true;
        console.warn(
          `[parse] 首次 JSON.parse 失败，sanitize 后恢复成功（${firstErr instanceof Error ? firstErr.message : firstErr}）`,
        );
      } catch {
        /* sanitize 也没救回来，进下面统一报错路径 */
      }
    }
    if (!recovered) {
      // 报错位置附近的上下文——比只给 head/tail 有用得多，
      // 直接指向罪魁祸首字符。position 从错误信息 "at position N" 抓。
      const pos = extractErrorPosition(firstErr);
      const errorContext =
        pos != null
          ? buildContextAround(json, pos, 120)
          : undefined;
      throw new LLMError('JSON.parse 失败', provider, {
        stage: 'json-parse',
        parseError: firstErr instanceof Error ? firstErr.message : String(firstErr),
        jsonLen: json.length,
        jsonHead: json.slice(0, 400),
        jsonTail: json.slice(-400),
        rawLen: rawText.length,
        rawHead: rawText.slice(0, 400),
        errorContext,
      });
    }
  }

  const validated = validateAsTopicScript(parsed, provider);
  return validated;
}

/**
 * 从 LLM 文本里抽出 JSON 对象。
 *
 * 历史上这里用过正则 `\{[\s\S]*?\}`（非贪婪），但对我们的 schema 不行——
 * scenes 里套 payload 里再套对象数组，深度轻松到 5 层。非贪婪匹配到**第一个**
 * `}` 就截断，拿到的是半截 JSON，JSON.parse 必然炸。
 *
 * 正确做法是**括号平衡扫描**：
 *   - 识别并跳过字符串字面量（字符串里的 `{}` 不算数）
 *   - 处理字符串里的 `\"` 转义
 *   - 找到顶层 `{` 对应的 `}`，中间是完整对象
 *
 * 三种常见污染一次性搞定：
 *   1. 纯 JSON                             → 整体平衡扫描直接命中
 *   2. ```json\n{...}\n```                 → 跳过围栏，扫到第一个 `{` 起
 *   3. "好的，给你：\n{...}\n希望有用"    → 同上
 */
function extractJson(text: string): string | null {
  // 先把常见的 markdown 代码围栏剥掉（如果有）。保留 fence 里的原文。
  // 匹配到 fence 就以 fence 里的内容为搜索范围；否则用整段。
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const scope = fenceMatch ? fenceMatch[1] : text;

  const start = scope.indexOf('{');
  if (start < 0) return null;

  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = start; i < scope.length; i++) {
    const ch = scope[i];

    if (escape) {
      escape = false;
      continue;
    }

    if (inString) {
      if (ch === '\\') escape = true;
      else if (ch === '"') inString = false;
      continue;
    }

    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) {
        return scope.slice(start, i + 1);
      }
    }
  }

  // 括号没闭合——常见原因是 max_tokens 被吃光 / 流被中途 abort。
  // 返回 null 让上层给出可观测的错误。
  return null;
}

/**
 * 尽力修复 LLM 吐出的 JSON 里的常见污染：
 *   - 尾随逗号：`{"a":1,}` / `["x",]`（最常见，Kimi/GPT/Claude 都有）
 *   - `//` 单行注释
 *   - `/* ... *\/` 多行注释
 *
 * 所有字符串字面量（双引号内）不动——必须做到和 JSON.parse 一样的
 * 字符串感知，否则会误伤正文内容。例如 `"s": "hi, // not a comment"`
 * 不能被当注释处理掉。
 */
function sanitizeJson(src: string): string {
  let out = '';
  let i = 0;
  const n = src.length;
  while (i < n) {
    const ch = src[i];

    // 字符串字面量：原样拷贝到结束引号
    if (ch === '"') {
      const start = i;
      i++;
      while (i < n) {
        const c = src[i];
        if (c === '\\') {
          i += 2;
          continue;
        }
        if (c === '"') {
          i++;
          break;
        }
        i++;
      }
      out += src.slice(start, i);
      continue;
    }

    // // 单行注释 → 跳到行尾
    if (ch === '/' && src[i + 1] === '/') {
      i += 2;
      while (i < n && src[i] !== '\n') i++;
      continue;
    }
    // /* ... */ 多行注释 → 跳到 */ 之后
    if (ch === '/' && src[i + 1] === '*') {
      i += 2;
      while (i < n && !(src[i] === '*' && src[i + 1] === '/')) i++;
      i += 2;
      continue;
    }

    // 尾随逗号：当前是 `,`，后面（跳过空白）是 `}` 或 `]` → 丢掉这个逗号
    if (ch === ',') {
      let j = i + 1;
      while (j < n && /\s/.test(src[j])) j++;
      if (src[j] === '}' || src[j] === ']') {
        i++; // 吃掉逗号
        continue;
      }
    }

    out += ch;
    i++;
  }
  return out;
}

/**
 * 从 JSON.parse 抛出的 SyntaxError 里抓字符偏移量。
 * V8/Node 的报错格式是 "... at position N (line X column Y)"。
 */
function extractErrorPosition(err: unknown): number | null {
  if (!(err instanceof Error)) return null;
  const m = err.message.match(/position\s+(\d+)/);
  return m ? Number(m[1]) : null;
}

/**
 * 构造 position 附近的上下文字符串，用插入符号标记出罪魁祸首字符。
 * 返回形如：
 *   ...上文...→X←...下文...  (line Y col Z)
 * 方便一眼看到是什么字符惹事。
 */
function buildContextAround(
  text: string,
  pos: number,
  radius: number,
): string {
  const from = Math.max(0, pos - radius);
  const to = Math.min(text.length, pos + radius);
  const before = text.slice(from, pos);
  const at = text[pos] ?? '<EOF>';
  const after = text.slice(pos + 1, to);
  // 用 ▶CHAR◀ 标记目标字符；空白字符可视化
  const visible = (s: string) =>
    s.replace(/\n/g, '↵').replace(/\t/g, '⇥');
  return `${from > 0 ? '…' : ''}${visible(before)}▶${visible(at)}◀${visible(after)}${to < text.length ? '…' : ''}`;
}

/**
 * 每种 scene 类型的必填数组字段。
 *
 * 必须和 visualizer/src/schema/types.ts 对齐——渲染层会裸调
 * `scene.X.length` / `scene.X.map(...)`，漏一个字段就会在渲染时炸出
 * 难定位的 `Cannot read properties of undefined (reading 'length')`。
 *
 * counterfactual / insight 没有必填数组（只有字符串字段），不用管。
 */
const REQUIRED_SCENE_ARRAYS: Record<string, readonly string[]> = {
  timeline: ['segments'],
  data_structure: ['nodes', 'edges'],
  decision_flow: ['nodes'],
  gauge: ['thresholds', 'trajectory'],
  layered_stack: ['layers'],
  kernel_journey: ['steps'],
};

/**
 * 按 scene.type 查必填数组表，逐个字段校验存在且非空。
 * 对 counterfactual / insight 这种没必填数组的 type，表里查不到就跳过。
 */
function validateSceneRequiredArrays(
  s: Record<string, unknown>,
  idx: number,
  provider: ProviderId,
): void {
  const type = s.type as string;
  const requiredFields = REQUIRED_SCENE_ARRAYS[type];
  if (!requiredFields) return;

  for (const field of requiredFields) {
    const val = s[field];
    if (!Array.isArray(val)) {
      throw new LLMError(
        `scene[${idx}] (type=${type}) 缺字段 "${field}" 或不是数组（实际：${val === undefined ? 'undefined' : typeof val}）`,
        provider,
        {
          stage: 'scene-validate',
          sceneIndex: idx,
          sceneType: type,
          missingField: field,
        },
      );
    }
    if (val.length === 0) {
      throw new LLMError(
        `scene[${idx}] (type=${type}) 的 "${field}" 是空数组——LLM 生成的场景没有有效内容`,
        provider,
        {
          stage: 'scene-validate',
          sceneIndex: idx,
          sceneType: type,
          missingField: field,
        },
      );
    }
  }
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
    // 按 type 校验必填数组——LLM 经常漏 data_structure 的 edges、
    // timeline 的 segments 等，之前只查 type+duration，漏的字段就这么
    // 溜到渲染层，炸出一个 "Cannot read properties of undefined (reading 'length')"
    // 的神秘错误。现在在 parse 阶段就拦下来，报错能直接指向漏的字段。
    validateSceneRequiredArrays(s, i, provider);
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
