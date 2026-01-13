/**
 * @file lib/ai/mock-service.ts
 * @description Mock AI 서비스 (개발/테스트용)
 *
 * 실제 AI API 연동 전에 UI 개발 및 테스트를 위한 Mock 서비스입니다.
 * 고정된 응답을 반환하여 AI 비용 없이 개발할 수 있습니다.
 */

import type {
  IAIService,
  AIProviderType,
  ReviewSummaryInput,
  ReviewSummaryOutput,
  TranslateInput,
  TranslateOutput,
} from './types';

export class MockAIService implements IAIService {
  readonly provider: AIProviderType = 'mock';

  /**
   * Mock 리뷰 요약 생성
   * 실제로는 AI가 분석하지만, 여기서는 고정된 응답을 반환합니다.
   */
  async summarizeReviews(input: ReviewSummaryInput): Promise<ReviewSummaryOutput> {
    // 시뮬레이션을 위한 딜레이
    await this.simulateDelay(1500);

    const reviewCount = input.reviews.length;
    const avgRating = this.calculateAverageRating(input.reviews);

    return {
      summary: `${input.productName}에 대한 ${reviewCount}개의 리뷰를 분석한 결과, 전반적으로 긍정적인 평가를 받고 있습니다. 사용자들은 특히 품질과 가성비에 만족하고 있으며, 배송 시간에 대한 우려가 일부 있습니다.`,
      positivePoints: [
        '품질이 기대 이상으로 좋음',
        '가격 대비 성능이 우수함',
        '디자인이 세련되고 트렌디함',
        '포장이 꼼꼼하게 되어 옴',
      ],
      negativePoints: [
        '배송에 2-3주 정도 소요됨',
        '사이즈가 표기보다 작은 편',
        '교환/반품 절차가 복잡함',
      ],
      recommendation: '품질을 중시하고 배송 기간을 기다릴 수 있는 분들에게 추천합니다. 사이즈 선택 시 한 사이즈 크게 주문하시는 것을 권장합니다.',
      overallRating: avgRating,
      sentimentScore: 0.65, // 긍정적
    };
  }

  /**
   * Mock 번역
   * 실제로는 AI가 번역하지만, 여기서는 간단한 Mock 응답을 반환합니다.
   */
  async translate(input: TranslateInput): Promise<TranslateOutput> {
    await this.simulateDelay(800);

    // Mock 번역: 간단한 키워드 기반 번역 시뮬레이션
    let translatedText = input.text;
    
    if (input.targetLanguage === 'ko' && input.sourceLanguage === 'en') {
      // 간단한 키워드 치환 (실제 번역 아님, 데모용)
      const translations: Record<string, string> = {
        'love': '사랑',
        'great': '훌륭한',
        'good': '좋은',
        'excellent': '최고의',
        'perfect': '완벽한',
        'quality': '품질',
        'fast': '빠른',
        'slow': '느린',
        'shipping': '배송',
        'delivery': '배송',
        'product': '제품',
        'price': '가격',
        'beautiful': '아름다운',
        'color': '색상',
        'size': '사이즈',
        'comfortable': '편안한',
        'recommend': '추천',
      };
      
      // Mock 번역 (실제로는 AI가 전체 문장을 자연스럽게 번역)
      translatedText = `[한국어 번역] ${input.text}`;
      
      // 키워드 일부만 치환
      Object.entries(translations).forEach(([eng, kor]) => {
        const regex = new RegExp(`\\b${eng}\\b`, 'gi');
        translatedText = translatedText.replace(regex, kor);
      });
    }

    return {
      translatedText,
      detectedLanguage: input.sourceLanguage,
    };
  }

  /**
   * API 호출 시뮬레이션을 위한 딜레이
   */
  private simulateDelay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * 리뷰 평균 평점 계산
   */
  private calculateAverageRating(reviews: ReviewSummaryInput['reviews']): number {
    const ratingsWithValue = reviews.filter((r) => r.rating !== undefined);
    if (ratingsWithValue.length === 0) return 4.0;

    const sum = ratingsWithValue.reduce((acc, r) => acc + (r.rating || 0), 0);
    const avg = sum / ratingsWithValue.length;
    return Math.round(avg * 10) / 10; // 소수점 1자리
  }
}

