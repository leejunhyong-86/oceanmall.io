/**
 * @file scripts/delete-all-products.js
 * @description 모든 상품 및 관련 데이터 삭제 스크립트
 * 
 * 사용법: node scripts/delete-all-products.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 환경 변수가 설정되지 않았습니다.');
  console.error('   NEXT_PUBLIC_SUPABASE_URL과 SUPABASE_SERVICE_ROLE_KEY가 필요합니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function deleteAllProducts() {
  console.log('🗑️  상품 삭제 시작...\n');

  try {
    // 1. 외부 리뷰 삭제
    console.log('1️⃣ 외부 리뷰 삭제 중...');
    const { error: err1 } = await supabase.from('external_reviews').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (err1) console.error('   ⚠️  오류:', err1.message);
    else console.log('   ✅ 완료');

    // 2. 내부 리뷰 삭제
    console.log('2️⃣ 내부 리뷰 삭제 중...');
    const { error: err2 } = await supabase.from('internal_reviews').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (err2) console.error('   ⚠️  오류:', err2.message);
    else console.log('   ✅ 완료');

    // 3. 위시리스트 삭제
    console.log('3️⃣ 위시리스트 삭제 중...');
    const { error: err3 } = await supabase.from('wishlists').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (err3) console.error('   ⚠️  오류:', err3.message);
    else console.log('   ✅ 완료');

    // 4. 장바구니 아이템 삭제
    console.log('4️⃣ 장바구니 아이템 삭제 중...');
    const { error: err4 } = await supabase.from('cart_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (err4) console.error('   ⚠️  오류:', err4.message);
    else console.log('   ✅ 완료');

    // 5. 주문 아이템 삭제
    console.log('5️⃣ 주문 아이템 삭제 중...');
    const { error: err5 } = await supabase.from('order_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (err5) console.error('   ⚠️  오류:', err5.message);
    else console.log('   ✅ 완료');

    // 6. 최근 조회 삭제
    console.log('6️⃣ 최근 조회 삭제 중...');
    const { error: err6 } = await supabase.from('recent_views').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (err6) console.error('   ⚠️  오류:', err6.message);
    else console.log('   ✅ 완료');

    // 7. AI 요약 삭제
    console.log('7️⃣ AI 요약 삭제 중...');
    const { error: err7 } = await supabase.from('ai_summaries').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (err7) console.error('   ⚠️  오류:', err7.message);
    else console.log('   ✅ 완료');

    // 8. 상품 삭제
    console.log('8️⃣ 상품 삭제 중...');
    const { error: err8 } = await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (err8) console.error('   ⚠️  오류:', err8.message);
    else console.log('   ✅ 완료');

    // 삭제 확인
    console.log('\n📊 삭제 확인 중...');
    const { count: productCount } = await supabase.from('products').select('*', { count: 'exact', head: true });
    const { count: reviewCount } = await supabase.from('external_reviews').select('*', { count: 'exact', head: true });

    console.log('\n' + '='.repeat(50));
    console.log('✅ 삭제 완료!');
    console.log('   - 남은 상품 수:', productCount || 0);
    console.log('   - 남은 외부 리뷰 수:', reviewCount || 0);
    console.log('='.repeat(50));

  } catch (error) {
    console.error('❌ 삭제 중 오류 발생:', error);
    process.exit(1);
  }
}

deleteAllProducts();
