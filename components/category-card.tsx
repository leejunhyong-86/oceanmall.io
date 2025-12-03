/**
 * @file components/category-card.tsx
 * @description 카테고리 카드 컴포넌트
 */

import Link from 'next/link';
import Image from 'next/image';
import type { Category } from '@/types';

interface CategoryCardProps {
  category: Category;
}

export function CategoryCard({ category }: CategoryCardProps) {
  return (
    <Link
      href={`/products?category=${category.slug}`}
      className="group block p-4 bg-white rounded-xl border border-gray-100 hover:border-purple-200 hover:shadow-md transition-all"
    >
      <div className="flex flex-col items-center text-center">
        {/* 아이콘 또는 이미지 */}
        <div className="w-12 h-12 mb-3 bg-purple-50 rounded-xl flex items-center justify-center group-hover:bg-purple-100 transition-colors overflow-hidden">
          {category.image_url ? (
            <Image
              src={category.image_url}
              alt={category.name}
              width={32}
              height={32}
              className="object-cover"
            />
          ) : (
            <span className="text-2xl">
              {getCategoryEmoji(category.slug)}
            </span>
          )}
        </div>

        {/* 카테고리명 */}
        <span className="font-medium text-sm text-gray-700 group-hover:text-purple-600 transition-colors">
          {category.name}
        </span>
      </div>
    </Link>
  );
}

// 카테고리별 기본 이모지
function getCategoryEmoji(slug: string): string {
  const emojis: Record<string, string> = {
    fashion: '👕',
    beauty: '💄',
    electronics: '📱',
    home: '🏠',
    health: '💊',
    sports: '⚽',
    toys: '🎮',
    food: '🍔',
    baby: '👶',
    pet: '🐕',
    books: '📚',
    auto: '🚗',
  };
  return emojis[slug] || '📦';
}

