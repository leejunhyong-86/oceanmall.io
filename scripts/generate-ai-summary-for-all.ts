/**
 * @file scripts/generate-ai-summary-for-all.ts
 * @description 모든 상품의 AI 요약 생성 (요약이 없는 상품만)
 *
 * AI 요약이 없는 모든 상품에 대해 AI 요약을 생성합니다.
 *
 * 사용법:
 * pnpm tsx scripts/generate-ai-summary-for-all.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';
import { createAIService } from '../lib/ai/index.js';

// 환경변수 로드
config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function generateAISummaryForAll() {
  console.log(`\n🚀 모든 상품의 AI 요약 생성 시작\n`);

  // 1. AI 요약이 없는 상품 조회
  console.log('📦 AI 요약이 없는 상품 조회 중...\n');
  
  const { data: productsWithoutSummary, error: productsError } = await supabase
    .from('products')
    .select(`
      id,
      title,
      slug,
      ai_summaries!left(product_id)
    `)
    .is('ai_summaries.product_id', null)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (productsError) {
    console.error('❌ 상품 조회 실패:', productsError);
    return;
  }

  if (!productsWithoutSummary || productsWithoutSummary.length === 0) {
    console.log('✅ AI 요약이 없는 상품이 없습니다.\n');
    return;
  }

  console.log(`📊 총 ${productsWithoutSummary.length}개의 상품에 AI 요약이 필요합니다.\n`);

  // 2. 전체 상품 수 확인
  const { count: totalCount } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);

  const { count: summaryCount } = await supabase
    .from('ai_summaries')
    .select('*', { count: 'exact', head: true })
    .eq('is_outdated', false);

  console.log(`📈 전체 통계:`);
  console.log(`   - 전체 상품: ${totalCount || 0}개`);
  console.log(`   - AI 요약 있음: ${summaryCount || 0}개`);
  console.log(`   - AI 요약 없음: ${productsWithoutSummary.length}개\n`);

  // 3. AI 서비스 초기화
  const aiService = createAIService();
  console.log(`🤖 AI 서비스: ${aiService.provider}\n`);

  let successCount = 0;
  let failCount = 0;
  let skipCount = 0;

  // 4. 각 상품에 대해 AI 요약 생성
  for (let i = 0; i < productsWithoutSummary.length; i++) {
    const product = productsWithoutSummary[i] as any;
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📦 [${i + 1}/${productsWithoutSummary.length}] 상품: ${product.title.substring(0, 50)}...`);
    console.log(`   Slug: ${product.slug}`);

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
        language: r.source_language || 'en',
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
      console.log(`   ⚠️  리뷰가 없어 AI 요약을 생성할 수 없습니다.`);
      skipCount++;
      continue;
    }

    // AI 요약 생성
    try {
      console.log(`\n🤖 AI 요약 생성 중...`);
      
      const result = await aiService.summarizeReviews({
        productName: product.title,
        reviews: allReviews,
      });

      console.log(`✅ AI 요약 생성 완료!`);
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
        failCount++;
      } else {
        console.log(`   ✅ AI 요약이 Supabase에 저장되었습니다.`);
        successCount++;
      }
    } catch (error) {
      console.error(`   ❌ AI 요약 생성 실패:`, error instanceof Error ? error.message : error);
      failCount++;
    }

    // API 호출 제한을 고려한 딜레이 (필요시)
    if (i < productsWithoutSummary.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1초 대기
    }
  }

  // 5. 최종 결과
  console.log(`\n${'='.repeat(60)}`);
  console.log(`✅ 모든 작업 완료!\n`);
  console.log(`📊 최종 결과:`);
  console.log(`   - 성공: ${successCount}개`);
  console.log(`   - 실패: ${failCount}개`);
  console.log(`   - 건너뜀 (리뷰 없음): ${skipCount}개`);
  console.log(`   - 총 처리: ${productsWithoutSummary.length}개\n`);
}

generateAISummaryForAll()
  .then(() => {
    console.log('✅ 완료!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  });
