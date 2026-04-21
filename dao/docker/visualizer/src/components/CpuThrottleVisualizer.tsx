import React from 'react';
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from 'remotion';
import {
  Stage,
  Panel,
  KernelInset,
  QuotaGauge,
  Timeline,
  StateIndicator,
  Kicker,
  Title,
  Subtitle,
  Caption,
  Mono,
  Callout,
} from '../primitives';
import { paper, terminal, fontFamilies, fontSizes, fontWeights, springs } from '../theme';

/**
 * CpuThrottleVisualizer · CPU 配额/节流可视化
 *
 * 视频结构（总 30s / 900f @ 30fps）：
 *
 *   [Intro   0-4s  ] → 标题 + 配置登场
 *   [Sim   4-28s  ] → 3 个周期，每周期 8s：前 4s 运行，后 4s 节流
 *   [Outro 28-30s ] → 洞见金句
 *
 * 模拟比例说明：
 *   真实世界一个周期 = 100ms，本视频里表示为 8s
 *   真实世界 quota = 50ms，本视频里运行 4s
 *   时间被"放慢"了 80 倍，方便观众看清楚 quota 消耗的过程。
 */

export type CpuThrottleConfig = {
  quotaUs: number;     // 50_000
  periodUs: number;    // 100_000
  periodCount: number; // 3
};

// —— 时长常量（帧数，fps=30） ——
const INTRO_FRAMES = 120;      // 0-4s
const OUTRO_FRAMES = 60;       // 28-30s

// —— 布局常量（1920x1080 画布） ——
const CANVAS_PADDING = 80;

export const CpuThrottleVisualizer: React.FC<{ config: CpuThrottleConfig }> = ({
  config,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const simStart = INTRO_FRAMES;
  const simEnd = durationInFrames - OUTRO_FRAMES;
  const simFrames = simEnd - simStart;
  const periodFrames = simFrames / config.periodCount;

  // —— 阶段判定 ——
  const phase: 'intro' | 'sim' | 'outro' =
    frame < simStart ? 'intro' : frame < simEnd ? 'sim' : 'outro';

  // —— 进入/退出的整体透明度 ——
  const introOpacity = spring({
    frame,
    fps,
    from: 0,
    to: 1,
    durationInFrames: 60,
    config: springs.standard,
  });

  const simOpacity = spring({
    frame: frame - (simStart - 30),
    fps,
    from: 0,
    to: 1,
    durationInFrames: 45,
    config: springs.standard,
  });

  const outroOpacity =
    phase === 'outro'
      ? spring({
          frame: frame - simEnd,
          fps,
          from: 0,
          to: 1,
          durationInFrames: 30,
          config: springs.standard,
        })
      : 0;

  // —— 模拟状态计算 ——
  const state = computeSimState({
    frame,
    simStart,
    simEnd,
    periodFrames,
    periodCount: config.periodCount,
    config,
  });

  return (
    <Stage>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          padding: CANVAS_PADDING,
          display: 'flex',
          flexDirection: 'column',
          gap: 32,
        }}
      >
        {/* ===== 头部：标题始终存在，intro 时淡入 ===== */}
        <Header introOpacity={introOpacity} frame={frame} />

        {/* ===== 主体：sim 阶段展示 ===== */}
        <div
          style={{
            flex: 1,
            opacity: phase === 'outro' ? 1 - outroOpacity * 0.6 : simOpacity,
            display: 'flex',
            flexDirection: 'column',
            gap: 32,
          }}
        >
          <MainSimulation state={state} config={config} />
        </div>

        {/* ===== Outro 洞见：绝对定位覆盖在主体上 ===== */}
        {outroOpacity > 0 && <OutroInsight opacity={outroOpacity} />}
      </div>
    </Stage>
  );
};

// ═══════════════════════════════════════════════════════════
// Header · 标题区
// ═══════════════════════════════════════════════════════════

