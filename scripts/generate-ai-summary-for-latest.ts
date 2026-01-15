/**
 * @file scripts/generate-ai-summary-for-latest.ts
 * @description 최근 크롤링된 상품의 AI 요약 생성
 *
 * 사용법:
 * pnpm tsx scripts/generate-ai-summary-for-latest.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';
import { createAIService } from '../lib/ai/index.js';

// 환경변수 로드 (.env.local 우선)
config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function generateAISummaryForLatest() {
  console.log(`\n🚀 최근 크롤링된 상품의 AI 요약 생성\n`);

  // 1. 최근 상품 조회 (리뷰가 있는 것만)
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id, title, slug')
    .order('created_at', { ascending: false })
    .limit(10);

  if (productsError || !products || products.length === 0) {
    console.error('❌ 상품을 찾을 수 없습니다:', productsError);
    return;
  }

  console.log(`📦 ${products.length}개의 최근 상품을 찾았습니다.\n`);

  // 2. 각 상품에 대해 AI 요약 생성
  for (const product of products) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📦 상품: ${product.title.substring(0, 50)}...`);
    console.log(`   Slug: ${product.slug}\n`);

    // 리뷰 조회
    const { data: externalReviews } = await supabase
      .from('external_reviews')
      .select('content, rating, source_language')
      .eq('product_id', product.id)
      .limit(50);

    const { data: userReviews } = await supabase
      .from('user_reviews')
      .select('content, rating')
      .eq('product_id', product.id)
      .eq('is_visible', true)
      .limit(20);

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

    console.log(`📊 리뷰 통계:`);
    console.log(`   - 외부 리뷰: ${externalReviews?.length || 0}개`);
    console.log(`   - 자체 리뷰: ${userReviews?.length || 0}개`);
    console.log(`   - 총 리뷰: ${allReviews.length}개`);

    if (allReviews.length === 0) {
      console.log(`   ⚠️  분석할 리뷰가 없습니다. 건너뜁니다.\n`);
      continue;
    }

    // AI 요약 생성
    console.log(`\n🤖 AI 요약 생성 중... (AI_PROVIDER: ${process.env.AI_PROVIDER || 'mock'})`);
    
    const aiService = createAIService();
    const result = await aiService.summarizeReviews({
      productName: product.title,
      reviews: allReviews,
    });

    console.log(`\n✅ AI 요약 생성 완료!`);
    console.log(`📝 요약: ${result.summary.substring(0, 100)}...`);
    console.log(`✅ 긍정 포인트: ${result.positivePoints.length}개`);
    console.log(`⚠️  부정 포인트: ${result.negativePoints.length}개`);
    console.log(`⭐ 평점: ${result.overallRating}/5`);

    // Supabase에 저장
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const { error: saveError } = await supabase
      .from('ai_summaries')
      .upsert({
        product_id: product.id,
        summary: result.summary,
        positive_points: result.positivePoints,
        negative_points: result.negativePoints,
        recommendation: result.recommendation,
        overall_rating: result.overallRating,
        sentiment_score: result.sentimentScore,
        ai_provider: aiService.provider,
        ai_model: process.env.AI_MODEL || 'mock',
        review_count: allReviews.length,
        is_outdated: false,
        expires_at: expiresAt.toISOString(),
        generated_at: new Date().toISOString(),
      }, {
        onConflict: 'product_id',
      });

    if (saveError) {
      console.error(`   ❌ 저장 실패:`, saveError.message);
    } else {
      console.log(`   ✅ AI 요약이 Supabase에 저장되었습니다.`);
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`✅ 모든 상품의 AI 요약 생성 완료!\n`);
}

generateAISummaryForLatest()
  .then(() => {
    console.log('✅ 완료!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  });
