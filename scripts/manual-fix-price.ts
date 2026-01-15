/**
 * @file scripts/manual-fix-price.ts
 * @description 특정 상품의 가격을 수동으로 수정하는 스크립트
 *
 * 사용법:
 * pnpm tsx scripts/manual-fix-price.ts <product-slug> <correct-price>
 * 예: pnpm tsx scripts/manual-fix-price.ts keurig-k-express 69
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';

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

async function manualFixPrice(productIdentifier: string, correctPrice: number) {
  console.log(`\n🔧 상품 가격 수동 수정\n`);

  // 상품 조회 (ID 또는 slug로 검색)
  let product;
  let productError;
  
  // UUID 형식인지 확인 (ID)
  if (productIdentifier.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
    const result = await supabase
      .from('products')
      .select('id, title, original_price, currency, price_krw')
      .eq('id', productIdentifier)
      .single();
    product = result.data;
    productError = result.error;
  } else {
    // slug로 검색
    const result = await supabase
      .from('products')
      .select('id, title, original_price, currency, price_krw')
      .ilike('slug', `%${productIdentifier}%`)
      .limit(1)
      .single();
    product = result.data;
    productError = result.error;
  }

  if (productError || !product) {
    console.error('❌ 상품을 찾을 수 없습니다:', productError);
    return;
  }

  console.log(`📦 상품: ${product.title}`);
  console.log(`   기존 가격: $${product.original_price?.toLocaleString() || '없음'}`);
  console.log(`   수정 가격: $${correctPrice.toFixed(2)}\n`);

  // KRW 가격 계산
  const priceKrw = Math.round(correctPrice * 1400);

  const { error: updateError } = await supabase
    .from('products')
    .update({
      original_price: correctPrice,
      price_krw: priceKrw,
    })
    .eq('id', product.id);

  if (updateError) {
    console.error('❌ 수정 실패:', updateError.message);
  } else {
    console.log('✅ 가격이 수정되었습니다!');
    console.log(`   USD: $${correctPrice.toFixed(2)}`);
    console.log(`   KRW: ₩${priceKrw.toLocaleString()}\n`);
  }
}

// 실행
const productIdentifier = process.argv[2];
const correctPrice = parseFloat(process.argv[3]);

if (!productIdentifier || isNaN(correctPrice)) {
  console.error('❌ 사용법: pnpm tsx scripts/manual-fix-price.ts <product-id-or-slug> <correct-price>');
  console.error('   예: pnpm tsx scripts/manual-fix-price.ts 52ee5dc6-289f-4413-ae9b-f3a62e6cd928 69');
  console.error('   또는: pnpm tsx scripts/manual-fix-price.ts keurig 69');
  process.exit(1);
}

manualFixPrice(productIdentifier, correctPrice)
  .then(() => {
    console.log('✅ 완료!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  });