const Header: React.FC<{ introOpacity: number; frame: number }> = ({
  introOpacity,
  frame,
}) => {
  const titleY = interpolate(introOpacity, [0, 1], [20, 0]);

  return (
    <div style={{ opacity: introOpacity, transform: `translateY(${titleY}px)` }}>
      <Kicker style={{ marginBottom: 12 }}>
        cgroup · CPU controller · 硬限制的时间感
      </Kicker>
      <Title>CPU Quota / Period · 配额用完就停，空闲也不让用</Title>
      <Subtitle style={{ marginTop: 12 }}>
        cpu.max = <Mono size="normal">"50000 100000"</Mono> · 每 100ms 最多用
        50ms CPU
      </Subtitle>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// MainSimulation · 主模拟区
// ═══════════════════════════════════════════════════════════

const MainSimulation: React.FC<{
  state: SimState;
  config: CpuThrottleConfig;
}> = ({ state, config }) => {
  return (
    <>
      {/* 上半部分：左边 gauge+state，右边 kernel inset */}
      <div
        style={{
          display: 'flex',
          gap: 40,
          alignItems: 'stretch',
        }}
      >
        <Panel kicker="USER VIEW · 进程 P 的视角" style={{ flex: 1.4 }} raised>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            <StateIndicator state={state.running ? 'running' : 'throttled'} size="large" />
            <QuotaGauge
              used={state.usedInPeriodUs}
              max={config.quotaUs}
              throttled={!state.running}
              width={820}
            />
            <Caption style={{ marginTop: -8 }}>
              {state.running
                ? '进程正在占用 CPU。quota 每纳秒都在被消耗。'
                : 'quota 已耗尽。即使 CPU 完全空闲，进程也被强制让出。'}
            </Caption>
          </div>
        </Panel>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <KernelInset title="$ cat /sys/fs/cgroup/.../cpu.stat" style={{ flex: 1 }}>
            <KernelStatLines state={state} />
          </KernelInset>
        </div>
      </div>

      {/* 下半部分：时间轴 */}
      <div style={{ marginTop: 20 }}>
        <Kicker style={{ marginBottom: 20 }}>TIMELINE · 三个周期的全景</Kicker>
        <Timeline
          periods={state.periods}
          currentPeriodIdx={state.periodIdx}
          currentProgressInPeriod={state.periodProgress}
          width={1760}
          height={64}
        />
      </div>
    </>
  );
};

// ═══════════════════════════════════════════════════════════
// KernelStatLines · 内核伪文件的实时内容
// ═══════════════════════════════════════════════════════════

const KernelStatLines: React.FC<{ state: SimState }> = ({ state }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <StatLine
        label="usage_usec"
        value={state.usageUsec}
        hint="累计运行时长"
        color={terminal.running}
      />
      <StatLine
        label="nr_periods"
        value={state.nrPeriods}
        hint="已完成周期数"
        color={terminal.neutral}
      />
      <StatLine
        label="nr_throttled"
        value={state.nrThrottled}
        hint="发生节流次数"
        color={terminal.blocked}
        pulse={state.justThrottled}
      />
      <StatLine
        label="throttled_usec"
        value={state.throttledUsec}
        hint="累计被节流的时长"
        color={terminal.blocked}
      />

      {/* 分隔线 + 当前周期信息 */}
      <div
        style={{
          marginTop: 10,
          paddingTop: 12,
          borderTop: `1px dashed ${terminal.rule}`,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: 12,
            alignItems: 'baseline',
            color: terminal.textMuted,
            fontSize: fontSizes.codeSmall,
          }}
        >
          <span style={{ color: terminal.textFaint }}># 当前周期</span>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontFamily: fontFamilies.mono,
            fontSize: fontSizes.code,
          }}
        >
          <span style={{ color: terminal.textSoft }}>period_idx</span>
          <span style={{ color: terminal.highlight }}>
            {state.periodIdx + 1}
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontFamily: fontFamilies.mono,
            fontSize: fontSizes.code,
          }}
        >
          <span style={{ color: terminal.textSoft }}>used_this_period</span>
          <span style={{ color: terminal.highlight }}>
            {(state.usedInPeriodUs / 1000).toFixed(1)} ms
          </span>
        </div>
      </div>
    </div>
  );
};

const StatLine: React.FC<{
  label: string;
  value: number;
  hint: string;
  color: string;
  pulse?: boolean;
}> = ({ label, value, hint, color, pulse = false }) => {
  // pulse 为 true 时显示一个稳定的光晕，不做帧级动画——避免闪烁
  const highlightIntensity = pulse ? 0.9 : 0;

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          fontFamily: fontFamilies.mono,
          fontSize: fontSizes.code,
          color: terminal.text,
        }}
      >
        <span style={{ color: terminal.textSoft }}>{label}</span>
        <span
          className="tabular"
          style={{
            color,
            fontWeight: fontWeights.semibold,
            fontFeatureSettings: '"tnum"',
            textShadow: highlightIntensity > 0
              ? `0 0 ${12 * highlightIntensity}px ${color}`
              : 'none',
          }}
        >
          {formatCounter(value)}
        </span>
      </div>
      <div
        style={{
          fontFamily: fontFamilies.sans,
          fontSize: fontSizes.caption,
          color: terminal.textFaint,
          marginTop: 2,
          marginLeft: 4,
        }}
      >
        {hint}
      </div>
    </div>
  );
};

function formatCounter(n: number): string {
  // 大数字加千位分隔线
  return n.toLocaleString('en-US');
}

// ═══════════════════════════════════════════════════════════
// OutroInsight · 洞见金句
// ═══════════════════════════════════════════════════════════

