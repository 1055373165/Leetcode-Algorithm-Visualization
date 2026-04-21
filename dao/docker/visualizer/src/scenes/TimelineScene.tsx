import React from 'react';
import { interpolate } from 'remotion';
import { Kicker, Title, Caption } from '../primitives';
import { paper, fontFamilies, fontSizes, fontWeights } from '../theme';
import type { TimelineScene as TimelineSceneSchema, TimelineSegment } from '../schema';
import { ScenePlaybackProps, phases } from './common';

const TONE_COLORS: Record<TimelineSegment['tone'], string> = {
  running: paper.running,
  blocked: paper.blocked,
  neutral: paper.inkFaint,
  accent: paper.accentWarm,
};

/**
 * TimelineScene · 时间轴过程
 *
 * 实现：一条横向的进度条，按 segments 的 weight 分段。
 * 游标从左走到右，过到每段时高亮该段并显示 note。
 * Markers 作为竖线插在时间轴上。
 */
export const TimelineScene: React.FC<
  ScenePlaybackProps & { scene: TimelineSceneSchema }
> = ({ scene, progress }) => {
  const { entering } = phases(progress);

  // 标题从上到下淡入
  const titleY = interpolate(entering, [0, 1], [20, 0]);

  // 时间轴游标位置（简单线性）
  const cursorAt = Math.min(0.999, Math.max(0, (progress - 0.1) / 0.75));

  // 找到游标当前所在 segment
  const activeIdx = findSegmentAt(scene.segments, cursorAt);

  const BAR_WIDTH = 1600;
  const BAR_HEIGHT = 80;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        padding: 120,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        opacity: entering,
      }}
    >
      <div style={{ transform: `translateY(${titleY}px)`, marginBottom: 56 }}>
        {scene.kicker && (
          <Kicker style={{ marginBottom: 12, color: paper.accentWarm }}>
            {scene.kicker}
          </Kicker>
        )}
        {scene.heading && <Title>{scene.heading}</Title>}
        <Caption style={{ marginTop: 10 }}>
          单位：<span style={{ fontFamily: fontFamilies.mono }}>{scene.unit}</span>
        </Caption>
      </div>

      {/* 时间条 */}
      <div style={{ position: 'relative', width: BAR_WIDTH, alignSelf: 'center' }}>
        {/* 游标 */}
        <div
          style={{
            position: 'absolute',
            top: -24,
            left: cursorAt * BAR_WIDTH - 10,
            width: 20,
            height: 20,
            opacity: entering,
          }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20">
            <path d="M 10 20 L 0 0 L 20 0 Z" fill={paper.accentWarm} />
          </svg>
        </div>

        {/* 分段 */}
        <div
          style={{
            display: 'flex',
            width: BAR_WIDTH,
            height: BAR_HEIGHT,
            gap: 4,
            border: `1px solid ${paper.rule}`,
            borderRadius: 10,
            backgroundColor: paper.surface,
            overflow: 'hidden',
          }}
        >
          {scene.segments.map((seg, idx) => (
            <div
              key={idx}
              style={{
                flex: seg.weight,
                height: '100%',
                backgroundColor: TONE_COLORS[seg.tone],
                opacity: idx === activeIdx ? 1 : 0.55,
                transition: 'none',
                position: 'relative',
              }}
            >
              {/* 段内标签（简短） */}
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  fontFamily: fontFamilies.sans,
                  fontSize: fontSizes.caption,
                  fontWeight: fontWeights.semibold,
                  color: 'white',
                  textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                  whiteSpace: 'nowrap',
                  pointerEvents: 'none',
                }}
              >
                {seg.weight > 0.15 ? seg.label : ''}
              </div>
            </div>
          ))}
        </div>

        {/* Markers */}
        {scene.markers?.map((m, idx) => (
          <div
            key={idx}
            style={{
              position: 'absolute',
              top: 0,
              bottom: -28,
              left: m.at * BAR_WIDTH,
              width: 2,
              backgroundColor: paper.accentCool,
            }}
          >
            <div
              style={{
                position: 'absolute',
                bottom: -22,
                left: 6,
                fontFamily: fontFamilies.mono,
                fontSize: fontSizes.caption,
                color: paper.accentCool,
                whiteSpace: 'nowrap',
              }}
            >
              {m.label}
            </div>
          </div>
        ))}
      </div>

      {/* 当前 segment 的 note */}
      <div
        style={{
          marginTop: 80,
          alignSelf: 'center',
          minHeight: 60,
          maxWidth: 1200,
          textAlign: 'center',
          fontFamily: fontFamilies.serif,
          fontSize: fontSizes.heading,
          color: paper.ink,
          fontStyle: 'italic',
          opacity: activeIdx >= 0 && scene.segments[activeIdx]?.note ? 1 : 0,
        }}
      >
        {activeIdx >= 0 && scene.segments[activeIdx]?.note}
      </div>
    </div>
  );
};

function findSegmentAt(segments: TimelineSegment[], at: number): number {
  let acc = 0;
  const total = segments.reduce((s, seg) => s + seg.weight, 0) || 1;
  for (let i = 0; i < segments.length; i++) {
    acc += segments[i].weight / total;
    if (at <= acc) return i;
  }
  return segments.length - 1;
}
