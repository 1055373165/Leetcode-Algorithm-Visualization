import React from 'react';
import { paper, fontFamilies, fontSizes, fontWeights, letterSpacings } from '../theme';

/**
 * StateIndicator · 进程状态徽章
 *
 * 一个圆点 + 一个全大写的状态词。圆点有微微的光晕（running 时绿色温柔，
 * throttled 时红色收束）。动画不在这里——由外层 interpolate opacity/scale。
 */
export const StateIndicator: React.FC<{
  state: 'running' | 'throttled';
  size?: 'normal' | 'large';
}> = ({ state, size = 'normal' }) => {
  const color = state === 'running' ? paper.running : paper.blocked;
  const label = state === 'running' ? 'RUNNING' : 'THROTTLED';
  const dotSize = size === 'large' ? 18 : 14;
  const fontSize = size === 'large' ? fontSizes.heading : fontSizes.body;

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 14,
      }}
    >
      <div
        style={{
          width: dotSize,
          height: dotSize,
          borderRadius: '50%',
          backgroundColor: color,
          // 光晕，给"活着"的感觉
          boxShadow: `0 0 0 4px ${color}22, 0 0 12px ${color}88`,
        }}
      />
      <span
        style={{
          fontFamily: fontFamilies.sans,
          fontSize,
          fontWeight: fontWeights.semibold,
          letterSpacing: letterSpacings.wide,
          color,
        }}
      >
        {label}
      </span>
    </div>
  );
};
