import React from 'react';
import { Sequence, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';
import { Stage, Kicker, Title, Subtitle } from '../primitives';
import { paper } from '../theme';
import {
  CounterfactualScene,
  InsightScene,
  TimelineScene,
  GaugeScene,
  LayeredStackScene,
  DataStructureScene,
  DecisionFlowScene,
  KernelJourneyScene,
} from '../scenes';
import type { Scene, TopicScript } from '../schema';

/**
 * GenericScenePlayer · 消费 TopicScript 的通用渲染器
 *
 * 职责：
 *   1. 根据每个 scene 的 duration 计算帧范围
 *   2. 插入一段 Intro（展示 topic 标题）和 Outro（淡出）
 *   3. 对每一帧找出"当前活跃 scene"和它内部的进度
 *   4. 把对应的 Scene 组件渲染到屏幕
 *
 * 这个组件是 schema → video 的核心桥梁。
 */
export const GenericScenePlayer: React.FC<{ script: TopicScript }> = ({ script }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 3 秒 Intro + 每个 scene 的 duration 之和
  const INTRO_SEC = 3;
  const introFrames = INTRO_SEC * fps;

  // 计算每个 scene 的起止帧
  const scenePlan = buildScenePlan(script.scenes, fps, introFrames);

  // 当前在哪个阶段？
  const inIntro = frame < introFrames;
  const currentSceneIdx = scenePlan.findIndex(
    (p) => frame >= p.start && frame < p.end,
  );
  const currentPlan = currentSceneIdx >= 0 ? scenePlan[currentSceneIdx] : null;

  return (
    <Stage>
      {/* Intro：展示 topic 标题 */}
      <Sequence from={0} durationInFrames={introFrames + 15}>
        <IntroTitle script={script} />
      </Sequence>

      {/* 每个场景用 Sequence 包裹，只在其帧段内渲染 */}
      {scenePlan.map((plan, idx) => (
        <Sequence
          key={idx}
          from={plan.start}
          durationInFrames={plan.end - plan.start}
        >
          <SceneRenderer
            scene={plan.scene}
            sceneDurationFrames={plan.end - plan.start}
          />
        </Sequence>
      ))}
    </Stage>
  );
};

// ═══════════════════════════════════════════════════════════
// Intro
// ═══════════════════════════════════════════════════════════

const IntroTitle: React.FC<{ script: TopicScript }> = ({ script }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const kickerOp = interpolate(frame, [6, 18], [0, 1], {
    extrapolateRight: 'clamp',
  });
  const titleSpring = spring({
    frame: frame - 12,
    fps,
    from: 0,
    to: 1,
    durationInFrames: 30,
    config: { mass: 0.8, damping: 150, stiffness: 120 },
  });
  const subtitleOp = interpolate(frame, [30, 50], [0, 1], {
    extrapolateRight: 'clamp',
  });

  // Intro 结尾 15 帧里整体淡出
  const introFrames = 3 * fps;
  const fadeOut = interpolate(frame, [introFrames, introFrames + 15], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const titleY = interpolate(titleSpring, [0, 1], [40, 0]);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        padding: 120,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        opacity: fadeOut,
      }}
    >
      {script.kicker && (
        <Kicker style={{ opacity: kickerOp, marginBottom: 20, color: paper.accentWarm }}>
          {script.kicker}
        </Kicker>
      )}
      <Title
        style={{
          opacity: titleSpring,
          transform: `translateY(${titleY}px)`,
          fontSize: 80,
          marginBottom: 24,
        }}
      >
        {script.title}
      </Title>
      {script.subtitle && (
        <Subtitle style={{ opacity: subtitleOp, fontSize: 32 }}>
          {script.subtitle}
        </Subtitle>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// 场景路由分发
// ═══════════════════════════════════════════════════════════

const SceneRenderer: React.FC<{ scene: Scene; sceneDurationFrames: number }> = ({
  scene,
  sceneDurationFrames,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = Math.max(0, Math.min(1, frame / sceneDurationFrames));
  const sceneProps = { progress, sceneFrame: frame, fps };

  switch (scene.type) {
    case 'counterfactual':
      return <CounterfactualScene {...sceneProps} scene={scene} />;
    case 'timeline':
      return <TimelineScene {...sceneProps} scene={scene} />;
    case 'data_structure':
      return <DataStructureScene {...sceneProps} scene={scene} />;
    case 'decision_flow':
      return <DecisionFlowScene {...sceneProps} scene={scene} />;
    case 'gauge':
      return <GaugeScene {...sceneProps} scene={scene} />;
    case 'layered_stack':
      return <LayeredStackScene {...sceneProps} scene={scene} />;
    case 'kernel_journey':
      return <KernelJourneyScene {...sceneProps} scene={scene} />;
    case 'insight':
      return <InsightScene {...sceneProps} scene={scene} />;
  }
};

// ═══════════════════════════════════════════════════════════
// 帧规划
// ═══════════════════════════════════════════════════════════

type ScenePlan = {
  scene: Scene;
  start: number; // 绝对帧
  end: number;   // 绝对帧（不含）
};

function buildScenePlan(scenes: Scene[], fps: number, introFrames: number): ScenePlan[] {
  const plans: ScenePlan[] = [];
  let cursor = introFrames;
  for (const scene of scenes) {
    const frames = Math.round(scene.duration * fps);
    plans.push({ scene, start: cursor, end: cursor + frames });
    cursor += frames;
  }
  return plans;
}

/** 工具：由 TopicScript 计算总帧数（给 Composition 用） */
export function computeTotalFrames(script: TopicScript, fps = 30): number {
  const INTRO_SEC = 3;
  const totalSec =
    INTRO_SEC +
    script.scenes.reduce((sum, s) => sum + s.duration, 0);
  return Math.round(totalSec * fps);
}
