import React from 'react';
import { paper, fontFamilies, fontSizes } from '../theme';

/**
 * Timeline · 多周期的时间条可视化
 *
 * 视觉模型：每个周期是一个容器（period），里面填充两种颜色：
 *   - 左侧实心绿块 = running 时长
 *   - 右侧斜纹灰块 = throttled 时长
 * 周期之间有竖线分隔，下方标 "period 1 / 2 / 3"。
 * 顶部有一个"当前位置指示器"（下箭头），指向当前时间点。
 */
export const Timeline: React.FC<{
  periods: {
    runMs: number;        // 本周期已 running 的 ms
    throttledMs: number;  // 本周期已 throttled 的 ms
    periodMs: number;     // 周期总长（通常 100）
  }[];
  currentPeriodIdx: number;   // 当前所在周期
  currentProgressInPeriod: number; // 0-1，当前周期已走过的比例
  width?: number;
  height?: number;
}> = ({
  periods,
  currentPeriodIdx,
  currentProgressInPeriod,
  width = 1200,
  height = 60,
}) => {
  const periodWidth = width / periods.length;
  const GAP = 4;  // 周期之间的视觉间隙

  // 当前指示器的绝对 x 位置
  const cursorX =
    currentPeriodIdx * periodWidth +
    currentProgressInPeriod * periodWidth;

  return (
    <div style={{ width, position: 'relative' }}>
      {/* 顶部游标 */}
      <div
        style={{
          position: 'absolute',
          top: -18,
          left: cursorX - 8,
          width: 16,
          height: 16,
          color: paper.accentWarm,
        }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16">
          <path d="M 8 16 L 0 0 L 16 0 Z" fill={paper.accentWarm} />
        </svg>
      </div>

      {/* 各周期块 */}
      <div
        style={{
          display: 'flex',
          width,
          height,
          gap: GAP,
        }}
      >
        {periods.map((p, idx) => {
          const runPct = p.runMs / p.periodMs;
          const throttledPct = p.throttledMs / p.periodMs;
          const isCurrent = idx === currentPeriodIdx;
          return (
            <div
              key={idx}
              style={{
                flex: 1,
                height: '100%',
                backgroundColor: paper.surface,
                border: `1px solid ${isCurrent ? paper.accentWarm : paper.rule}`,
                borderRadius: 6,
                position: 'relative',
                overflow: 'hidden',
                boxShadow: isCurrent ? paper.shadowSoft : 'none',
              }}
            >
              {/* running 段 */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  bottom: 0,
                  width: `${runPct * 100}%`,
                  backgroundColor: paper.running,
                }}
              />
              {/* throttled 段 */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: `${runPct * 100}%`,
                  bottom: 0,
                  width: `${throttledPct * 100}%`,
                  // 斜纹背景，语义："这段时间本来可以用但被强制停了"
                  backgroundImage: `repeating-linear-gradient(
                    45deg,
                    ${paper.blocked},
                    ${paper.blocked} 4px,
                    ${paper.surface} 4px,
                    ${paper.surface} 8px
                  )`,
                  opacity: 0.85,
                }}
              />
            </div>
          );
        })}
      </div>

      {/* 周期标签 */}
      <div
        style={{
          display: 'flex',
          width,
          gap: GAP,
          marginTop: 10,
        }}
      >
        {periods.map((_, idx) => (
          <div
            key={idx}
            style={{
              flex: 1,
              textAlign: 'center',
              fontFamily: fontFamilies.mono,
              fontSize: fontSizes.caption,
              color: idx === currentPeriodIdx ? paper.ink : paper.inkFaint,
              fontWeight: idx === currentPeriodIdx ? 600 : 400,
            }}
          >
            period {idx + 1}  ·  100ms
          </div>
        ))}
      </div>
    </div>
  );
};
