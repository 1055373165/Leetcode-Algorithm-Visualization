import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 允许从兄弟目录 visualizer/src 里 import 场景组件
  transpilePackages: [],
  webpack: (config) => {
    // 关键：强制 Remotion 单例。
    //
    // 背景：我们从 ../visualizer/src/* 通过 tsconfig paths 引入场景组件，
    // 而 visualizer 自己 node_modules 里又有一份 remotion / @remotion/player。
    // 如果不 alias，webpack 在打包 visualizer 的源码时会沿着 visualizer 的
    // node_modules 解析，最终 bundle 里会出现两份 Remotion（即便版本号
    // 一致，module identity 也是不同的），触发 Remotion 的 checkMultiple
    // RemotionVersions 运行时断言：
    //   🚨 Multiple versions of Remotion detected: 4.0.448 and 4.0.449
    //
    // 我们 pin 两侧都到 4.0.448 之后，版本号一致了，但 bundle 里仍会是
    // 两份 module instance。这里的 alias 把 remotion / @remotion/player
    // 永远解析到 studio 根下的同一份，彻底消除多实例。
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      remotion: path.resolve(__dirname, 'node_modules/remotion'),
      '@remotion/player': path.resolve(
        __dirname,
        'node_modules/@remotion/player',
      ),
    };
    return config;
  },
  experimental: {
    // 防止 @remotion/player 在 SSR 时报错
    esmExternals: 'loose',
  },
};

export default nextConfig;
