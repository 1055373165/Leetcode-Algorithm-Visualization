/**
 * 把任意主题字符串转成 URL-safe 的 slug。
 *
 * 策略：
 *   1. 小写 + 去首尾空白
 *   2. 保留中文（放宽规则），其他非字母数字空格转 "-"
 *   3. 连续空白/短横线合并成一个短横线
 *   4. 防重复：外部调用时可以自己在末尾加随机后缀
 *
 * 例：
 *   "epoll"           → "epoll"
 *   "B+ 树"           → "b-树"
 *   "Linux 调度器"     → "linux-调度器"
 *   "TCP/IP 握手"     → "tcp-ip-握手"
 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\w\u4e00-\u9fa5\s-]/g, '-')   // 非字母/数字/中文/空格/短横线 → -
    .replace(/[\s_]+/g, '-')                    // 空白 / 下划线 → -
    .replace(/-+/g, '-')                        // 多个 - 合并
    .replace(/^-|-$/g, '')                      // 去掉首尾 -
    || 'topic';                                  // fallback
}
