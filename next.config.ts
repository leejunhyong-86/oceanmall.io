import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { hostname: "img.clerk.com" },
      { hostname: "images.unsplash.com" },
      { hostname: "images.pexels.com" },
      { hostname: "videos.pexels.com" },
      // Kickstarter 크롤링 이미지
      { hostname: "i.kickstarter.com" },
      { hostname: "ksr-ugc.imgix.net" },
      // 와디즈 크롤링 이미지 (cdn, cdn1, cdn2, cdn3, static 등 모든 서브도메인)
      { hostname: "*.wadiz.kr" },
    ],
  },
};

export default nextConfig;
