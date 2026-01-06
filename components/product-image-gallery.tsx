'use client';

/**
 * @file components/product-image-gallery.tsx
 * @description 상품 이미지 갤러리 컴포넌트
 *
 * 기능:
 * 1. 메인 이미지 표시 (9:16 비율)
 * 2. 썸네일 호버 시 메인 이미지 변경
 * 3. 이미지 클릭 시 확대 모달
 * 4. 비디오 재생 지원
 */

import { useState, useRef } from 'react';
import Image from 'next/image';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent } from './ui/dialog';
import { cn } from '@/lib/utils';

interface ProductImageGalleryProps {
  videoUrl?: string | null;
  thumbnailUrl?: string | null;
  images: string[];
  productTitle: string;
}

export function ProductImageGallery({
  videoUrl,
  thumbnailUrl,
  images,
  productTitle,
}: ProductImageGalleryProps) {
  // 모든 미디어 아이템 (비디오 + 이미지들)
  const allMedia = [
    ...(videoUrl ? [{ type: 'video' as const, url: videoUrl }] : []),
    ...(thumbnailUrl ? [{ type: 'image' as const, url: thumbnailUrl }] : []),
    ...images.map((url) => ({ type: 'image' as const, url })),
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalIndex, setModalIndex] = useState(0);
  
  // 비디오 관련 상태
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const currentMedia = allMedia[currentIndex] || { type: 'image', url: thumbnailUrl };

  // 썸네일 호버
  const handleThumbnailHover = (index: number) => {
    setCurrentIndex(index);
    // 비디오를 호버로 변경하면 재생 중지
    if (allMedia[index]?.type === 'video' && videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  // 이미지 클릭 - 모달 열기
  const handleImageClick = () => {
    setModalIndex(currentIndex);
    setIsModalOpen(true);
  };

  // 모달 내 이전/다음 이미지
  const handleModalPrev = () => {
    setModalIndex((prev) => (prev > 0 ? prev - 1 : allMedia.length - 1));
  };

  const handleModalNext = () => {
    setModalIndex((prev) => (prev < allMedia.length - 1 ? prev + 1 : 0));
  };

  // 비디오 재생/일시정지
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // 음소거 토글
  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  if (allMedia.length === 0) {
    return (
      <div className="relative aspect-[9/16] max-h-[600px] bg-gray-100 rounded-2xl overflow-hidden mx-auto flex items-center justify-center">
        <span className="text-8xl opacity-20">📦</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 메인 미디어 */}
      <div
        className="relative aspect-[9/16] max-h-[600px] bg-black rounded-2xl overflow-hidden mx-auto cursor-pointer group"
        onClick={currentMedia.type === 'image' ? handleImageClick : undefined}
      >
        {currentMedia.type === 'video' ? (
          <>
            <video
              ref={videoRef}
              src={currentMedia.url}
              className="w-full h-full object-contain"
              loop
              playsInline
              muted={isMuted}
              poster={thumbnailUrl || undefined}
            />

            {/* 비디오 컨트롤 */}
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
              <Button
                size="icon"
                variant="ghost"
                className="bg-black/50 text-white hover:bg-black/70"
                onClick={(e) => {
                  e.stopPropagation();
                  togglePlay();
                }}
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5" />
                )}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="bg-black/50 text-white hover:bg-black/70"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMute();
                }}
              >
                {isMuted ? (
                  <VolumeX className="w-5 h-5" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </Button>
            </div>

            {/* 재생 오버레이 */}
            {!isPlaying && (
              <div
                className="absolute inset-0 flex items-center justify-center cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  togglePlay();
                }}
              >
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                  <Play className="w-8 h-8 text-white fill-white" />
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <Image
              src={currentMedia.url}
              alt={productTitle}
              fill
              className="object-contain"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />
            {/* 확대 힌트 */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 text-gray-900 px-4 py-2 rounded-lg text-sm font-medium">
                클릭하여 확대
              </div>
            </div>
          </>
        )}
      </div>

      {/* 썸네일 갤러리 */}
      {allMedia.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {allMedia.map((media, idx) => (
            <button
              key={idx}
              onMouseEnter={() => handleThumbnailHover(idx)}
              onClick={() => setCurrentIndex(idx)}
              className={cn(
                'relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 border-2 transition-all',
                currentIndex === idx
                  ? 'border-purple-500 ring-2 ring-purple-200'
                  : 'border-transparent hover:border-gray-300'
              )}
            >
              {media.type === 'video' ? (
                <div className="w-full h-full flex items-center justify-center bg-black">
                  <Play className="w-6 h-6 text-white fill-white" />
                </div>
              ) : (
                <Image
                  src={media.url}
                  alt={`${productTitle} ${idx + 1}`}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              )}
            </button>
          ))}
        </div>
      )}

      {/* 확대 모달 */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-none">
          <div className="relative w-full h-[90vh] flex items-center justify-center">
            {/* 닫기 버튼 */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-50 text-white hover:bg-white/10"
              onClick={() => setIsModalOpen(false)}
            >
              <X className="w-6 h-6" />
            </Button>

            {/* 이전 버튼 */}
            {allMedia.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 z-50 text-white hover:bg-white/10"
                onClick={handleModalPrev}
              >
                <ChevronLeft className="w-8 h-8" />
              </Button>
            )}

            {/* 모달 이미지 */}
            <div className="relative w-full h-full flex items-center justify-center p-4">
              {allMedia[modalIndex]?.type === 'image' ? (
                <Image
                  src={allMedia[modalIndex].url}
                  alt={`${productTitle} ${modalIndex + 1}`}
                  fill
                  className="object-contain"
                  sizes="95vw"
                />
              ) : (
                <div className="text-white text-center">
                  <p>비디오는 메인 화면에서 재생해주세요</p>
                </div>
              )}
            </div>

            {/* 다음 버튼 */}
            {allMedia.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 z-50 text-white hover:bg-white/10"
                onClick={handleModalNext}
              >
                <ChevronRight className="w-8 h-8" />
              </Button>
            )}

            {/* 인디케이터 */}
            {allMedia.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 bg-black/50 text-white px-4 py-2 rounded-full text-sm">
                {modalIndex + 1} / {allMedia.length}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}

