/**
 * @file scripts/filter-detail-images.ts
 * @description 상품 상세 이미지 필터링 스크립트
 *
 * 사용법: pnpm filter-images
 *
 * 이 스크립트는 모든 상품의 detail_images를 필터링하여
 * 제품 정보와 무관한 이미지(로고, 아이콘, 낮은 해상도 등)를 제거합니다.
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';
import { filterProductDetailImages } from '../lib/utils/image-filter';

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

async function filterAllProductDetailImages() {
  console.log('🔍 상품 상세 이미지 필터링 시작\n');

  try {
    // 모든 상품 조회
    console.log('📦 상품 목록 조회 중...');
    const { data: products, error: fetchError } = await supabase
      .from('products')
      .select('id, title, detail_images');

    if (fetchError) {
      throw new Error(`상품 조회 실패: ${fetchError.message}`);
    }

    if (!products || products.length === 0) {
      console.log('⚠️  조회된 상품이 없습니다.');
      return;
    }

    console.log(`   총 ${products.length}개 상품 발견\n`);

    let totalFiltered = 0;
    let totalRemoved = 0;
    let updatedCount = 0;

    // 각 상품의 detail_images 필터링
    for (const product of products) {
      const originalImages = product.detail_images || [];
      
      if (originalImages.length === 0) {
        continue;
      }

      const filteredImages = filterProductDetailImages(originalImages);
      const removedCount = originalImages.length - filteredImages.length;

      if (removedCount > 0) {
        console.log(`   📦 ${product.title.substring(0, 40)}...`);
        console.log(`      원본: ${originalImages.length}개 → 필터링 후: ${filteredImages.length}개 (${removedCount}개 제거)`);
        
        // 제거된 이미지 URL 출력 (디버깅용)
        const removedImages = originalImages.filter(img => !filteredImages.includes(img));
        if (removedImages.length > 0) {
          console.log(`      제거된 이미지:`);
          removedImages.slice(0, 3).forEach((img, idx) => {
            console.log(`         [${idx + 1}] ${img.substring(0, 80)}...`);
          });
          if (removedImages.length > 3) {
            console.log(`         ... 외 ${removedImages.length - 3}개`);
          }
        }

        // 데이터베이스 업데이트
        const { error: updateError } = await supabase
          .from('products')
          .update({ detail_images: filteredImages })
          .eq('id', product.id);

        if (updateError) {
          console.error(`      ❌ 업데이트 실패: ${updateError.message}`);
        } else {
          updatedCount++;
          totalFiltered += filteredImages.length;
          totalRemoved += removedCount;
        }
        console.log('');
      }
    }

    // 결과 요약
    console.log('\n📊 필터링 결과 요약:');
    console.log(`   - 처리된 상품: ${updatedCount}개`);
    console.log(`   - 유지된 이미지: ${totalFiltered}개`);
    console.log(`   - 제거된 이미지: ${totalRemoved}개`);
    console.log(`   - 제거율: ${totalRemoved > 0 ? ((totalRemoved / (totalFiltered + totalRemoved)) * 100).toFixed(1) : 0}%`);
    console.log('\n✅ 필터링 완료!');

  } catch (error) {
    console.error('\n❌ 필터링 실패:', error);
    process.exit(1);
  }
}

// 실행
filterAllProductDetailImages();

