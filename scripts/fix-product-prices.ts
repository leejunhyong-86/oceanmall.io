/**
 * @file scripts/fix-product-prices.ts
 * @description 비정상적으로 큰 가격을 수정하는 스크립트
 *
 * Amazon 크롤러에서 가격 추출 시 소수점이 누락되어 비정상적으로 큰 가격이 저장된 경우를 수정합니다.
 * 예: 103207 -> 103.21
 *
 * 사용법:
 * pnpm tsx scripts/fix-product-prices.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';

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

async function fixProductPrices() {
  console.log(`\n🔧 상품 가격 수정 시작\n`);

  // 1. USD 통화이고 가격이 100 이상인 상품 조회 (모든 의심스러운 가격 확인)
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id, title, original_price, currency, price_krw, source_url')
    .eq('currency', 'USD')
    .gte('original_price', 100)
    .order('created_at', { ascending: false });

  if (productsError) {
    console.error('❌ 상품 조회 실패:', productsError);
    return;
  }

  if (!products || products.length === 0) {
    console.log('✅ 수정할 상품이 없습니다.\n');
    return;
  }

  console.log(`📦 ${products.length}개의 상품을 찾았습니다.\n`);

  let fixedCount = 0;
  let needManualCheck: any[] = [];

  for (const product of products) {
    if (!product.original_price) continue;

    // 가격이 비정상적으로 큰 경우 처리
    // Amazon 상품은 일반적으로 $1000 이하이므로, $100 이상이면 의심
    if (product.original_price >= 100) {
      // 여러 가능성 체크
      let correctedPrice: number | null = null;
      let reason = '';

      // 1. $100 이상 $1000 미만: 여러 가능성 체크
      if (product.original_price >= 100 && product.original_price < 1000) {
        // 100으로 나눈 값이 합리적인 범위인지 확인 (예: 6900 -> 69.00)
        const dividedBy100 = product.original_price / 100;
        if (dividedBy100 >= 0.01 && dividedBy100 <= 100) {
          correctedPrice = dividedBy100;
          reason = '100으로 나눔 (소수점 누락 추정)';
        }
        // 10으로 나눈 값도 확인 (예: 690 -> 69.00)
        else {
          const dividedBy10 = product.original_price / 10;
          if (dividedBy10 >= 0.01 && dividedBy10 <= 100) {
            correctedPrice = dividedBy10;
            reason = '10으로 나눔 (소수점 누락 추정)';
          }
        }
      }
      
      // 2. $1000 이상 $10000 미만: 100으로 나눔
      if (product.original_price >= 1000 && product.original_price < 10000) {
        const dividedBy100 = product.original_price / 100;
        if (dividedBy100 >= 0.01 && dividedBy100 <= 100) {
          correctedPrice = dividedBy100;
          reason = '100으로 나눔 (소수점 누락 추정)';
        }
      }
      
      // 3. $10000 이상: 100으로 나눔
      if (product.original_price >= 10000) {
        const dividedBy100 = product.original_price / 100;
        if (dividedBy100 >= 0.01 && dividedBy100 <= 1000) {
          correctedPrice = dividedBy100;
          reason = '100으로 나눔 (소수점 누락 추정)';
        }
      }

      if (correctedPrice !== null) {
        const correctedPriceKrw = correctedPrice ? Math.round(correctedPrice * 1400) : null;

        console.log(`📝 수정: ${product.title.substring(0, 50)}...`);
        console.log(`   기존: $${product.original_price.toLocaleString()}`);
        console.log(`   수정: $${correctedPrice.toFixed(2)} (${reason})`);

        const { error: updateError } = await supabase
          .from('products')
          .update({
            original_price: correctedPrice,
            price_krw: correctedPriceKrw,
          })
          .eq('id', product.id);

        if (updateError) {
          console.error(`   ❌ 수정 실패:`, updateError.message);
        } else {
          console.log(`   ✅ 수정 완료\n`);
          fixedCount++;
        }
      } else {
        // 수정할 수 없는 경우 수동 확인 필요
        needManualCheck.push(product);
        console.log(`⚠️  수동 확인 필요: ${product.title.substring(0, 50)}...`);
        console.log(`   가격: $${product.original_price.toLocaleString()}`);
        console.log(`   (자동 수정 불가 - 수동 확인 필요)\n`);
      }
    }
  }

  if (needManualCheck.length > 0) {
    console.log(`\n⚠️  수동 확인이 필요한 상품: ${needManualCheck.length}개`);
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`✅ 가격 수정 완료!`);
  console.log(`   📊 총 ${products.length}개 중 ${fixedCount}개 수정됨\n`);
}

fixProductPrices()
  .then(() => {
    console.log('✅ 완료!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  });
