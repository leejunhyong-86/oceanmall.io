/**
 * @file src/types.ts
 * @description AliExpress 크롤러 타입 정의
 */

// ============================================
// 리뷰 인터페이스
// ============================================

export interface Review {
  content: string;                    // 리뷰 내용
  reviewerName: string | null;        // 리뷰어 이름
  reviewerCountry: string | null;     // 리뷰어 국가
  rating: number | null;               // 평점 (0-5)
  reviewDate: Date | null;             // 작성일
  helpfulCount: number;                // 도움됨 수
  isVerifiedPurchase: boolean;         // 검증된 구매 여부
  sourceReviewId: string | null;       // 원본 리뷰 ID
}

// ============================================
// AliExpress 상품 인터페이스
// ============================================

export interface AliExpressProduct {
  // 기본 정보
  title: string;
  slug: string;
  description: string;

  // 가격 정보
  price: number;                       // USD 가격
  originalPrice: number | null;        // 할인 전 가격
  currency: string;                    // 통화 (USD)
  discount: number | null;             // 할인율 (%)

  // 이미지
  thumbnailUrl: string;
  images: string[];                    // 추가 이미지들
  detailImages: string[];              // 상세 설명 이미지

  // 평점 및 리뷰
  rating: number | null;               // 평균 평점
  reviewCount: number;                 // 리뷰 개수
  orders: number | null;               // 주문 수

  // 판매자 정보
  sellerName: string | null;
  sellerRating: number | null;
  storeUrl: string | null;

  // 배송 정보
  shippingFrom: string | null;        // 배송 출발지
  estimatedDelivery: string | null;   // 예상 배송일

  // 메타 정보
  itemId: string;                      // AliExpress 상품 ID
  sourceUrl: string;
  crawledAt: string;

  // 리뷰 목록
  reviews?: Review[];                  // 수집된 리뷰 목록
}

// ============================================
// 크롤링 설정 타입
// ============================================

export interface CrawlConfig {
  headless: boolean;
  timeout: number;
  delay: number;
  retryCount: number;
  maxProducts: number;
}

// ============================================
// Supabase 상품 타입 (저장용)
// ============================================

export interface ProductInsert {
  title: string;
  slug: string;
  description?: string | null;
  thumbnail_url?: string | null;
  video_url?: string | null;
  original_price?: number | null;
  currency?: string;
  price_krw?: number | null;
  source_platform: string;
  source_url: string;
  external_rating?: number | null;
  external_review_count?: number;
  category_id?: string | null;
  tags?: string[];
  is_featured?: boolean;
  is_active?: boolean;
  discount_percentage?: number | null;
  detail_images?: string[];
}
