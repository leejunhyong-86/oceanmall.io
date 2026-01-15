/**
 * @file scripts/list-products.ts
 * @description 최근 크롤링된 상품 목록 조회
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';

config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function listProducts() {
  const { data: products, error } = await supabase
    .from('products')
    .select('id, title, slug, original_price, currency')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('❌ 조회 실패:', error);
    return;
  }

  console.log(`\n📦 최근 상품 목록:\n`);
  products?.forEach((p, idx) => {
    console.log(`${idx + 1}. ${p.title.substring(0, 60)}...`);
    console.log(`   Slug: ${p.slug}`);
    console.log(`   가격: $${p.original_price?.toLocaleString() || '없음'}`);
    console.log(`   ID: ${p.id}\n`);
  });
}

listProducts()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ 오류:', error);
    process.exit(1);
  });
