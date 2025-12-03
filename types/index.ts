/**
 * @file types/index.ts
 * @description 프로젝트 전역 타입 정의 진입점
 */

// 데이터베이스 타입 re-export
export * from './database';

// ============================================
// API Response 타입
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ============================================
// Filter & Sort 타입
// ============================================

export type SortDirection = 'asc' | 'desc';

export interface ProductFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  platform?: string;
  search?: string;
  isFeatured?: boolean;
}

export interface ProductSort {
  field: 'created_at' | 'price_krw' | 'external_rating' | 'view_count';
  direction: SortDirection;
}

// ============================================
// AI 관련 타입
// ============================================

export interface AIReviewSummaryRequest {
  productId: string;
  reviews: string[];
  productName: string;
}

export interface AIReviewSummaryResponse {
  summary: string;
  positivePoints: string[];
  negativePoints: string[];
  recommendation: string;
  overallRating: number;
}

export interface AITranslateRequest {
  text: string;
  sourceLanguage: string;
  targetLanguage?: string;
}

export interface AITranslateResponse {
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
}

// ============================================
// UI 상태 타입
// ============================================

export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

export interface ModalState {
  isOpen: boolean;
  type?: string;
  data?: unknown;
}

