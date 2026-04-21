import React from 'react';
import { Composition, registerRoot } from 'remotion';
import { CpuThrottleComposition } from './compositions/CpuThrottle';
import { GenericTopicComposition } from './compositions/GenericTopic';
import { computeTotalFrames } from './components/GenericScenePlayer';
import { EXAMPLE_SCRIPT, type TopicScript } from './schema';
import './style.css';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* 手工打造的参考视频（A+B 美学的质量天花板） */}
      <Composition
        id="CpuThrottle"
        component={CpuThrottleComposition}
        durationInFrames={900} // 30s @ 30fps
        fps={30}
        width={1920}
        height={1080}
      />

      {/* Schema 驱动的通用 composition */}
      {/* 时长由 calculateMetadata 在拿到 inputProps 后动态计算 */}
      <Composition
        id="GenericTopic"
        component={GenericTopicComposition}
        // 默认用 EXAMPLE_SCRIPT 计算出初始时长；真实渲染时会被 calculateMetadata 覆盖
        durationInFrames={computeTotalFrames(EXAMPLE_SCRIPT)}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{}}
        calculateMetadata={({ props, defaultProps }) => {
          // Remotion 会把 input props 合并进 props
          const merged = props as { script?: TopicScript };
          const script = merged.script ?? EXAMPLE_SCRIPT;
          return {
            durationInFrames: computeTotalFrames(script, 30),
            props: merged,
          };
        }}
      />
    </>
  );
};

registerRoot(RemotionRoot);
