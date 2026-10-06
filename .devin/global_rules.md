# Project Context

## Design Context

Confirmed by the user on 2026-09-30:
- Current edition: personal, local use only. Do not build commercial accounts, subscriptions, payment, membership gates, or cloud operations for this iteration.
- Initial learner context: an employed software engineer preparing to change jobs.
- The user approved trying Motion Canvas first for the video upgrade. Preserve the Remotion assets for comparison; do not assume the entire Agent application is implemented.
- Primary learning problem: understanding a familiar solution but failing to transfer it to a different problem.
- Updated product entry: user selects a LeetCode problem and a programming language (including Go, Python, C++), then starts an agent-generated analysis, UI explanation, suitable visualization, and a deliberate-practice sequence linking the problem to extensions. Do not replace this entry with a fixed-course-only product.
- EdClub is a requested teaching reference, not a source of evidence that typing metrics measure algorithm mastery.
- Product personality: professional cognitive laboratory; restrained, clear, trustworthy.
- Favor readable light surfaces and purposeful algorithm-state diagrams over decorative dashboards, gamification, and visual spectacle.
- Teach decision rules and their applicability boundaries through contrasting problems, state manipulation, counterexamples, and unaided transfer tasks.
- Distinguish observed learning evidence from self-reported confidence. Watching content is not evidence of mastery. Do not invent mastery percentages or efficacy claims.
- Preserve keyboard access, non-color state labels, reduced-motion support, and usable mobile layouts.

## Existing Architecture and Verification

- The existing project produces Markdown algorithm explanations and React/Remotion videos; it is not yet an interactive learning service.
- `algo-visualizer/src/index.tsx` calls `registerRoot` and defines the active composition registry. `src/Root.tsx` contains a separate registry not imported by that entry; do not assume both are active.
- Verified from `algo-visualizer/`: `../node_modules/.bin/remotion compositions src/index.tsx` bundles successfully and lists 16 compositions as of 2026-09-30. This is not a visual-render acceptance test.
- Root `npm test` now runs the Motion Canvas model tests, including 6,015 exhaustive differential cases. `npm run motion:check` typechecks the new pipeline; `npm run motion:build` builds the scene bundle. These do not validate every legacy Remotion composition.
- `npm run motion:dev` opens the local Motion Canvas editor at http://127.0.0.1:9000. The project variables (nums, k) are in `.devin/motion-canvas/sliding-window.ts`; the current visual template supports 1–10 integers in [-999, 999] and 1 <= k <= n.
- `npm run motion:render` starts a temporary local server, uses installed Google Chrome via Playwright, renders review PNGs and exports a uniquely named `motion-canvas/output/sliding-window-<timestamp>-<id>.mp4` without replacing older versions. `CHROME_PATH` can select a Chrome executable. `npm run motion:render -- --stills` renders review images only. The sample is silent, 1920x1080 at 60fps, approximately 82.27 seconds.
- `motion-canvas/model/deque.ts` generates serializable before/after events; `model/lesson.ts` defines teaching beats and their total duration; `scenes/deque.tsx` animates stable objects. The scene distinguishes transition frames from valid invariant checkpoints.
- Existing legacy teaching snapshots can represent intermediate states. In `algo-visualizer/src/compositions/SlidingWindowMax.tsx`, the claim that the deque head is always the current-window maximum is not true in every `consider` frame. Do not reuse them directly for grading.
- Motion Canvas 3.17.2 currently requires Vite 4/5; the pinned Vite 5 toolchain and other dependencies have unresolved npm audit warnings. Keep this trusted-input personal experiment loopback-only, and do not expose its editor/export endpoints to the network. Do not bypass dependency constraints or security policies.
- `npm run learn` starts the local workbench at `/motion-canvas/workbench.html`. Currently only problem 239 is implemented: the page recomputes Motion Canvas playback for 1–10 values, supports a seekable timeline, named decision points, 0.5×/1×/1.5×/2× live playback, reduced-motion/static state, and explanatory text. During a scan transition the prior window and intended new range are both named; only once movement completes is the new range called current. The fixed video exported by `npm run motion:render` still uses the separate project variables in `.devin/motion-canvas/sliding-window.ts`; changing inputs in the browser does not export another MP4.
- The workbench includes reviewed Go/Python/C++ reference snippets. `npm run learn:code-check` compiles/runs these on the local machine against a bounded differential corpus; the workbench never executes user-supplied code. `npm run learn:check` uses local Chrome to check desktop/mobile flows, keyboard tabs, input changes, persistence, reduced motion, and damaged storage. Local quiz attempts are stored only under `algorithm-studio:attempts:v1` in this browser, preserve first attempts and hint use, and can be exported. They are not a validated mastery score.
- Preserve existing uncommitted user changes and generated videos. Arbitrary-problem Agent generation, licensed problem ingestion, generalized multi-language judging, user code execution, and multi-day adaptive practice remain future work. No learning-effect experiment has been completed.
