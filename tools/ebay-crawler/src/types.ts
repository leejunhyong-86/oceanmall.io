/**
 * @file types.ts
 * @description eBay 크롤러 타입 정의
 */

// 리뷰 인터페이스
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

// eBay 상품 인터페이스
export interface EbayProduct {
  // 기본 정보
  itemId: string;                   // eBay 상품 고유 ID
  title: string;
  slug: string;
  description: string;
  
  // 미디어
  thumbnailUrl: string;
  imageUrls: string[];
  videoUrl: string | null;
  
  // 가격 정보
  price: number | null;             // 현재 가격 (USD)
  originalPrice: number | null;     // 원래 가격 (USD)
  priceKrw: number | null;          // 한화 환산 가격
  currency: string;
  
  // 경매 정보 (경매 상품인 경우)
  bidCount: number | null;          // 입찰 수
  timeLeft: string | null;          // 남은 시간
  isBuyItNow: boolean;              // 즉시 구매 가능 여부
  
  // 평점 및 리뷰
  rating: number;                   // 판매자 평점 (1-5)
  reviewCount: number;              // 리뷰/피드백 수
  
  // 카테고리 및 판매자
  category: string;
  condition: string | null;         // 상품 상태 (New, Used 등)
  seller: string | null;
  sellerFeedbackScore: number | null;
  
  // 배송 정보
  shippingCost: string | null;      // 배송비
  freeShipping: boolean;
  location: string | null;          // 판매자 위치
  
  // 메타 정보
  sourceUrl: string;
  crawledAt: Date;
  
  // 리뷰 목록
  reviews?: Review[];                  // 수집된 리뷰 목록
}

// 크롤링 설정
export interface CrawlConfig {
  maxProducts: number;
  headless: boolean;
  searchQuery?: string;
  categoryUrl?: string;
  dealsUrl?: string;
}

// Supabase products 테이블 삽입 타입
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
}

