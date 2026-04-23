'use client';

/**
 * Prompt 模板管理
 *
 * 用户可以新增/编辑/删除自己的 user-prompt 模板，系统内置两个只读模板
 * 作为起点（算法题深度解析 / 系统技术深度讲解）——是之前 lib/llm/prompt.ts
 * 里 `buildUserPrompt` 硬编码分支的 1:1 迁移。
 *
 * 设计取舍（参考 2026-04 的讨论）：
 *   - **只暴露 user prompt**。SYSTEM_PROMPT 继续锁死在 lib/llm/prompt.ts，
 *     它承担"把输出钉死到我们的 TopicScript schema"的职责。用户在
 *     这里编辑模板只会影响"讲什么 / 从哪个角度讲"，不会把 schema 改坏
 *     导致视频渲染崩。
 *   - **内置模板只读可复制**。用户没法误删内置样板；想改的话点"复制"
 *     出一份可编辑的 custom 模板。
 *   - **占位符只支持 `{{topic}}`**。后续要扩展（例如 {{duration}} /
 *     {{language}}）在 renderTemplate 里加就行。
 *   - **存储走 localStorage**，和 settings 一个机制：个人学习工具可接受。
 */

export type PromptTemplate = {
  /** 稳定 ID。内置用 "builtin:xxx" 前缀，自定义用 "custom:" + 时间戳 */
  id: string;
  /** 展示名 */
  name: string;
  /** 一句话说明这个模板是拿来干嘛的 */
  description?: string;
  /**
   * User prompt 模板正文。支持占位符：
   *   {{topic}}   —— 用户在 /new 页输入的主题词
   * 其它占位符会被原样保留（方便将来扩展）。
   */
  userPromptTemplate: string;
  /** true = 内置样板，不可删除/编辑；false = 用户自定义 */
  builtin: boolean;
  /** ISO 时间串 */
  createdAt: string;
  updatedAt: string;
};

/**
 * 内置：算法题深度解析
 * 迁移自旧 buildUserPrompt 的 isAlgorithmTopic 分支。
 */
const BUILTIN_ALGORITHM: PromptTemplate = {
  id: 'builtin:algorithm',
  name: '算法题深度解析',
  description:
    'LeetCode / 经典算法题：暴力 vs 优化、复杂度权衡、模式识别。适合具体题目或算法名',
  builtin: true,
  createdAt: '2026-04-22T00:00:00.000Z',
  updatedAt: '2026-04-22T00:00:00.000Z',
  userPromptTemplate: `算法题：{{topic}}

请为这个算法题生成一份 3-5 分钟的深度解析 TopicScript JSON。

## 叙事结构（8-14 个场景）

1. **开场 · counterfactual**（1-2 scenes）
   - 暴力解法的复杂度具体是多少？在 n = 10^5 时会跑多久？
   - 为什么暴力不可接受？（TLE / OOM / 实际业务场景不能等）
2. **问题抽象 · data_structure / timeline**（1-2 scenes）
   - 把输入画出来：数组长什么样、约束是什么、输出要什么
   - 暴力解法怎么暴力的，瓶颈在哪一步
3. **关键洞见 · counterfactual / insight 式场景**（1 scene）
   - 点出"如果我们预先知道 X 就能省下 Y" 这种核心观察
4. **优化算法 · data_structure + timeline + decision_flow**（3-5 scenes）
   - 核心数据结构：哈希表/单调栈/线段树/DP 表怎么设计
   - 执行过程：指针移动、窗口扩缩、状态转移逐帧演示
   - 关键决策点：什么时候收缩、什么时候更新答案
5. **复杂度分析 · gauge / timeline**（1 scene）
   - 时间/空间复杂度具体是多少，对比暴力解法
6. **模式识别 · insight**（1 scene）
   - 这道题属于哪类套路？在哪些题里还会出现？
   - openQuestion：变种问题、边界条件思考

## 场景选择建议

- 数组/字符串题：优先考虑 timeline + data_structure（展示指针移动或哈希表加速）
- 链表/树题：优先考虑 data_structure（展示节点连接关系）
- 动态规划：优先考虑 timeline（展示填表过程）或 decision_flow（状态转移）
- 回溯/递归：优先考虑 decision_flow（展示决策树剪枝）
- 二分/分治：优先考虑 decision_flow（展示分支判断）
- 排序题：优先考虑 timeline（展示元素交换/归并过程）
- 图论题：优先考虑 data_structure（展示图的邻接关系）或 timeline（展示遍历顺序）

## 硬性规则

- scenes 数组 8-14 个场景
- 总时长 180-300 秒（3-5 分钟）
- 必须输出合法 JSON，不要有任何 markdown 代码块包裹，不要解释性文字
- 中文用词精准有力，避免"这个东西很复杂"这类空话
- kicker 用全大写短词 或少量大写拉丁 + 中文点缀
- heading 里不要包含完整代码，只写算法思想或步骤名称
- 至少用到 4 种不同的 scene type

直接输出 TopicScript JSON，不要任何其他文字。`,
};

