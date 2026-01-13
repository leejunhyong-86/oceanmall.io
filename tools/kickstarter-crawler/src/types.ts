/**
 * @file src/types.ts
 * @description Kickstarter 크롤러 타입 정의
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
// Kickstarter 프로젝트 타입
// ============================================

export interface KickstarterProject {
  // 기본 정보
  title: string;
  slug: string;
  description: string;
  blurb: string;

  // 미디어
  thumbnailUrl: string;
  videoUrl: string | null;

  // 펀딩 정보
  goalAmount: number;
  pledgedAmount: number;
  currency: string;
  percentFunded: number;
  backersCount: number;

  // 기간 정보
  deadline: string | null;
  daysToGo: number | null;
  state: 'live' | 'successful' | 'failed' | 'canceled' | 'suspended';

  // 카테고리
  category: string;
  subcategory: string | null;
  location: string;

  // 크리에이터
  creatorName: string;
  creatorAvatar: string | null;
  creatorBio: string | null;
  projectsCreated: number;

  // 리워드 정보
  minRewardAmount: number | null;  // 최소 리워드 금액
  rewards: RewardTier[];           // 모든 리워드 티어

  // 메타
  sourceUrl: string;
  crawledAt: string;
  
  // 리뷰 목록 (댓글/업데이트)
  reviews?: Review[];                  // 수집된 댓글 목록
}

// ============================================
// 리워드 티어 타입
// ============================================

export interface RewardTier {
  title: string;
  amount: number;
  currency: string;
  description: string;
  backersCount: number;
  estimatedDelivery: string | null;
  shippingInfo: string | null;
  isLimited: boolean;
  remaining: number | null;
}

// ============================================
// 크롤링 설정 타입
// ============================================

export interface CrawlConfig {
  headless: boolean;
  timeout: number;
  delay: number;
  retryCount: number;
  maxProjects: number;
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
}

