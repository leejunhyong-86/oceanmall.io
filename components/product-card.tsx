'use client';

/**
 * @file components/product-card.tsx
 * @description 릴스 스타일 상품 카드 컴포넌트
 *
 * 9:16 비율의 세로형 썸네일로 호버 시 영상이 재생됩니다.
 * 인스타그램 릴스 스타일의 모던한 디자인입니다.
 */

import { useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Play, Star, ExternalLink } from 'lucide-react';
import type { ProductWithCategory } from '@/types';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: ProductWithCategory;
  className?: string;
}

export function ProductCard({ product, className }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [hasVideoError, setHasVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (videoRef.current && product.video_url && !hasVideoError) {
      videoRef.current.play().catch(() => {
        // 자동 재생 실패 시 무시
        setHasVideoError(true);
      });
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  // 가격 포맷팅 - USD(달러) 기준
  const formatPrice = (price: number | null, currency: string = 'USD') => {
    if (price === null) return 'Price TBD';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(price);
  };

  // 플랫폼 이름 표시
  const getPlatformLabel = (platform: string) => {
    const labels: Record<string, string> = {
      amazon: '아마존',
      aliexpress: '알리',
      iherb: 'iHerb',
      ebay: '이베이',
    };
    return labels[platform.toLowerCase()] || platform;
  };

  return (
    <Link
      href={`/products/${product.slug}`}
      className={cn(
        'group block relative rounded-2xl overflow-hidden bg-gray-100 shadow-sm hover:shadow-xl transition-all duration-300',
        className
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* 9:16 비율 컨테이너 */}
      <div className="relative aspect-[9/16] overflow-hidden">
        {/* 썸네일 이미지 */}
        {product.thumbnail_url ? (
          <Image
            src={product.thumbnail_url}
            alt={product.title}
            fill
            className={cn(
              'object-cover transition-opacity duration-300',
              isHovered && isVideoLoaded ? 'opacity-0' : 'opacity-100'
            )}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center">
            <span className="text-6xl opacity-20">📦</span>
          </div>
        )}

        {/* 영상 (호버 시 재생) */}
        {product.video_url && !hasVideoError && (
          <video
            ref={videoRef}
            src={product.video_url}
            className={cn(
              'absolute inset-0 w-full h-full object-cover transition-opacity duration-300',
              isHovered ? 'opacity-100' : 'opacity-0'
            )}
            muted
            loop
            playsInline
            preload="metadata"
            onLoadedData={() => setIsVideoLoaded(true)}
            onError={() => {
              // 영상 로드 실패 시 에러 상태로 설정
              setHasVideoError(true);
              setIsVideoLoaded(false);
            }}
          />
        )}

        {/* 영상 재생 아이콘 (영상이 있고, 로드되었으며, 에러가 없을 때만) */}
        {product.video_url && isVideoLoaded && !hasVideoError && !isHovered && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center">
              <Play className="w-6 h-6 text-white fill-white" />
            </div>
          </div>
        )}

        {/* 그라데이션 오버레이 */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* 상단 배지들 */}
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
          {/* 플랫폼 배지 */}
          <span className="px-2 py-1 bg-white/90 backdrop-blur-sm text-xs font-medium rounded-full text-gray-700">
            {getPlatformLabel(product.source_platform)}
          </span>

          {/* 추천 배지 */}
          {product.is_featured && (
            <span className="px-2 py-1 bg-yellow-400 text-xs font-bold rounded-full text-yellow-900">
              추천
            </span>
          )}
        </div>

        {/* 하단 정보 */}
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          {/* 평점 */}
          {product.external_rating && (
            <div className="flex items-center gap-1 mb-2">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium">{product.external_rating.toFixed(1)}</span>
              {product.external_review_count > 0 && (
                <span className="text-xs text-gray-300">
                  ({product.external_review_count.toLocaleString()})
                </span>
              )}
            </div>
          )}

          {/* 상품명 */}
          <h3 className="font-semibold text-sm sm:text-base line-clamp-2 mb-2 group-hover:text-purple-200 transition-colors">
            {product.title}
          </h3>

          {/* 가격 - 할인 정보 포함 */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {product.discount_rate > 0 && (
                <span className="text-red-500 font-bold text-sm">{product.discount_rate}%</span>
              )}
              {/* 할인된 가격 표시 (original_price 기준) */}
              <span className="text-lg font-bold">
                {product.discount_rate > 0 && product.original_price
                  ? formatPrice(product.original_price * (1 - product.discount_rate / 100), product.currency)
                  : formatPrice(product.original_price, product.currency)}
              </span>
              {/* 할인 전 원가 (취소선) */}
              {product.discount_rate > 0 && product.original_price && (
                <span className="text-sm text-gray-400 line-through">
                  {formatPrice(product.original_price, product.currency)}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between">
              {/* 구매자 수 */}
              {product.purchase_count > 0 && (
                <span className="text-xs text-gray-300">{product.purchase_count}명구매중</span>
              )}
              <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity ml-auto" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

// 스켈레톤 로딩 상태
export function ProductCardSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden bg-gray-100 animate-pulse">
      <div className="aspect-[9/16] bg-gray-200" />
    </div>
  );
}

