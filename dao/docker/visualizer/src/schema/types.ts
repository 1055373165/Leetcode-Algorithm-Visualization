/**
 * 场景 Schema · visualizer 和 studio 共享的"视频描述语言"
 *
 * 设计原则：
 *   1. 纯数据结构，无函数、无 Map/Set、无 Date——LLM 能可靠输出 JSON
 *   2. 判别联合（type 字段）让类型推导清晰，便于 GenericScenePlayer 分派
 *   3. 字段数量受控，防止 LLM 在细节上发挥过度
 *   4. 时间单位统一为秒（视频坐标系），避免帧数心智负担
 *
 * LLM 输出这个 schema → GenericScenePlayer 消费这个 schema → Remotion 渲染视频
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
 *    用于"随时间变化"的主题：CPU 节流、请求生命周期、握手协议等。
 */
export type TimelineScene = SceneBase & {
  type: 'timeline';
  /** 单位名称。例 "ms" "s" "周期" */
  unit: string;
  /** 时间条上按顺序发生的区段 */
  segments: TimelineSegment[];
  /** 关键时刻（在时间轴上标记） */
  markers?: TimelineMarker[];
};

export type TimelineSegment = {
  label: string;
  /** 占时间轴的比例（0-1）；所有 segments 加起来应该 ≈ 1 */
  weight: number;
  /** 语义颜色 */
  tone: 'running' | 'blocked' | 'neutral' | 'accent';
  /** 短描述（可选），动画播到这里时显示 */
  note?: string;
};

export type TimelineMarker = {
  label: string;
  /** 位置（0-1） */
  at: number;
};

/**
 * 3. DataStructure · 数据结构关系图
 *    用于"X 指向 Y，Y 包含 Z"这类拓扑主题：task_struct → css_set、红黑树等。
 */
export type DataStructureScene = SceneBase & {
  type: 'data_structure';
  /** 节点列表。渲染成带标签的盒子 */
  nodes: DataNode[];
  /** 节点间的关系。箭头连接 */
  edges: DataEdge[];
  /** 显示策略 */
  reveal: 'sequential' | 'all_at_once';
};

export type DataNode = {
  /** 节点 ID，edges 通过 ID 引用 */
  id: string;
  /** 盒子上的主要标签 */
  label: string;
  /** 副标签（可选），比如字段名或类型 */
  subLabel?: string;
  /** 视觉强调 */
  tone: 'primary' | 'secondary' | 'accent' | 'muted';
  /** 是否在深色 kernel 面板里（内核数据结构 → true） */
  kernel?: boolean;
};

export type DataEdge = {
  from: string;
  to: string;
  /** 边上的文字 */
  label?: string;
  /** 边的类型 */
  kind: 'references' | 'contains' | 'points_to' | 'derives';
};

/**
 * 4. DecisionFlow · 决策流程图
 *    用于分支逻辑：OOM 决策、路由、算法分支等。
 */
export type DecisionFlowScene = SceneBase & {
  type: 'decision_flow';
  /** 流程的起始节点描述 */
  entry: string;
  /** 决策节点列表（扁平结构，用 id 引用关系） */
  nodes: DecisionNode[];
  /** 高亮展示的"主路径"，按 ID 顺序 */
  highlightPath?: string[];
};

export type DecisionNode = {
  id: string;
  /** 节点上的问题或动作 */
  text: string;
  /** 节点类型 */
  kind: 'condition' | 'action' | 'outcome';
  /**
   * 子节点引用 + 分支标签。可选：
   * - condition/action 节点会填
   * - outcome（终点）节点语义上就没下游，经常省略
   * LLM 按这个准则生成最自然，运行时组件用 `?.find(...)` 兜底。
   */
  branches?: { to: string; label: string }[];
  /** 结果节点的语义色（仅当 kind === 'outcome' 时生效） */
  tone?: 'good' | 'bad' | 'neutral';
};

/**
 * 5. Gauge · 阈值/压力表
 *    用于资源压力类：memory.low/high/max、CPU 使用率、网络拥塞等。
 */
export type GaugeScene = SceneBase & {
  type: 'gauge';
  /** 量纲名 */
  unit: string;
  /** 表的最大刻度 */
  max: number;
  /** 阈值线（按 value 升序） */
  thresholds: GaugeThreshold[];
  /** 值的时间序列，动画会按序走过 */
  trajectory: { atSecond: number; value: number }[];
};

export type GaugeThreshold = {
  label: string;
  value: number;
  tone: 'safe' | 'warning' | 'danger';
};

/**
 * 6. LayeredStack · 分层叠加
 *    用于层叠结构：OverlayFS、OSI、镜像层、协议栈等。
 */
export type LayeredStackScene = SceneBase & {
  type: 'layered_stack';
  /** 从底到顶的层 */
  layers: StackLayer[];
  /** 可选的"操作"序列，动画演示层间交互（例 CoW、数据包穿透） */
  operations?: StackOperation[];
};

export type StackLayer = {
  label: string;
  /** 副标签（例 "Read-only" "Read-write"） */
  subLabel?: string;
  tone: 'primary' | 'secondary' | 'accent' | 'muted';
};

export type StackOperation = {
  atSecond: number;
  /** 从哪层移动/读/写 */
  fromLayer: number;
  /** 到哪层（可与 from 相同，表示只在该层操作） */
  toLayer: number;
  label: string;
  kind: 'read' | 'write' | 'copy_up' | 'propagate';
};

/**
 * 7. KernelJourney · 内核之旅
 *    用于"一个命令/调用进入内核后发生了什么"：echo PID > cgroup.procs、open(2) 等。
 *    每步可能带有代码片段，整体在深色 kernel 面板里展开。
 */
export type KernelJourneyScene = SceneBase & {
  type: 'kernel_journey';
  /** 触发入口（用户空间动作）。例 `echo 1234 > cgroup.procs` */
  userAction: string;
  /** 内核里的步骤序列 */
  steps: JourneyStep[];
};

export type JourneyStep = {
  /** 步骤标题 */
  title: string;
  /** 内核做了什么的说明文字 */
  description: string;
  /** 可选的内核函数名或相关代码片段 */
  code?: string;
};

/**
 * 8. Insight · 洞见金句
 *    用于结尾，把整个视频的核心论点固化。
 */
export type InsightScene = SceneBase & {
  type: 'insight';
  /** 主洞见（衬线引用风格） */
  insight: string;
  /** 支持性说明（可选） */
  supporting?: string;
  /** 留给观众的问题（可选） */
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

/** 提取某个 type 对应的具体 Scene 子类型 */
export type SceneOf<T extends SceneType> = Extract<Scene, { type: T }>;
