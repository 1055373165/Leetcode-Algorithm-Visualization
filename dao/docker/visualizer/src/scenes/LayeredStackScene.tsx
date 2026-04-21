import React from 'react';
import { interpolate } from 'remotion';
import { Kicker, Title, Caption } from '../primitives';
import { paper, fontFamilies, fontSizes, fontWeights } from '../theme';
import type { LayeredStackScene as LayeredStackSceneSchema, StackLayer } from '../schema';
import { ScenePlaybackProps, phases } from './common';

const LAYER_COLORS: Record<StackLayer['tone'], string> = {
  primary: paper.accentWarm,
  secondary: paper.accentCool,
  accent: paper.highlight,
  muted: paper.rule,
};

/**
 * LayeredStackScene · 层叠结构（OSI, OverlayFS, 镜像层）
 *
 * 从底到顶绘制一组斜视的"厚板"。
 * operations 演示层间动作（读/写/copy-up）——用一个小圆点在层间移动并高亮。
 */
export const LayeredStackScene: React.FC<
  ScenePlaybackProps & { scene: LayeredStackSceneSchema }
> = ({ scene, progress }) => {
  const { entering } = phases(progress);

  const LAYER_W = 900;
  const LAYER_H = 90;
  const LAYER_GAP = 10;

  // 当前正在演示的操作（按 atSecond 排序，progress 乘以总秒数定位）
  const lastSec = scene.operations?.[scene.operations.length - 1]?.atSecond ?? 0;
  const currentSec = progress * Math.max(lastSec, 1);
  const activeOp = scene.operations?.find(
    (o) => Math.abs(o.atSecond - currentSec) < 0.5,
  );

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        padding: 120,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 60,
        opacity: entering,
      }}
    >
      <div style={{ alignSelf: 'flex-start' }}>
        {scene.kicker && <Kicker style={{ marginBottom: 12 }}>{scene.kicker}</Kicker>}
        {scene.heading && <Title>{scene.heading}</Title>}
      </div>

      <div style={{ position: 'relative', width: LAYER_W, height: scene.layers.length * (LAYER_H + LAYER_GAP) }}>
        {/* 从底到顶：数组反转 */}
        {[...scene.layers].reverse().map((layer, reverseIdx) => {
          const idx = scene.layers.length - 1 - reverseIdx;
          const y = reverseIdx * (LAYER_H + LAYER_GAP);
          const isActive = activeOp && (activeOp.fromLayer === idx || activeOp.toLayer === idx);
          return (
            <div
              key={idx}
              style={{
                position: 'absolute',
                left: 0,
                top: y,
                width: LAYER_W,
                height: LAYER_H,
                backgroundColor: LAYER_COLORS[layer.tone],
                opacity: isActive ? 1 : 0.78,
                borderRadius: 10,
                // 3D 斜视效果
                transform: `perspective(1200px) rotateX(12deg) rotateY(-2deg)`,
                boxShadow: isActive
                  ? `0 8px 24px ${LAYER_COLORS[layer.tone]}55, 0 2px 4px rgba(0,0,0,0.1)`
                  : `0 4px 12px rgba(0,0,0,0.08)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 32px',
                color: 'white',
                fontFamily: fontFamilies.sans,
                fontWeight: fontWeights.semibold,
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: fontSizes.heading, textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
                  {layer.label}
                </span>
                {layer.subLabel && (
                  <span style={{ fontSize: fontSizes.label, opacity: 0.85, fontWeight: fontWeights.regular }}>
                    {layer.subLabel}
                  </span>
                )}
              </div>
              <div
                style={{
                  fontFamily: fontFamilies.mono,
                  fontSize: fontSizes.caption,
                  opacity: 0.6,
                }}
              >
                layer {idx}
              </div>
            </div>
          );
        })}
      </div>

      {activeOp && (
        <div
          style={{
            padding: '16px 32px',
            backgroundColor: paper.surfaceRaised,
            borderRadius: 12,
            border: `1px solid ${paper.accentWarm}`,
            fontFamily: fontFamilies.serif,
            fontSize: fontSizes.heading,
            color: paper.accentWarm,
            fontStyle: 'italic',
          }}
        >
          {activeOp.kind.toUpperCase()}{'  ·  '}{activeOp.label}
        </div>
      )}
    </div>
  );
};
