import React from 'react';
import { CpuThrottleVisualizer } from '../components/CpuThrottleVisualizer';

/**
 * CpuThrottle · Composition 入口
 *
 * 负责声明"这个视频要讲什么参数下的故事"——
 * 具体的渲染交给 Visualizer 组件。
 *
 * 参数：50000 / 100000 µs = 0.5 CPU 核（Docker `--cpus=0.5` 的等效）
 * 周期数：3 个（够让观众看到规律，又不太长）
 */
export const CpuThrottleComposition: React.FC = () => {
  return (
    <CpuThrottleVisualizer
      config={{
        quotaUs: 50_000,
        periodUs: 100_000,
        periodCount: 3,
      }}
    />
  );
};
