import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { koKR } from "@clerk/localizations";
import { Geist, Geist_Mono } from "next/font/google";

import Navbar from "@/components/Navbar";
import { SyncUserProvider } from "@/components/providers/sync-user-provider";
import CustomCursor from "@/components/custom-cursor";
import DynamicBackground from "@/components/DynamicBackground";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "오션몰 - AI 리뷰 통합 플랫폼",
  description: "전세계 인기 상품의 리뷰를 AI가 한눈에 요약해드립니다. 해외직구의 정보 탐색 시간을 90% 단축하세요.",
  keywords: ["해외직구", "리뷰", "AI", "쇼핑", "아마존", "알리익스프레스"],
  icons: {
    icon: "/icon-180x180.png",
    shortcut: "/icon-180x180.png",
    apple: "/icon-180x180.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider localization={koKR}>
      <html lang="ko">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <DynamicBackground />
          <SyncUserProvider>
            <Navbar />
            {children}
          </SyncUserProvider>
          <CustomCursor />
        </body>
      </html>
    </ClerkProvider>
  );
}
