/**
 * @file scripts/check-recent-products.ts
 * @description 최근 크롤링된 상품 확인 스크립트
 */

import { getServiceRoleClient } from '@/lib/supabase/service-role';
import { config } from 'dotenv';
import { resolve } from 'path';

// .env.local 파일 로드
config({ path: resolve(process.cwd(), '.env.local') });

async function checkRecentProducts() {
  console.log('🔍 최근 크롤링된 상품 확인\n');

  try {
    const supabase = getServiceRoleClient();

    // 최근 5개 상품 조회
    const { data: products, error } = await supabase
      .from('products')
      .select('id, title, slug, detail_images, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      throw new Error(`상품 조회 실패: ${error.message}`);
    }

    if (!products || products.length === 0) {
      console.log('⚠️  조회된 상품이 없습니다.');
      return;
    }

    console.log(`📦 최근 ${products.length}개 상품:\n`);

    products.forEach((product, idx) => {
      console.log(`[${idx + 1}] ${product.title.substring(0, 60)}...`);
      console.log(`    Slug: ${product.slug}`);
      console.log(`    상세 이미지: ${product.detail_images?.length || 0}개`);
      console.log(`    URL: http://localhost:3000/products/${product.slug}`);
      console.log('');
    });

    // detail_images가 있는 상품만 필터링
    const productsWithDetailImages = products.filter(
      p => p.detail_images && p.detail_images.length > 0
    );

    if (productsWithDetailImages.length > 0) {
      console.log(`\n✅ detail_images가 있는 상품: ${productsWithDetailImages.length}개`);
      console.log(`\n🌐 확인할 URL:`);
      productsWithDetailImages.forEach((product, idx) => {
        console.log(`   [${idx + 1}] http://localhost:3000/products/${product.slug}`);
      });
    } else {
      console.log('\n⚠️  detail_images가 있는 상품이 없습니다.');
    }

  } catch (error) {
    console.error('\n❌ 오류:', error);
    process.exit(1);
  }
}

checkRecentProducts();

