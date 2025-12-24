/**
 * @file src/types.ts
 * @description 와디즈 크롤러 타입 정의
 */

// ============================================
// 와디즈 프로젝트 타입
// ============================================

export interface WadizProject {
  // 기본 정보
  title: string;
  slug: string;
  description: string;
  summary: string;

  // 미디어
  thumbnailUrl: string;
  videoUrl: string | null;

  // 펀딩 정보
  targetAmount: number;     // 목표 금액
  totalAmount: number;      // 현재 모인 금액
  achievementRate: number;  // 달성률 (%)
  supporterCount: number;   // 서포터 수

  // 리워드 정보
  minRewardAmount: number | null;  // 최소 리워드 금액
  rewards: WadizReward[];          // 모든 리워드

  // 기간 정보
  remainingDays: number | null;
  startDate: string | null;
  endDate: string | null;
  status: 'ongoing' | 'success' | 'fail' | 'scheduled';

  // 카테고리
  category: string;
  subcategory: string | null;

  // 메이커
  makerName: string;
  makerProfileUrl: string | null;

  // 메타
  sourceUrl: string;
  crawledAt: string;
}

// ============================================
// 와디즈 리워드 타입
// ============================================

export interface WadizReward {
  title: string;
  amount: number;
  description: string;
  supporterCount: number;
  deliveryDate: string | null;
  isLimited: boolean;
  remaining: number | null;
  totalQuantity: number | null;
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

