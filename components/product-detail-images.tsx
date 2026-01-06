'use client';

/**
 * @file components/product-detail-images.tsx
 * @description 상품 상세 설명 이미지 컴포넌트
 *
 * 상품의 상세 설명 이미지들을 세로로 배치하고,
 * 클릭 시 확대 모달을 표시합니다.
 */

import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent } from './ui/dialog';
import { filterProductDetailImages } from '@/lib/utils/image-filter';

interface ProductDetailImagesProps {
  images: string[];
  productTitle?: string;
}

export function ProductDetailImages({
  images,
  productTitle = '상품',
}: ProductDetailImagesProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // 유효한 이미지만 필터링
  const validImages = filterProductDetailImages(images);

  // 이미지 클릭 - 모달 열기
  const handleImageClick = (index: number) => {
    setCurrentIndex(index);
    setIsModalOpen(true);
  };

  // 모달 내 이전/다음 이미지
  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : validImages.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < validImages.length - 1 ? prev + 1 : 0));
  };

  if (validImages.length === 0) {
    return null;
  }

  return (
    <>
      {/* 이미지 리스트 */}
      <div className="space-y-4">
        {validImages.map((imageUrl, index) => (
          <div
            key={index}
            className="relative w-full cursor-pointer group overflow-hidden rounded-lg bg-gray-50"
            onClick={() => handleImageClick(index)}
          >
            <div className="relative w-full" style={{ paddingBottom: '100%' }}>
              <Image
                src={imageUrl}
                alt={`${productTitle} 상세 이미지 ${index + 1}`}
                fill
                className="object-contain transition-transform group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </div>
            {/* 호버 오버레이 */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 text-gray-900 px-4 py-2 rounded-lg text-sm font-medium">
                클릭하여 확대
              </div>
            </div>
          </div>
        ))}
      </div>

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
            {validImages.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 z-50 text-white hover:bg-white/10"
                onClick={handlePrev}
              >
                <ChevronLeft className="w-8 h-8" />
              </Button>
            )}

            {/* 모달 이미지 */}
            <div className="relative w-full h-full flex items-center justify-center p-4">
              <Image
                src={validImages[currentIndex]}
                alt={`${productTitle} 상세 이미지 ${currentIndex + 1}`}
                fill
                className="object-contain"
                sizes="95vw"
              />
            </div>

            {/* 다음 버튼 */}
            {validImages.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 z-50 text-white hover:bg-white/10"
                onClick={handleNext}
              >
                <ChevronRight className="w-8 h-8" />
              </Button>
            )}

            {/* 인디케이터 */}
            {validImages.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 bg-black/50 text-white px-4 py-2 rounded-full text-sm">
                {currentIndex + 1} / {validImages.length}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

