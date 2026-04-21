import React from 'react';
import { interpolate } from 'remotion';
import { Kicker, Title } from '../primitives';
import { paper, terminal, fontFamilies, fontSizes, fontWeights } from '../theme';
import type {
  DataStructureScene as DataStructureSceneSchema,
  DataNode,
  DataEdge,
} from '../schema';
import { ScenePlaybackProps, phases } from './common';

const NODE_TONE: Record<DataNode['tone'], { fg: string; bg: string; border: string }> = {
  primary: { fg: 'white', bg: paper.accentWarm, border: paper.accentWarm },
  secondary: { fg: paper.ink, bg: paper.surfaceRaised, border: paper.ruleStrong },
  accent: { fg: 'white', bg: paper.accentCool, border: paper.accentCool },
  muted: { fg: paper.inkMuted, bg: paper.surface, border: paper.rule },
};

/**
 * DataStructureScene · 数据结构关系图
 *
 * 节点按水平流布局（左→右），内核节点自动着深色。
 * 边按顺序渐进显示（reveal=sequential）或一次性（all_at_once）。
 *
 * 注：这是一个布局简化实现。复杂拓扑需要后续支持显式坐标。
 */
export const DataStructureScene: React.FC<
  ScenePlaybackProps & { scene: DataStructureSceneSchema }
> = ({ scene, progress }) => {
  const { entering } = phases(progress);

  const revealStart = 0.2;
  const revealEnd = 0.85;
  const revealSpan = revealEnd - revealStart;
  const totalItems = scene.nodes.length + scene.edges.length;

  // 判断某节点/边是否应该已经显示
  const isVisible = (idx: number) => {
    if (scene.reveal === 'all_at_once') return progress >= revealStart;
    const t = revealStart + (revealSpan * (idx + 1)) / totalItems;
    return progress >= t - 0.05;
  };

  // 自动布局：均匀分布在水平方向
  const canvas = { w: 1600, h: 540 };
  const nodePositions = computeLayout(scene.nodes, canvas);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        padding: 120,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        opacity: entering,
      }}
    >
      <div style={{ marginBottom: 40 }}>
        {scene.kicker && <Kicker style={{ marginBottom: 12 }}>{scene.kicker}</Kicker>}
        {scene.heading && <Title>{scene.heading}</Title>}
      </div>

      <svg
        width={canvas.w}
        height={canvas.h}
        style={{ alignSelf: 'center' }}
      >
        {/* 边先画（在节点下层） */}
        {scene.edges.map((edge, idx) => {
          const from = nodePositions.get(edge.from);
          const to = nodePositions.get(edge.to);
          if (!from || !to) return null;
          const edgeIdx = scene.nodes.length + idx;
          const visible = isVisible(edgeIdx);
          if (!visible) return null;
          return <EdgeLine key={idx} from={from} to={to} edge={edge} />;
        })}
      </svg>

      {/* 节点绝对定位在 SVG 上面 */}
      <div style={{ position: 'relative', width: canvas.w, height: 0, alignSelf: 'center' }}>
        {scene.nodes.map((node, idx) => {
          const pos = nodePositions.get(node.id);
          if (!pos) return null;
          const visible = isVisible(idx);
          const opacity = interpolate(
            progress,
            [revealStart + (revealSpan * idx) / totalItems - 0.05, revealStart + (revealSpan * idx) / totalItems + 0.05],
            [0, 1],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
          );
          return (
            <NodeBox
              key={node.id}
              node={node}
              x={pos.x}
              y={pos.y - canvas.h}
              opacity={scene.reveal === 'all_at_once' ? (visible ? 1 : 0) : opacity}
            />
          );
        })}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════

function computeLayout(
  nodes: DataNode[],
  canvas: { w: number; h: number },
): Map<string, { x: number; y: number }> {
  const map = new Map<string, { x: number; y: number }>();
  const cols = nodes.length;
  const colW = canvas.w / (cols + 1);
  nodes.forEach((n, i) => {
    map.set(n.id, {
      x: colW * (i + 1),
      y: canvas.h / 2,
    });
  });
  return map;
}

const NODE_W = 260;
const NODE_H = 140;

const NodeBox: React.FC<{
  node: DataNode;
  x: number;
  y: number;
  opacity: number;
}> = ({ node, x, y, opacity }) => {
  const tone = node.kernel
    ? { fg: terminal.text, bg: terminal.surface, border: terminal.accentCool }
    : NODE_TONE[node.tone];

  return (
    <div
      style={{
        position: 'absolute',
        left: x - NODE_W / 2,
        top: y - NODE_H / 2,
        width: NODE_W,
        height: NODE_H,
        borderRadius: 12,
        backgroundColor: tone.bg,
        border: `2px solid ${tone.border}`,
        boxShadow: node.kernel ? terminal.glowStrong : paper.shadow,
        padding: '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        opacity,
        fontFamily: node.kernel ? fontFamilies.mono : fontFamilies.sans,
      }}
    >
      <div
        style={{
          fontSize: fontSizes.label,
          fontWeight: fontWeights.semibold,
          color: tone.fg,
          lineHeight: 1.2,
        }}
      >
        {node.label}
      </div>
      {node.subLabel && (
        <div
          style={{
            fontSize: fontSizes.caption,
            color: node.kernel ? terminal.textMuted : tone.fg,
            opacity: node.kernel ? 1 : 0.85,
            marginTop: 6,
            lineHeight: 1.3,
          }}
        >
          {node.subLabel}
        </div>
      )}
    </div>
  );
};

const EDGE_COLOR: Record<DataEdge['kind'], string> = {
  references: paper.accentWarm,
  contains: paper.accentCool,
  points_to: paper.ink,
  derives: paper.inkMuted,
};

const EdgeLine: React.FC<{
  from: { x: number; y: number };
  to: { x: number; y: number };
  edge: DataEdge;
}> = ({ from, to, edge }) => {
  const color = EDGE_COLOR[edge.kind];
  const dash = edge.kind === 'derives' ? '6 6' : undefined;
  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2 - 24;
  return (
    <g>
      <defs>
        <marker
          id={`arrow-${edge.kind}`}
          viewBox="0 0 10 10"
          refX="10"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill={color} />
        </marker>
      </defs>
      <line
        x1={from.x + NODE_W / 2}
        y1={from.y}
        x2={to.x - NODE_W / 2}
        y2={to.y}
        stroke={color}
        strokeWidth={2}
        strokeDasharray={dash}
        markerEnd={`url(#arrow-${edge.kind})`}
      />
      {edge.label && (
        <text
          x={midX}
          y={midY}
          textAnchor="middle"
          fontFamily={fontFamilies.mono}
          fontSize={fontSizes.caption}
          fill={color}
        >
          {edge.label}
        </text>
      )}
    </g>
  );
};
