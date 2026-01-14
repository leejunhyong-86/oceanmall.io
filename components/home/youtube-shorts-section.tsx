/**
 * @file components/home/youtube-shorts-section.tsx
 * @description YouTube Shorts 영상 표시 섹션
 *
 * YouTube 채널의 쇼츠 영상을 그리드 형태로 표시합니다.
 * 각 영상을 클릭하면 전체화면 모달로 재생됩니다.
 *
 * 주요 기능:
 * - 9:16 세로 비율 그리드 (모바일 2열, 데스크탑 6열)
 * - 썸네일 표시 + 재생 버튼 오버레이
 * - 클릭 시 전체화면 모달로 iframe 재생
 * - 조회수 표시 (K/M 포맷)
 * - 다크 배경 (bg-gray-900)
 *
 * @dependencies
 * - next/image: 이미지 최적화
 * - lucide-react: 아이콘
 */

'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Youtube, Play, Eye, X } from 'lucide-react';
import type { YouTubeShort } from '@/lib/youtube/youtube-service';

interface YouTubeShortsSectionProps {
  shorts: YouTubeShort[];
}

export function YouTubeShortsSection({ shorts }: YouTubeShortsSectionProps) {
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(6); // 초기 6개만 표시

  // 더보기 버튼 핸들러
  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 6); // 6개씩 추가
  };

  // 표시할 쇼츠 목록
  const visibleShorts = shorts.slice(0, visibleCount);
  const hasMore = visibleCount < shorts.length;

  // 쇼츠가 없으면 섹션을 렌더링하지 않음
  if (shorts.length === 0) {
    return null;
  }

  return (
    <>
      <section className="py-16 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4">
          {/* 헤더 */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center">
                <Youtube className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold">
                  YouTube Shorts
                </h2>
                <p className="text-sm text-gray-400">
                  최신 쇼츠 영상
                </p>
              </div>
            </div>
          </div>

          {/* 쇼츠 그리드 - 모바일 1열, 태블릿 3열, 데스크탑 6열 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {visibleShorts.map((short) => (
              <button
                key={short.id}
                onClick={() => setSelectedVideo(short.id)}
                className="group relative aspect-[9/16] overflow-hidden rounded-lg bg-gray-800 hover:ring-4 hover:ring-red-500 transition-all duration-300"
                aria-label={`${short.title} 재생`}
              >
                {/* 썸네일 */}
                <Image
                  src={short.thumbnail.high || short.thumbnail.medium}
                  alt={short.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                />

                {/* 재생 버튼 오버레이 */}
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-colors flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-red-600/90 group-hover:bg-red-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Play className="w-8 h-8 text-white fill-white ml-1" />
                  </div>
                </div>

                {/* 조회수 */}
                <div className="absolute bottom-2 left-2 right-2">
                  <div className="flex items-center gap-1 text-xs bg-black/70 backdrop-blur-sm rounded px-2 py-1">
                    <Eye className="w-3 h-3" />
                    <span>{formatNumber(parseInt(short.viewCount, 10))}</span>
                  </div>
                </div>

                {/* 제목 (호버 시) */}
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-xs line-clamp-2 text-white">
                    {short.title}
                  </p>
                </div>
              </button>
            ))}
          </div>

          {/* 더보기 버튼 */}
          {hasMore && (
            <div className="mt-8 text-center">
              <button
                onClick={handleLoadMore}
                className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-full font-semibold transition-colors"
              >
                더보기
                <Youtube className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* 전체화면 모달 */}
      {selectedVideo && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={() => setSelectedVideo(null)}
          role="dialog"
          aria-modal="true"
          aria-label="YouTube Shorts 재생"
        >
          {/* 닫기 버튼 */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedVideo(null);
            }}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
            aria-label="닫기"
          >
            <X className="w-8 h-8" />
          </button>

          {/* YouTube iframe */}
          <div
            className="relative w-full max-w-md aspect-[9/16]"
            onClick={(e) => e.stopPropagation()}
          >
            <iframe
              src={`https://www.youtube.com/embed/${selectedVideo}?autoplay=1&rel=0`}
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
              className="w-full h-full rounded-lg"
              title="YouTube Shorts"
            />
          </div>
        </div>
      )}
    </>
  );
}

/**
 * 숫자를 K/M 포맷으로 변환
 * 예: 1000 → "1K", 1500000 → "1.5M"
 */
function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}
