import type { Metadata } from 'next';
import { Nav } from '@/components/Nav';
import './globals.css';

export const metadata: Metadata = {
  title: 'Dao Studio · 技术深度视频工作室',
  description: '输入任意技术主题，AI 生成 30 秒视频解析，统一管理 + 间隔复习',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>
        <div className="min-h-screen flex flex-col">
          <Nav />
          <main className="flex-1 max-w-[1400px] w-full mx-auto px-8 py-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
