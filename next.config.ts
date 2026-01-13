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
      // 와디즈 크롤링 이미지 - 각 서브도메인 명시
      { hostname: "cdn.wadiz.kr" },
      { hostname: "cdn1.wadiz.kr" },
      { hostname: "cdn2.wadiz.kr" },
      { hostname: "cdn3.wadiz.kr" },
      { hostname: "static.wadiz.kr" },
      { hostname: "www.wadiz.kr" },
      // Amazon 크롤링 이미지
      { hostname: "images-na.ssl-images-amazon.com" },
      { hostname: "images-eu.ssl-images-amazon.com" },
      { hostname: "m.media-amazon.com" },
      { hostname: "images-amazon.com" },
      // Shopee Thailand 크롤링 이미지
      { hostname: "cf.shopee.co.th" },
      { hostname: "down-th.img.susercontent.com" },
      { hostname: "f.shopee.co.th" },
      // eBay 크롤링 이미지
      { hostname: "i.ebayimg.com" },
      { hostname: "thumbs.ebaystatic.com" },
      // AliExpress 크롤링 이미지
      { hostname: "ae01.alicdn.com" },
      { hostname: "ae02.alicdn.com" },
      { hostname: "ae03.alicdn.com" },
      { hostname: "ae04.alicdn.com" },
      { hostname: "img.alicdn.com" },
      { hostname: "gd1.alicdn.com" },
      { hostname: "gd2.alicdn.com" },
      { hostname: "gd3.alicdn.com" },
      { hostname: "gd4.alicdn.com" },
      // Instagram 이미지 (Phase 2: Instagram 피드)
      { hostname: "scontent.cdninstagram.com" },
      { hostname: "*.cdninstagram.com", protocol: "https" },
      // YouTube 썸네일 (Phase 3 대비)
      { hostname: "i.ytimg.com" },
      { hostname: "img.youtube.com" },
    ],
  },
  // HTTP 431 에러 방지: 헤더 크기 제한 증가
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

export default nextConfig;
