import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from '../contexts/AuthContext';
import { RoomProvider } from '../contexts/RoomContext';
import { GameStateProvider } from '../contexts/GameStateContext';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "海龜湯遊戲",
  description: "線上海龜湯遊戲平台",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <head>
        {/* 移除所有 preload 標籤，讓 Next.js 自動處理資源載入 */}
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <div id="app">
          <AuthProvider>
            <RoomProvider>
              <GameStateProvider>
                {children}
              </GameStateProvider>
            </RoomProvider>
          </AuthProvider>
        </div>
      </body>
    </html>
  );
}
