'use client';

/**
 * @file components/product-grid.tsx
 * @description 릴스 스타일 상품 그리드 컴포넌트
 *
 * 반응형 그리드: 데스크탑 4열 / 태블릿 3열 / 모바일 2열
 */

import { useRouter, useSearchParams } from 'next/navigation';
import { ProductCard } from './product-card';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { ProductWithCategory } from '@/types';

interface ProductGridProps {
  products: ProductWithCategory[];
  currentPage: number;
  totalPages: number;
  total: number;
}

export function ProductGrid({ products, currentPage, totalPages, total }: ProductGridProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 페이지 변경 핸들러
  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`/products?${params.toString()}`);
  };

  if (products.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-4">🔍</div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          검색 결과가 없습니다
        </h3>
        <p className="text-gray-500 mb-6">
          다른 검색어나 필터를 시도해보세요.
        </p>
        <Button
          variant="outline"
          onClick={() => router.push('/products')}
        >
          전체 상품 보기
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 상품 그리드 - 릴스 스타일 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="w-4 h-4" />
            이전
          </Button>

          <div className="flex items-center gap-1">
            {generatePageNumbers(currentPage, totalPages).map((pageNum, idx) => (
              pageNum === '...' ? (
                <span key={`ellipsis-${idx}`} className="px-2 text-gray-400">
                  ...
                </span>
              ) : (
                <Button
                  key={pageNum}
                  variant={pageNum === currentPage ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => handlePageChange(pageNum as number)}
                  className="w-10"
                >
                  {pageNum}
                </Button>
              )
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
          >
            다음
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* 페이지 정보 */}
      <p className="text-center text-sm text-gray-500">
        {total.toLocaleString()}개 중 {((currentPage - 1) * 12) + 1}-
        {Math.min(currentPage * 12, total)}번째 상품
      </p>
    </div>
  );
}

// 페이지 번호 생성 헬퍼
function generatePageNumbers(current: number, total: number): (number | string)[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | string)[] = [];

  if (current <= 4) {
    pages.push(1, 2, 3, 4, 5, '...', total);
  } else if (current >= total - 3) {
    pages.push(1, '...', total - 4, total - 3, total - 2, total - 1, total);
  } else {
    pages.push(1, '...', current - 1, current, current + 1, '...', total);
  }

  return pages;
}

