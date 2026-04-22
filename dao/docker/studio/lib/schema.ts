/**
 * TopicScript Schema · studio 自己的视频描述语言定义
 *
 * 设计原则：
 *   1. 纯数据结构，无函数、无 Map/Set、无 Date——LLM 能可靠输出 JSON
 *   2. 判别联合（type 字段）让类型推导清晰
 *   3. 字段数量受控，防止 LLM 在细节上发挥过度
 *   4. 时间单位统一为秒（视频坐标系），避免帧数心智负担
 *
 * 注意：这份 schema 必须和 visualizer 侧的 `visualizer/src/schema/types.ts`
 * 保持兼容（字段名、类型、取值枚举完全一致），否则 studio 生成的
 * TopicScript 用 visualizer CLI 渲染会失败。两边版本当前都锁在
 * schemaVersion: 1。任何 schema 变更必须同时改两边并同步 bump 版本号。
 *
 * 为什么不再从 visualizer re-export：
 *   之前 studio 通过 `../../visualizer/src/schema/types` 直接引入类型，
 *   导致 webpack 打包时可能顺着 visualizer 目录解析到第二份 Remotion，
 *   触发 `🚨 Multiple versions of Remotion detected` 运行时异常。
 *   现在 studio 和 visualizer 在代码层面完全独立——Remotion 只由
 *   visualizer 通过 /api/render 的 CLI 子进程使用，不进入 studio 的 bundle。
 */

// ═══════════════════════════════════════════════════════════
// 顶层：TopicScript
// ═══════════════════════════════════════════════════════════

export type TopicScript = {
  /** slug, URL-safe. 例 "epoll" "b-plus-tree" */
  id: string;
  /** 原始主题词，用户输入的那个 */
  topic: string;
  /** 视频主标题。例 "epoll · 从轮询到事件通知" */
  title: string;
  /** 副标题，可选。通常是一句话概括"这个东西的本质" */
  subtitle?: string;
  /** kicker，首屏上方的小标签。例 "LINUX · 内核 I/O 多路复用" */
  kicker?: string;
  /** 场景序列（按时间顺序播放） */
  scenes: Scene[];
  /** 生成元信息 */
  meta: ScriptMeta;
};

export type ScriptMeta = {
  /** ISO 8601 字符串 */
  createdAt: string;
  /** schema 版本，未来升级用 */
  schemaVersion: 1;
  /** 生成本脚本的 LLM 提供方和模型 */
  generatedBy?: {
    provider: string;
    model: string;
  };
};

// ═══════════════════════════════════════════════════════════
// 场景基础字段
// ═══════════════════════════════════════════════════════════

export type SceneBase = {
  /** 本场景时长（秒） */
  duration: number;
  /** 场景顶部的 kicker（可选）。例 "MECHANISM" "THE KEY INSIGHT" */
  kicker?: string;
  /** 场景标题（可选）。serif 大字 */
  heading?: string;
};

// ═══════════════════════════════════════════════════════════
// 8 种场景原语
// ═══════════════════════════════════════════════════════════

/**
 * 1. Counterfactual · "没有它之前，世界是什么样的"
 *    用于开场，制造问题意识。
 */
export type CounterfactualScene = SceneBase & {
  type: 'counterfactual';
  /** 没有这个技术时的痛点场景 */
  problemStatement: string;
  /** 这个痛点带来的后果 */
  consequence: string;
  /** 引出主题的过渡句（可选） */
  transition?: string;
};

/**
 * 2. Timeline · 时间轴上的过程
 */
export type TimelineScene = SceneBase & {
  type: 'timeline';
  unit: string;
  segments: TimelineSegment[];
  markers?: TimelineMarker[];
};

export type TimelineSegment = {
  label: string;
  weight: number;
  tone: 'running' | 'blocked' | 'neutral' | 'accent';
  note?: string;
};

export type TimelineMarker = {
  label: string;
  at: number;
};

/**
 * 3. DataStructure · 数据结构关系图
 */
export type DataStructureScene = SceneBase & {
  type: 'data_structure';
  nodes: DataNode[];
  edges: DataEdge[];
  reveal: 'sequential' | 'all_at_once';
};

export type DataNode = {
  id: string;
  label: string;
  subLabel?: string;
  tone: 'primary' | 'secondary' | 'accent' | 'muted';
  kernel?: boolean;
};

export type DataEdge = {
  from: string;
  to: string;
  label?: string;
  kind: 'references' | 'contains' | 'points_to' | 'derives';
};

/**
 * 4. DecisionFlow · 决策流程图
 */
export type DecisionFlowScene = SceneBase & {
  type: 'decision_flow';
  entry: string;
  nodes: DecisionNode[];
  highlightPath?: string[];
};

export type DecisionNode = {
  id: string;
  text: string;
  kind: 'condition' | 'action' | 'outcome';
  branches: { to: string; label: string }[];
  tone?: 'good' | 'bad' | 'neutral';
};

/**
 * 5. Gauge · 阈值/压力表
 */
export type GaugeScene = SceneBase & {
  type: 'gauge';
  unit: string;
  max: number;
  thresholds: GaugeThreshold[];
  trajectory: { atSecond: number; value: number }[];
};

export type GaugeThreshold = {
  label: string;
  value: number;
  tone: 'safe' | 'warning' | 'danger';
};

/**
 * 6. LayeredStack · 分层叠加
 */
export type LayeredStackScene = SceneBase & {
  type: 'layered_stack';
  layers: StackLayer[];
  operations?: StackOperation[];
};

export type StackLayer = {
  label: string;
  subLabel?: string;
  tone: 'primary' | 'secondary' | 'accent' | 'muted';
};

export type StackOperation = {
  atSecond: number;
  fromLayer: number;
  toLayer: number;
  label: string;
  kind: 'read' | 'write' | 'copy_up' | 'propagate';
};

/**
 * 7. KernelJourney · 内核之旅
 */
export type KernelJourneyScene = SceneBase & {
  type: 'kernel_journey';
  userAction: string;
  steps: JourneyStep[];
};

export type JourneyStep = {
  title: string;
  description: string;
  code?: string;
};

/**
 * 8. Insight · 洞见金句
 */
export type InsightScene = SceneBase & {
  type: 'insight';
  insight: string;
  supporting?: string;
  openQuestion?: string;
};

// ═══════════════════════════════════════════════════════════
// 判别联合
// ═══════════════════════════════════════════════════════════

export type Scene =
  | CounterfactualScene
  | TimelineScene
  | DataStructureScene
  | DecisionFlowScene
  | GaugeScene
  | LayeredStackScene
  | KernelJourneyScene
  | InsightScene;

export type SceneType = Scene['type'];

export type SceneOf<T extends SceneType> = Extract<Scene, { type: T }>;
