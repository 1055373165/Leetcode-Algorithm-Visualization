/**
 * 三种字体扮演三种角色：
 *   - serif  → 概念性标题、主叙事（给人"值得慢读"的信号）
 *   - sans   → UI 标签、次级说明
 *   - mono   → 代码、命令、数值（内核视角的核心字体）
 */
export const fontFamilies = {
  serif: '"Source Serif Pro", "Source Serif 4", Georgia, "Noto Serif SC", serif',
  sans: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", sans-serif',
  mono: '"JetBrains Mono", "IBM Plex Mono", Menlo, Consolas, "Courier New", monospace',
};

/**
 * 字号梯度（参考 1920x1080 画布，低分辨率需要等比缩）。
 * 命名反映用途而非大小——换主题时不需要改组件代码。
 */
export const fontSizes = {
  hero: 72,       // 视频开场的主标题
  title: 48,      // 场景标题
  heading: 32,    // 小节标题
  body: 22,       // 主叙事文字
  label: 18,      // 元素标签
  caption: 14,    // 辅助说明
  codeLarge: 24,  // 突出代码
  code: 18,       // 正常代码
  codeSmall: 14,  // 密集表格中的代码
};

export const fontWeights = {
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
};

export const lineHeights = {
  tight: 1.15,
  normal: 1.4,
  relaxed: 1.6,
};

export const letterSpacings = {
  tight: '-0.02em',
  normal: '0',
  wide: '0.04em',
  kicker: '0.08em',  // 上标题/kicker 专用
};
