import React from 'react';
import { AbsoluteFill } from 'remotion';
import { paper, fontFamilies } from '../theme';

/**
 * Stage · 外层画布
 *
 * 提供 A 风格（paper）的统一底色和字体基准。所有视频的根节点都应该是它。
 * 不做其他事情——只做底色 + 字体 + 全屏。
 */
export const Stage: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: paper.bg,
        color: paper.ink,
        fontFamily: fontFamilies.sans,
        // 极细的纸纹理（用 radial gradient 模拟，不会引入资源）
        backgroundImage: `radial-gradient(
          ellipse at 20% 10%,
          rgba(255, 255, 255, 0.4) 0%,
          rgba(255, 255, 255, 0) 50%
        )`,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};
