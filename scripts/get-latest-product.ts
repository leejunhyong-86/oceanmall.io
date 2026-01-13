import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';

config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function getLatestProduct() {
  const { data, error } = await supabase
    .from('products')
    .select('id, slug, title, source_platform, created_at')
    .order('created_at', { ascending: false })
    .limit(3);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('\n최근 상품 3개:\n');
  data?.forEach((p, i) => {
    console.log(`${i + 1}. ${p.title}`);
    console.log(`   Slug: ${p.slug}`);
    console.log(`   Platform: ${p.source_platform}`);
    console.log(`   Created: ${p.created_at}\n`);
  });

  // 리뷰 개수 확인
  if (data && data.length > 0) {
    for (const product of data) {
      const { count } = await supabase
        .from('external_reviews')
        .select('*', { count: 'exact', head: true })
        .eq('product_id', product.id);
      
      console.log(`${product.title.substring(0, 50)}... → 리뷰 ${count}개`);
    }
  }
}

getLatestProduct().catch(console.error);
