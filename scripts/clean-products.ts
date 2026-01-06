/**
 * @file scripts/clean-products.ts
 * @description 모든 상품 및 관련 데이터 삭제 스크립트
 *
 * 사용법: pnpm clean-products
 *
 * 이 스크립트는 다음 데이터를 삭제합니다:
 * - AI 요약
 * - 외부 리뷰
 * - 한국 사용자 리뷰
 * - 리뷰 투표
 * - 위시리스트
 * - 최근 조회
 * - 장바구니
 * - 주문 상품
 * - 주문
 * - 상품
 * - 카테고리
 */

import { createClient } from '@supabase/supabase-js';
import * as readline from 'readline';
import { config } from 'dotenv';
import { resolve } from 'path';

// .env.local 파일 로드
config({ path: resolve(process.cwd(), '.env.local') });

// 환경 변수 확인
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 환경 변수가 설정되지 않았습니다.');
  console.error('   NEXT_PUBLIC_SUPABASE_URL과 SUPABASE_SERVICE_ROLE_KEY를 .env.local에 설정하세요.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 사용자 확인 함수
function askConfirmation(question: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

async function cleanAllProducts() {
  console.log('🗑️  상품 데이터 삭제 스크립트\n');
  console.log('⚠️  경고: 이 작업은 되돌릴 수 없습니다!');
  console.log('   다음 데이터가 모두 삭제됩니다:');
  console.log('   - 모든 상품');
  console.log('   - 모든 카테고리');
  console.log('   - 모든 리뷰 (외부 + 한국 사용자)');
  console.log('   - AI 요약');
  console.log('   - 위시리스트');
  console.log('   - 장바구니');
  console.log('   - 주문 내역');
  console.log('');

  const confirmed = await askConfirmation('정말로 삭제하시겠습니까? (y/N): ');

  if (!confirmed) {
    console.log('❌ 취소되었습니다.');
    process.exit(0);
  }

  try {
    console.log('\n🗑️  데이터 삭제 중...\n');

    // 1. AI 요약 삭제
    console.log('   AI 요약 삭제 중...');
    const { error: aiError } = await supabase
      .from('ai_summaries')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    if (aiError) console.warn(`   ⚠️  AI 요약 삭제 경고: ${aiError.message}`);
    else console.log('   ✅ AI 요약 삭제 완료');

    // 2. 리뷰 투표 삭제
    console.log('   리뷰 투표 삭제 중...');
    const { error: voteError } = await supabase
      .from('review_votes')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    if (voteError) console.warn(`   ⚠️  리뷰 투표 삭제 경고: ${voteError.message}`);
    else console.log('   ✅ 리뷰 투표 삭제 완료');

    // 3. 외부 리뷰 삭제
    console.log('   외부 리뷰 삭제 중...');
    const { error: externalReviewError } = await supabase
      .from('external_reviews')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    if (externalReviewError) console.warn(`   ⚠️  외부 리뷰 삭제 경고: ${externalReviewError.message}`);
    else console.log('   ✅ 외부 리뷰 삭제 완료');

    // 4. 한국 사용자 리뷰 삭제
    console.log('   한국 사용자 리뷰 삭제 중...');
    const { error: userReviewError } = await supabase
      .from('user_reviews')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    if (userReviewError) console.warn(`   ⚠️  사용자 리뷰 삭제 경고: ${userReviewError.message}`);
    else console.log('   ✅ 한국 사용자 리뷰 삭제 완료');

    // 5. 위시리스트 삭제
    console.log('   위시리스트 삭제 중...');
    const { error: wishlistError } = await supabase
      .from('wishlists')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    if (wishlistError) console.warn(`   ⚠️  위시리스트 삭제 경고: ${wishlistError.message}`);
    else console.log('   ✅ 위시리스트 삭제 완료');

    // 6. 최근 조회 삭제
    console.log('   최근 조회 삭제 중...');
    const { error: recentViewError } = await supabase
      .from('recent_views')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    if (recentViewError) console.warn(`   ⚠️  최근 조회 삭제 경고: ${recentViewError.message}`);
    else console.log('   ✅ 최근 조회 삭제 완료');

    // 7. 장바구니 삭제
    console.log('   장바구니 삭제 중...');
    const { error: cartError } = await supabase
      .from('carts')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    if (cartError) console.warn(`   ⚠️  장바구니 삭제 경고: ${cartError.message}`);
    else console.log('   ✅ 장바구니 삭제 완료');

    // 8. 주문 상품 삭제
    console.log('   주문 상품 삭제 중...');
    const { error: orderItemError } = await supabase
      .from('order_items')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    if (orderItemError) console.warn(`   ⚠️  주문 상품 삭제 경고: ${orderItemError.message}`);
    else console.log('   ✅ 주문 상품 삭제 완료');

    // 9. 주문 삭제
    console.log('   주문 삭제 중...');
    const { error: orderError } = await supabase
      .from('orders')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    if (orderError) console.warn(`   ⚠️  주문 삭제 경고: ${orderError.message}`);
    else console.log('   ✅ 주문 삭제 완료');

    // 10. 상품 삭제
    console.log('   상품 삭제 중...');
    const { error: productError } = await supabase
      .from('products')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    if (productError) throw new Error(`상품 삭제 실패: ${productError.message}`);
    console.log('   ✅ 상품 삭제 완료');

    // 11. 카테고리 삭제
    console.log('   카테고리 삭제 중...');
    const { error: categoryError } = await supabase
      .from('categories')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    if (categoryError) throw new Error(`카테고리 삭제 실패: ${categoryError.message}`);
    console.log('   ✅ 카테고리 삭제 완료');

    // 결과 확인
    console.log('\n📊 삭제 결과 확인 중...');
    const { count: categoryCount } = await supabase
      .from('categories')
      .select('*', { count: 'exact', head: true });
    const { count: productCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });
    const { count: reviewCount } = await supabase
      .from('external_reviews')
      .select('*', { count: 'exact', head: true });

    console.log(`   - 남은 카테고리: ${categoryCount}개`);
    console.log(`   - 남은 상품: ${productCount}개`);
    console.log(`   - 남은 리뷰: ${reviewCount}개`);

    console.log('\n✅ 모든 데이터가 성공적으로 삭제되었습니다!');
    console.log('\n💡 다음 단계:');
    console.log('   1. 새로운 상품 데이터를 준비하세요');
    console.log('   2. pnpm seed 명령어로 데이터를 다시 삽입하세요');

  } catch (error) {
    console.error('\n❌ 삭제 실패:', error);
    process.exit(1);
  }
}

// 실행
cleanAllProducts();

