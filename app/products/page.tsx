/**
 * @file app/products/page.tsx
 * @description 상품 목록 페이지 (릴스 스타일)
 *
 * Server Component로 초기 데이터를 fetch하고,
 * 9:16 비율의 릴스 스타일 그리드로 상품을 표시합니다.
 *
 * 반응형: 데스크탑 4열 / 태블릿 3열 / 모바일 2열
 */

import { Suspense } from 'react';
import { getProducts } from '@/actions/products';
import { getCategories } from '@/actions/categories';
import { ProductGrid } from '@/components/product-grid';
import { ProductFilters } from '@/components/product-filters';
import { ProductCardSkeleton } from '@/components/product-card';
import type { ProductFilters as ProductFiltersType, ProductSort } from '@/types';

interface ProductsPageProps {
  searchParams: Promise<{
    category?: string;
    search?: string;
    sort?: string;
    minPrice?: string;
    maxPrice?: string;
    featured?: string;
    page?: string;
  }>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;

  // 필터 파라미터 파싱
  const filters: ProductFiltersType = {
    category: params.category,
    search: params.search,
    minPrice: params.minPrice ? parseInt(params.minPrice) : undefined,
    maxPrice: params.maxPrice ? parseInt(params.maxPrice) : undefined,
    isFeatured: params.featured === 'true' ? true : undefined,
  };

  // 정렬 파라미터 파싱
  const sort: ProductSort = (() => {
    switch (params.sort) {
      case 'price_asc':
        return { field: 'price_krw', direction: 'asc' };
      case 'price_desc':
        return { field: 'price_krw', direction: 'desc' };
      case 'rating':
        return { field: 'external_rating', direction: 'desc' };
      case 'popular':
        return { field: 'view_count', direction: 'desc' };
      default:
        return { field: 'created_at', direction: 'desc' };
    }
  })();

  const page = params.page ? parseInt(params.page) : 1;
  const pageSize = 12;

  // 병렬로 데이터 fetch (환경 변수 미설정 시 빈 데이터)
  let products: Awaited<ReturnType<typeof getProducts>>['products'] = [];
  let total = 0;
  let categories: Awaited<ReturnType<typeof getCategories>> = [];

  try {
    const result = await Promise.all([
      getProducts({ filters, sort, page, pageSize }),
      getCategories(),
    ]);
    products = result[0].products;
    total = result[0].total;
    categories = result[1];
  } catch (error) {
    console.error('데이터 로드 실패:', error);
  }

  const totalPages = Math.ceil(total / pageSize);

  return (
    <main className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b sticky top-16 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {params.category
                  ? categories.find((c) => c.slug === params.category)?.name || '상품'
                  : params.search
                    ? `"${params.search}" 검색 결과`
                    : params.featured === 'true'
                      ? '추천 상품'
                      : '전체 상품'}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                총 {total.toLocaleString()}개의 상품
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* 필터 사이드바 */}
          <aside className="lg:w-64 flex-shrink-0">
            <Suspense fallback={<div className="h-96 bg-gray-100 rounded-xl animate-pulse" />}>
              <ProductFilters
                categories={categories}
                currentFilters={filters}
                currentSort={params.sort}
              />
            </Suspense>
          </aside>

          {/* 상품 그리드 */}
          <div className="flex-1">
            <Suspense fallback={<ProductGridSkeleton />}>
              <ProductGrid
                products={products}
                currentPage={page}
                totalPages={totalPages}
                total={total}
              />
            </Suspense>
          </div>
        </div>
      </div>
    </main>
  );
}

// 그리드 스켈레톤
function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

// SEO 메타데이터
export async function generateMetadata({ searchParams }: ProductsPageProps) {
  const params = await searchParams;

  let title = '전체 상품';
  if (params.category) {
    title = `${params.category} 카테고리`;
  } else if (params.search) {
    title = `"${params.search}" 검색 결과`;
  }

  return {
    title: `${title} | 해외직구멀티샵`,
    description: `해외직구멀티샵에서 ${title}을 확인하세요. AI 리뷰 요약으로 빠른 구매 결정을 도와드립니다.`,
  };
}

