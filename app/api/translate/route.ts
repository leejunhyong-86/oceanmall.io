/**
 * @file app/api/translate/route.ts
 * @description 텍스트 번역 API
 *
 * 외부 리뷰를 한국어로 번역합니다.
 * 결과는 external_reviews 테이블에 캐싱됩니다.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClerkSupabaseClient } from '@/lib/supabase/server';
import { getAIService } from '@/lib/ai';

export async function POST(request: NextRequest) {
  try {
    const { reviewId, text, sourceLanguage, targetLanguage } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: 'text is required' },
        { status: 400 }
      );
    }

    const supabase = await createClerkSupabaseClient();

    // reviewId가 있으면 캐시 확인
    if (reviewId) {
      const { data: review } = await supabase
        .from('external_reviews')
        .select('translated_content, is_translated')
        .eq('id', reviewId)
        .single();

      if (review?.is_translated && review.translated_content) {
        return NextResponse.json({
          translatedText: review.translated_content,
          sourceLanguage: sourceLanguage || 'en',
          targetLanguage: targetLanguage || 'ko',
          cached: true,
        });
      }
    }

    // AI 서비스로 번역
    const aiService = getAIService();
    const result = await aiService.translate({
      text,
      targetLanguage: targetLanguage || 'ko',
      sourceLanguage: sourceLanguage || 'en',
    });

    // reviewId가 있으면 결과를 DB에 저장
    if (reviewId) {
      await supabase
        .from('external_reviews')
        .update({
          translated_content: result.translatedText,
          is_translated: true,
        })
        .eq('id', reviewId);
    }

    return NextResponse.json({
      translatedText: result.translatedText,
      sourceLanguage: result.detectedLanguage || sourceLanguage,
      targetLanguage: targetLanguage || 'ko',
      cached: false,
    });
  } catch (error) {
    console.error('Translation Error:', error);
    return NextResponse.json(
      { error: '번역 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * 여러 리뷰를 한 번에 번역
 */
export async function PUT(request: NextRequest) {
  try {
    const { productId } = await request.json();

    if (!productId) {
      return NextResponse.json(
        { error: 'productId is required' },
        { status: 400 }
      );
    }

    const supabase = await createClerkSupabaseClient();

    // 번역되지 않은 외부 리뷰 가져오기
    const { data: reviews } = await supabase
      .from('external_reviews')
      .select('id, content, source_language')
      .eq('product_id', productId)
      .eq('is_translated', false)
      .eq('source_language', 'en') // 영어만
      .limit(20);

    if (!reviews || reviews.length === 0) {
      return NextResponse.json({
        message: '번역할 리뷰가 없습니다.',
        translatedCount: 0,
      });
    }

    const aiService = getAIService();
    let translatedCount = 0;

    // 각 리뷰를 번역
    for (const review of reviews) {
      try {
        const result = await aiService.translate({
          text: review.content,
          targetLanguage: 'ko',
          sourceLanguage: review.source_language || 'en',
        });

        await supabase
          .from('external_reviews')
          .update({
            translated_content: result.translatedText,
            is_translated: true,
          })
          .eq('id', review.id);

        translatedCount++;

        // API 레이트 제한을 피하기 위한 딜레이
        await new Promise(r => setTimeout(r, 1000));
      } catch (error) {
        console.error(`Translation failed for review ${review.id}:`, error);
      }
    }

    return NextResponse.json({
      message: `${translatedCount}개의 리뷰가 번역되었습니다.`,
      translatedCount,
      totalReviews: reviews.length,
    });
  } catch (error) {
    console.error('Batch Translation Error:', error);
    return NextResponse.json(
      { error: '일괄 번역 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
