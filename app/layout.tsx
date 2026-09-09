import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '下一步，想清楚！｜L2 無心的錯誤',
  description: '給國一學生的三輪校園情境對話選擇遊戲。',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-Hant"><body>{children}</body></html>;
}
