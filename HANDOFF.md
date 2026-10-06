# 开发交接：算法研习室个人版

> 本文是现有代码的状态说明与接手路径，不是未来能力已上线的承诺。面向要继续开发此仓库的人；日常启动、交互和命令从 [README.md](README.md) 开始。

## 1. 已完成与未完成

已完成一个围绕 **239. 滑动窗口最大值** 的个人学习闭环样片：确定性算法事件、Motion Canvas 连续动作、浏览器实时回放与静态状态表、Go/Python/C++ 经有界用例验证的参考代码、三道决策/迁移自测、浏览器内学习记录及导出。默认教学输入 `[1,3,-1,-3,5,3,6,7]`、`k=3`，答案 `[3,3,5,5,6,7]`。另外还有多道独立 Markdown 题解和旧 Remotion 视频，没有全部迁移到此工作台。

**仍未实现**：自由选择任意 LeetCode 题目、获得可用于本系统的题目数据、Agent 自动生成并验证任意题的解法/教学内容/视频、各题型的视觉原语、通用多语言运行与判题、跨设备同步及有真实学习效果证据的自适应练习。界面刻意标注“本地确定性演示”，不要把现有生成器宣传为已经接入 AI。当前不做商业化。

## 2. 路径与职责

| 位置 | 职责 / 注意事项 |
| --- | --- |
| `README.md` | 操作入口、运行前提、支持范围与排障。 |
| `.devin/global_rules.md` | 已确认的个人版设计目标、验证命令与现存限制。 |
| `.devin/motion-canvas.vite.ts` | Motion Canvas / FFmpeg 的 Vite 配置；固定本机 `127.0.0.1:9000`，输出 `motion-canvas/output/`。 |
| `.devin/motion-canvas/sliding-window.ts` | MP4 渲染使用的默认 `nums`、`k` 和场景注册；**不读取工作台输入框**。相邻 `.meta` 是编辑器使用的项目元数据。 |
| `motion-canvas/model/deque.ts` | 纯算法事件生成：`scan / expire / prune / append / collect`，含 `before/after` 状态、候选下标与 `invariantReady`。无 React、Motion Canvas 或 DOM 依赖。 |
| `motion-canvas/model/lesson.ts` | 把事件编排为教学段落，计算总时长与扫描过渡文案，并安排预测、总结、迁移提问。 |
| `motion-canvas/model/learning.ts` | 用户输入校验、时间线映射、文字状态、三个练习和记录的版本化读写。 |
| `motion-canvas/model/code.ts` | 固定 Go/Python/C++ 参考实现；是内容资产，不是任意输入的通用运行器。 |
| `motion-canvas/scenes/deque.tsx` | 基于相同 `lesson` 绘制视频场景；数组对象保持身份，候选按操作运动。相邻 `.meta` 为场景元数据。 |
| `motion-canvas/player.ts` | 工作台内嵌 Motion Canvas Player 和 Stage，负责播放、跳转、倍速、重算、首帧就绪与订阅释放。 |
| `motion-canvas/workbench.html`、`.css`、`.ts` | 学习工作台 UI、语义说明、响应式布局、静态替代与本地偏好/练习交互。 |
| `motion-canvas/render-client.ts`、`render.ts` | 浏览器端渲染控制与本机 Chrome/FFmpeg 自动导出；文件名按时间戳和随机 ID 区分版本。 |
| `motion-canvas/model/*.test.ts` | 模型、约束、练习历史与扫描过渡回归测试。 |
| `motion-canvas/workbench-check.ts` | Playwright 浏览器流程：首帧、快慢速帧推进、窗口 `[4,6] → [5,7]`、参数切换、键盘、移动端和坏存储。 |
| `motion-canvas/code-check.ts` | 临时生成编译/运行验证入口，对照独立暴力 oracle；需要本地 Go/Python/C++，会在系统临时目录留下测试文件。 |
| `algo-visualizer/src/index.tsx` | 旧 Remotion 当前注册入口。`src/Root.tsx` 为另一套未由此入口引用的注册表。 |
| `<题号>.<英文题名>/` | 旧文章与视频资产，如 `0239.SlidingWindowMaximum/README.md`、`animation.mp4`。存在旧版和 `*-v2` 文稿，不能假设已经统一。 |

