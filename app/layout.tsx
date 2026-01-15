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
    icon: [
      { url: "/icon-180x180.png", sizes: "180x180", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-256x256.png", sizes: "256x256", type: "image/png" },
      { url: "/icons/icon-384x384.png", sizes: "384x384", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icon-180x180.png", sizes: "180x180", type: "image/png" },
    ],
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
