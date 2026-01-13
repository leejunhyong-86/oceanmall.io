import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { isValidProductDetailImage, filterProductDetailImages } from '../lib/utils/image-filter.js';

dotenv.config({ path: '.env.local' });

async function testFilter() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from('products')
    .select('title, detail_images')
    .eq('source_platform', 'aliexpress')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.error('오류:', error);
    return;
  }

  console.log('\n상품:', data.title.substring(0, 50) + '...');
  console.log('\n원본 이미지 개수:', data.detail_images?.length || 0);

  if (data.detail_images && data.detail_images.length > 0) {
    console.log('\n필터 테스트:');
    data.detail_images.forEach((img: string, i: number) => {
      const valid = isValidProductDetailImage(img);
      console.log(`${i + 1}. ${valid ? '✅ 통과' : '❌ 차단'}`);
      console.log(`   ${img}`);
    });

    const filtered = filterProductDetailImages(data.detail_images);
    console.log(`\n필터 후 이미지 개수: ${filtered.length}`);
  }
}

testFilter();
