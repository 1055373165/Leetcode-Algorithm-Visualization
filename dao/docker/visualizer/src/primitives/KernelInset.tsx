import React, { CSSProperties } from 'react';
import { terminal, fontFamilies, fontSizes, fontWeights, letterSpacings } from '../theme';

/**
 * KernelInset · B 风格的深色内嵌面板
 *
 * 规则：任何展示内核视角（kernel 数据结构、系统调用、cpu.stat 之类伪文件内容）
 *      的内容都必须放在 KernelInset 里。这是我们的视觉语言：
 *          paper 色 = 用户视角
 *          terminal 色 = 内核视角
 *      观众看到切换到深色面板，就知道"现在我们在看内核内部"。
 *
 * 顶部带一个类终端的标题栏（显示文件路径或命令），增强"内核"语感。
 */
export const KernelInset: React.FC<{
  children: React.ReactNode;
  title?: string;        // 终端栏上显示的"路径"或"命令"
  style?: CSSProperties;
}> = ({ children, title, style }) => {
  return (
    <div
      style={{
        backgroundColor: terminal.bg,
        borderRadius: 8,
        border: `1px solid ${terminal.rule}`,
        boxShadow: terminal.glowStrong,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        ...style,
      }}
    >
      {title && (
        <div
          style={{
            height: 36,
            backgroundColor: terminal.surface,
            borderBottom: `1px solid ${terminal.rule}`,
            display: 'flex',
            alignItems: 'center',
            padding: '0 16px',
            gap: 10,
          }}
        >
          {/* 三个 macOS 风格的点（仅装饰，暗示"这是一个终端窗口"） */}
          <div style={{ display: 'flex', gap: 6 }}>
            <TerminalDot color="#3D4352" />
            <TerminalDot color="#3D4352" />
            <TerminalDot color="#3D4352" />
          </div>
          <div
            style={{
              fontFamily: fontFamilies.mono,
              fontSize: fontSizes.codeSmall,
              fontWeight: fontWeights.medium,
              color: terminal.textMuted,
              letterSpacing: letterSpacings.tight,
              marginLeft: 8,
            }}
          >
            {title}
          </div>
        </div>
      )}
      <div
        style={{
          padding: '18px 22px',
          fontFamily: fontFamilies.mono,
          fontSize: fontSizes.code,
          color: terminal.text,
          lineHeight: 1.55,
          flex: 1,
        }}
      >
        {children}
      </div>
    </div>
  );
};

const TerminalDot: React.FC<{ color: string }> = ({ color }) => (
  <div
    style={{
      width: 10,
      height: 10,
      borderRadius: '50%',
      backgroundColor: color,
    }}
  />
);