/**
 * 内置：系统/通用技术深度讲解
 * 迁移自旧 buildUserPrompt 的 fallback 分支 + 补强（之前那段过于简短）。
 */
const BUILTIN_SYSTEM: PromptTemplate = {
  id: 'builtin:system',
  name: '系统技术深度讲解',
  description:
    'epoll / RAFT / cgroup / B+ 树等系统/基础设施主题：演化历史、核心机制、设计决策',
  builtin: true,
  createdAt: '2026-04-22T00:00:00.000Z',
  updatedAt: '2026-04-22T00:00:00.000Z',
  userPromptTemplate: `技术主题：{{topic}}

请为这个主题生成一份 3-5 分钟的深度讲解 TopicScript JSON。

## 叙事骨架

1. **反事实开场 · counterfactual**（1-2 scenes）
   - 没有它之前工程师怎么办？具体到失败的工作流或性能数字
   - 为什么老方案撑不住了（规模 / 硬件 / 业务复杂度）
2. **历史锚点 · timeline / decision_flow**（可选 1 scene）
   - 哪一年、什么人、出于什么动机；同时期竞品和胜出原因
3. **核心机制 · data_structure / timeline / kernel_journey / layered_stack**（3-5 scenes）
   - 把关键数据结构画出来，运行时流程拆步骤，分层技术用 layered_stack
4. **设计决策 · decision_flow / gauge**（1-3 scenes）
   - 拒绝了哪些替代方案？为什么？什么场景下反而会吃亏
5. **金句收尾 · insight**（1 scene）
   - 一句话概括本质，留一个引发思考的 openQuestion

## 内容密度要求

- 文字要具体：不说"性能很好"，说"从 O(n) 降到 O(log n)"、"从 10ms 降到 0.3ms"
- 必须回答"为什么"，不说"用红黑树"，说"选红黑树而不是 AVL，因为写多读少场景下旋转次数更少"
- 要有可验证的具体：年份、内核版本号、论文作者、commit hash、具体硬件、具体业务场景
- 删虚词："从而"、"因此"、"总的来说"、"我们可以看到"
- data_structure 的 label/subLabel 要写字段名、容量、复杂度，不要"节点1"
- kernel_journey 的 description 每步 2-4 句，讲清楚内核改了什么、为什么这么改

## 硬性规则

- scenes 8-14 个，总时长 180-300 秒
- 至少用到 4 种不同的 scene type
- 必须输出合法 JSON，不要 markdown 代码块包裹，不要解释性文字
- 中文用词精准有力

直接输出 TopicScript JSON，不要任何其他文字。`,
};

export const BUILTIN_TEMPLATES: readonly PromptTemplate[] = [
  BUILTIN_ALGORITHM,
  BUILTIN_SYSTEM,
];

/** localStorage 实际存的结构。内置模板不进 storage，只存用户自定义 + activeId。 */
type StoredPromptState = {
  custom: PromptTemplate[];
  /** 当前在 /new 页选中的模板 id；可能指向内置或自定义 */
  activeId: string;
};

const STORAGE_KEY = 'dao-studio:prompts';

function defaultState(): StoredPromptState {
  return {
    custom: [],
    activeId: BUILTIN_ALGORITHM.id,
  };
}

