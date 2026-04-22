# Dao Studio · 多主题技术视频工作室

**输入任意技术主题 → AI 流式生成 3-5 分钟视频脚本 → CLI 渲染 MP4 → 管理 + 间隔复习**

本目录（studio/）与同级目录 `dao/docker/visualizer/` **在代码层面完全独立**：

- **studio/**（本目录）：Next.js 前端 + LLM 网关 + 数据管理。**前端 bundle 里不包含 Remotion**。
- **visualizer/**：Remotion 渲染引擎 + 8 种场景原语。仅被 studio 的 `/api/render` 以**子进程**形式调用。

两者唯一的运行时接口是 `TopicScript` JSON 协议（在 `lib/schema.ts` 和 `visualizer/src/schema/types.ts` 两边各存一份）。任何一边改 schema 必须同步更新另一边并同步 bump `schemaVersion`。

## 工作流

```text
 用户输入 "epoll"
       │
       ↓
  POST /api/generate  ──(SSE 流式)─→  LLM（DeepSeek V3.2 / Claude / GPT / Ollama）
                                   │
                                   │ 边想边吐，前端实时显示 reasoning + content
                                   │ 返回符合 TopicScript schema 的 JSON
                                   ↓
  localStorage 保存 TopicEntry
       │
       ↓
  跳转到 /[topicId]
       │
       ├── 播放 tab：点"渲染 MP4" → POST /api/render
       │                                  ↓
       │                           child_process 调 visualizer/ 的 remotion CLI
       │                                  ↓
       │                           MP4 落盘 public/renders/<topicId>.mp4
       │                                  ↓
       │                           浏览器用原生 <video> 播放
       ├── 编辑 tab：用户直接改 JSON，保存后重新渲染才看到变化
       └── 笔记 tab：学习笔记（markdown，自动保存）
       │
       ↓
  用户看完 → ReviewPanel 打分 1-5 → 简化 SM-2 算法排下次复习
       │
       ↓
  首页按"记忆衰减"排序，最需要复习的在前
```

## 快速开始

```bash
# 1. 安装依赖（在 studio/ 目录）
npm install

# 2. 启动开发服务器（端口 3333）
npm run dev
# → http://localhost:3333

# 3. 配置 AI Provider
#    点右上角 "设置" → 填入 Anthropic / OpenAI API key 或配置 Ollama

# 4. 创建第一个主题
#    点 "+ 新建" → 输入主题词（例 "epoll"）
#    → 流式看到 reasoning + content，通常 1-3 分钟完成
#    → 自动跳转到详情页

# 5. 渲染视频（需要 visualizer 侧准备好）
#    先在 ../visualizer 跑 `npm install`。在详情页点"渲染 MP4"，
#    挂在后台 1-10 分钟（视频越长越久），渲染完自动播放。
```

## AI Provider 支持

四个都在 UI 可配。所有 provider 统一走 SSE 流式接口，进度实时可见：

| Provider | 默认模型 | 需要 | 质量 |
|---|---|---|---|
| **Anthropic Claude** | `claude-3-5-sonnet-20241022` | API key | ⭐⭐⭐⭐⭐ |
| **OpenAI GPT** | `gpt-4o` | API key | ⭐⭐⭐⭐ |
| **NVIDIA NIM** | `deepseek-ai/deepseek-v3.2` | API key | ⭐⭐⭐⭐ |
| **Ollama（本地）** | `qwen2.5:14b` | `ollama serve` 在本机运行 | ⭐⭐⭐ |

用户切换 provider 只需一次点击，key 存在 localStorage（个人工具可接受）。

### 推理型模型的 reasoning 处理

DeepSeek V3.2 / GLM 系列等推理型模型默认会先吐一大段 `delta.reasoning_content`、再吐 `delta.content`。Studio 在 `lib/llm/providers/openai_compat.ts` 里同时消费两者：

- `reasoning_content` 或者通过 `chat_template_kwargs: { thinking: false }` / `thinking: { type: 'disabled' }` 关掉（满足即时流出需求）
- 或者开着思考，独立 emit `event: reasoning` 给前端展示透明的"思考过程"面板。

`content` 才会被累积成最终用于 parse JSON 的 `rawText`，不会被 reasoning 污染。

## 目录结构

```text
studio/
├── app/                        Next.js 14 App Router
│   ├── layout.tsx              全局布局 + Nav
│   ├── page.tsx                首页：主题库 + 衰减排序
│   ├── new/page.tsx            新建主题 → 流式调 /api/generate
│   ├── [topicId]/page.tsx      详情：MP4 预览 / JSON 编辑 / 笔记 / 复习
│   ├── settings/page.tsx       AI Provider 配置
│   ├── globals.css
│   └── api/
│       ├── generate/route.ts   流式调 LLM（SSE + reasoning 事件）
│       └── render/route.ts     子进程调 visualizer CLI 渲染 MP4
│
├── components/
│   ├── Nav.tsx
│   ├── TopicCard.tsx           首页卡片（带衰减色条）
│   ├── RenderedVideo.tsx       MP4 预览（原生 <video>）
│   └── ReviewPanel.tsx         1-5 打分 + 更新复习状态
│
├── lib/
│   ├── schema.ts               ⭐ TopicScript 独立类型（不依赖 visualizer）
│   ├── sse.ts                  SSE / NDJSON 流式解析工具
│   ├── slugify.ts
│   ├── storage.ts              localStorage CRUD + 导入导出
│   ├── review.ts               简化 SM-2 + 衰减评分
│   ├── settings.ts             Provider 配置管理 + 旧默认值自动迁移
│   └── llm/
│       ├── index.ts            Provider registry + LEGACY_MODEL_MIGRATIONS
│       ├── types.ts            StreamCallback 带 kind: content|reasoning
│       ├── prompt.ts           ⭐ system prompt（3-5 分钟深度版本）
│       ├── parse.ts            LLM 响应 → TopicScript，容错解析
│       └── providers/
│           ├── anthropic.ts        自定义 SSE event 格式
│           ├── openai.ts           通过 openai_compat
│           ├── nvidia.ts           通过 openai_compat + thinking 禁用
│           ├── ollama.ts           NDJSON 流式
│           └── openai_compat.ts    共享 SSE 消费者（content + reasoning）
│
└── tailwind.config.ts          paper 色板（与 visualizer 同源的设计 token）
```

## 设计决策记录

### 为什么场景 schema（B 路线）而非 LLM 直出代码（A 路线）？

A 路线（LLM 写 JSX）的质量抖动太严重，且需要沙箱执行风险高。B 路线把 LLM 的创造性限制在"填数据"——视觉由我们固定的原语保证——换来稳定。

### 为什么本地存储（localStorage）而非数据库？

个人学习工具，数据量不会大到超过 10MB 的 localStorage 上限。导入导出做了，想要多端同步时用户可以自己手动同步。

未来要上数据库：把 `lib/storage.ts` 的实现换掉即可，其他代码不需要动。

### 为什么复习用简化 SM-2 而不是完整的 Anki 算法？

完整 SM-2 有 easiness factor 等多个参数，对个人学习过度设计。简化版本（5 个档位 → 5 种间隔乘数）足够准确，调参对用户更友好。

### 为什么取消了 @remotion/player 实时预览？

直接原因：studio 跨目录 import visualizer 的场景组件时，webpack 会沿着 visualizer 的 `node_modules/` 解析到第二份 Remotion，触发 `🚨 Multiple versions of Remotion detected` 运行时异常。不管用 pin 版本、webpack alias 还是 transpilePackages 指令，都有盲点。

根源原因：两个包都有 Remotion 依赖本来就有冲突风险。最干净的归零方案 = **studio 完全不包含 Remotion**，转成服务端 CLI 渲染（和 npx/pnpm workspace 辅助无关，纯子进程调用）。

代价：编辑 JSON 后需要点一次"渲染"才能看到效果。用户体验损失有限——视频长到 3-5 分钟后，原来 "改一个字等 2 秒重渲染" 的模式本来也不成立。

### 为什么调 visualizer CLI 用子进程而不是 npm 包引入？

包引入仍然会把 Remotion 代码带进 studio 的 node 侧 bundle，产生更隐蔽的依赖图。子进程是唯一能保证 Remotion 运行在独立进程空间的方式。代价是需要 visualizer 目录在系统上存在、装好依赖；但这本来就是开发环境假设。

## 已知限制

- **LLM 输出质量 ≈ 65-85%**，取决于主题抽象程度。非标主题（如量子物理）可能触发硬凑场景。
- **API key 明文存在 localStorage**——仅用于个人使用，不要部署到多用户环境。
- **内容生成 1-3 分钟**（推理型模型更久），SSE 流式实时显示。
- **MP4 渲染 1-15 分钟**，取决于视频长度和 CPU。挂在 /api/render 后台，超时兑底 10 分钟。
- **浏览器兼容性**：Chrome/Safari/Firefox 最新版。
- **Schema 版本同步**：lib/schema.ts 和 visualizer/src/schema/types.ts 必须同步修改（现在两边都锁在 schemaVersion: 1）。

## 扩展方向（TODO）

- 知识图谱视图（主题之间的依赖关系可视化）
- 渲染进度条（/api/render 再加一层 SSE 把 Remotion stdout 进度转发给前端）
- 多账户（API key 后端化 + 真正数据库）
- 主题共享市场
