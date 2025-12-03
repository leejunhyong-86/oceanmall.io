/**
 * @file components/related-products.tsx
 * @description 관련 상품 컴포넌트
 */

import Link from 'next/link';
import Image from 'next/image';
import { Star } from 'lucide-react';
import type { Product } from '@/types';

interface RelatedProductsProps {
  products: Product[];
}

export function RelatedProducts({ products }: RelatedProductsProps) {
  if (products.length === 0) {
    return null;
  }

  // 가격 포맷팅
  const formatPrice = (price: number | null) => {
    if (price === null) return '가격 문의';
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="bg-white rounded-xl border p-4">
      <h3 className="font-semibold text-gray-900 mb-4">관련 상품</h3>
      <div className="space-y-4">
        {products.map((product) => (
          <Link
            key={product.id}
            href={`/products/${product.slug}`}
            className="flex gap-3 group"
          >
            {/* 썸네일 */}
            <div className="relative w-16 h-20 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
              {product.thumbnail_url ? (
                <Image
                  src={product.thumbnail_url}
                  alt={product.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-2xl opacity-30">📦</span>
                </div>
              )}
            </div>

            {/* 정보 */}
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-purple-600 transition-colors">
                {product.title}
              </h4>
              {product.external_rating && (
                <div className="flex items-center gap-1 mt-1">
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  <span className="text-xs text-gray-500">
                    {product.external_rating.toFixed(1)}
                  </span>
                </div>
              )}
              <div className="text-sm font-semibold text-gray-900 mt-1">
                {formatPrice(product.price_krw)}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

