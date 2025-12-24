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
      // 와디즈 크롤링 이미지
      { hostname: "cdn.wadiz.kr" },
      { hostname: "static.wadiz.kr" },
    ],
  },
};

export default nextConfig;
