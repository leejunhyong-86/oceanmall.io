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
  ChevronLeft 
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

  // 가격 포맷팅 (개선된 버전)
  const formatPrice = () => {
    // 1. KRW 가격이 있고 합리적인 범위 내에 있으면 우선 표시
    if (product.price_krw !== null && product.price_krw > 0) {
      // 비정상적으로 큰 가격 체크 (1억원 이상이면 원본 가격 표시)
      if (product.price_krw < 100000000) {
        return {
          main: new Intl.NumberFormat('ko-KR', {
            style: 'currency',
            currency: 'KRW',
            maximumFractionDigits: 0,
          }).format(product.price_krw),
          sub: null,
        };
      }
    }

    // 2. 원본 가격이 있으면 환산하여 표시
    if (product.original_price !== null && product.original_price > 0 && product.currency) {
      const exchangeRates: Record<string, number> = {
        USD: 1400,
        EUR: 1500,
        JPY: 10,
        CNY: 200,
        KRW: 1,
      };
      
      const rate = exchangeRates[product.currency] || 1;
      const estimatedKRW = Math.round(product.original_price * rate);
      
      // 비정상적으로 큰 가격 체크
      if (estimatedKRW < 100000000) {
        return {
          main: `${product.currency} ${product.original_price.toLocaleString()}`,
          sub: `약 ${new Intl.NumberFormat('ko-KR', {
            style: 'currency',
            currency: 'KRW',
            maximumFractionDigits: 0,
          }).format(estimatedKRW)}`,
        };
      }
    }

    // 3. 둘 다 없거나 비정상적이면 가격 문의
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
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
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

          {/* 조회수 */}
          <div className="text-sm text-gray-500">
            조회수 {product.view_count.toLocaleString()}회
          </div>
        </div>
      </div>
    </div>
  );
}

