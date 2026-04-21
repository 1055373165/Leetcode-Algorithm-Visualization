'use client';

import { Player } from '@remotion/player';
import type { TopicScript } from '@/lib/schema';
import { GenericScenePlayer, computeTotalFrames } from '../../visualizer/src/components/GenericScenePlayer';

/**
 * ScriptPlayer · 在浏览器里实时预览 TopicScript
 *
 * 用 @remotion/player 嵌入 GenericScenePlayer。
 * 这样用户编辑 JSON 时可以即时看到效果变化，无需服务端渲染 mp4。
 *
 * 需要本地 mp4 导出时另走 renderMedia 流程（未来再加）。
 */
export const ScriptPlayer: React.FC<{
  script: TopicScript;
  controls?: boolean;
  autoPlay?: boolean;
}> = ({ script, controls = true, autoPlay = false }) => {
  const durationInFrames = computeTotalFrames(script, 30);

  return (
    <div
      style={{
        width: '100%',
        aspectRatio: '16 / 9',
        borderRadius: 12,
        overflow: 'hidden',
        border: '1px solid #D8CFBE',
        backgroundColor: '#F4EFE6',
        boxShadow: '0 2px 4px rgba(42, 38, 32, 0.1), 0 8px 24px rgba(42, 38, 32, 0.08)',
      }}
    >
      <Player
        component={GenericScenePlayer}
        inputProps={{ script }}
        durationInFrames={Math.max(30, durationInFrames)}
        compositionWidth={1920}
        compositionHeight={1080}
        fps={30}
        controls={controls}
        autoPlay={autoPlay}
        loop
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};
