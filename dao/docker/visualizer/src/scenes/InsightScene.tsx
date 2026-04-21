import React from 'react';
import { interpolate } from 'remotion';
import { Kicker, Callout, Caption } from '../primitives';
import { paper, fontFamilies, fontSizes, lineHeights } from '../theme';
import type { InsightScene as InsightSceneSchema } from '../schema';
import { ScenePlaybackProps, phases } from './common';

/**
 * InsightScene · 洞见金句（收尾场景）
 *
 * 结构：中央浮起一张"论文引用式"的卡片，承载核心洞见。
 * 支持性段落在下方展开，最后一个问题以斜体留白结束。
 */
export const InsightScene: React.FC<
  ScenePlaybackProps & { scene: InsightSceneSchema }
> = ({ scene, progress }) => {
  const { entering } = phases(progress);

  const cardY = interpolate(entering, [0, 1], [40, 0]);
  const insightOp = interpolate(progress, [0.1, 0.3], [0, 1], {
    extrapolateRight: 'clamp',
  });
  const supportingOp = interpolate(progress, [0.4, 0.6], [0, 1], {
    extrapolateRight: 'clamp',
  });
  const questionOp = interpolate(progress, [0.65, 0.85], [0, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        padding: 120,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          maxWidth: 1400,
          width: '100%',
          padding: '64px 72px',
          backgroundColor: paper.surfaceRaised,
          borderRadius: 20,
          boxShadow: paper.shadowDeep,
          border: `1px solid ${paper.rule}`,
          opacity: entering,
          transform: `translateY(${cardY}px)`,
        }}
      >
        {scene.kicker && (
          <Kicker style={{ marginBottom: 24, color: paper.accentWarm }}>
            {scene.kicker}
          </Kicker>
        )}

        <div style={{ opacity: insightOp }}>
          <Callout style={{ borderLeft: 'none', paddingLeft: 0 }}>
            {scene.insight}
          </Callout>
        </div>

        {scene.supporting && (
          <div
            style={{
              opacity: supportingOp,
              marginTop: 32,
              fontFamily: fontFamilies.sans,
              fontSize: fontSizes.body,
              lineHeight: lineHeights.relaxed,
              color: paper.inkSoft,
            }}
          >
            {scene.supporting}
          </div>
        )}

        {scene.openQuestion && (
          <div
            style={{
              opacity: questionOp,
              marginTop: 40,
              paddingTop: 28,
              borderTop: `1px dashed ${paper.ruleStrong}`,
            }}
          >
            <Caption style={{ marginBottom: 10, color: paper.accentCool }}>
              LEFT FOR YOU
            </Caption>
            <div
              style={{
                fontFamily: fontFamilies.serif,
                fontSize: fontSizes.heading,
                fontStyle: 'italic',
                lineHeight: lineHeights.normal,
                color: paper.ink,
              }}
            >
              {scene.openQuestion}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
