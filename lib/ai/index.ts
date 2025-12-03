/**
 * @file lib/ai/index.ts
 * @description AI 서비스 팩토리 및 진입점
 *
 * 이 파일은 환경 설정에 따라 적절한 AI 서비스를 생성합니다.
 * 현재는 Mock 서비스만 구현되어 있으며, 추후 실제 AI 서비스가 추가됩니다.
 */

import type { IAIService, AIProviderType, AIServiceConfig } from './types';
import { MockAIService } from './mock-service';

// 타입 re-export
export * from './types';
export { MockAIService } from './mock-service';

/**
 * AI 서비스 인스턴스를 생성하는 팩토리 함수
 *
 * @param config - AI 서비스 설정
 * @returns AI 서비스 인스턴스
 *
 * @example
 * ```ts
 * const aiService = createAIService({ provider: 'mock' });
 * const summary = await aiService.summarizeReviews({ ... });
 * ```
 */
export function createAIService(config?: AIServiceConfig): IAIService {
  const provider = config?.provider || getDefaultProvider();

  switch (provider) {
    case 'mock':
      return new MockAIService();

    case 'openai':
      // TODO: OpenAI 서비스 구현 후 활성화
      console.warn('OpenAI service not implemented yet, using mock');
      return new MockAIService();

    case 'claude':
      // TODO: Claude 서비스 구현 후 활성화
      console.warn('Claude service not implemented yet, using mock');
      return new MockAIService();

    case 'gemini':
      // TODO: Gemini 서비스 구현 후 활성화
      console.warn('Gemini service not implemented yet, using mock');
      return new MockAIService();

    default:
      return new MockAIService();
  }
}

/**
 * 환경 변수에서 기본 AI 제공자 결정
 */
function getDefaultProvider(): AIProviderType {
  const envProvider = process.env.AI_PROVIDER as AIProviderType | undefined;

  if (envProvider && ['openai', 'claude', 'gemini', 'mock'].includes(envProvider)) {
    return envProvider;
  }

  // 개발 환경에서는 mock 사용
  if (process.env.NODE_ENV === 'development') {
    return 'mock';
  }

  return 'mock';
}

/**
 * 싱글톤 AI 서비스 인스턴스
 * 여러 곳에서 동일한 인스턴스를 사용하기 위함
 */
let aiServiceInstance: IAIService | null = null;

export function getAIService(): IAIService {
  if (!aiServiceInstance) {
    aiServiceInstance = createAIService();
  }
  return aiServiceInstance;
}

