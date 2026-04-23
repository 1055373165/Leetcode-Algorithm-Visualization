import React from 'react';
import { interpolate } from 'remotion';
import { Kicker, Title } from '../primitives';
import { paper, fontFamilies, fontSizes, fontWeights } from '../theme';
import type { DecisionFlowScene as DecisionFlowSceneSchema, DecisionNode } from '../schema';
import { ScenePlaybackProps, phases } from './common';

const NODE_STYLE: Record<DecisionNode['kind'], { border: string; bg: string; shape: string }> = {
  condition: { border: paper.accentCool, bg: paper.surfaceRaised, shape: '12px' },
  action: { border: paper.ruleStrong, bg: paper.surface, shape: '8px' },
  outcome: { border: paper.accentWarm, bg: paper.surfaceRaised, shape: '24px' },
};

const OUTCOME_TONE: Record<NonNullable<DecisionNode['tone']>, string> = {
  good: paper.running,
  bad: paper.blocked,
  neutral: paper.inkMuted,
};

/**
 * DecisionFlowScene · 决策流程（简化纵向布局）
 *
 * 按 highlightPath 顺序逐个展开节点。节点类型不同用不同的圆角表示。
 * 节点间画细线连接，分支标签写在连线上。
 */
export const DecisionFlowScene: React.FC<
  ScenePlaybackProps & { scene: DecisionFlowSceneSchema }
> = ({ scene, progress }) => {
  const { entering } = phases(progress);
  const path = scene.highlightPath ?? scene.nodes.map((n) => n.id);
  const nodeMap = new Map(scene.nodes.map((n) => [n.id, n]));

  const walk = Math.max(0, Math.min(1, (progress - 0.15) / 0.7));
  const visibleCount = Math.min(path.length, Math.ceil(walk * path.length));

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        padding: 120,
        display: 'flex',
        flexDirection: 'column',
        opacity: entering,
      }}
    >
      <div style={{ marginBottom: 32 }}>
        {scene.kicker && <Kicker style={{ marginBottom: 12 }}>{scene.kicker}</Kicker>}
        {scene.heading && <Title>{scene.heading}</Title>}
      </div>

      <div
        style={{
          padding: '14px 24px',
          backgroundColor: paper.surface,
          border: `1px dashed ${paper.ruleStrong}`,
          borderRadius: 10,
          fontFamily: fontFamilies.mono,
          fontSize: fontSizes.body,
          color: paper.inkSoft,
          alignSelf: 'center',
          marginBottom: 28,
        }}
      >
        {scene.entry}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
        {path.map((id, idx) => {
          const node = nodeMap.get(id);
          if (!node) return null;
          const style = NODE_STYLE[node.kind];
          const outcomeColor = node.kind === 'outcome' && node.tone ? OUTCOME_TONE[node.tone] : null;
          const opacity = interpolate(
            progress,
            [0.15 + (0.7 * idx) / path.length - 0.03, 0.15 + (0.7 * idx) / path.length + 0.03],
            [0, 1],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
          );

          // 从上一节点到当前节点的分支标签。
          // 注意：Kimi/Claude 经常给 outcome（终点）节点省略 branches 字段——
          // 语义上这是对的（终点没下游）。所以 prev.branches 要再加一层 ?.，
          // 仅靠 prev?. 只能防 prev 本身是 undefined。
          const prev = idx > 0 ? nodeMap.get(path[idx - 1]) : null;
          const branchLabel =
            prev?.branches?.find((b) => b.to === id)?.label ?? '';

          return (
            <React.Fragment key={id}>
              {idx > 0 && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    opacity,
                  }}
                >
                  <div style={{ width: 2, height: 20, backgroundColor: paper.ruleStrong }} />
                  {branchLabel && (
                    <div
                      style={{
                        padding: '2px 10px',
                        backgroundColor: paper.bg,
                        border: `1px solid ${paper.rule}`,
                        borderRadius: 6,
                        fontFamily: fontFamilies.mono,
                        fontSize: fontSizes.caption,
                        color: paper.accentCool,
                        fontWeight: fontWeights.semibold,
                      }}
                    >
                      {branchLabel}
                    </div>
                  )}
                  <div style={{ width: 2, height: 20, backgroundColor: paper.ruleStrong }} />
                </div>
              )}

              <div
                style={{
                  minWidth: 420,
                  maxWidth: 720,
                  padding: '18px 28px',
                  backgroundColor: style.bg,
                  border: `2px solid ${outcomeColor ?? style.border}`,
                  borderRadius: style.shape,
                  opacity,
                  fontFamily: fontFamilies.sans,
                  fontSize: fontSizes.body,
                  fontWeight: fontWeights.medium,
                  color: outcomeColor ?? paper.ink,
                  textAlign: 'center',
                  boxShadow: idx === visibleCount - 1 && visibleCount > 0 ? paper.shadow : 'none',
                }}
              >
                <div
                  style={{
                    fontSize: fontSizes.caption,
                    fontWeight: fontWeights.semibold,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: outcomeColor ?? paper.inkMuted,
                    marginBottom: 4,
                  }}
                >
                  {node.kind}
                </div>
                {node.text}
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
