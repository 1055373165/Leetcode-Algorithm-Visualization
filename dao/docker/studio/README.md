# Dao Studio · 多主题技术视频工作室

**输入任意技术主题 → AI 生成场景脚本 → 实时预览视频 → 管理 + 间隔复习**

这是 `dao/docker/visualizer/` 的上层应用。两者分工：

- **visualizer/**：Remotion 渲染引擎 + 8 种场景原语
- **studio/**（本目录）：Next.js 前端 + LLM 网关 + 数据管理

## 工作流

```text
 用户输入 "epoll"
       │
       ↓
  POST /api/generate  ────→  LLM（Claude/GPT/Ollama）
                                   │
                                   │ 返回符合 TopicScript schema 的 JSON
                                   ↓
  localStorage 保存 TopicEntry
       │
       ↓
  跳转到 /[topicId]
       │
       ├── 播放 tab：@remotion/player 嵌入 GenericScenePlayer 实时渲染
       ├── 编辑 tab：用户直接改 JSON，实时看效果
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
#    点 "+ 新建" → 输入主题词（例 "epoll"） → 等 30-60s → 自动跳转到详情页
```

## AI Provider 支持

三个都在 UI 可配：

| Provider | 默认模型 | 需要 | 质量 |
|---|---|---|---|
| **Anthropic Claude** | `claude-3-5-sonnet-20241022` | API key | ⭐⭐⭐⭐⭐ |
| **OpenAI GPT** | `gpt-4o` | API key | ⭐⭐⭐⭐ |
| **Ollama（本地）** | `qwen2.5:14b` | `ollama serve` 在本机运行 | ⭐⭐⭐ |

用户切换 provider 只需要一次点击，key 存在 localStorage（个人工具可接受）。

## 目录结构

```text
studio/
├── app/                        Next.js 14 App Router
│   ├── layout.tsx              全局布局 + Nav
│   ├── page.tsx                首页：主题库 + 衰减排序
│   ├── new/page.tsx            新建主题 → 调 /api/generate
│   ├── [topicId]/page.tsx      详情：播放器 / JSON 编辑 / 笔记 / 复习
│   ├── settings/page.tsx       AI Provider 配置
│   ├── globals.css
│   └── api/
│       └── generate/route.ts   调 LLM 的后端路由
│
├── components/
│   ├── Nav.tsx
│   ├── TopicCard.tsx           首页卡片（带衰减色条）
│   ├── ScriptPlayer.tsx        @remotion/player 嵌入
│   └── ReviewPanel.tsx         1-5 打分 + 更新复习状态
│
├── lib/
│   ├── schema.ts               从 visualizer 再导出 TopicScript 类型
│   ├── slugify.ts
│   ├── storage.ts              localStorage CRUD + 导入导出
│   ├── review.ts               简化 SM-2 + 衰减评分
│   ├── settings.ts             Provider 配置管理
│   └── llm/
│       ├── index.ts            Provider registry
│       ├── types.ts
│       ├── prompt.ts           ⭐ system prompt（grok-any-tech 精神 + schema 约束）
│       ├── parse.ts            LLM 响应 → TopicScript，容错解析
│       └── providers/
│           ├── anthropic.ts
│           ├── openai.ts
│           └── ollama.ts
│
└── tailwind.config.ts          paper 色板（与 visualizer 同源）
```

## 设计决策记录

### 为什么场景 schema（B 路线）而非 LLM 直出代码（A 路线）？

A 路线（LLM 写 JSX）的质量抖动太严重，且需要沙箱执行风险高。B 路线把 LLM 的创造性限制在"填数据"——视觉由我们固定的原语保证——换来稳定。

### 为什么本地存储（localStorage）而非数据库？

个人学习工具，数据量不会大到超过 10MB 的 localStorage 上限。导入导出做了，想要多端同步时用户可以自己手动同步。

未来要上数据库：把 `lib/storage.ts` 的实现换掉即可，其他代码不需要动。

### 为什么复习用简化 SM-2 而不是完整的 Anki 算法？

完整 SM-2 有 easiness factor 等多个参数，对个人学习过度设计。简化版本（5 个档位 → 5 种间隔乘数）足够准确，调参对用户更友好。

### 为什么 @remotion/player 而不是渲染 mp4？

实时预览比等待 3 分钟渲染体验好 100 倍。用户改 JSON 就能看到效果——这让"编辑"tab 真正有用。
导出 mp4 的需求未来可以加一个 /api/render 路由，用 renderMedia 单独生成。

## 已知限制

- **LLM 输出质量 ≈ 65-85%**，取决于主题抽象程度。非标主题（如量子物理）可能触发硬凑场景。
- **API key 明文存在 localStorage**——仅用于个人使用，不要部署到多用户环境。
- **首次生成需 30-60 秒**，没有流式显示。可在 UI 上看到 "生成中..." 的阶段指示。
- **浏览器兼容性**：Chrome/Safari/Firefox 最新版。

## 扩展方向（TODO）

- 流式显示 LLM 生成过程（需要 `/api/generate` 改 SSE）
- `/api/render` 路由导出 mp4
- 知识图谱视图（主题之间的依赖关系可视化）
- 多账户（API key 后端化 + 真正数据库）
- 主题共享市场