function loadState(): StoredPromptState {
  if (typeof window === 'undefined') return defaultState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw) as Partial<StoredPromptState>;
    return {
      custom: Array.isArray(parsed.custom) ? parsed.custom : [],
      activeId: typeof parsed.activeId === 'string' ? parsed.activeId : BUILTIN_ALGORITHM.id,
    };
  } catch {
    return defaultState();
  }
}

function saveState(state: StoredPromptState): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  window.dispatchEvent(new Event('dao-studio:prompts-changed'));
}

/**
 * 返回完整模板列表（内置 + 自定义），内置永远在前。
 * 纯函数，不动 storage。
 */
export function listPrompts(): PromptTemplate[] {
  const { custom } = loadState();
  return [...BUILTIN_TEMPLATES, ...custom];
}

/** 找不到就 fallback 到内置第一个 —— 避免拿到 undefined 让上层处理 null 检查。 */
export function getPromptById(id: string): PromptTemplate {
  const all = listPrompts();
  return all.find((p) => p.id === id) ?? BUILTIN_TEMPLATES[0];
}

export function getActivePromptId(): string {
  return loadState().activeId;
}

export function setActivePromptId(id: string): void {
  const state = loadState();
  // 只接受确实存在的 id，否则留原值
  const all = [...BUILTIN_TEMPLATES, ...state.custom];
  if (!all.some((p) => p.id === id)) return;
  state.activeId = id;
  saveState(state);
}

/**
 * 新增自定义模板。返回新模板（已带 id）。
 * 注意：传入的 partial 不需要 id / createdAt / updatedAt / builtin，由这里生成。
 */
export function createPrompt(partial: {
  name: string;
  description?: string;
  userPromptTemplate: string;
}): PromptTemplate {
  const now = new Date().toISOString();
  const tpl: PromptTemplate = {
    id: 'custom:' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7),
    name: partial.name.trim() || '未命名模板',
    description: partial.description?.trim() || undefined,
    userPromptTemplate: partial.userPromptTemplate,
    builtin: false,
    createdAt: now,
    updatedAt: now,
  };
  const state = loadState();
  state.custom = [...state.custom, tpl];
  saveState(state);
  return tpl;
}

/**
 * 更新现有自定义模板。内置模板改不了（调用者应该先 duplicatePrompt）。
 * 返回 true = 已更新，false = 找不到 or 试图改内置。
 */
export function updatePrompt(
  id: string,
  partial: Partial<Pick<PromptTemplate, 'name' | 'description' | 'userPromptTemplate'>>,
): boolean {
  if (id.startsWith('builtin:')) return false;
  const state = loadState();
  const idx = state.custom.findIndex((p) => p.id === id);
  if (idx < 0) return false;
  const old = state.custom[idx];
  state.custom[idx] = {
    ...old,
    ...partial,
    // 清洗传入字段：空字符串 description 视为删除
    description:
      partial.description !== undefined
        ? partial.description.trim() || undefined
        : old.description,
    name: partial.name !== undefined ? partial.name.trim() || old.name : old.name,
    updatedAt: new Date().toISOString(),
  };
  saveState(state);
  return true;
}

export function deletePrompt(id: string): boolean {
  if (id.startsWith('builtin:')) return false;
  const state = loadState();
  const next = state.custom.filter((p) => p.id !== id);
  if (next.length === state.custom.length) return false;
  state.custom = next;
  // 如果删的是当前 active，回退到内置第一个
  if (state.activeId === id) state.activeId = BUILTIN_TEMPLATES[0].id;
  saveState(state);
  return true;
}

/**
 * 复制一份（内置或自定义都可以）。生成新 id，名字加后缀 "（副本）"，
 * builtin = false 总是可编辑。用于"我想改内置模板"的场景。
 */
export function duplicatePrompt(id: string): PromptTemplate | null {
  const src = getPromptById(id);
  // getPromptById 的 fallback 保证非 null，但防御性处理一下空列表
  if (!src) return null;
  return createPrompt({
    name: src.name + '（副本）',
    description: src.description,
    userPromptTemplate: src.userPromptTemplate,
  });
}

/**
 * 占位符渲染：把模板里的 `{{topic}}` 等换成实际值。
 * 未定义的占位符**原样保留**，而不是换成空字符串——
 * 这样用户写错占位符名字（比如 {{tpic}}）更容易发现。
 */
