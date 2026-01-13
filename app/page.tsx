/**
 * @file app/page.tsx
 * @description 홈 페이지 - 추천 상품 표시
 *
 * Server Component로 데이터를 fetch하여 초기 로딩 성능을 최적화합니다.
 * 
 * 주요 구성:
 * - HeroHeader: 중세 세계지도 배경의 히어로 헤더 (로고 + 검색창 + 사용자 메뉴)
 * - CategoryNavbar: 카테고리 네비게이션 바
 * - Today's New Section: 오늘의 신상품
 * - Lucky Draw Section: 럭키드로우 이벤트
 * - Instagram Feed Section: Instagram 최신 게시물
 * - Featured Products Section: 추천 상품 목록
 * - CTA Section: 행동 유도 섹션
 */

import Link from 'next/link';
import { getFeaturedProducts, getNewProducts } from '@/actions/products';
import { getActiveLuckyDrawEvent } from '@/actions/lucky-draw';
import { getInstagramFeed } from '@/actions/instagram';
import { ProductCard } from '@/components/product-card';
import { HeroHeader } from '@/components/header/hero-header';
import { CategoryNavbar } from '@/components/header/category-navbar';
import { TodaysNewSection } from '@/components/home/todays-new-section';
import { LuckyDrawSection } from '@/components/home/lucky-draw-section';
import { InstagramFeedSection } from '@/components/home/instagram-feed-section';
import { ArrowRight } from 'lucide-react';

export default async function HomePage() {
  // Server Component에서 데이터 fetch (병렬 실행)
  // 환경 변수가 없을 경우 빈 배열 반환
  let featuredProducts: Awaited<ReturnType<typeof getFeaturedProducts>> = [];
  let newProducts: Awaited<ReturnType<typeof getNewProducts>> = [];
  let luckyDrawEvent: Awaited<ReturnType<typeof getActiveLuckyDrawEvent>> = null;
  let instagramPosts: Awaited<ReturnType<typeof getInstagramFeed>> = [];

  try {
    [featuredProducts, newProducts, luckyDrawEvent, instagramPosts] = await Promise.all([
      getFeaturedProducts(8),
      getNewProducts(4),
      getActiveLuckyDrawEvent(),
      getInstagramFeed(6), // Instagram 최신 6개 게시물
    ]);
  } catch (error) {
    console.error('데이터 로드 실패:', error);
    // 환경 변수 미설정 등의 이유로 실패해도 페이지는 표시
  }

  return (
    <main className="min-h-screen">
      {/* Hero Header - 중세 세계지도 배경의 히어로 헤더 */}
      <HeroHeader 
        youtubeUrl="https://www.youtube.com/@oceancialwave"
        instagramUrl="https://www.instagram.com/oceancialwave"
      />

      {/* Category Navbar - 카테고리 네비게이션 바 */}
      <CategoryNavbar />

      {/* Today's New Section - 오늘의 신상품 */}
      <TodaysNewSection products={newProducts} />

      {/* Lucky Draw Section - 럭키드로우 이벤트 */}
      <LuckyDrawSection event={luckyDrawEvent} />

      {/* Instagram Feed Section - Instagram 최신 게시물 */}
      <InstagramFeedSection 
        posts={instagramPosts} 
        instagramUrl="https://www.instagram.com/oceancialwave"
      />

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
