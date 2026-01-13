/**
 * @file scripts/translate-reviews.ts
 * @description 상품의 외부 리뷰를 한국어로 번역
 *
 * 사용법:
 * pnpm tsx scripts/translate-reviews.ts <product-slug>
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

async function translateReviews(productSlug: string) {
  console.log(`\n🌐 리뷰 번역 시작: ${productSlug}\n`);

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

  // 2. 번역되지 않은 외부 리뷰 조회
  const { data: reviews } = await supabase
    .from('external_reviews')
    .select('id, content, source_language, reviewer_name')
    .eq('product_id', product.id)
    .eq('is_translated', false)
    .eq('source_language', 'en');

  if (!reviews || reviews.length === 0) {
    console.log('ℹ️  번역할 리뷰가 없습니다. (이미 번역되었거나 영어 리뷰가 없습니다)\n');
    return;
  }

  console.log(`📊 번역 대상: ${reviews.length}개의 리뷰\n`);

  // 3. AI 서비스로 번역
  const aiService = createAIService();
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < reviews.length; i++) {
    const review = reviews[i];
    console.log(`\n[${i + 1}/${reviews.length}] 번역 중...`);
    console.log(`   리뷰어: ${review.reviewer_name || '익명'}`);
    console.log(`   원문: ${review.content.substring(0, 100)}...`);

    try {
      const result = await aiService.translateText({
        text: review.content,
        targetLanguage: 'ko',
        sourceLanguage: review.source_language,
      });

      console.log(`   번역: ${result.translatedText.substring(0, 100)}...`);

      // Supabase에 저장
      const { error } = await supabase
        .from('external_reviews')
        .update({
          translated_content: result.translatedText,
          is_translated: true,
        })
        .eq('id', review.id);

      if (error) {
        console.error(`   ❌ 저장 실패:`, error.message);
        failCount++;
      } else {
        console.log(`   ✅ 번역 및 저장 완료`);
        successCount++;
      }

      // API 레이트 제한을 피하기 위한 딜레이
      if (i < reviews.length - 1) {
        await new Promise(r => setTimeout(r, 1000));
      }
    } catch (error: any) {
      console.error(`   ❌ 번역 실패:`, error.message);
      failCount++;
    }
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`✅ 번역 완료!`);
  console.log(`   성공: ${successCount}개`);
  console.log(`   실패: ${failCount}개`);
  console.log(`${'='.repeat(50)}\n`);
}

// 실행
const productSlug = process.argv[2];

if (!productSlug) {
  console.error('❌ 사용법: pnpm tsx scripts/translate-reviews.ts <product-slug>');
  process.exit(1);
}

translateReviews(productSlug)
  .then(() => {
    console.log('✅ 완료!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  });
