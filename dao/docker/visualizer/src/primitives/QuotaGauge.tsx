import React from 'react';
import { paper, fontFamilies, fontSizes, fontWeights, mix } from '../theme';
import { Mono } from './Typography';

/**
 * QuotaGauge · quota 消耗的水平进度条
 *
 * 核心视觉隐喻：像一条正在被喝掉的饮料。
 *   - 填充颜色随状态变化（running=sage green, throttled=clay red）
 *   - 到达尽头时有一层"容器边界"闪烁（提示硬限制）
 *   - 数字显示 "used / max µs" 等宽数字
 */
export const QuotaGauge: React.FC<{
  used: number;          // 已用 quota（μs）
  max: number;           // quota 上限（μs）
  throttled: boolean;    // 当前是否在 throttle 状态
  width?: number;
  height?: number;
}> = ({ used, max, throttled, width = 900, height = 80 }) => {
  const pct = Math.min(1, used / max);

  // 节流时颜色过渡到 blocked 色；平时是 running 绿
  const fillColor = throttled
    ? mix(paper.running, paper.blocked, Math.min(1, (used / max - 0.95) * 20 + 1))
    : paper.running;

  return (
    <div style={{ width }}>
      {/* 顶部标签栏 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: 10,
        }}
      >
        <span
          style={{
            fontFamily: fontFamilies.sans,
            fontSize: fontSizes.label,
            fontWeight: fontWeights.medium,
            color: paper.inkSoft,
          }}
        >
          本周期 CPU 配额
        </span>
        <span>
          <Mono size="large" color={paper.ink}>
            {formatMicroseconds(used)}
          </Mono>
          <span
            style={{
              fontFamily: fontFamilies.sans,
              fontSize: fontSizes.body,
              color: paper.inkFaint,
              margin: '0 8px',
            }}
          >
            /
          </span>
          <Mono size="large" color={paper.inkMuted}>
            {formatMicroseconds(max)}
          </Mono>
        </span>
      </div>

      {/* 条形进度 */}
      <div
        style={{
          position: 'relative',
          width,
          height,
          backgroundColor: paper.surface,
          border: `1px solid ${paper.rule}`,
          borderRadius: height / 2,
          overflow: 'hidden',
          boxShadow: `inset 0 1px 3px rgba(42, 38, 32, 0.08)`,
        }}
      >
        {/* 填充部分 */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            bottom: 0,
            width: `${pct * 100}%`,
            backgroundColor: fillColor,
            transition: 'none',
            // 边缘稍亮一点，制造"液面"感
            backgroundImage: `linear-gradient(
              180deg,
              rgba(255, 255, 255, 0.15) 0%,
              rgba(0, 0, 0, 0.05) 100%
            )`,
          }}
        />

        {/* 满格警戒线（50ms 上限处） */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            right: 0,
            width: 3,
            backgroundColor: throttled ? paper.blocked : paper.ruleStrong,
            opacity: throttled ? 0.9 : 0.4,
          }}
        />
      </div>

      {/* 底部刻度 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: 8,
          fontFamily: fontFamilies.mono,
          fontSize: fontSizes.caption,
          color: paper.inkFaint,
        }}
      >
        <span>0</span>
        <span>上限 = quota</span>
      </div>
    </div>
  );
};

function formatMicroseconds(us: number): string {
  // 用毫秒显示更直观，补零到 2 位小数
  const ms = us / 1000;
  return `${ms.toFixed(1)} ms`;
}
