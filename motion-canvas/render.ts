import {randomUUID} from 'node:crypto';
import {mkdir, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {chromium} from 'playwright';
import {createServer} from 'vite';

async function main() {
  const server = await createServer({
    configFile: resolve('.devin/motion-canvas.vite.ts'),
    server: {host: '127.0.0.1', port: 9001, strictPort: false},
  });
  await server.listen();
  let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
  try {
    browser = await chromium.launch({
      headless: true,
      ...(process.env.CHROME_PATH ? {executablePath: process.env.CHROME_PATH} : {channel: 'chrome'}),
    });
    const page = await browser.newPage({viewport: {width: 1440, height: 1000}});
    const pageErrors: string[] = [];
    page.on('pageerror', error => {pageErrors.push(error.message); console.error(error.message);});
    await page.goto(server.resolvedUrls!.local[0], {waitUntil: 'networkidle'});
    await page.exposeFunction('renderProgress', (frame: number) => {
      if (frame % 600 === 0) console.log(`Rendered frame ${frame}`);
    });
    const info = await page.evaluate(async () => {
      const clientPath = '/motion-canvas/render-client.ts';
      const client = await import(clientPath) as typeof import('./render-client');
      return client.getReviewPoints();
    });
    const reviewDir = resolve('motion-canvas/review');
    await mkdir(reviewDir, {recursive: true});
    for (const point of info.points) {
      const data = await page.evaluate(async time => {
        const clientPath = '/motion-canvas/render-client.ts';
        const client = await import(clientPath) as typeof import('./render-client');
        return client.snapshot(time);
      }, point.time);
      await writeFile(resolve(reviewDir, `${point.name}.png`), Buffer.from(data.split(',')[1], 'base64'));
      console.log(`Snapshot: ${point.name} (${point.time.toFixed(2)}s)`);
    }
    if (!process.argv.includes('--stills')) {
      const exportName = `sliding-window-${new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14)}-${randomUUID().slice(0, 8)}`;
      const result = await page.evaluate(async name => {
        const clientPath = '/motion-canvas/render-client.ts';
        const client = await import(clientPath) as typeof import('./render-client');
        return client.renderVideo((frame: number) => {
          void (window as unknown as {renderProgress: (frame: number) => Promise<void>}).renderProgress(frame);
        }, name);
      }, exportName);
      console.log(JSON.stringify({file: `motion-canvas/output/${exportName}.mp4`, ...result}));
    }
    if (pageErrors.length) throw new Error(pageErrors.join('\n'));
  } finally {
    await browser?.close();
    await server.close();
  }
}

main().catch(error => {console.error(error); process.exitCode = 1;});
