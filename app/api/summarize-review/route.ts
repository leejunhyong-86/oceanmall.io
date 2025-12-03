/**
 * @file app/api/summarize-review/route.ts
 * @description AI 리뷰 요약 API 라우트
 *
 * 상품 리뷰를 AI로 분석하여 요약, 긍정/부정 포인트, 추천 대상을 반환합니다.
 * 결과는 Supabase에 캐싱되어 24시간 동안 재사용됩니다.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClerkSupabaseClient } from '@/lib/supabase/server';
import { getAIService } from '@/lib/ai';

export async function POST(request: NextRequest) {
  try {
    const { productId, productName } = await request.json();

    if (!productId) {
      return NextResponse.json(
        { error: 'productId is required' },
        { status: 400 }
      );
    }

    const supabase = await createClerkSupabaseClient();

    // 1. 캐시된 요약이 있는지 확인
    const { data: cachedSummary } = await supabase
      .from('ai_summaries')
      .select('*')
      .eq('product_id', productId)
      .eq('is_outdated', false)
      .single();

    // 캐시가 유효하면 반환
    if (cachedSummary) {
      const expiresAt = cachedSummary.expires_at
        ? new Date(cachedSummary.expires_at)
        : null;
      
      if (!expiresAt || expiresAt > new Date()) {
        return NextResponse.json({
          summary: cachedSummary.summary,
          positivePoints: cachedSummary.positive_points,
          negativePoints: cachedSummary.negative_points,
          recommendation: cachedSummary.recommendation,
          overallRating: cachedSummary.overall_rating,
          provider: cachedSummary.ai_provider || 'cached',
          cached: true,
        });
      }
    }

    // 2. 리뷰 데이터 가져오기
    const { data: externalReviews } = await supabase
      .from('external_reviews')
      .select('content, rating, source_language')
      .eq('product_id', productId)
      .limit(50);

    const { data: userReviews } = await supabase
      .from('user_reviews')
      .select('content, rating')
      .eq('product_id', productId)
      .eq('is_visible', true)
      .limit(20);

    // 리뷰 합치기
    const allReviews = [
      ...(externalReviews?.map((r) => ({
        content: r.content,
        rating: r.rating ?? undefined,
        language: r.source_language,
      })) || []),
      ...(userReviews?.map((r) => ({
        content: r.content,
        rating: r.rating,
        language: 'ko',
      })) || []),
    ];

    // 리뷰가 없으면 기본 응답
    if (allReviews.length === 0) {
      return NextResponse.json({
        summary: '아직 분석할 리뷰가 충분하지 않습니다.',
        positivePoints: [],
        negativePoints: [],
        recommendation: '리뷰가 수집되면 AI 분석이 제공됩니다.',
        overallRating: 0,
        provider: 'none',
        reviewCount: 0,
      });
    }

    // 3. AI 서비스로 요약 생성
    const aiService = getAIService();
    const result = await aiService.summarizeReviews({
      productName: productName || '상품',
      reviews: allReviews,
    });

    // 4. 결과를 캐시에 저장
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24시간 후 만료

    await supabase.from('ai_summaries').upsert({
      product_id: productId,
      summary: result.summary,
      positive_points: result.positivePoints,
      negative_points: result.negativePoints,
      recommendation: result.recommendation,
      overall_rating: result.overallRating,
      sentiment_score: result.sentimentScore,
      ai_provider: aiService.provider,
      ai_model: 'mock',
      review_count: allReviews.length,
      is_outdated: false,
      expires_at: expiresAt.toISOString(),
      generated_at: new Date().toISOString(),
    }, {
      onConflict: 'product_id',
    });

    return NextResponse.json({
      summary: result.summary,
      positivePoints: result.positivePoints,
      negativePoints: result.negativePoints,
      recommendation: result.recommendation,
      overallRating: result.overallRating,
      provider: aiService.provider,
      reviewCount: allReviews.length,
      cached: false,
    });
  } catch (error) {
    console.error('AI Summary Error:', error);
    return NextResponse.json(
      { error: 'AI 요약 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

