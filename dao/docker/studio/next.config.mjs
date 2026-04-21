/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 允许从兄弟目录 visualizer/src 里 import 场景组件
  transpilePackages: [],
  webpack: (config) => {
    // 让 @visualizer/* 别名指向 ../visualizer/src/*
    // （tsconfig 的 paths 也配置了同样的东西，这里确保 webpack 端也能解析）
    return config;
  },
  experimental: {
    // 防止 @remotion/player 在 SSR 时报错
    esmExternals: 'loose',
  },
};

export default nextConfig;
