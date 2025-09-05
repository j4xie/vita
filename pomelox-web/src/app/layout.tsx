import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
// Import i18n configuration
// import '../lib/i18n';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'PomeloX - 海外华人学生活动平台',
  description: 'PomeloX是专为海外华人学生打造的活动管理和志愿服务平台。发现活动，参与社区，记录成长。',
  keywords: ['华人学生', '海外活动', '志愿服务', '学生社区', 'PomeloX'],
  authors: [{ name: 'PomeloX Team' }],
  viewport: 'width=device-width, initial-scale=1',
  robots: 'index, follow',
  openGraph: {
    title: 'PomeloX - 海外华人学生活动平台',
    description: '发现活动，参与社区，记录成长',
    type: 'website',
    locale: 'zh_CN',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="theme-color" content="#ff6b35" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="PomeloX" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={inter.className}>
        <div id="root">
          {children}
        </div>
      </body>
    </html>
  );
}