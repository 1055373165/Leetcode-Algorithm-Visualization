/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Studio 前端 bundle 不再包含 Remotion。视频渲染完全由 /api/render 通过
  // 子进程调 visualizer CLI 完成，MP4 落盘到 public/renders/，浏览器用原生
  // <video> 标签播放。好处：
  //   1. Studio 代码库里搜不到 Remotion / visualizer 的 import 路径
  //   2. 未来 visualizer 升版本不会拖累 studio
  //   3. 彻底消除之前"两份 Remotion"的运行时冲突
};

export default nextConfig;
