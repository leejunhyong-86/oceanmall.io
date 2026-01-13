/**
 * @file scripts/reset-and-process.ts
 * @description 기존 AI 요약과 번역을 초기화하고 OpenAI로 재생성
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';
import { createAIService } from '../lib/ai/index.js';

// .env 파일 먼저 읽기
config({ path: resolve(process.cwd(), '.env') });
// .env.local 읽기 (있으면 덮어쓰기)
config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function resetAndProcess() {
  console.log(`\n🔄 AI 요약 및 번역 재생성 시작\n`);
  console.log(`AI Provider: ${process.env.AI_PROVIDER || 'mock'}`);
  console.log(`OpenAI API Key: ${process.env.OPENAI_API_KEY ? '✅ 설정됨' : '❌ 없음'}\n`);

  // 1. 리뷰가 있는 최근 상품 찾기
  const { data: products } = await supabase
    .from('products')
    .select('id, title, slug')
    .order('created_at', { ascending: false })
    .limit(5);

  if (!products || products.length === 0) {
    console.log('❌ 상품을 찾을 수 없습니다.');
    return;
  }

  let targetProduct = null;
  for (const product of products) {
    const { count } = await supabase
      .from('external_reviews')
      .select('*', { count: 'exact', head: true })
      .eq('product_id', product.id);

    if (count && count > 0) {
      targetProduct = { ...product, reviewCount: count };
      break;
    }
  }

  if (!targetProduct) {
    console.log('❌ 리뷰가 있는 상품을 찾을 수 없습니다.');
    return;
  }

  console.log(`✅ 처리 대상: ${targetProduct.title}`);
  console.log(`   리뷰 개수: ${targetProduct.reviewCount}개\n`);

  // 2. 기존 번역 초기화
  console.log(`🔄 기존 번역 초기화 중...`);
  const { error: resetError } = await supabase
    .from('external_reviews')
    .update({
      translated_content: null,
      is_translated: false,
    })
    .eq('product_id', targetProduct.id);

  if (resetError) {
    console.error('❌ 번역 초기화 실패:', resetError);
  } else {
    console.log('✅ 번역 초기화 완료\n');
  }

  // 3. 리뷰 조회
  const { data: reviews } = await supabase
    .from('external_reviews')
    .select('*')
    .eq('product_id', targetProduct.id);

  if (!reviews || reviews.length === 0) {
    console.log('❌ 리뷰를 가져올 수 없습니다.');
    return;
  }

  // 4. AI 요약 생성
  console.log(`🤖 OpenAI로 AI 요약 생성 중...\n`);
  
  const aiService = createAIService();
  
  console.log(`📌 사용 중인 AI 서비스: ${aiService.provider}`);
  
  if (aiService.provider === 'mock') {
    console.warn('⚠️  경고: Mock 서비스가 사용되고 있습니다!');
    console.warn('   .env.local에 다음을 추가하세요:');
    console.warn('   AI_PROVIDER=openai');
    console.warn('   OPENAI_API_KEY=sk-proj-...\n');
  }

  const summaryResult = await aiService.summarizeReviews({
    productName: targetProduct.title,
    reviews: reviews.map(r => ({
      content: r.content,
      rating: r.rating ?? undefined,
      language: r.source_language,
    })),
  });

  console.log(`\n✅ AI 요약 생성 완료!\n`);
  console.log(`${'='.repeat(60)}`);
  console.log(`📝 ${summaryResult.summary}\n`);
  console.log(`✅ 긍정 포인트:`);
  summaryResult.positivePoints.forEach((p, i) => console.log(`   ${i + 1}. ${p}`));
  console.log(`\n⚠️  부정 포인트:`);
  summaryResult.negativePoints.forEach((p, i) => console.log(`   ${i + 1}. ${p}`));
  console.log(`\n💡 ${summaryResult.recommendation}`);
  console.log(`⭐ 평점: ${summaryResult.overallRating}/5`);
  console.log(`😊 감정: ${summaryResult.sentimentScore.toFixed(2)}`);
  console.log(`${'='.repeat(60)}\n`);

  // 5. Supabase에 저장
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);

  await supabase
    .from('ai_summaries')
    .upsert({
      product_id: targetProduct.id,
      summary: summaryResult.summary,
      positive_points: summaryResult.positivePoints,
      negative_points: summaryResult.negativePoints,
      recommendation: summaryResult.recommendation,
      overall_rating: summaryResult.overallRating,
      sentiment_score: summaryResult.sentimentScore,
      ai_provider: aiService.provider,
      ai_model: process.env.AI_MODEL || 'gpt-4o-mini',
      review_count: reviews.length,
      is_outdated: false,
      expires_at: expiresAt.toISOString(),
      generated_at: new Date().toISOString(),
    }, {
      onConflict: 'product_id',
    });

  console.log(`💾 AI 요약 저장 완료\n`);

  // 6. 리뷰 번역 (처음 5개만)
  console.log(`🌐 리뷰 번역 시작 (최대 5개)...\n`);
  
  const toTranslate = reviews.filter(r => r.source_language === 'en').slice(0, 5);
  
  for (let i = 0; i < toTranslate.length; i++) {
    const review = toTranslate[i];
    console.log(`[${i + 1}/${toTranslate.length}] ${review.reviewer_name || '익명'}`);
    console.log(`   원문: ${review.content.substring(0, 60)}...`);

    try {
      const result = await aiService.translate({
        text: review.content,
        targetLanguage: 'ko',
        sourceLanguage: 'en',
      });

      console.log(`   번역: ${result.translatedText.substring(0, 60)}...`);

      await supabase
        .from('external_reviews')
        .update({
          translated_content: result.translatedText,
          is_translated: true,
        })
        .eq('id', review.id);

      console.log(`   ✅ 저장 완료\n`);

      // API 레이트 제한 방지
      if (i < toTranslate.length - 1) {
        await new Promise(r => setTimeout(r, 1500));
      }
    } catch (error: any) {
      console.error(`   ❌ 실패: ${error.message}\n`);
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`🎉 완료!`);
  console.log(`${'='.repeat(60)}\n`);
  console.log(`🌐 상품 페이지:`);
  console.log(`http://localhost:3000/products/${targetProduct.slug}\n`);
}

resetAndProcess().catch(console.error);
