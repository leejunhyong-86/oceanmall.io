import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function checkImages() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from('products')
    .select('id, title, thumbnail_url, detail_images')
    .eq('id', '311d3724-7f65-4017-8ecc-8f0317e9dcfd')
    .single();

  if (error) {
    console.error('오류:', error);
    return;
  }

  console.log('\n=== 이미지 확인 ===\n');
  console.log('상품:', data.title.substring(0, 50) + '...');
  console.log('\n📸 썸네일:');
  console.log(data.thumbnail_url);
  console.log('\n📷 상세 이미지 개수:', data.detail_images?.length || 0);
  
  if (data.detail_images && data.detail_images.length > 0) {
    console.log('\n처음 5개:');
    data.detail_images.slice(0, 5).forEach((img: string, i: number) => {
      console.log(`${i + 1}. ${img}`);
    });
  }
  console.log('\n');
}

checkImages();
