import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function checkProductDetail() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', '5f8e8285-876a-4a0b-a68e-1483c0e4b90b')
    .single();

  console.log('\n=== 상품 상세 정보 ===\n');

  if (error) {
    console.error('오류:', error);
  } else if (data) {
    console.log('ID:', data.id);
    console.log('제목:', data.title);
    console.log('Slug:', data.slug);
    console.log('설명:', data.description?.substring(0, 100) + '...');
    console.log('\n이미지:');
    console.log('  - 썸네일:', data.thumbnail_url);
    console.log('  - 비디오:', data.video_url);
    console.log('  - 상세 이미지:', data.detail_images);
    console.log('\n가격:');
    console.log('  - 원화:', data.price_krw?.toLocaleString() + '원');
    console.log('  - 원가:', data.original_price);
    console.log('  - 통화:', data.currency);
    console.log('\n평점:');
    console.log('  - 평점:', data.external_rating);
    console.log('  - 리뷰 수:', data.external_review_count);
    console.log('\n기타:');
    console.log('  - 플랫폼:', data.source_platform);
    console.log('  - URL:', data.source_url);
    console.log('  - 태그:', data.tags);
    console.log('  - 활성:', data.is_active);
    console.log('  - 추천:', data.is_featured);
    console.log('\n');
  }
}

checkProductDetail();