const OutroInsight: React.FC<{ opacity: number }> = ({ opacity }) => {
  const frame = useCurrentFrame();

  const y = interpolate(opacity, [0, 1], [30, 0]);

  return (
    <div
      style={{
        position: 'absolute',
        left: CANVAS_PADDING + 80,
        right: CANVAS_PADDING + 80,
        top: '50%',
        transform: `translateY(calc(-50% + ${y}px))`,
        opacity,
        padding: '48px 56px',
        backgroundColor: paper.surfaceRaised,
        borderRadius: 16,
        boxShadow: paper.shadowDeep,
        border: `1px solid ${paper.rule}`,
      }}
    >
      <Kicker style={{ marginBottom: 16, color: paper.accentWarm }}>
        THE KEY INSIGHT
      </Kicker>
      <Callout style={{ borderLeft: 'none', paddingLeft: 0 }}>
        即使 CPU 完全空闲，quota 用完就必须停——
        <br />
        硬限制以利用率换取可预测性。
      </Callout>
      <div
        style={{
          marginTop: 32,
          fontFamily: fontFamilies.sans,
          fontSize: fontSizes.body,
          color: paper.inkSoft,
          lineHeight: 1.55,
        }}
      >
        对比 <Mono>cpu.weight</Mono>（软限制）：CPU 空闲时进程可以用满 100%，
        只在竞争时按权重分配。
        <span style={{ color: paper.inkMuted }}>
          {' '}
          多租户延迟敏感场景选硬限制，独占高吞吐场景选软限制。
        </span>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// 模拟状态计算
// ═══════════════════════════════════════════════════════════

type SimState = {
  periodIdx: number;           // 0-based 当前周期
  periodProgress: number;      // 0-1 本周期已走的比例
  running: boolean;            // 当前是否在运行
  usedInPeriodUs: number;      // 本周期已用 quota（μs）
  usageUsec: number;           // 累计运行时长
  throttledUsec: number;       // 累计节流时长
  nrPeriods: number;
  nrThrottled: number;
  justThrottled: boolean;      // 本帧刚刚进入 throttled 状态
  periods: { runMs: number; throttledMs: number; periodMs: number }[];
};

function computeSimState(args: {
  frame: number;
  simStart: number;
  simEnd: number;
  periodFrames: number;
  periodCount: number;
  config: CpuThrottleConfig;
}): SimState {
  const { frame, simStart, simEnd, periodFrames, periodCount, config } = args;

  // intro 阶段：空的初始状态
  if (frame < simStart) {
    return emptyState(periodCount, config.periodUs);
  }

  // outro 阶段：固定在最后一帧的状态
  const clampedFrame = Math.min(frame, simEnd - 1);
  const simFrame = clampedFrame - simStart;

  const periodIdx = Math.min(periodCount - 1, Math.floor(simFrame / periodFrames));
  const frameInPeriod = simFrame - periodIdx * periodFrames;
  const progressInPeriod = frameInPeriod / periodFrames;

  // 每个周期：前 50% 运行，后 50% 节流
  const running = progressInPeriod < 0.5;
  const justThrottled =
    !running &&
    progressInPeriod < 0.5 + 2 / periodFrames; // 刚跨过一瞬

  // 本周期已用 quota
  const usedInPeriodUs = running
    ? (progressInPeriod / 0.5) * config.quotaUs
    : config.quotaUs;

  // 累计计数器（包含已完成的周期 + 本周期进行中的部分）
  let usageUsec = 0;
  let throttledUsec = 0;
  for (let i = 0; i < periodIdx; i++) {
    usageUsec += config.quotaUs;
    throttledUsec += config.periodUs - config.quotaUs;
  }
  usageUsec += usedInPeriodUs;
  if (!running) {
    const throttledProgress = (progressInPeriod - 0.5) / 0.5;
    throttledUsec += throttledProgress * (config.periodUs - config.quotaUs);
  }

  const nrPeriods = periodIdx + (progressInPeriod >= 1 ? 1 : 0);
  const nrThrottled = periodIdx + (!running ? 1 : 0);

  // 整个时间轴上每个周期的状态
  const periods = Array.from({ length: periodCount }, (_, i) => {
    if (i < periodIdx) {
      return {
        runMs: config.quotaUs / 1000,
        throttledMs: (config.periodUs - config.quotaUs) / 1000,
        periodMs: config.periodUs / 1000,
      };
    }
    if (i === periodIdx) {
      const runMs = running
        ? (progressInPeriod / 0.5) * (config.quotaUs / 1000)
        : config.quotaUs / 1000;
      const throttledMs = running
        ? 0
        : ((progressInPeriod - 0.5) / 0.5) *
          ((config.periodUs - config.quotaUs) / 1000);
      return {
        runMs,
        throttledMs,
        periodMs: config.periodUs / 1000,
      };
    }
    return { runMs: 0, throttledMs: 0, periodMs: config.periodUs / 1000 };
  });

  return {
    periodIdx,
    periodProgress: progressInPeriod,
    running,
    usedInPeriodUs,
    usageUsec: Math.round(usageUsec),
    throttledUsec: Math.round(throttledUsec),
    nrPeriods,
    nrThrottled,
    justThrottled,
    periods,
  };
}

function emptyState(periodCount: number, periodUs: number): SimState {
  return {
    periodIdx: 0,
    periodProgress: 0,
    running: true,
    usedInPeriodUs: 0,
    usageUsec: 0,
    throttledUsec: 0,
    nrPeriods: 0,
    nrThrottled: 0,
    justThrottled: false,
    periods: Array.from({ length: periodCount }, () => ({
      runMs: 0,
      throttledMs: 0,
      periodMs: periodUs / 1000,
    })),
  };
}
