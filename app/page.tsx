/**
 * @file app/page.tsx
 * @description 홈 페이지 - 추천 상품 및 카테고리 표시
 *
 * Server Component로 데이터를 fetch하여 초기 로딩 성능을 최적화합니다.
 */

import Link from 'next/link';
import { getFeaturedProducts } from '@/actions/products';
import { getCategories } from '@/actions/categories';
import { ProductCard } from '@/components/product-card';
import { CategoryCard } from '@/components/category-card';
import { ArrowRight, Sparkles, Globe, MessageSquare } from 'lucide-react';

export default async function HomePage() {
  // Server Component에서 데이터 fetch (병렬 실행)
  // 환경 변수가 없을 경우 빈 배열 반환
  let featuredProducts: Awaited<ReturnType<typeof getFeaturedProducts>> = [];
  let categories: Awaited<ReturnType<typeof getCategories>> = [];

  try {
    [featuredProducts, categories] = await Promise.all([
      getFeaturedProducts(8),
      getCategories(),
    ]);
  } catch (error) {
    console.error('데이터 로드 실패:', error);
    // 환경 변수 미설정 등의 이유로 실패해도 페이지는 표시
  }

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 text-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
        <div className="relative max-w-7xl mx-auto px-4 py-24 sm:py-32">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              전세계 인기 상품의 리뷰를
              <br />
              <span className="text-yellow-300">AI가 한눈에</span> 요약해드립니다
            </h1>
            <p className="text-lg sm:text-xl text-purple-100 max-w-2xl mx-auto mb-8">
              여러 해외 쇼핑몰에 흩어진 상품 정보와 리뷰를 한 곳에 모아,
              <br className="hidden sm:block" />
              AI 기술로 핵심만 빠르게 파악하세요.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/products"
                className="inline-flex items-center justify-center gap-2 bg-white text-purple-700 px-8 py-4 rounded-full font-semibold hover:bg-purple-50 transition-colors"
              >
                상품 둘러보기
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">AI 리뷰 요약</h3>
              <p className="text-gray-600">
                수백 개의 리뷰를 AI가 분석하여 긍정/부정 포인트를 명확하게 정리해드립니다.
              </p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                <Globe className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">다국어 번역</h3>
              <p className="text-gray-600">
                영어, 중국어, 일본어 리뷰를 실시간으로 한글 번역하여 언어 장벽을 제거합니다.
              </p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                <MessageSquare className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">한국어 리뷰</h3>
              <p className="text-gray-600">
                실제 구매자들의 한국어 리뷰로 더 신뢰할 수 있는 정보를 확인하세요.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      {categories.length > 0 && (
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold">카테고리</h2>
              <Link
                href="/products"
                className="text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
              >
                전체 보기
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {categories.slice(0, 6).map((category) => (
                <CategoryCard key={category.id} category={category} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Products Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold">추천 상품</h2>
            <Link
              href="/products?featured=true"
              className="text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
            >
              더 보기
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {featuredProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-gray-500">
              <p>아직 등록된 추천 상품이 없습니다.</p>
              <p className="text-sm mt-2">관리자 페이지에서 상품을 등록해주세요.</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            해외직구, 이제 쉽고 빠르게
          </h2>
          <p className="text-lg text-purple-100 mb-8">
            AI가 분석한 리뷰 요약으로 30분 걸리던 정보 탐색을 5분으로 단축하세요.
          </p>
          <Link
            href="/products"
            className="inline-flex items-center justify-center gap-2 bg-white text-purple-700 px-8 py-4 rounded-full font-semibold hover:bg-purple-50 transition-colors"
          >
            지금 시작하기
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </main>
  );
}