export function renderTemplate(
  template: string,
  vars: Record<string, string>,
): string {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key: string) => {
    if (key in vars) return vars[key];
    return match;
  });
}

// -------------------------------------------------------------------------
// 模板变量 · 元数据 + 值持久化
// -------------------------------------------------------------------------

/**
 * 模板支持的变量元数据。
 *
 * 加新变量时**只改这里**：UI（/new 折叠区、/prompts 预览区、占位符提示文案）
 * 会自动把新变量的输入框和占位符名渲染出来。
 *
 * 设计取舍：
 *   - 全部用 text input（不用 select/radio），保留最大灵活性。
 *     用户想写 "90 秒快闪" / "30 分钟深度课" 都行，不被我们的选项框死。
 *   - topic 也定义在这里是为了元数据统一，但它在 UI 里是"主输入框"，
 *     `alwaysShown: true` 标记它不进"高级变量"折叠区。
 */
export type TemplateVariable = {
  /** 占位符名称（不带 {{}}），模板里写 {{key}} 就会被替换 */
  key: string;
  /** UI 标签 */
  label: string;
  /** input placeholder */
  placeholder: string;
  /** 初始默认值（用户没改过时用） */
  defaultValue: string;
  /** 一句话说明这个变量是干嘛的，展示在 UI 上帮助用户理解 */
  hint?: string;
  /**
   * 是否在 /new 主流程永远显示（true）。
   * false 的进"高级变量"折叠区，默认折叠避免干扰主流程。
   */
  alwaysShown?: boolean;
};

export const TEMPLATE_VARIABLES: readonly TemplateVariable[] = [
  {
    key: 'topic',
    label: '主题',
    placeholder: '例：epoll / B+ 树 / RAFT',
    defaultValue: '',
    hint: '必填，视频讲的东西',
    alwaysShown: true,
  },
  {
    key: 'duration',
    label: '时长',
    placeholder: '3-5 分钟',
    defaultValue: '3-5 分钟',
    hint: '期望的视频时长描述。注意：若和模板里的硬性规则冲突，以模板为准',
  },
  {
    key: 'language',
    label: '语言',
    placeholder: '中文',
    defaultValue: '中文',
    hint: '脚本的输出语言。支持 "中文" / "English" / "中英双语" 等',
  },
  {
    key: 'audience',
    label: '目标观众',
    placeholder: '有一定基础的工程师',
    defaultValue: '有一定基础的工程师',
    hint: '决定讲解的深度和术语密度。例："资深内核开发者" / "大学本科生"',
  },
];

/** 所有非 topic 的变量，用于 UI 折叠区生成 */
export const ADVANCED_VARIABLES: readonly TemplateVariable[] = TEMPLATE_VARIABLES.filter(
  (v) => !v.alwaysShown,
);

/** 变量值字典：key → 字符串值 */
export type PromptVars = Record<string, string>;

const VARS_STORAGE_KEY = 'dao-studio:prompt-vars';

/** 返回所有变量的默认值字典（不含 topic，topic 每次用户自己填） */
export function defaultPromptVars(): PromptVars {
  const out: PromptVars = {};
  for (const v of TEMPLATE_VARIABLES) {
    if (v.alwaysShown) continue;
    out[v.key] = v.defaultValue;
  }
  return out;
}

/**
 * 读取持久化的变量值。找不到 / 损坏时回退默认。
 * 自动补齐新增变量的默认值（增量兼容），旧字段即使没了也不会崩。
 */
export function getPromptVars(): PromptVars {
  const def = defaultPromptVars();
  if (typeof window === 'undefined') return def;
  try {
    const raw = localStorage.getItem(VARS_STORAGE_KEY);
    if (!raw) return def;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    // 合并：保留用户已存的字符串值，忽略非法类型，补上新增变量的默认值
    const merged: PromptVars = { ...def };
    for (const [k, v] of Object.entries(parsed)) {
      if (typeof v === 'string') merged[k] = v;
    }
    return merged;
  } catch {
    return def;
  }
}

export function savePromptVars(vars: PromptVars): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(VARS_STORAGE_KEY, JSON.stringify(vars));
  window.dispatchEvent(new Event('dao-studio:prompt-vars-changed'));
}