## 3. 单题数据流与不变量

```text
浏览器 nums, k ──校验──> buildDequeTrace ──> DequeEvent[] ──> buildLesson
                                          ├──> 场景对象运动、视频导出
                                          ├──> Player 实时回放
                                          └──> workbench 静态状态与原因说明
课程中的固定练习 ──> 首次提交 / 提示使用 ──> 版本化 localStorage（可导出）
```

- `deque.ts` 内部保存**下标**，比较 `nums[index]`。`expire` 从队头删窗口外元素；`prune` 从队尾删更早且不更大的候选；`append` 后才恢复有效且严格递减的候选序列；窗口形成后 `collect` 读取队头。算法候选空间 O(k)，**教学快照和答案另占空间**。
- 当前纯 trace 允许 1–256 个安全整数且 `1 ≤ k ≤ n`；视频和网页的视觉课程另外限制为 **1–10 个整数、数值绝对值不超过 999**。模型接受更多数据不等于当前版能清晰可视化它们。
- `invariantReady` 只在 `append`、`collect` 后成立。`scan` 引入新元素的动画期间，旧窗口仍可见；`scanTransitionText` 将旧范围与目标范围同时说清。例如扫描下标 7 时，移动前仍是 `[4,6]`，到位后才是 `[5,7]`。**不要在维护中的画面声称队头已经是新窗口答案。**
- 每个 `LessonBeat` 给出持续时间、运动时间及可解释内容。`learning.ts` 中 `stateAtFrame` 只有在过渡完成后才用事件 `after` 状态；改变动画节奏时必须一起校准此检查点、静态状态和浏览器测试，不能只改画面。
- 用户点击章节、拖动时间线后，工作台以 Player **实际渲染的帧**推进说明，避免文字先于 Canvas 更新；仅隐藏 Canvas 的静态模式可立即显示确定性状态。倍速是内嵌 Player 的 0.5×/1×/1.5×/2×，MP4 导出仍采用 60 fps 标准时间线。

## 4. 本地记录与隐私

- 偏好键：`algorithm-studio:preferences:v1`（输入、`k`、语言、倍速）。练习键：`algorithm-studio:attempts:v1`；每道题保留首次回答是否正确以及是否看过提示，重复尝试不能改写首次结果。最多保留 200 条尝试，达到上限时拒绝写入，不静默丢失旧记录。
- 解析旧记录失败时提示并转为**只在本次会话使用的内存记录**，不覆盖损坏的存储；用户可导出有效记录。没有账号、同步、数据库、学习效果概率评分，也不能用“已观看/已点对选项”作为掌握证据。
- 数据和参考代码均用固定内容及 `textContent` 呈现；页面不执行任意用户提交的代码。新 Agent 集成时必须保持这一边界，题目原文和模型输出都不能直接成为系统指令或网页可执行脚本。

## 5. 验证矩阵与实际覆盖面

在仓库根目录：

```bash
npm ci
npm test
npm run motion:check
npm run motion:build
npm run learn:check
npm run learn:code-check
```

- `npm test` 只针对新模型：18 项 Node 单元测试，包括 **6,015** 组小数组单调队列差分对照、重复元素、过期、快照、JSON 往返、预测前后状态、记录损坏与上限。不是所有旧题解的测试。
- `learn:code-check` 对 **1,641** 组长度 1–5、元素取 `−1/0/1`、`k` 在合法范围的案例，分别调用本机 Go、Python、C++ 参考实现对照暴力结果；不能外推到所有边界或宣称 LeetCode Accepted。运行器是**本机程序**，不要用于不可信代码。
- `learn:check` 需要安装 Chrome（非 Playwright 自动下载的浏览器）。测试播放、倍速的实际帧推进、局部事件截图、无效输入恢复、三个语言标签、键盘 tab、尝试记录、刷新后保存、损坏存储不覆盖、移动端无水平滚动和减少动态效果；审阅 PNG 被 `.gitignore` 排除。
- `motion:render` 生成新视频前先导出开场、淘汰、扫描末端窗口进入/到位、总结与迁移等关键帧。生成 MP4 后需检查实际时长、分辨率、音视频流以及能否解码；当前样片是**无音频、1920×1080、60 fps**，默认约 82.27 秒。只跑 `motion:build` 或单元测试不等于完成视频验收。
- `npx --no-install remotion compositions algo-visualizer/src/index.tsx` 可验证旧入口能列出 16 个组合，但不保证每个旧视频帧时长正确。已知旧 `MinSubArrayLen` 每步 3 秒、共 16 步，而注册时长仅 300 帧（10 秒）；当前提交没有替旧资产全面修正这个问题。

