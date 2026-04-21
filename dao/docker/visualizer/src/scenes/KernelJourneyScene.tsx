import React from 'react';
import { interpolate } from 'remotion';
import { Kicker, Title, KernelInset } from '../primitives';
import { paper, terminal, fontFamilies, fontSizes, fontWeights } from '../theme';
import type { KernelJourneyScene as KernelJourneySceneSchema } from '../schema';
import { ScenePlaybackProps, phases } from './common';

/**
 * KernelJourneyScene · 内核之旅（一个用户操作进入内核后的步骤序列）
 *
 * 整个场景在深色 kernel 主题下——这是我们视觉语言里"内核视角"的信号。
 * 左侧是固定的用户入口，右侧是随时间展开的步骤列表。
 * 当前激活步骤以 accent 色高亮。
 */
export const KernelJourneyScene: React.FC<
  ScenePlaybackProps & { scene: KernelJourneySceneSchema }
> = ({ scene, progress }) => {
  const { entering } = phases(progress);

  const walk = Math.max(0, Math.min(1, (progress - 0.15) / 0.7));
  const activeIdx = Math.min(
    scene.steps.length - 1,
    Math.floor(walk * scene.steps.length),
  );

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        padding: 120,
        backgroundColor: terminal.bg,
        color: terminal.text,
        display: 'flex',
        flexDirection: 'column',
        opacity: entering,
      }}
    >
      <div style={{ marginBottom: 32 }}>
        {scene.kicker && (
          <Kicker style={{ marginBottom: 12, color: terminal.accentCool }}>
            {scene.kicker}
          </Kicker>
        )}
        {scene.heading && (
          <Title style={{ color: terminal.text }}>{scene.heading}</Title>
        )}
      </div>

      {/* 用户入口 */}
      <div
        style={{
          alignSelf: 'flex-start',
          padding: '12px 20px',
          backgroundColor: terminal.surface,
          border: `1px solid ${terminal.rule}`,
          borderRadius: 8,
          fontFamily: fontFamilies.mono,
          fontSize: fontSizes.body,
          color: terminal.highlight,
          marginBottom: 24,
          boxShadow: terminal.glow,
        }}
      >
        <span style={{ color: terminal.textMuted }}>user → kernel  </span>
        {scene.userAction}
      </div>

      {/* 下箭头 */}
      <div style={{ display: 'flex', justifyContent: 'flex-start', marginLeft: 40, marginBottom: 12 }}>
        <svg width="20" height="30" viewBox="0 0 20 30">
          <line x1="10" y1="0" x2="10" y2="22" stroke={terminal.rule} strokeWidth="2" />
          <path d="M 10 30 L 4 22 L 16 22 Z" fill={terminal.rule} />
        </svg>
      </div>

      {/* 步骤列表 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {scene.steps.map((step, idx) => {
          const stepT = 0.15 + (0.7 * idx) / scene.steps.length;
          const opacity = interpolate(
            progress,
            [stepT - 0.03, stepT + 0.03],
            [0, 1],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
          );
          const isActive = idx === activeIdx;

          return (
            <div
              key={idx}
              style={{
                display: 'flex',
                gap: 20,
                opacity,
                padding: '16px 20px',
                backgroundColor: isActive ? terminal.surfaceRaised : 'transparent',
                border: `1px solid ${isActive ? terminal.accentWarm : terminal.rule}`,
                borderRadius: 10,
                boxShadow: isActive ? terminal.glowStrong : 'none',
              }}
            >
              {/* 步号 */}
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  backgroundColor: isActive ? terminal.accentWarm : terminal.surface,
                  border: `2px solid ${isActive ? terminal.accentWarm : terminal.rule}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: fontFamilies.mono,
                  fontSize: fontSizes.body,
                  fontWeight: fontWeights.bold,
                  color: isActive ? 'white' : terminal.textMuted,
                  flexShrink: 0,
                }}
              >
                {idx + 1}
              </div>

              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontFamily: fontFamilies.sans,
                    fontSize: fontSizes.heading,
                    fontWeight: fontWeights.semibold,
                    color: isActive ? terminal.text : terminal.textSoft,
                    marginBottom: 6,
                  }}
                >
                  {step.title}
                </div>
                <div
                  style={{
                    fontFamily: fontFamilies.sans,
                    fontSize: fontSizes.body,
                    color: terminal.textMuted,
                    lineHeight: 1.5,
                    marginBottom: step.code ? 10 : 0,
                  }}
                >
                  {step.description}
                </div>
                {step.code && (
                  <div
                    style={{
                      fontFamily: fontFamilies.mono,
                      fontSize: fontSizes.code,
                      color: isActive ? terminal.accentWarm : terminal.textSoft,
                      backgroundColor: terminal.bg,
                      padding: '6px 12px',
                      borderRadius: 6,
                      border: `1px solid ${terminal.rule}`,
                      display: 'inline-block',
                    }}
                  >
                    {step.code}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
