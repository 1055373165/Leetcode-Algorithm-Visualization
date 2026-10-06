import {fileURLToPath} from 'node:url';
import {defineConfig} from 'vite';
import motionCanvas from '@motion-canvas/vite-plugin';
import ffmpeg from '@motion-canvas/ffmpeg';

export default defineConfig({
  plugins: [
    motionCanvas({
      project: fileURLToPath(new URL('./motion-canvas/sliding-window.ts', import.meta.url)),
      output: fileURLToPath(new URL('../motion-canvas/output', import.meta.url)),
    }),
    ffmpeg(),
  ],
  server: {host: '127.0.0.1', port: 9000, strictPort: true},
  build: {
    outDir: 'dist/motion-canvas',
    emptyOutDir: false,
    rollupOptions: {input: {workbench: fileURLToPath(new URL('../motion-canvas/workbench.html', import.meta.url))}},
  },
});
