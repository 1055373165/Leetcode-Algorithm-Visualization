import { Config } from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setOutputLocation('out/video.mp4');
Config.setConcurrency(4);

// Remotion Studio CSRF 防护：放开常用 origins
// 如果还是被拦，把 Terminal 里报的 blocked origin 加到下面数组里。
// 某些版本的 Remotion 用方法名可能不同；env 变量是最稳的 fallback，见 README。
try {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const c: any = Config;
  if (typeof c.setStudioOrigin === 'function') {
    c.setStudioOrigin(['http://localhost:3000', 'http://127.0.0.1:3000']);
  }
} catch {
  // 低版本无此 API，走 env 变量方式
}
