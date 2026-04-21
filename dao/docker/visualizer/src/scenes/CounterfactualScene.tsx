import React from 'react';
import { spring, useCurrentFrame, interpolate } from 'remotion';
import { Kicker, Title, Callout } from '../primitives';
import { paper, fontFamilies, fontSizes, fontWeights, lineHeights } from '../theme';
import type { CounterfactualScene as CounterfactualSceneSchema } from '../schema';
import { ScenePlaybackProps, sceneSprings, phases } from './common';

/**
 * CounterfactualScene · "没有它之前，世界是什么样的"
 *
 * 视觉节奏：
 *   0-15%   kicker + 标题进入（从下向上淡入）
 *   15-40%  problemStatement 展开（serif 正文）
 *   40-75%  consequence 展开，并在左侧出现一个"痛"的视觉锚点（红色竖条）
 *   75-100% transition 句以斜体浮现，暗示"解法即将出场"
 */
export const CounterfactualScene: React.FC<
  ScenePlaybackProps & { scene: CounterfactualSceneSchema }
> = ({ scene, progress, sceneFrame, fps }) => {
  const { entering, dwelling } = phases(progress);

  const titleY = interpolate(entering, [0, 1], [24, 0]);

  const problemOpacity = interpolate(progress, [0.15, 0.35], [0, 1], {
    extrapolateRight: 'clamp',
  });
  const consequenceOpacity = interpolate(progress, [0.4, 0.6], [0, 1], {
    extrapolateRight: 'clamp',
  });
  const transitionOpacity = interpolate(progress, [0.75, 0.9], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const painBarHeight = spring({
    frame: sceneFrame - progress * 0.4 * 100,
    fps,
    from: 0,
    to: 1,
    durationInFrames: 45,
    config: sceneSprings.enter,
  });

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        padding: '80px 120px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        opacity: entering,
      }}
    >
      <div style={{ transform: `translateY(${titleY}px)` }}>
        {scene.kicker && (
          <Kicker style={{ marginBottom: 16, color: paper.accentWarm }}>
            {scene.kicker}
          </Kicker>
        )}
        {scene.heading && (
          <Title style={{ marginBottom: 48 }}>{scene.heading}</Title>
        )}
      </div>

      <div style={{ display: 'flex', gap: 40 }}>
        {/* 左侧痛点竖条（视觉锚点） */}
        <div
          style={{
            width: 4,
            alignSelf: 'stretch',
            backgroundColor: paper.blocked,
            opacity: 0.6,
            transform: `scaleY(${painBarHeight})`,
            transformOrigin: 'top',
            borderRadius: 2,
          }}
        />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 32 }}>
          {/* problem */}
          <div style={{ opacity: problemOpacity }}>
            <div
              style={{
                fontFamily: fontFamilies.sans,
                fontSize: fontSizes.caption,
                fontWeight: fontWeights.semibold,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: paper.blocked,
                marginBottom: 10,
              }}
            >
              The problem
            </div>
            <div
              style={{
                fontFamily: fontFamilies.serif,
                fontSize: fontSizes.heading,
                lineHeight: lineHeights.normal,
                color: paper.ink,
              }}
            >
              {scene.problemStatement}
            </div>
          </div>

          {/* consequence */}
          <div style={{ opacity: consequenceOpacity }}>
            <div
              style={{
                fontFamily: fontFamilies.sans,
                fontSize: fontSizes.caption,
                fontWeight: fontWeights.semibold,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: paper.inkMuted,
                marginBottom: 10,
              }}
            >
              The consequence
            </div>
            <div
              style={{
                fontFamily: fontFamilies.serif,
                fontSize: fontSizes.body,
                lineHeight: lineHeights.relaxed,
                color: paper.inkSoft,
              }}
            >
              {scene.consequence}
            </div>
          </div>

          {/* transition */}
          {scene.transition && (
            <div style={{ opacity: transitionOpacity, marginTop: 16 }}>
              <Callout>{scene.transition}</Callout>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
