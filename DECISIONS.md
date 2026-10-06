# 架构决策记录

## ADR-001：本轮动画升级范围锁定为三道已有题目
- 状态：已决定
- 日期：2026-03-21
- 背景：用户要求使用 `autopilot.md` 实现“更易理解算法原理”的 Remotion 动画生成需求，但未指定单一道题。当前工作区中 `0208.ImplementTrie`、`0239.SlidingWindowMaximum`、`0103.binary-tree-zigzag-level-order-traversal` 均已有 README、旧版 Composition/Visualizer 与导出视频，且分别代表 Trie、单调双端队列、树 BFS 三类典型可视化模式。
- 候选方案：
  - 方案 A：只升级一道题，风险低但无法验证新规范在不同题型上的泛化能力。
  - 方案 B：一次性升级全部题目，覆盖面最大但范围过大，不符合最小可交付原则。
  - 方案 C：升级三道代表性题目，覆盖多种认知模式，同时保持可在单轮内完成。
- 最终决定：采用方案 C，先升级三道代表性题目，并产出对应 `animation.mp4`。
- 代价与妥协：本轮不会把新规范立即推广到所有已有题目；其余题目后续可按同样模式增量迁移。
- 推翻条件：如果用户明确要求仅处理单一道题，或要求批量升级全部题目，则需要重估范围。
- 影响范围：`algo-visualizer/src/compositions/ImplementTrie.tsx`、`algo-visualizer/src/components/ImplementTrieVisualizer.tsx`、`algo-visualizer/src/compositions/SlidingWindowMax.tsx`、`algo-visualizer/src/components/SlidingWindowMaxVisualizer.tsx`、`algo-visualizer/src/compositions/ZigzagLevelOrder.tsx`、`algo-visualizer/src/components/ZigzagLevelOrderVisualizer.tsx`、`algo-visualizer/src/index.tsx`，以及三道题目录下的 `animation.mp4`。
- 探针验证：不需要

## ADR-002：采用“认知骨架 + 教学步骤”的 step 模型替代普通执行日志
- 状态：已决定
- 日期：2026-03-21
- 背景：现有动画虽然能展示算法过程，但多数 step 更像操作日志，缺少阶段、决策依据、不变量、答案推进等教学信息，导致用户只能“看到过程”，很难“理解为什么这么做”。
- 候选方案：
  - 方案 A：沿用现有 step 结构，只优化文案和样式。
  - 方案 B：重构 step 结构，让每一步显式携带 phase、focus、action、why、delta、invariant、progress 等教学语义。
  - 方案 C：不在 step 中存解释，改为 Visualizer 运行时动态推断。
- 最终决定：采用方案 B。解释语义直接固化在每个 step 中，保证 Composition 生成的是“可教”的状态序列，而不是“可播”的状态序列。
- 代价与妥协：step 数据会更长，Composition 生成逻辑更复杂，但换来更稳定的一致性和更强的可视化可控性。
- 推翻条件：如果后续证实某类题目无法承受过多预计算状态，才考虑把部分说明迁移到 Visualizer 运行时计算。
- 影响范围：三道题的 step 类型定义、step 生成逻辑、说明文案、结果区与图例区展示。
- 探针验证：不需要

## ADR-003：按题型定制可视化布局，而不是复用统一模板
- 状态：已决定
- 日期：2026-03-21
- 背景：用户明确要求禁止“所有题套同一模板”。不同题型的认知负担不同，Trie 需要看路径和词尾标记，滑动窗口最大值需要看窗口范围和双端队列淘汰逻辑，锯齿层序遍历需要看树、队列、当前层写入位置与方向翻转。
- 候选方案：
  - 方案 A：统一布局，靠局部组件替换。
  - 方案 B：共享深色主题与颜色语义，但每题单独设计核心数据结构区和辅助信息区。
  - 方案 C：高度自由设计，不保留任何统一视觉语言。
- 最终决定：采用方案 B。统一主题、色彩语义和信息区层级，但为每道题分别设计核心视觉表达。
- 代价与妥协：组件间可复用性会降低，但用户理解成本更低。
- 推翻条件：如果未来出现大量同构题型，可在保持语义一致的前提下抽象局部通用组件。
- 影响范围：三道题的 Visualizer 布局、图例、色彩语义、信息分区和当前步骤说明区。
- 探针验证：不需要

## ADR-004：通过强调步重复与更长停留来突出关键转折
- 状态：已决定
- 日期：2026-03-21
- 背景：现有动画采用固定步长，导致关键步骤与普通过渡的注意力权重相同，不利于用户抓住真正的算法命门。
- 候选方案：
  - 方案 A：全部 step 统一时长。
  - 方案 B：为关键转折额外插入强调 step，在不引入复杂动态时长计算的前提下拉长关键停留。
  - 方案 C：为每个 step 单独存 frameDuration，并在 Visualizer 中实现可变时长映射。
- 最终决定：采用方案 B。保留简单的 `durationPerStep` 机制，同时用额外 step 放大关键决策点。
- 代价与妥协：step 数量会上升，但实现简单且可控。
- 推翻条件：如果后续出现大量需要非均匀节奏的视频，可改为 `frameOffsets` 或 `durations[]` 驱动。
- 影响范围：step 生成策略、Composition 时长估算、关键解释帧数量。
- 探针验证：不需要
