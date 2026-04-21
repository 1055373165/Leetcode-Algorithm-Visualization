import React, { CSSProperties } from 'react';
import {
  paper,
  fontFamilies,
  fontSizes,
  fontWeights,
  lineHeights,
  letterSpacings,
} from '../theme';

/**
 * 排版组件 · 强制用语义而非样式命名
 *
 * 用 <Kicker>、<Title>、<Body> 而不是 <div style={{fontSize:48}}>，
 * 因为尺寸和字体可能随主题调整，但"它在内容层级里是什么"是稳定的。
 */

export const Kicker: React.FC<{ children: React.ReactNode; style?: CSSProperties }> = ({
  children,
  style,
}) => (
  <div
    style={{
      fontFamily: fontFamilies.sans,
      fontSize: fontSizes.caption,
      fontWeight: fontWeights.semibold,
      letterSpacing: letterSpacings.kicker,
      textTransform: 'uppercase',
      color: paper.inkMuted,
      ...style,
    }}
  >
    {children}
  </div>
);

export const Title: React.FC<{ children: React.ReactNode; style?: CSSProperties }> = ({
  children,
  style,
}) => (
  <div
    style={{
      fontFamily: fontFamilies.serif,
      fontSize: fontSizes.title,
      fontWeight: fontWeights.semibold,
      lineHeight: lineHeights.tight,
      letterSpacing: letterSpacings.tight,
      color: paper.ink,
      ...style,
    }}
  >
    {children}
  </div>
);

export const Subtitle: React.FC<{ children: React.ReactNode; style?: CSSProperties }> = ({
  children,
  style,
}) => (
  <div
    style={{
      fontFamily: fontFamilies.serif,
      fontSize: fontSizes.body,
      fontWeight: fontWeights.regular,
      lineHeight: lineHeights.normal,
      color: paper.inkSoft,
      fontStyle: 'italic',
      ...style,
    }}
  >
    {children}
  </div>
);

export const Label: React.FC<{ children: React.ReactNode; style?: CSSProperties }> = ({
  children,
  style,
}) => (
  <div
    style={{
      fontFamily: fontFamilies.sans,
      fontSize: fontSizes.label,
      fontWeight: fontWeights.medium,
      color: paper.inkSoft,
      ...style,
    }}
  >
    {children}
  </div>
);

export const Caption: React.FC<{ children: React.ReactNode; style?: CSSProperties }> = ({
  children,
  style,
}) => (
  <div
    style={{
      fontFamily: fontFamilies.sans,
      fontSize: fontSizes.caption,
      fontWeight: fontWeights.regular,
      color: paper.inkMuted,
      letterSpacing: letterSpacings.wide,
      ...style,
    }}
  >
    {children}
  </div>
);

/**
 * Mono · 用于代码或精确数值（tabular 数字防止跳动）
 */
export const Mono: React.FC<{
  children: React.ReactNode;
  size?: 'small' | 'normal' | 'large';
  color?: string;
  style?: CSSProperties;
}> = ({ children, size = 'normal', color, style }) => {
  const sizeMap = {
    small: fontSizes.codeSmall,
    normal: fontSizes.code,
    large: fontSizes.codeLarge,
  };
  return (
    <span
      className="tabular"
      style={{
        fontFamily: fontFamilies.mono,
        fontSize: sizeMap[size],
        color: color ?? 'inherit',
        fontFeatureSettings: '"tnum"',
        ...style,
      }}
    >
      {children}
    </span>
  );
};

/**
 * Callout · 衬线的引用块，用于金句或核心洞见
 */
export const Callout: React.FC<{ children: React.ReactNode; style?: CSSProperties }> = ({
  children,
  style,
}) => (
  <div
    style={{
      fontFamily: fontFamilies.serif,
      fontSize: fontSizes.heading,
      fontWeight: fontWeights.regular,
      fontStyle: 'italic',
      lineHeight: lineHeights.relaxed,
      color: paper.ink,
      borderLeft: `3px solid ${paper.accentWarm}`,
      paddingLeft: 24,
      ...style,
    }}
  >
    {children}
  </div>
);
