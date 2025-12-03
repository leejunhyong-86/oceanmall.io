'use client';

/**
 * @file components/product-filters.tsx
 * @description 상품 필터 컴포넌트
 */

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import type { Category, ProductFilters as ProductFiltersType } from '@/types';
import { cn } from '@/lib/utils';

interface ProductFiltersProps {
  categories: Category[];
  currentFilters: ProductFiltersType;
  currentSort?: string;
}

export function ProductFilters({
  categories,
  currentFilters,
  currentSort,
}: ProductFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  
  const [searchValue, setSearchValue] = useState(currentFilters.search || '');
  const [isOpen, setIsOpen] = useState(false);

  // URL 파라미터 업데이트
  const updateParams = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (value === null || value === '') {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    
    // 페이지 리셋
    params.delete('page');
    
    startTransition(() => {
      router.push(`/products?${params.toString()}`);
    });
  };

  // 검색 핸들러
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateParams('search', searchValue);
  };

  // 필터 초기화
  const clearAllFilters = () => {
    setSearchValue('');
    startTransition(() => {
      router.push('/products');
    });
  };

  // 활성 필터 개수
  const activeFilterCount = [
    currentFilters.category,
    currentFilters.search,
    currentFilters.minPrice,
    currentFilters.maxPrice,
    currentFilters.isFeatured,
  ].filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* 모바일 필터 토글 */}
      <div className="lg:hidden">
        <Button
          variant="outline"
          className="w-full justify-between"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4" />
            필터
            {activeFilterCount > 0 && (
              <span className="bg-purple-600 text-white text-xs px-2 py-0.5 rounded-full">
                {activeFilterCount}
              </span>
            )}
          </span>
          <span>{isOpen ? '닫기' : '열기'}</span>
        </Button>
      </div>

      {/* 필터 패널 */}
      <div className={cn(
        'bg-white rounded-xl border p-4 space-y-6',
        'lg:block',
        isOpen ? 'block' : 'hidden lg:block'
      )}>
        {/* 검색 */}
        <div>
          <Label className="text-sm font-medium mb-2 block">검색</Label>
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              type="text"
              placeholder="상품명 검색..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" size="icon" variant="outline" disabled={isPending}>
              <Search className="w-4 h-4" />
            </Button>
          </form>
        </div>

        {/* 카테고리 */}
        <div>
          <Label className="text-sm font-medium mb-2 block">카테고리</Label>
          <div className="space-y-1">
            <button
              onClick={() => updateParams('category', null)}
              className={cn(
                'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors',
                !currentFilters.category
                  ? 'bg-purple-100 text-purple-700 font-medium'
                  : 'hover:bg-gray-100'
              )}
            >
              전체
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => updateParams('category', category.slug)}
                className={cn(
                  'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors',
                  currentFilters.category === category.slug
                    ? 'bg-purple-100 text-purple-700 font-medium'
                    : 'hover:bg-gray-100'
                )}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* 정렬 */}
        <div>
          <Label className="text-sm font-medium mb-2 block">정렬</Label>
          <div className="space-y-1">
            {[
              { value: '', label: '최신순' },
              { value: 'popular', label: '인기순' },
              { value: 'rating', label: '평점순' },
              { value: 'price_asc', label: '낮은 가격순' },
              { value: 'price_desc', label: '높은 가격순' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => updateParams('sort', option.value || null)}
                className={cn(
                  'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors',
                  (currentSort || '') === option.value
                    ? 'bg-purple-100 text-purple-700 font-medium'
                    : 'hover:bg-gray-100'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* 필터 초기화 */}
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            className="w-full text-gray-500"
            onClick={clearAllFilters}
          >
            <X className="w-4 h-4 mr-2" />
            필터 초기화
          </Button>
        )}
      </div>

      {/* 로딩 인디케이터 */}
      {isPending && (
        <div className="fixed inset-0 bg-white/50 flex items-center justify-center z-50">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
        </div>
      )}
    </div>
  );
}

