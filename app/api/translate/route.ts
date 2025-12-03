/**
 * @file app/api/translate/route.ts
 * @description 번역 API 라우트
 *
 * 외국어 텍스트를 한국어로 번역합니다.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAIService } from '@/lib/ai';

export async function POST(request: NextRequest) {
  try {
    const { text, sourceLanguage = 'en', targetLanguage = 'ko' } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: 'text is required' },
        { status: 400 }
      );
    }

    const aiService = getAIService();
    const result = await aiService.translate({
      text,
      sourceLanguage,
      targetLanguage,
    });

    return NextResponse.json({
      translatedText: result.translatedText,
      sourceLanguage: result.detectedLanguage || sourceLanguage,
      targetLanguage,
    });
  } catch (error) {
    console.error('Translation Error:', error);
    return NextResponse.json(
      { error: '번역 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

