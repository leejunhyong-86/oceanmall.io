/**
 * @file lib/ai/openai-service.ts
 * @description OpenAI를 사용한 AI 서비스 구현
 *
 * GPT-4를 사용하여 리뷰 요약, 감정 분석, 번역을 수행합니다.
 */

import type { 
  IAIService, 
  ReviewSummaryInput, 
  ReviewSummaryOutput, 
  TranslateInput, 
  TranslateOutput 
} from './types';

export class OpenAIService implements IAIService {
  provider = 'openai' as const;
  private apiKey: string;
  private model: string;

  constructor(apiKey?: string, model: string = 'gpt-4o-mini') {
    this.apiKey = apiKey || process.env.OPENAI_API_KEY || '';
    this.model = model;

    if (!this.apiKey) {
      console.warn('OpenAI API key not found, service may not work');
    }
  }

  /**
   * 리뷰를 분석하여 요약 생성
   */
  async summarizeReviews(input: ReviewSummaryInput): Promise<ReviewSummaryOutput> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key is required');
    }

    // 리뷰 텍스트 준비
    const reviewTexts = input.reviews.map((r, i) => 
      `리뷰 ${i + 1} (평점: ${r.rating || 'N/A'}): ${r.content}`
    ).join('\n\n');

    const prompt = `당신은 전문 상품 리뷰 분석가입니다. 다음 "${input.productName}" 상품의 리뷰들을 분석하여 한국어로 요약해주세요.

리뷰 목록 (총 ${input.reviews.length}개):
${reviewTexts}

다음 형식의 JSON으로 응답해주세요:
{
  "summary": "전체적인 요약 (2-3문장)",
  "positivePoints": ["긍정적인 포인트 1", "긍정적인 포인트 2", "..."],
  "negativePoints": ["부정적인 포인트 1", "부정적인 포인트 2", "..."],
  "recommendation": "추천 대상 또는 구매 고려사항",
  "overallRating": 평균 평점 (1-5 사이 숫자),
  "sentimentScore": 감정 점수 (-1.0 ~ 1.0, 긍정적일수록 높음)
}

분석 시 주의사항:
- 실제 리뷰 내용을 기반으로 정확하게 분석
- 긍정/부정 포인트는 각각 최대 5개까지
- 구체적이고 실용적인 정보 제공
- 감정 점수는 전체 리뷰의 긍정/부정 비율을 반영`;

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: '당신은 전문 상품 리뷰 분석가입니다. 항상 JSON 형식으로만 응답하세요.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.7,
          response_format: { type: 'json_object' },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`OpenAI API error: ${JSON.stringify(error)}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new Error('No content in OpenAI response');
      }

      const result = JSON.parse(content);

      return {
        summary: result.summary || '요약을 생성할 수 없습니다.',
        positivePoints: result.positivePoints || [],
        negativePoints: result.negativePoints || [],
        recommendation: result.recommendation || '',
        overallRating: result.overallRating || 0,
        sentimentScore: result.sentimentScore || 0,
      };
    } catch (error) {
      console.error('OpenAI summarization error:', error);
      throw error;
    }
  }

  /**
   * 텍스트를 대상 언어로 번역
   */
  async translate(input: TranslateInput): Promise<TranslateOutput> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key is required');
    }

    const sourceLang = input.sourceLanguage || '자동 감지';
    const targetLang = input.targetLanguage === 'ko' ? '한국어' : input.targetLanguage;

    const prompt = `다음 텍스트를 ${targetLang}로 자연스럽게 번역해주세요. 원문의 뉘앙스와 의미를 최대한 보존하되, 대상 언어의 자연스러운 표현을 사용하세요.

원문:
${input.text}

번역 시 주의사항:
- 상품 리뷰의 맥락을 고려
- 구어체 표현은 자연스러운 한국어로 변환
- 전문 용어는 정확하게 번역`;

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: `당신은 전문 번역가입니다. ${sourceLang}에서 ${targetLang}로 정확하고 자연스럽게 번역하세요.`,
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`OpenAI API error: ${JSON.stringify(error)}`);
      }

      const data = await response.json();
      const translatedText = data.choices[0]?.message?.content?.trim();

      if (!translatedText) {
        throw new Error('No translation in OpenAI response');
      }

      return {
        translatedText,
        detectedLanguage: input.sourceLanguage || 'en',
      };
    } catch (error) {
      console.error('OpenAI translation error:', error);
      throw error;
    }
  }
}
