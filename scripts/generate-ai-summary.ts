/**
 * @file scripts/generate-ai-summary.ts
 * @description 상품의 리뷰를 분석하여 AI 요약 생성
 *
 * 사용법:
 * pnpm tsx scripts/generate-ai-summary.ts <product-slug>
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

async function generateAISummary(productSlug: string) {
  console.log(`\n🚀 AI 요약 생성 시작: ${productSlug}\n`);

  // 1. 상품 정보 조회
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('*')
    .eq('slug', productSlug)
    .single();

  if (productError || !product) {
    console.error('❌ 상품을 찾을 수 없습니다:', productError);
    return;
  }

  console.log(`✅ 상품 찾음: ${product.title}`);
  console.log(`   ID: ${product.id}\n`);

  // 2. 외부 리뷰 조회
  const { data: externalReviews } = await supabase
    .from('external_reviews')
    .select('content, rating, source_language')
    .eq('product_id', product.id)
    .limit(50);

  // 3. 자체 리뷰 조회
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
  console.log(`   - 총 리뷰: ${allReviews.length}개\n`);

  if (allReviews.length === 0) {
    console.log('⚠️  분석할 리뷰가 없습니다.');
    return;
  }

  // 4. AI 서비스로 요약 생성
  console.log(`🤖 AI 요약 생성 중... (AI_PROVIDER: ${process.env.AI_PROVIDER || 'mock'})`);
  
  const aiService = createAIService();
  const result = await aiService.summarizeReviews({
    productName: product.title,
    reviews: allReviews,
  });

  console.log(`\n✅ AI 요약 생성 완료!\n`);
  console.log(`📝 요약: ${result.summary}\n`);
  console.log(`✅ 긍정 포인트 (${result.positivePoints.length}개):`);
  result.positivePoints.forEach((p, i) => console.log(`   ${i + 1}. ${p}`));
  console.log(`\n⚠️  부정 포인트 (${result.negativePoints.length}개):`);
  result.negativePoints.forEach((p, i) => console.log(`   ${i + 1}. ${p}`));
  console.log(`\n💡 추천: ${result.recommendation}`);
  console.log(`⭐ 평점: ${result.overallRating}/5`);
  console.log(`😊 감정 점수: ${result.sentimentScore} (${result.sentimentScore > 0 ? '긍정적' : result.sentimentScore < 0 ? '부정적' : '중립'})`);

  // 5. Supabase에 저장
  console.log(`\n💾 Supabase에 저장 중...`);
  
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
      ai_model: process.env.AI_MODEL || 'gpt-4o-mini',
      review_count: allReviews.length,
      is_outdated: false,
      expires_at: expiresAt.toISOString(),
      generated_at: new Date().toISOString(),
    }, {
      onConflict: 'product_id',
    });

  if (saveError) {
    console.error('❌ 저장 실패:', saveError);
  } else {
    console.log('✅ AI 요약이 Supabase에 저장되었습니다.\n');
  }
}

// 실행
const productSlug = process.argv[2];

if (!productSlug) {
  console.error('❌ 사용법: pnpm tsx scripts/generate-ai-summary.ts <product-slug>');
  process.exit(1);
}

generateAISummary(productSlug)
  .then(() => {
    console.log('✅ 완료!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  });
