/**
 * @file scripts/process-product-reviews.ts
 * @description 최근 상품의 리뷰를 AI로 분석하고 번역
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';
import { createAIService } from '../lib/ai/index.js';

config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function processReviews() {
  console.log(`\n🚀 리뷰 처리 시작\n`);
  console.log(`AI Provider: ${process.env.AI_PROVIDER || 'mock'}\n`);

  // 1. 리뷰가 있는 최근 상품 찾기
  const { data: products } = await supabase
    .from('products')
    .select('id, title, slug, source_platform, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  if (!products || products.length === 0) {
    console.log('❌ 상품을 찾을 수 없습니다.');
    return;
  }

  // 리뷰가 있는 상품 찾기
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

  console.log(`✅ 처리 대상 상품 찾음:`);
  console.log(`   제목: ${targetProduct.title}`);
  console.log(`   ID: ${targetProduct.id}`);
  console.log(`   리뷰 개수: ${targetProduct.reviewCount}개\n`);

  // 2. 리뷰 조회
  const { data: reviews } = await supabase
    .from('external_reviews')
    .select('*')
    .eq('product_id', targetProduct.id);

  if (!reviews || reviews.length === 0) {
    console.log('❌ 리뷰를 가져올 수 없습니다.');
    return;
  }

  console.log(`📊 리뷰 상세:`);
  reviews.forEach((r, i) => {
    console.log(`   ${i + 1}. ${r.reviewer_name || '익명'} (평점: ${r.rating || 'N/A'})`);
    console.log(`      "${r.content.substring(0, 80)}..."`);
  });
  console.log('');

  // 3. AI 요약 생성
  console.log(`🤖 AI 요약 생성 중...\n`);
  
  const aiService = createAIService();
  const summaryResult = await aiService.summarizeReviews({
    productName: targetProduct.title,
    reviews: reviews.map(r => ({
      content: r.content,
      rating: r.rating ?? undefined,
      language: r.source_language,
    })),
  });

  console.log(`✅ AI 요약 생성 완료!\n`);
  console.log(`${'='.repeat(60)}`);
  console.log(`📝 요약: ${summaryResult.summary}\n`);
  console.log(`✅ 긍정 포인트 (${summaryResult.positivePoints.length}개):`);
  summaryResult.positivePoints.forEach((p, i) => console.log(`   ${i + 1}. ${p}`));
  console.log(`\n⚠️  부정 포인트 (${summaryResult.negativePoints.length}개):`);
  summaryResult.negativePoints.forEach((p, i) => console.log(`   ${i + 1}. ${p}`));
  console.log(`\n💡 추천: ${summaryResult.recommendation}`);
  console.log(`⭐ 평점: ${summaryResult.overallRating}/5`);
  console.log(`😊 감정 점수: ${summaryResult.sentimentScore.toFixed(2)} (${summaryResult.sentimentScore > 0 ? '긍정적' : summaryResult.sentimentScore < 0 ? '부정적' : '중립'})`);
  console.log(`${'='.repeat(60)}\n`);

  // 4. Supabase에 저장
  console.log(`💾 AI 요약 저장 중...`);
  
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);

  const { error: saveError } = await supabase
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

  if (saveError) {
    console.error('❌ 저장 실패:', saveError);
  } else {
    console.log('✅ AI 요약이 Supabase에 저장되었습니다.\n');
  }

  // 5. 리뷰 번역
  console.log(`🌐 리뷰 번역 시작...\n`);
  
  const untranslatedReviews = reviews.filter(r => !r.is_translated && r.source_language === 'en');
  
  if (untranslatedReviews.length === 0) {
    console.log('ℹ️  번역할 리뷰가 없습니다.\n');
  } else {
    console.log(`📋 번역 대상: ${untranslatedReviews.length}개\n`);
    
    let successCount = 0;
    
    for (let i = 0; i < untranslatedReviews.length; i++) {
      const review = untranslatedReviews[i];
      console.log(`[${i + 1}/${untranslatedReviews.length}] 번역 중...`);
      console.log(`   리뷰어: ${review.reviewer_name || '익명'}`);
      console.log(`   원문: ${review.content.substring(0, 80)}...`);

      try {
        const translationResult = await aiService.translate({
          text: review.content,
          targetLanguage: 'ko',
          sourceLanguage: review.source_language || 'en',
        });

        console.log(`   번역: ${translationResult.translatedText.substring(0, 80)}...`);

        // Supabase에 저장
        const { error } = await supabase
          .from('external_reviews')
          .update({
            translated_content: translationResult.translatedText,
            is_translated: true,
          })
          .eq('id', review.id);

        if (error) {
          console.error(`   ❌ 저장 실패:`, error.message);
        } else {
          console.log(`   ✅ 번역 및 저장 완료`);
          successCount++;
        }

        // API 레이트 제한 방지
        await new Promise(r => setTimeout(r, 1000));
      } catch (error: any) {
        console.error(`   ❌ 번역 실패:`, error.message);
      }
      
      console.log('');
    }

    console.log(`${'='.repeat(60)}`);
    console.log(`✅ 번역 완료: ${successCount}/${untranslatedReviews.length}개 성공`);
    console.log(`${'='.repeat(60)}\n`);
  }

  // 6. 최종 결과
  console.log(`\n🎉 모든 처리 완료!\n`);
  console.log(`처리 결과:`);
  console.log(`   ✅ AI 요약 생성: 완료`);
  console.log(`   ✅ 감정 분석: ${summaryResult.sentimentScore > 0 ? '긍정적' : '부정적'}`);
  console.log(`   ✅ 리뷰 번역: ${untranslatedReviews.length}개 중 번역 시도`);
  console.log(`\n상품 페이지 URL: http://localhost:3000/products/${targetProduct.slug}\n`);
}

processReviews().catch(console.error);
