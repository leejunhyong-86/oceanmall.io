'use client';

/**
 * @file components/wishlist-item.tsx
 * @description 위시리스트 아이템 컴포넌트
 */

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Star, Trash2, ExternalLink } from 'lucide-react';
import { Button } from './ui/button';
import { removeFromWishlist } from '@/actions/wishlists';
import type { WishlistWithProduct } from '@/types';

interface WishlistItemProps {
  item: WishlistWithProduct;
}

export function WishlistItem({ item }: WishlistItemProps) {
  const [isRemoving, setIsRemoving] = useState(false);
  const [isRemoved, setIsRemoved] = useState(false);

  const handleRemove = async () => {
    setIsRemoving(true);
    const result = await removeFromWishlist(item.product_id);
    if (result.success) {
      setIsRemoved(true);
    }
    setIsRemoving(false);
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

  if (isRemoved) {
    return null;
  }

  return (
    <div className="flex gap-4 p-4 bg-gray-50 rounded-xl">
      {/* 썸네일 */}
      <Link
        href={`/products/${item.product.slug}`}
        className="relative w-20 h-28 flex-shrink-0 bg-gray-200 rounded-lg overflow-hidden"
      >
        {item.product.thumbnail_url ? (
          <Image
            src={item.product.thumbnail_url}
            alt={item.product.title}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-3xl opacity-30">📦</span>
          </div>
        )}
      </Link>

      {/* 정보 */}
      <div className="flex-1 min-w-0">
        <Link
          href={`/products/${item.product.slug}`}
          className="font-medium text-gray-900 hover:text-purple-600 line-clamp-2"
        >
          {item.product.title}
        </Link>

        {item.product.external_rating && (
          <div className="flex items-center gap-1 mt-1">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm text-gray-600">
              {item.product.external_rating.toFixed(1)}
            </span>
          </div>
        )}

        <div className="text-lg font-bold text-gray-900 mt-2">
          {formatPrice(item.product.price_krw)}
        </div>

        {/* 저장 당시 가격과 비교 */}
        {item.saved_price && item.product.price_krw && (
          item.saved_price !== item.product.price_krw && (
            <div className="text-xs mt-1">
              {item.product.price_krw < item.saved_price ? (
                <span className="text-green-600">
                  ↓ {formatPrice(item.saved_price - item.product.price_krw)} 하락
                </span>
              ) : (
                <span className="text-red-600">
                  ↑ {formatPrice(item.product.price_krw - item.saved_price)} 상승
                </span>
              )}
            </div>
          )
        )}
      </div>

      {/* 액션 버튼 */}
      <div className="flex flex-col gap-2">
        <Button
          size="sm"
          variant="outline"
          asChild
        >
          <a
            href={item.product.source_url}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="text-red-500 hover:text-red-600 hover:bg-red-50"
          onClick={handleRemove}
          disabled={isRemoving}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

