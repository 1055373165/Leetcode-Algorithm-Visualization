'use client';

import type { TopicScript } from '@/lib/schema';

/**
 * RenderedVideo · 只靠 MP4 预览视频
 *
 * 和原来的 ScriptPlayer 不同：这个组件 **不在浏览器里跑 Remotion**，
 * 而是依赖服务端 /api/render 把 JSON 脚本通过 visualizer CLI 渲染成
 * MP4 文件，再用原生 <video> 播放。
 *
 * 这样做的目的是让 studio 的 bundle 彻底不含 Remotion，避免和
 * visualizer 那份 Remotion 产生多实例冲突（见 lib/schema.ts 头部注释）。
 *
 * 代价：编辑 JSON 后需要用户主动点一次"导出 MP4"才能看到新画面。
 * 相对完全隔离的好处，这个代价是可以接受的。
 */
export const RenderedVideo: React.FC<{
  script: TopicScript;
  videoUrl: string | null;
  renderStage: 'idle' | 'rendering' | 'done' | 'error';
  onRequestRender: () => void;
}> = ({ script, videoUrl, renderStage, onRequestRender }) => {
  const totalSeconds = Math.round(
    3 + script.scenes.reduce((sum, s) => sum + s.duration, 0),
  );

  // 状态 1：视频已渲染好 → 直接播
  if (videoUrl) {
    return (
      <div
        className="relative w-full rounded-xl overflow-hidden border border-paper-rule shadow-paper bg-black"
        style={{ aspectRatio: '16 / 9' }}
      >
        <video
          // key 用 url 触发重挂载，避免缓存旧内容
          key={videoUrl}
          src={videoUrl}
          controls
          preload="metadata"
          className="w-full h-full object-contain"
        >
          你的浏览器不支持 HTML5 video 标签。
          <a href={videoUrl} className="underline ml-2">
            直接下载 MP4
          </a>
        </video>
      </div>
    );
  }

  // 状态 2：正在渲染
  if (renderStage === 'rendering') {
    return (
      <div
        className="w-full rounded-xl border border-paper-rule bg-paper-surface flex flex-col items-center justify-center gap-3 text-paper-ink"
        style={{ aspectRatio: '16 / 9' }}
      >
        <div className="w-8 h-8 border-2 border-paper-accentWarm border-t-transparent rounded-full animate-spin" />
        <div className="text-sm font-semibold">
          Remotion 正在渲染 MP4……
        </div>
        <div className="text-xs text-paper-inkMuted font-mono">
          大约需要 {Math.ceil(totalSeconds * 1.5)}–{totalSeconds * 3} 秒 ·
          请耐心等待
        </div>
      </div>
    );
  }

  // 状态 3：还没渲染（idle / error）→ 占位 + 行动按钮
  return (
    <div
      className="w-full rounded-xl border border-dashed border-paper-rule bg-paper-surface flex flex-col items-center justify-center gap-4 p-8"
      style={{ aspectRatio: '16 / 9' }}
    >
      <div className="text-center max-w-md">
        <div className="text-paper-ink font-semibold mb-2">
          这个主题还没有渲染成视频
        </div>
        <div className="text-sm text-paper-inkMuted leading-relaxed">
          Studio 不在浏览器里预览 Remotion 画面，而是通过服务端的
          <span className="font-mono text-paper-accentCool">
            {' '}
            visualizer CLI{' '}
          </span>
          渲染成 MP4。
          <br />
          脚本共 {script.scenes.length} 个场景，总时长约{' '}
          <span className="font-mono">{totalSeconds}s</span>。
        </div>
      </div>
      <button
        onClick={onRequestRender}
        className="px-5 py-2 bg-paper-accentWarm text-white rounded-md text-sm font-semibold hover:bg-paper-accentWarm/90 transition-colors"
      >
        {renderStage === 'error' ? '重试渲染 →' : '渲染成 MP4 →'}
      </button>
      {renderStage === 'error' && (
        <div className="text-xs text-paper-blocked">
          上次渲染失败，请查看错误信息后重试
        </div>
      )}
    </div>
  );
};
