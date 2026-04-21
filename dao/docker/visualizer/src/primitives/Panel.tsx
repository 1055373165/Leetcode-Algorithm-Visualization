import React, { CSSProperties } from 'react';
import { paper, fontFamilies, fontSizes, fontWeights, letterSpacings } from '../theme';

/**
 * Panel · A 风格的浮起卡片
 *
 * 带柔软阴影和暖色边框，是外层叙事的容器。
 * 可选的 kicker（上标题），用于给面板定性（"CONFIG" / "STATE" 等）。
 */
export const Panel: React.FC<{
  children: React.ReactNode;
  kicker?: string;
  style?: CSSProperties;
  raised?: boolean;  // 更强的浮起感，用于关键元素
}> = ({ children, kicker, style, raised = false }) => {
  return (
    <div
      style={{
        backgroundColor: raised ? paper.surfaceRaised : paper.surface,
        border: `1px solid ${paper.rule}`,
        borderRadius: 12,
        padding: '24px 28px',
        boxShadow: raised ? paper.shadowDeep : paper.shadow,
        position: 'relative',
        ...style,
      }}
    >
      {kicker && (
        <div
          style={{
            position: 'absolute',
            top: -10,
            left: 20,
            backgroundColor: paper.bg,
            padding: '0 10px',
            fontFamily: fontFamilies.sans,
            fontSize: fontSizes.caption,
            fontWeight: fontWeights.semibold,
            letterSpacing: letterSpacings.kicker,
            textTransform: 'uppercase',
            color: paper.inkMuted,
          }}
        >
          {kicker}
        </div>
      )}
      {children}
    </div>
  );
};
