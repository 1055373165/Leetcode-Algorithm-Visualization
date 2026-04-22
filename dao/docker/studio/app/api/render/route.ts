import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import type { TopicScript } from '@/lib/schema';

/**
 * POST /api/render
 *
 * 接收 TopicScript，调用 visualizer 目录下的 Remotion CLI 渲染 MP4。
 * 输出文件写入 public/renders/，Next.js 自动 serve。
 *
 * Body: { script: TopicScript, topicId: string }
 * Response: { url: string }  或  错误信息
 */
export async function POST(req: NextRequest) {
  let body: { script?: TopicScript; topicId?: string };
  try {
    body = (await req.json()) as { script?: TopicScript; topicId?: string };
  } catch {
    return NextResponse.json({ error: '请求体不是合法 JSON' }, { status: 400 });
  }

  const { script, topicId } = body;
  if (!script || !topicId) {
    return NextResponse.json(
      { error: 'script 和 topicId 不能为空' },
      { status: 400 },
    );
  }

  // 确保输出目录存在
  const rendersDir = path.resolve(process.cwd(), 'public', 'renders');
  fs.mkdirSync(rendersDir, { recursive: true });

  const outputFile = path.join(rendersDir, `${topicId}.mp4`);

  // props 写入临时文件（避免 shell 转义超长 JSON）
  const propsFile = path.join(os.tmpdir(), `render-props-${topicId}.json`);
  fs.writeFileSync(propsFile, JSON.stringify({ script }), 'utf8');

  const visualizerDir = path.resolve(process.cwd(), '..', 'visualizer');

  // 检查 visualizer 目录是否存在
  if (!fs.existsSync(visualizerDir)) {
    return NextResponse.json(
      { error: `找不到 visualizer 目录: ${visualizerDir}` },
      { status: 500 },
    );
  }

  const tag = `[render ${topicId}]`;
  console.log(`${tag} 开始渲染 → ${outputFile}`);
  const t0 = Date.now();

  try {
    await new Promise<void>((resolve, reject) => {
      const proc = spawn(
        'npx',
        [
          'remotion',
          'render',
          'GenericTopic',
          outputFile,
          `--props=${propsFile}`,
        ],
        {
          cwd: visualizerDir,
          stdio: ['ignore', 'pipe', 'pipe'],
          // 10 分钟超时兜底。
          // 当前目标视频长度 3-5 分钟，Remotion 渲染耗时大约是视频时长的 1.5-3 倍
          // （Mac M 系列），所以最长可能跑到 ~15 分钟；但 10 分钟是合理的"卡死"阈值。
          // 真需要跑更久，说明 Remotion 或脚本本身有问题，应该让它失败而不是继续耗着。
          timeout: 600_000,
        },
      );

      let stdout = '';
      let stderr = '';

      proc.stdout?.on('data', (d) => {
        const s = d.toString();
        stdout += s;
        // 把 Remotion 渲染进度打印到服务端日志
        console.log(`${tag} stdout: ${s.trim()}`);
      });

      proc.stderr?.on('data', (d) => {
        const s = d.toString();
        stderr += s;
        console.log(`${tag} stderr: ${s.trim()}`);
      });

      proc.on('error', (err) => {
        reject(new Error(`子进程启动失败: ${err.message}`));
      });

      proc.on('close', (code) => {
        const elapsed = Date.now() - t0;
        console.log(`${tag} 退出码 ${code}，耗时 ${elapsed}ms`);
        if (code === 0) {
          resolve();
        } else {
          reject(
            new Error(
              `Remotion 渲染失败 (exit ${code})\nstdout: ${stdout.slice(-500)}\nstderr: ${stderr.slice(-500)}`,
            ),
          );
        }
      });
    });

    // 清理临时 props 文件
    try {
      fs.unlinkSync(propsFile);
    } catch {
      // ignore
    }

    const url = `/renders/${topicId}.mp4`;
    console.log(`${tag} 渲染完成: ${url}`);
    return NextResponse.json({ url, filePath: outputFile });
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e);
    console.error(`${tag} 渲染异常:`, err);
    return NextResponse.json({ error: err }, { status: 500 });
  }
}
