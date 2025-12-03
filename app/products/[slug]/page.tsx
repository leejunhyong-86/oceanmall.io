/**
 * @file app/products/[slug]/page.tsx
 * @description 상품 상세 페이지
 *
 * Server Component로 상품 정보, AI 요약, 리뷰를 fetch합니다.
 * 릴스 스타일의 영상 플레이어와 AI 요약 박스를 포함합니다.
 */

import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { getProductBySlug, getRelatedProducts } from '@/actions/products';
import { getExternalReviews, getUserReviews } from '@/actions/reviews';
import { ProductDetail } from '@/components/product-detail';
import { AISummaryBox } from '@/components/ai-summary-box';
import { ExternalReviewList } from '@/components/external-review-list';
import { UserReviewList } from '@/components/user-review-list';
import { RelatedProducts } from '@/components/related-products';
import type { Metadata } from 'next';

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  // 병렬로 관련 데이터 fetch
  const [externalReviews, userReviews, relatedProducts] = await Promise.all([
    getExternalReviews(product.id, { limit: 10 }),
    getUserReviews(product.id, { limit: 10, sortBy: 'recent' }),
    getRelatedProducts(product.id, product.category_id, 4),
  ]);

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 상품 상세 정보 */}
        <ProductDetail product={product} />

        <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 메인 콘텐츠 (2/3) */}
          <div className="lg:col-span-2 space-y-8">
            {/* AI 요약 */}
            <Suspense fallback={<AISummaryBoxSkeleton />}>
              <AISummaryBox productId={product.id} productName={product.title} />
            </Suspense>

            {/* 외부 리뷰 */}
            <section>
              <h2 className="text-xl font-bold mb-4">해외 리뷰</h2>
              <ExternalReviewList
                reviews={externalReviews}
                productId={product.id}
                totalCount={product.external_review_count}
              />
            </section>

            {/* 자체 리뷰 */}
            <section>
              <h2 className="text-xl font-bold mb-4">한국 사용자 리뷰</h2>
              <UserReviewList
                reviews={userReviews}
                productId={product.id}
                totalCount={product.internal_review_count}
              />
            </section>
          </div>

          {/* 사이드바 (1/3) */}
          <div className="space-y-6">
            {/* 관련 상품 */}
            <RelatedProducts products={relatedProducts} />
          </div>
        </div>
      </div>
    </main>
  );
}

// AI 요약 스켈레톤
function AISummaryBoxSkeleton() {
  return (
    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-6 animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
      <div className="h-4 bg-gray-200 rounded w-full mb-2" />
      <div className="h-4 bg-gray-200 rounded w-2/3" />
    </div>
  );
}

// SEO 메타데이터
export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return {
      title: '상품을 찾을 수 없습니다',
    };
  }

  return {
    title: `${product.title} | 해외직구멀티샵`,
    description: product.description || `${product.title}의 AI 리뷰 요약과 상세 정보를 확인하세요.`,
    openGraph: {
      title: product.title,
      description: product.description || undefined,
      images: product.thumbnail_url ? [product.thumbnail_url] : undefined,
    },
  };
}