仓库 `motion-canvas/output/` 被忽略，但旧样片 `sliding-window.mp4` 与修正版 `sliding-window-20261006073950-e783bb13.mp4` 已由先前提交显式跟踪。新导出的唯一文件默认仍被忽略；审阅图、`dist/`、`node_modules/` 也不入库。GitHub 上看到的固定样片**不会随你在网页里改输入而改变**。

## 6. 运行、故障与安全边界

- 配置文件强制 Vite 仅监听 `127.0.0.1:9000`、`strictPort: true`；`learn` 与 `motion:dev` 是同一服务的不同打开方式，不要同时占用端口。自动视频导出与浏览器测试另开本机临时服务、结束时关闭。
- Browser UI 出错时显示错误并回退到静态状态；用户输入错误则保留原输入。首帧真正渲染完毕才显示“就绪”。刷新失去尚未保存的临时内存记录；已有本地记录仅对该浏览器配置文件有效。
- Chrome 启动失败：确认 Chrome 可执行文件，必要时使用 `CHROME_PATH` 环境变量。Go/Python/C++ 缺失只影响 `learn:code-check`，不影响浏览已有动画。
- Motion Canvas 3.17.2 依赖 Vite 4/5，锁定的 Vite 5 与其他依赖存在未清理的 `npm audit` 告警。**不应暴露编辑器/导出端口到公网，也不应通过调低安全策略或强装不兼容版本来回避告警。** 待上游兼容、安全修复或替代方案验证后再考虑部署。
- 不存在已授权的 LeetCode 商业题库抓取实现；当前内容来自本仓库及固定教学样例。不要为“任选题”绕开第三方来源限制，也不要把用户的私有原文自动写入公共缓存。
- 仓库里有既有本机工具权限文件 `.claude/settings.local.json`，属于历史追踪资产；接手时注意它不等于生产部署配置。新的项目代理规则与设置遵循 `.devin/` 路径。

## 7. 建议的下一步（未实现，勿当作验收项）

1. **抽象教学中间表示**：目前纯事件数据可复用，但页面标题、动画布局、练习库都专门为 239 写成。先选择第二个结构不同的题型验证 `ProblemRevision → SolutionSpec → Trace → LessonPlan → Scene` 的通用边界，避免把一个视频模板套遍百题。
2. **题目来源与授权**：设计可替换来源接口、版本号、约束与函数签名规范化；未经确认的自动抓取不要进入默认流程。失败时显示“来源不可用/未支持”，不能凭题号补造原题。
3. **真实 Agent 及验证**：分离题意解析、解法、语言实现、执行验证、教学编排；输出与轨迹需绑定版本和验证记录。模型可以提出解释，不能作为唯一判题器。先在固定审阅题集比较新旧讲解，再扩展到个人任选题。
4. **语言适配与隔离**：固定 Go/Python/C++ 编译/运行版本、函数签名、输入输出协议、资源限制与等价输出判定。当前 `code-check.ts` 只运行仓库固定可信代码，不具备安全执行用户代码的能力。
5. **可迁移练习**：从固定三题升级为带反例、适用条件和未曝光变体的课程，并对首次独立回答、使用提示、隔日复习分开统计。真实学习收益需要用户实验，不能拿播放时长或测试覆盖率替代。

处理阶段性修正时，先复现并写失败测试，再改事件/教学数据，最后检查工作台预览、静态替代、真实视频和跨语言参考实现是否依然一致。