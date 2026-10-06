# 算法研习室（个人本地版）

这个仓库同时保存 LeetCode 题解、已有的 Remotion 教学动画，以及正在试验的 Motion Canvas 交互式学习工作台。目标是看懂解法的决策依据，再通过预测和迁移练习检查自己是否真的理解；**不是已经支持任选题目自动生成课程的完整 AI Agent 产品**。

目前网页工作台只完整支持 **239. 滑动窗口最大值**。其他题目的 Markdown 题解和部分 MP4 可在各题目录独立阅读。新旧动画并存，不要把工作台的「更新演示」误解为会重新渲染 MP4。

## 环境准备

- Node.js 22（已验证版本：22.17.0）和 npm；仓库根目录有 `package-lock.json`。
- 本机预览及导出：安装 Google Chrome。自动化脚本使用 Playwright 驱动本机 Chrome，**不会自动安装浏览器**；如未使用默认安装位置，可通过 `CHROME_PATH` 指定 Chrome 可执行文件。
- 仅运行 `npm run learn:code-check` 时另需本地的 `go`、`python3`、`c++`（支持 C++17）。浏览工作台和看现成视频不需要这三个编译器。

在仓库根目录安装依赖并启动：

```bash
npm ci
npm run learn
```

工作台地址为 `http://127.0.0.1:9000/motion-canvas/workbench.html`。启动命令通常会自动打开浏览器；未打开时手动访问该地址。**只在本机使用**：Vite 监听 `127.0.0.1`，不要把端口暴露到公网。`9000` 已被其他进程占用时，先停止那个本地预览服务；配置启用了 `strictPort`，不会悄悄换端口。

## 在工作台学习

1. 查看固定窗口求最大值的核心机制与可步进动画。默认输入为 `[1, 3, -1, -3, 5, 3, 6, 7]`，`k = 3`，结果为 `[3, 3, 5, 5, 6, 7]`。
2. 修改 `nums` 和 `k` 后点击「更新演示」，或选「经典样例 / 递减序列 / 重复元素」。输入接受 `[1,3,-1]`、`1, 3, -1` 或空格分隔；演示目前限制为 **1–10 个整数**、每个值在 **−999～999**、`1 ≤ k ≤ n`。不符合要求会显示错误，原输入不会被抹掉。
3. 点击播放、拖动进度条、使用前后步骤和章节跳转；「遇到思考点时暂停」可以在关键决策前停下。网页实时动画支持 **0.5× / 1× / 1.5× / 2×**，选择会随本机偏好保存。倍速**不改变已导出的 MP4**。
4. 开启「静态步骤」查看输入、窗口、候选下标和值、已有答案的文字状态。手机窄屏和系统“减少动态效果”环境默认显示此模式；核心状态不依赖颜色或连续动画才能理解。
5. 在「解题逻辑」阅读为什么队头会过期、队尾为何被支配；「参考代码」可选择 Go / Python / C++ 并复制。切换语言不改变算法；页面不会执行你粘贴的代码。
6. 在「迁移自测」回答过期删除、等值处理、与每日温度的对比。首次作答和是否看过提示分别记录；结果**不是掌握度评分**。记录保存在当前浏览器的 `localStorage`，可点「导出学习记录」下载 JSON；换浏览器、清理站点数据或更换本机不会自动同步。损坏的旧记录不会被自动覆盖。

重点查看原样例最后一次扫描：窗口从 `[4,6]` 移动到 `[5,7]` 时，过渡画面只称“正在右移”；7 真正进入窗口后才称 `[5,7]` 为当前范围。静态状态表和动画使用同一套事件数据。

## 预览、视频导出与现成资产

