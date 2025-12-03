'use client';

/**
 * @file components/product-detail.tsx
 * @description 상품 상세 정보 컴포넌트
 *
 * 릴스 스타일 영상 플레이어와 상품 정보를 표시합니다.
 */

import { useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Star, 
  Heart, 
  ExternalLink,
  Share2,
  ChevronLeft 
} from 'lucide-react';
import { Button } from './ui/button';
import { toggleWishlist, isInWishlist } from '@/actions/wishlists';
import type { ProductWithCategory } from '@/types';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';

interface ProductDetailProps {
  product: ProductWithCategory;
}

export function ProductDetail({ product }: ProductDetailProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isLoadingWishlist, setIsLoadingWishlist] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // 위시리스트 상태 확인
  useEffect(() => {
    isInWishlist(product.id).then(setIsWishlisted);
  }, [product.id]);

  // 영상 재생/일시정지
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

  // 위시리스트 토글
  const handleWishlistToggle = async () => {
    setIsLoadingWishlist(true);
    try {
      const result = await toggleWishlist(product.id);
      if (result.success) {
        setIsWishlisted(result.isInWishlist);
      }
    } finally {
      setIsLoadingWishlist(false);
    }
  };

  // 가격 포맷팅
  const formatPrice = (price: number | null) => {
    if (price === null) return '가격 문의';
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      maximumFractionDigits: 0,
    }).format(price);
  };

  // 플랫폼 이름
  const getPlatformLabel = (platform: string) => {
    const labels: Record<string, string> = {
      amazon: '아마존',
      aliexpress: '알리익스프레스',
      iherb: 'iHerb',
      ebay: '이베이',
    };
    return labels[platform.toLowerCase()] || platform;
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      {/* 뒤로가기 */}
      <div className="p-4 border-b">
        <Link
          href="/products"
          className="inline-flex items-center text-gray-600 hover:text-gray-900"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>상품 목록</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6">
        {/* 미디어 섹션 */}
        <div className="space-y-4">
          {/* 메인 미디어 (영상 또는 이미지) */}
          <div className="relative aspect-[9/16] max-h-[600px] bg-black rounded-2xl overflow-hidden mx-auto">
            {product.video_url ? (
              <>
                <video
                  ref={videoRef}
                  src={product.video_url}
                  className="w-full h-full object-contain"
                  loop
                  playsInline
                  muted={isMuted}
                  poster={product.thumbnail_url || undefined}
                  onClick={togglePlay}
                />
                
                {/* 영상 컨트롤 */}
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="bg-black/50 text-white hover:bg-black/70"
                    onClick={togglePlay}
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
                    onClick={toggleMute}
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
                    onClick={togglePlay}
                  >
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                      <Play className="w-8 h-8 text-white fill-white" />
                    </div>
                  </div>
                )}
              </>
            ) : product.thumbnail_url ? (
              <Image
                src={product.thumbnail_url}
                alt={product.title}
                fill
                className="object-contain"
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                <span className="text-8xl opacity-20">📦</span>
              </div>
            )}
          </div>

          {/* 추가 이미지 썸네일 */}
          {product.images && product.images.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {product.images.slice(0, 5).map((image, idx) => (
                <div
                  key={idx}
                  className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100"
                >
                  <Image
                    src={image}
                    alt={`${product.title} ${idx + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 상품 정보 섹션 */}
        <div className="space-y-6">
          {/* 카테고리 & 플랫폼 */}
          <div className="flex items-center gap-2 flex-wrap">
            {product.category && (
              <Link
                href={`/products?category=${product.category.slug}`}
                className="px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-full hover:bg-purple-200"
              >
                {product.category.name}
              </Link>
            )}
            <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
              {getPlatformLabel(product.source_platform)}
            </span>
            {product.is_featured && (
              <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-sm rounded-full font-medium">
                추천 상품
              </span>
            )}
          </div>

          {/* 상품명 */}
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {product.title}
          </h1>

          {/* 평점 */}
          <div className="flex items-center gap-4">
            {product.external_rating && (
              <div className="flex items-center gap-1">
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold">{product.external_rating.toFixed(1)}</span>
                <span className="text-gray-500">
                  ({product.external_review_count.toLocaleString()} 해외 리뷰)
                </span>
              </div>
            )}
            {product.internal_rating && (
              <div className="flex items-center gap-1 text-purple-600">
                <Star className="w-5 h-5 fill-purple-400 text-purple-400" />
                <span className="font-semibold">{product.internal_rating.toFixed(1)}</span>
                <span className="text-purple-500">
                  ({product.internal_review_count} 한국 리뷰)
                </span>
              </div>
            )}
          </div>

          {/* 가격 */}
          <div className="py-4 border-y">
            <div className="text-3xl font-bold text-gray-900">
              {formatPrice(product.price_krw)}
            </div>
            {product.original_price && product.currency !== 'KRW' && (
              <div className="text-gray-500 mt-1">
                원본 가격: {product.currency} {product.original_price.toLocaleString()}
              </div>
            )}
          </div>

          {/* 설명 */}
          {product.description && (
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-600">{product.description}</p>
            </div>
          )}

          {/* 태그 */}
          {product.tags && product.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {product.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-gray-50 text-gray-600 text-xs rounded"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* 액션 버튼 */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              asChild
              className="flex-1 bg-purple-600 hover:bg-purple-700"
              size="lg"
            >
              <a
                href={product.source_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="w-5 h-5 mr-2" />
                {getPlatformLabel(product.source_platform)}에서 구매하기
              </a>
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={handleWishlistToggle}
              disabled={isLoadingWishlist}
              className={cn(
                isWishlisted && 'border-red-200 bg-red-50'
              )}
            >
              <Heart
                className={cn(
                  'w-5 h-5',
                  isWishlisted ? 'fill-red-500 text-red-500' : ''
                )}
              />
            </Button>

            <Button variant="outline" size="lg">
              <Share2 className="w-5 h-5" />
            </Button>
          </div>

          {/* 조회수 */}
          <div className="text-sm text-gray-500">
            조회수 {product.view_count.toLocaleString()}회
          </div>
        </div>
      </div>
    </div>
  );
}

