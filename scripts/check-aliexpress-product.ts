import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function checkProduct() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from('products')
    .select('id, title, price_krw, external_rating, external_review_count, source_platform, created_at')
    .eq('source_platform', 'aliexpress')
    .order('created_at', { ascending: false })
    .limit(1);

  console.log('\n=== 최근 저장된 AliExpress 상품 ===\n');

  if (error) {
    console.error('오류:', error);
  } else if (data && data.length > 0) {
    const p = data[0];
    console.log('✅ ID:', p.id);
    console.log('📦 제목:', p.title.substring(0, 70) + '...');
    console.log('💰 가격:', p.price_krw?.toLocaleString() + '원');
    console.log('⭐ 평점:', p.external_rating + '/5');
    console.log('💬 리뷰 수:', p.external_review_count + '개');
    console.log('🏪 플랫폼:', p.source_platform);
    console.log('🕒 저장 시간:', new Date(p.created_at).toLocaleString('ko-KR'));
    console.log('\n');
  } else {
    console.log('상품을 찾을 수 없습니다.');
  }
}

checkProduct();
