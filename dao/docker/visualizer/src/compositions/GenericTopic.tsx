import React from 'react';
import { getInputProps } from 'remotion';
import { GenericScenePlayer } from '../components/GenericScenePlayer';
import { EXAMPLE_SCRIPT, type TopicScript } from '../schema';

/**
 * GenericTopic · 通用主题 composition
 *
 * 接收 `inputProps.script` 作为 TopicScript 播放视频。
 * 无输入时默认播 EXAMPLE_SCRIPT（epoll），便于单独启动时预览。
 *
 * Studio / API 通过 Remotion 的 inputProps 机制传入脚本：
 *   renderMedia({ ..., inputProps: { script } })
 *   或者 <Player inputProps={{ script }} />
 */
export const GenericTopicComposition: React.FC = () => {
  const inputProps = getInputProps() as { script?: TopicScript };
  const script = inputProps?.script ?? EXAMPLE_SCRIPT;
  return <GenericScenePlayer script={script} />;
};
