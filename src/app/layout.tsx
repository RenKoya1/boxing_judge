import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Boxing Judge AI - ボクシング AI 採点システム",
  description: "AIによるボクシング動画の分析・採点アプリケーション",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
