import React from 'react';
import { interpolate } from 'remotion';
import { Kicker, Title, Panel, Mono } from '../primitives';
import { paper, fontFamilies, fontSizes, fontWeights } from '../theme';
import type { GaugeScene as GaugeSceneSchema, GaugeThreshold } from '../schema';
import { ScenePlaybackProps, phases } from './common';

const THRESHOLD_COLORS: Record<GaugeThreshold['tone'], string> = {
  safe: paper.running,
  warning: paper.highlight,
  danger: paper.blocked,
};

/**
 * GaugeScene · 阈值压力表
 *
 * 视觉：一个立式的圆柱（或高瓶状）压力表，底部为 0，顶部为 max。
 * 阈值线横切柱体，把柱体分成不同颜色的带。
 * 当前值随 trajectory 动态升高，指针（一个三角形）指向当前高度。
 * 跨过阈值线时，该线短暂高亮。
 */
export const GaugeScene: React.FC<
  ScenePlaybackProps & { scene: GaugeSceneSchema }
> = ({ scene, progress }) => {
  const { entering } = phases(progress);

  // 计算当前值：根据 trajectory，用 progress 定位到虚拟秒数
  // 假设 trajectory 的最后一个点对应 progress=1
  const lastSecond = scene.trajectory[scene.trajectory.length - 1]?.atSecond ?? 1;
  const currentVirtualSec = progress * lastSecond;
  const currentValue = interpolateTrajectory(scene.trajectory, currentVirtualSec);
  const currentPct = Math.min(1, currentValue / scene.max);

  const BAR_HEIGHT = 600;
  const BAR_WIDTH = 160;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        padding: 120,
        display: 'flex',
        alignItems: 'center',
        gap: 80,
        opacity: entering,
      }}
    >
      {/* 左侧：标题 + 当前值 + 阈值说明 */}
      <div style={{ flex: 1.2 }}>
        {scene.kicker && <Kicker style={{ marginBottom: 12 }}>{scene.kicker}</Kicker>}
        {scene.heading && <Title style={{ marginBottom: 40 }}>{scene.heading}</Title>}

        <Panel kicker="CURRENT" style={{ marginBottom: 32, maxWidth: 520 }} raised>
          <div style={{ fontFamily: fontFamilies.mono, fontSize: 72, fontWeight: fontWeights.bold, color: paper.ink }}>
            {currentValue.toFixed(1)}
            <span style={{ fontSize: 32, color: paper.inkMuted, marginLeft: 12 }}>
              {scene.unit}
            </span>
          </div>
          <div style={{ fontFamily: fontFamilies.sans, fontSize: fontSizes.caption, color: paper.inkMuted, marginTop: 4 }}>
            最大 <Mono size="small">{scene.max} {scene.unit}</Mono>
          </div>
        </Panel>

        {/* 阈值列表 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 520 }}>
          {scene.thresholds.map((t) => {
            const crossed = currentValue >= t.value;
            return (
              <div
                key={t.label}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 16px',
                  borderRadius: 8,
                  backgroundColor: crossed ? `${THRESHOLD_COLORS[t.tone]}22` : 'transparent',
                  border: `1px solid ${crossed ? THRESHOLD_COLORS[t.tone] : paper.rule}`,
                  fontFamily: fontFamilies.sans,
                  fontSize: fontSizes.label,
                  color: crossed ? THRESHOLD_COLORS[t.tone] : paper.inkSoft,
                  fontWeight: crossed ? fontWeights.semibold : fontWeights.regular,
                }}
              >
                <span>{t.label}</span>
                <Mono size="small" color="inherit">
                  {t.value} {scene.unit}
                </Mono>
              </div>
            );
          })}
        </div>
      </div>

      {/* 右侧：立式压力表 */}
      <div style={{ position: 'relative', height: BAR_HEIGHT, width: BAR_WIDTH + 120 }}>
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: BAR_WIDTH,
            height: BAR_HEIGHT,
            border: `2px solid ${paper.ruleStrong}`,
            borderRadius: BAR_WIDTH / 2,
            backgroundColor: paper.surface,
            overflow: 'hidden',
            boxShadow: `inset 0 2px 6px rgba(42, 38, 32, 0.08)`,
          }}
        >
          {/* 当前填充 */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: `${currentPct * 100}%`,
              backgroundImage: `linear-gradient(
                180deg,
                ${getTopColor(currentValue, scene.thresholds)} 0%,
                ${paper.running} 100%
              )`,
              transition: 'none',
            }}
          />

          {/* 阈值横线 */}
          {scene.thresholds.map((t) => (
            <div
              key={t.label}
              style={{
                position: 'absolute',
                bottom: `${(t.value / scene.max) * 100}%`,
                left: 0,
                right: 0,
                height: 2,
                backgroundColor: THRESHOLD_COLORS[t.tone],
                boxShadow: `0 0 8px ${THRESHOLD_COLORS[t.tone]}`,
              }}
            />
          ))}
        </div>

        {/* 阈值标签（右侧） */}
        {scene.thresholds.map((t) => (
          <div
            key={`lbl-${t.label}`}
            style={{
              position: 'absolute',
              bottom: `${(t.value / scene.max) * 100}%`,
              left: BAR_WIDTH + 16,
              transform: 'translateY(50%)',
              fontFamily: fontFamilies.mono,
              fontSize: fontSizes.caption,
              color: THRESHOLD_COLORS[t.tone],
              fontWeight: fontWeights.semibold,
              whiteSpace: 'nowrap',
            }}
          >
            {t.label}
          </div>
        ))}
      </div>
    </div>
  );
};

function interpolateTrajectory(
  trajectory: { atSecond: number; value: number }[],
  t: number,
): number {
  if (trajectory.length === 0) return 0;
  if (t <= trajectory[0].atSecond) return trajectory[0].value;
  if (t >= trajectory[trajectory.length - 1].atSecond) {
    return trajectory[trajectory.length - 1].value;
  }
  for (let i = 0; i < trajectory.length - 1; i++) {
    const a = trajectory[i];
    const b = trajectory[i + 1];
    if (t >= a.atSecond && t <= b.atSecond) {
      const k = (t - a.atSecond) / (b.atSecond - a.atSecond);
      return a.value + (b.value - a.value) * k;
    }
  }
  return 0;
}

function getTopColor(
  value: number,
  thresholds: GaugeThreshold[],
): string {
  const sorted = [...thresholds].sort((a, b) => b.value - a.value);
  for (const t of sorted) {
    if (value >= t.value) return THRESHOLD_COLORS[t.tone];
  }
  return paper.running;
}
