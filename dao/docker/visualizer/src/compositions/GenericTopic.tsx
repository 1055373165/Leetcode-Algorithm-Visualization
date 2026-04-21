import React from 'react';
import { GenericScenePlayer } from '../components/GenericScenePlayer';
import { EXAMPLE_SCRIPT, type TopicScript } from '../schema';

/**
 * GenericTopic · 通用主题 composition
 *
 * 接收 `script` 作为 React prop（Remotion 会把 Composition 的 defaultProps +
 * 调用方传入的 inputProps 合并后作为 props 传给组件）。
 *
 * 无 script 时默认播 EXAMPLE_SCRIPT（epoll），便于单独启动时预览。
 *
 * Studio / CLI 通过这些方式传入：
 *   renderMedia({ ..., inputProps: { script } })
 *   <Player inputProps={{ script }} />
 */
export const GenericTopicComposition: React.FC<{
  script?: TopicScript;
}> = ({ script }) => {
  return <GenericScenePlayer script={script ?? EXAMPLE_SCRIPT} />;
};
