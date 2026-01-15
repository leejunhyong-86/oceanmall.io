'use client';

/**
 * @file components/product-detail.tsx
 * @description 상품 상세 정보 컴포넌트
 *
 * 릴스 스타일 영상 플레이어와 상품 정보를 표시합니다.
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Star, 
  Heart, 
  ExternalLink,
  Share2,
  ChevronLeft,
  ShoppingBag
} from 'lucide-react';
import { Button } from './ui/button';
import { toggleWishlist, isInWishlist } from '@/actions/wishlists';
import { AddToCartButton } from './add-to-cart-button';
import { ProductImageGallery } from './product-image-gallery';
import type { ProductWithCategory } from '@/types';
import { cn } from '@/lib/utils';

interface ProductDetailProps {
  product: ProductWithCategory;
}

export function ProductDetail({ product }: ProductDetailProps) {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isLoadingWishlist, setIsLoadingWishlist] = useState(false);

  // 위시리스트 상태 확인
  useEffect(() => {
    isInWishlist(product.id).then(setIsWishlisted);
  }, [product.id]);

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

  // 가격 포맷팅 - USD 기준으로 표시
  const formatPrice = () => {
    // 원본 가격이 있으면 USD 형식으로 표시
    if (product.original_price !== null && product.original_price > 0 && product.currency) {
      // 가격이 비정상적으로 큰 경우 (예: 10000 이상) 체크
      // Amazon 상품의 경우 일반적으로 $1000 이하이므로, $10000 이상이면 파싱 오류로 간주
      if (product.original_price > 10000) {
        // 가격을 100으로 나눠서 소수점 2자리로 표시 (예: 103207 -> 1032.07)
        const correctedPrice = product.original_price / 100;
        return {
          main: new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: product.currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }).format(correctedPrice),
          sub: null,
        };
      }
      
      // 정상적인 가격 범위
      return {
        main: new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: product.currency,
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(product.original_price),
        sub: product.price_krw && product.price_krw < 100000000
          ? `약 ${new Intl.NumberFormat('ko-KR', {
              style: 'currency',
              currency: 'KRW',
              maximumFractionDigits: 0,
            }).format(product.price_krw)}`
          : null,
      };
    }

    // KRW 가격만 있는 경우
    if (product.price_krw !== null && product.price_krw > 0 && product.price_krw < 100000000) {
      return {
        main: new Intl.NumberFormat('ko-KR', {
          style: 'currency',
          currency: 'KRW',
          maximumFractionDigits: 0,
        }).format(product.price_krw),
        sub: null,
      };
    }

    // 가격 정보가 없거나 비정상적인 경우
    return {
      main: '가격 문의',
      sub: '원본 사이트에서 확인하세요',
    };
  };

  const priceInfo = formatPrice();

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
          <ProductImageGallery
            videoUrl={product.video_url}
            thumbnailUrl={product.thumbnail_url}
            images={product.images || []}
            productTitle={product.title}
          />
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
              {priceInfo.main}
            </div>
            {priceInfo.sub && (
              <div className="text-gray-500 mt-1">
                {priceInfo.sub}
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
          <div className="space-y-3 pt-4">
            {/* 메인 액션 버튼들 */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* 직접 구매 가능하면 장바구니 버튼, 아니면 외부 링크 버튼 */}
              <AddToCartButton
                productId={product.id}
                priceKrw={product.price_krw}
                sourceUrl={product.source_url}
                className="flex-1"
              />

              {/* 직접 구매 가능해도 외부 링크 제공 */}
              {product.price_krw && (
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                >
                  <a
                    href={product.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="w-5 h-5 mr-2" />
                    {getPlatformLabel(product.source_platform)}
                  </a>
                </Button>
              )}

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

            {/* 장바구니 바로가기 버튼 */}
            {product.price_krw && (
              <Button
                asChild
                variant="outline"
                size="lg"
                className="w-full border-purple-200 text-purple-700 hover:bg-purple-50"
              >
                <Link href="/cart">
                  <ShoppingBag className="w-5 h-5 mr-2" />
                  장바구니 보기
                </Link>
              </Button>
            )}
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

