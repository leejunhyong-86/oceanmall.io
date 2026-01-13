import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function listProducts() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from('products')
    .select('id, title, price_krw, external_rating, external_review_count, source_platform, created_at')
    .eq('source_platform', 'aliexpress')
    .order('created_at', { ascending: false });

  console.log('\n=== 전체 AliExpress 상품 목록 ===\n');

  if (error) {
    console.error('오류:', error);
  } else if (data && data.length > 0) {
    console.log(`총 ${data.length}개의 상품이 저장되어 있습니다.\n`);
    
    data.forEach((p, idx) => {
      console.log(`[${idx + 1}] ${p.title.substring(0, 60)}...`);
      console.log(`    💰 ${p.price_krw?.toLocaleString()}원 | ⭐ ${p.external_rating || '-'}/5 | 💬 ${p.external_review_count}개 리뷰`);
      console.log(`    🆔 ${p.id}`);
      console.log(`    🕒 ${new Date(p.created_at).toLocaleString('ko-KR')}`);
      console.log('');
    });
  } else {
    console.log('상품을 찾을 수 없습니다.');
  }
}

listProducts();
