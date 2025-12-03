/**
 * @file lib/ai/types.ts
 * @description AI 서비스 인터페이스 및 타입 정의
 *
 * 이 파일은 다양한 AI 제공자(OpenAI, Claude, Gemini)를 추상화하기 위한
 * 공통 인터페이스를 정의합니다.
 */

// ============================================
// AI Provider 타입
// ============================================

export type AIProviderType = 'openai' | 'claude' | 'gemini' | 'mock';

// ============================================
// 리뷰 요약 관련
// ============================================

export interface ReviewSummaryInput {
  productName: string;
  reviews: ReviewForSummary[];
}

export interface ReviewForSummary {
  content: string;
  rating?: number;
  language?: string;
}

export interface ReviewSummaryOutput {
  summary: string;
  positivePoints: string[];
  negativePoints: string[];
  recommendation: string;
  overallRating: number;
  sentimentScore: number; // -1.0 ~ 1.0
}

// ============================================
// 번역 관련
// ============================================

export interface TranslateInput {
  text: string;
  sourceLanguage: string;
  targetLanguage: string;
}

export interface TranslateOutput {
  translatedText: string;
  detectedLanguage?: string;
}

// ============================================
// AI 서비스 인터페이스
// ============================================

export interface IAIService {
  /**
   * AI 제공자 식별자
   */
  readonly provider: AIProviderType;

  /**
   * 리뷰 요약 생성
   */
  summarizeReviews(input: ReviewSummaryInput): Promise<ReviewSummaryOutput>;

  /**
   * 텍스트 번역
   */
  translate(input: TranslateInput): Promise<TranslateOutput>;
}

// ============================================
// AI 서비스 설정
// ============================================

export interface AIServiceConfig {
  provider: AIProviderType;
  apiKey?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

