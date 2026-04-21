# Docker 底层技术 · Remotion 视频解析

独立的 Remotion 工程，为 `dao/docker/` 下的四份文档配套生成视频解析。

## 设计哲学

不同于算法可视化的"看清每一步操作"，这里的目标是**看清结构与机理**。

美学采用 **A+B 双面板**：

- **A · paper**（暖米色主画布）：用户视角、外层叙事、进程眼中的世界
- **B · terminal**（深色内嵌面板）：内核视角、系统调用、伪文件内容

视觉切换 = 认知切换。观众看到深色面板出现，就知道"现在进入内核内部"。

参考：[ciechanow.ski](https://ciechanow.ski) 的技术电影化美学 + Brendan Gregg / Julia Evans 的终端蓝图风。

## 目录结构

```text
visualizer/
├── package.json
├── tsconfig.json
├── remotion.config.ts
├── src/
│   ├── index.tsx              # 入口（只导入 Root）
│   ├── Root.tsx               # 注册所有 composition
│   ├── style.css              # 全局样式（极简，所有 token 在 theme/）
│   ├── theme/
│   │   ├── colors.ts          # paper + terminal 双色板 + mix() 工具
│   │   ├── typography.ts      # serif/sans/mono 三种字体的分工
│   │   ├── motion.ts          # spring 配置梯度 + easing 曲线
│   │   └── index.ts
│   ├── primitives/            # 跨视频复用的原子组件
│   │   ├── Stage.tsx          # A 风格外层画布
│   │   ├── Panel.tsx          # A 风格浮起卡片（带 kicker）
│   │   ├── KernelInset.tsx    # B 风格终端内嵌面板
│   │   ├── Timeline.tsx       # 多周期时间条
│   │   ├── QuotaGauge.tsx     # 配额进度条
│   │   ├── StateIndicator.tsx # RUNNING / THROTTLED 徽章
│   │   ├── Typography.tsx     # Kicker / Title / Body / Mono / Callout
│   │   └── index.ts
│   ├── compositions/          # 每个视频一个入口
│   │   └── CpuThrottle.tsx
│   └── components/            # 每个视频的主 Visualizer
│       └── CpuThrottleVisualizer.tsx
└── out/                       # 渲染输出（gitignore）
```

## 快速开始

```bash
# 1. 进入目录（不要用 cd 命令注入，根据 gstack 约定请用你的终端）
#    假设你已经在 dao/docker/visualizer/

# 2. 安装依赖
npm install

# 3. 启动 Remotion Studio（交互预览）
npm run dev
# 浏览器访问 http://localhost:3000
# 左侧选 "CpuThrottle" 即可实时预览

# 4. 渲染视频
npm run build:cpu
# 输出：out/cpu-throttle.mp4
```

## 目前的视频

| ID | 概念 | 时长 | 状态 |
|----|------|------|------|
| `CpuThrottle` | cgroup CPU 硬限制的时间维度 | 30s | ✅ v1 |

### CpuThrottle · 讲什么

`cpu.max = "50000 100000"` 意味着每 100ms 最多用 50ms CPU。

视频演示三个完整周期，让观众**亲眼看到**：

1. quota 在每个周期前半段线性消耗
2. quota 耗尽后，进程被强制节流——即使 CPU 空闲也要让出
3. 周期边界跨过时，quota 重置，循环继续
4. 同时在深色终端面板实时展示 `cpu.stat` 的四个计数器变化

时间被"放慢" 80 倍（真实 100ms → 视频 8s），让观众看清微观的时间切片。

## 添加新视频的步骤

每个新概念都按下面的模式：

1. 在 `src/compositions/` 新增 `XxxComposition.tsx`——只声明参数
2. 在 `src/components/` 新增 `XxxVisualizer.tsx`——实现渲染
3. 在 `src/Root.tsx` 添加一个 `<Composition>` 注册
4. 复用 `primitives/` 里的 A+B 元素，保持视觉语言统一
5. 如果新概念需要某种通用原子（比如"数据结构盒子 + 引线标签"），
   抽象到 `primitives/` 而不是写死在 Visualizer 里

## 可视化语言约定

为了让所有视频保持一致的视觉词汇：

- **进程/用户实体** → paper 色 Panel，serif 字体
- **内核数据/系统调用/命令** → terminal 色 KernelInset，mono 字体
- **运行/正常状态** → sage green (`paper.running`)
- **阻塞/被杀/受限** → clay red (`paper.blocked`)
- **主要焦点** → burnt orange (`paper.accentWarm`)
- **数字/计数器** → 必须用 `<Mono>` 或 `tabular-nums` class，防止宽度跳动
- **状态切换** → 用 spring 而不是硬切；参考 `theme/motion.ts`

## 渲染参数

默认画布 1920x1080 @ 30fps。修改见 `src/Root.tsx` 的 `<Composition>` 属性。

渲染到 4K：在 `Composition` 里把 width/height 改成 3840x2160，fps 保持 30。

## 已知限制

- 当前工程 **未在本地 `npm install` 过**，首次运行需要联网安装约 300MB 的依赖
- `@remotion/google-fonts` 在网络受限环境下可能失败；若遇到，把字体改回系统字体即可（在 `theme/typography.ts`）
- 本地渲染 30s 1080p 视频大约需要 1-3 分钟（视 CPU）