| 操作 | 命令 / 位置 | 说明 |
| --- | --- | --- |
| 工作台 | `npm run learn` | 个人学习页面；默认打开 `/motion-canvas/workbench.html`。 |
| Motion Canvas 编辑器 | `npm run motion:dev` | 使用相同的本机服务，编辑器在 `http://127.0.0.1:9000/`。不要与 `npm run learn` 同时占用 9000。 |
| 导出视频 | `npm run motion:render` | 本机 Chrome 驱动，先保存关键帧到 `motion-canvas/review/`，再导出 1920×1080、60 fps、无配音的 MP4 到 `motion-canvas/output/`；文件名含时间戳与随机 ID，不覆盖旧版。 |
| 只检查关键帧 | `npm run motion:render -- --stills` | 不生成 MP4。 |
| 本次修正版 | [`motion-canvas/output/sliding-window-20261006073950-e783bb13.mp4`](motion-canvas/output/sliding-window-20261006073950-e783bb13.mp4) | 已提交的默认输入样片，约 82.27 秒；旁边的 `sliding-window.mp4` 是保留作对比的旧样片。 |
| 其他题解与视频 | 各编号题目目录，如 [`0239.SlidingWindowMaximum/README.md`](0239.SlidingWindowMaximum/README.md) | 题目 Markdown、已有 `animation.mp4` 是独立资产；不等于都已接入新工作台。 |

**输入有两处，互不自动同步**：工作台输入框会即时重算网页场景；命令行 MP4 使用 [`.devin/motion-canvas/sliding-window.ts`](.devin/motion-canvas/sliding-window.ts) 中的项目变量。要导出另一组数据，先修改该配置，再执行 `npm run motion:render`；改网页输入**不会**导出新视频。`motion-canvas/output/` 和 `motion-canvas/review/` 默认被 Git 忽略，仅上述两个样片曾显式加入版本库；以后新导出的文件不会自动进入提交。

已有 Remotion 内容仍保留。如需检查当前注册入口（位于 `algo-visualizer/src/index.tsx`）：

```bash
npx --no-install remotion compositions algo-visualizer/src/index.tsx
```

此命令只列出组合，不能替代逐帧视觉验收。`algo-visualizer/src/Root.tsx` 中还有另一份注册表，但当前 CLI 入口是 `index.tsx`。

## 开发与检查

在仓库根目录运行：

```bash
npm test                     # 模型与学习记录单元测试
npm run motion:check         # 新 Motion Canvas 流程的 TypeScript 检查
npm run motion:build         # 工作台与场景的生产构建
npm run learn:check          # 本机 Chrome 浏览器交互、移动端和倍速回归
npm run learn:code-check     # 用本机 Go、Python、C++ 验证三份参考实现
```

`npm test` 覆盖现有新模型（包含 6,015 组小输入差分对照）；它**不是**所有历史题解和 Remotion 动画的完整测试。`learn:code-check` 的独立对照限定于长度 1–5、值 `−1/0/1` 的 1,641 组用例；通过不等于平台判题通过。浏览器检查会生成被忽略的 PNG 审阅截图，并在独立浏览器上下文中测试练习记录。

## 当前边界与问题排查

- **不是 AI 产品完成态**：尚无任意题目抓取、Agent 生成、通用 Go/Python/C++ 判题、用户代码执行、账号或云同步；目前不接入支付或会员。
- **预览显示旧内容**：先刷新工作台；确认访问的是 `/motion-canvas/workbench.html` 而不是 `/` 的动画编辑器，并检查当前输入与 `k`。固定 MP4 不跟随网页输入。
- **Chrome 无法启动**：确认 Chrome 已安装；使用 `CHROME_PATH=<Chrome 可执行文件路径> npm run motion:render`（浏览器测试同理）。
- **导出失败或看起来不完整**：先用 `--stills` 检查 `review/` 的开场、窗口右移前后、总结帧；视频参数写在 `motion-canvas/render-client.ts`，教学时长从事件生成，不要任意写死帧数。
- **安全与许可**：目前 Motion Canvas 3.17.2 配套的 Vite 5 及部分既有依赖仍有 `npm audit` 告警。仅供可信输入的本地个人实验，不对外提供编辑器、导出服务或任意代码执行。仓库题解不意味着已获得第三方题库商业抓取或分发授权。

架构、文件责任、已知缺口与接手开发顺序见 [HANDOFF.md](HANDOFF.md)。
