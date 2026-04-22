/**
 * 轻量级 Server-Sent Events / NDJSON 流解析工具
 *
 * 只依赖 Web Streams（ReadableStream, TextDecoder），浏览器和 Node 18+ 都能用。
 * 服务端 provider 用这里的 iterator 消费上游 LLM 的流式响应；
 * 浏览器端用同一套 iterator 消费我们自己 /api/generate 发回的 SSE。
 */

export type SseEvent = {
  /** event 字段；没有时为 undefined（对应 SSE 规范里的 "message" 默认事件） */
  event?: string;
  /** data 字段拼接后的字符串；SSE 允许多行 data，用 \n 合并 */
  data: string;
  /** id 字段（可选） */
  id?: string;
};

/**
 * 把一个 ReadableStream<Uint8Array> 解析成 SSE 事件流。
 *
 * SSE 规范要点：
 *   - 事件之间用空行（\n\n 或 \r\n\r\n）分隔
 *   - 每行以 `field:value` 形式出现；忽略注释行（冒号开头）
 *   - 多个 data: 行拼接成一段、用 \n 连接
 */
export async function* iterSse(
  body: ReadableStream<Uint8Array>,
): AsyncGenerator<SseEvent, void, unknown> {
  const reader = body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // 同时兼容 \n\n 和 \r\n\r\n
      let sepIdx: number;
      while ((sepIdx = findBoundary(buffer)) >= 0) {
        const raw = buffer.slice(0, sepIdx.valueOf());
        const boundaryLen = boundaryLength(buffer, sepIdx);
        buffer = buffer.slice(sepIdx + boundaryLen);
        const evt = parseSseBlock(raw);
        if (evt) yield evt;
      }
    }
    // 流结束时可能还有最后一块没有双换行的残余
    const tail = buffer.trim();
    if (tail) {
      const evt = parseSseBlock(tail);
      if (evt) yield evt;
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * 把一个 ReadableStream<Uint8Array> 按行切开（NDJSON 场景）。
 * 空行会被过滤。
 */
export async function* iterLines(
  body: ReadableStream<Uint8Array>,
): AsyncGenerator<string, void, unknown> {
  const reader = body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let nl: number;
      while ((nl = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, nl).replace(/\r$/, '');
        buffer = buffer.slice(nl + 1);
        if (line.length > 0) yield line;
      }
    }
    const tail = buffer.trim();
    if (tail) yield tail;
  } finally {
    reader.releaseLock();
  }
}

function findBoundary(buf: string): number {
  const a = buf.indexOf('\n\n');
  const b = buf.indexOf('\r\n\r\n');
  if (a < 0) return b;
  if (b < 0) return a;
  return Math.min(a, b);
}

function boundaryLength(buf: string, idx: number): number {
  return buf.startsWith('\r\n\r\n', idx) ? 4 : 2;
}

function parseSseBlock(block: string): SseEvent | null {
  if (!block) return null;
  let event: string | undefined;
  let id: string | undefined;
  const dataLines: string[] = [];

  for (const rawLine of block.split(/\r?\n/)) {
    if (!rawLine || rawLine.startsWith(':')) continue; // 空行已被切掉；冒号开头是注释
    const colon = rawLine.indexOf(':');
    const field = colon < 0 ? rawLine : rawLine.slice(0, colon);
    // SSE 规范：value 前可以有一个空格，去掉它
    let value = colon < 0 ? '' : rawLine.slice(colon + 1);
    if (value.startsWith(' ')) value = value.slice(1);

    switch (field) {
      case 'event':
        event = value;
        break;
      case 'data':
        dataLines.push(value);
        break;
      case 'id':
        id = value;
        break;
      // retry 我们不用，忽略
    }
  }

  if (dataLines.length === 0 && !event) return null;
  return { event, data: dataLines.join('\n'), id };
}

/**
 * SSE 序列化：给服务端写 SSE 时用。
 * event 可省略，data 可以是字符串或会被 JSON.stringify 的对象。
 */
export function encodeSseEvent(event: string | undefined, data: unknown): string {
  const dataStr =
    typeof data === 'string' ? data : JSON.stringify(data);
  const prefix = event ? `event: ${event}\n` : '';
  // data 可能含 \n，需要按行拆分（SSE 规范要求）
  const dataLines = dataStr.split('\n').map((l) => `data: ${l}`).join('\n');
  return `${prefix}${dataLines}\n\n`;
}
