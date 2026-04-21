/**
 * 双色板系统：
 *   - paper   → A 风格（Ciechanowski 式，暖米色，用户视角 / 外层叙事）
 *   - terminal → B 风格（内核终端视角，深色内嵌面板）
 *
 * 使用原则：
 *   外层画布用 paper，任何涉及"进入内核内部"的内嵌面板用 terminal。
 *   视觉切换 = 认知切换，观众无需文字提示即可区分用户层和内核层。
 */

export const paper = {
  // 底色
  bg: '#F4EFE6',          // 暖米色画布
  surface: '#EBE4D4',     // 次级表面（面板、卡片）
  surfaceRaised: '#FBF7EE', // 浮起元素（略亮于 bg）

  // 墨水
  ink: '#2A2620',         // 主文字
  inkSoft: '#463F36',     // 次级文字
  inkMuted: '#6B635A',    // 说明文字
  inkFaint: '#A89E90',    // 辅助标注

  // 线条与分隔
  rule: '#D8CFBE',
  ruleStrong: '#BCB09B',

  // 语义色（克制使用，每个视频场景最多亮起 2 种）
  running: '#5A7F3D',     // 正在运行（正常状态）
  blocked: '#B14A36',     // 被节流/阻塞
  accentWarm: '#C5572A',  // 强调 · 暖（主角元素）
  accentCool: '#3C6E71',  // 强调 · 冷（次要元素）
  highlight: '#E8B94A',   // 关注点高亮（闪烁用）

  // 阴影（Ciechanowski 风格，柔和偏暖）
  shadow: '0 1px 2px rgba(42, 38, 32, 0.08), 0 4px 12px rgba(42, 38, 32, 0.06)',
  shadowSoft: '0 1px 3px rgba(42, 38, 32, 0.05)',
  shadowDeep: '0 2px 4px rgba(42, 38, 32, 0.1), 0 8px 24px rgba(42, 38, 32, 0.08)',
};

export const terminal = {
  // 底色
  bg: '#13161C',          // 近黑带一丝暖意
  surface: '#1B1F28',     // 次级表面
  surfaceRaised: '#232834', // 浮起元素

  // 文字
  text: '#D6D8E0',        // 主文字
  textSoft: '#AFB3BF',    // 次级
  textMuted: '#7A7F8E',   // 说明
  textFaint: '#525765',   // 辅助

  // 线条
  rule: '#2B303C',
  ruleStrong: '#3D4352',

  // 语义色（比 paper 版本亮度高 1.2x，适应深色背景）
  running: '#7BC96F',     // 绿
  blocked: '#E5826A',     // 红
  neutral: '#7BA8E8',     // 蓝
  accentWarm: '#E58660',
  accentCool: '#6AB3B6',
  highlight: '#F0C46B',

  // 阴影（深色场景下用微弱高光，不是下沉阴影）
  glow: '0 0 0 1px rgba(120, 130, 150, 0.15)',
  glowStrong: '0 0 0 1px rgba(120, 130, 150, 0.3), 0 0 16px rgba(50, 60, 80, 0.4)',
};

/**
 * 通用工具：根据进度（0-1）在两色之间插值（简单 RGB 线性混合）。
 * 用于让色彩变化跟随动画平滑过渡，而不是硬跳变。
 */
export function mix(colorA: string, colorB: string, t: number): string {
  const ca = hexToRgb(colorA);
  const cb = hexToRgb(colorB);
  const r = Math.round(ca.r + (cb.r - ca.r) * t);
  const g = Math.round(ca.g + (cb.g - ca.g) * t);
  const b = Math.round(ca.b + (cb.b - ca.b) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  };
}
