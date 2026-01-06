/**
 * @file scripts/assign-categories.ts
 * @description 크롤링된 상품에 카테고리를 할당하는 스크립트
 * 
 * 사용법: pnpm assign-categories
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

// .env.local 파일 로드
config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 환경 변수가 설정되지 않았습니다.');
  console.error('   NEXT_PUBLIC_SUPABASE_URL과 SUPABASE_SERVICE_ROLE_KEY를 .env.local에 설정하세요.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 카테고리 데이터
const categories = [
  { id: '11111111-1111-1111-1111-111111111101', name: '전자기기', slug: 'electronics', description: '스마트폰, 태블릿, 이어폰, 스마트워치 등', image_url: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400', sort_order: 1 },
  { id: '11111111-1111-1111-1111-111111111102', name: '뷰티', slug: 'beauty', description: '스킨케어, 메이크업, 헤어케어, 향수 등', image_url: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400', sort_order: 2 },
  { id: '11111111-1111-1111-1111-111111111103', name: '패션', slug: 'fashion', description: '의류, 신발, 가방, 액세서리 등', image_url: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400', sort_order: 3 },
  { id: '11111111-1111-1111-1111-111111111104', name: '건강식품', slug: 'health', description: '비타민, 영양제, 프로틴, 다이어트 식품 등', image_url: 'https://images.unsplash.com/photo-1505576399279-565b52d4ac71?w=400', sort_order: 4 },
  { id: '11111111-1111-1111-1111-111111111105', name: '주방용품', slug: 'kitchen', description: '조리도구, 식기, 수납용품, 소형가전 등', image_url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400', sort_order: 5 },
  { id: '11111111-1111-1111-1111-111111111106', name: '스포츠', slug: 'sports', description: '운동기구, 스포츠웨어, 아웃도어 용품 등', image_url: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400', sort_order: 6 },
  { id: '11111111-1111-1111-1111-111111111107', name: '유아용품', slug: 'baby', description: '유아의류, 장난감, 유모차, 육아용품 등', image_url: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400', sort_order: 7 },
  { id: '11111111-1111-1111-1111-111111111108', name: '홈인테리어', slug: 'home', description: '가구, 조명, 수납, 인테리어 소품 등', image_url: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=400', sort_order: 8 },
];

async function assignCategories() {
  console.log('📋 카테고리 할당 시작...\n');

  try {
    // 1. 기존 카테고리 확인
    console.log('1️⃣ 기존 카테고리 확인 중...');
    const { data: existingCategories, error: categoryCheckError } = await supabase
      .from('categories')
      .select('*');

    if (categoryCheckError) {
      throw new Error(`카테고리 조회 실패: ${categoryCheckError.message}`);
    }

    // 2. 카테고리가 없으면 생성
    if (!existingCategories || existingCategories.length === 0) {
      console.log('   📦 카테고리가 없습니다. 카테고리를 생성합니다...');
      const { error: insertError } = await supabase
        .from('categories')
        .insert(categories);
      
      if (insertError) {
        throw new Error(`카테고리 생성 실패: ${insertError.message}`);
      }
      console.log(`   ✅ ${categories.length}개 카테고리 생성 완료\n`);
    } else {
      console.log(`   ✅ ${existingCategories.length}개 카테고리 존재\n`);
    }

    // 3. 상품 조회
    console.log('2️⃣ 상품 조회 중...');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, title, tags, source_platform, category_id')
      .is('category_id', null);

    if (productsError) {
      throw new Error(`상품 조회 실패: ${productsError.message}`);
    }

    if (!products || products.length === 0) {
      console.log('   ℹ️ 카테고리가 할당되지 않은 상품이 없습니다.');
      return;
    }

    console.log(`   📦 ${products.length}개 상품이 카테고리 미할당 상태\n`);

    // 4. 카테고리 매핑 (키워드 기반 - 확장된 키워드)
    const categoryKeywords = {
      '11111111-1111-1111-1111-111111111101': ['electronics', 'phone', 'tablet', 'watch', 'earbuds', 'headphone', 'laptop', 'computer', 'camera'],
      '11111111-1111-1111-1111-111111111102': [
        // 영어 키워드
        'beauty', 'skin', 'makeup', 'cosmetic', 'lotion', 'cream', 'serum', 'mask', 'cleanser', 
        'moisturizer', 'moisturis', 'shampoo', 'hair', 'nail', 'eye', 'lip', 'face', 'deodorant', 
        'body wash', 'soap', 'toner', 'sunscreen', 'patch', 'pore', 'pads', 'towel', 'wipe', 
        'cotton', 'hydrat', 'exfoliat', 'anti-aging', 'wrinkle', 'brightening', 'whitening',
        'mascara', 'eyebrow', 'foundation', 'concealer', 'blush', 'lipstick', 'gloss',
        'essence', 'ampoule', 'emulsion', 'gel', 'balm', 'oil', 'mist', 'spray',
        'acne', 'pimple', 'blemish', 'blackhead', 'whitehead', 'spot',
        'collagen', 'hyaluronic', 'niacinamide', 'retinol', 'vitamin', 'glycolic', 'salicylic',
        'peeling', 'scrub', 'polish',
        // 한글 키워드
        '비누', '손', '로션', '크림', '세럼', '마스크', '클렌저', '토너', '에센스', '앰플', '팩',
        '패치', '모공', '각질', '수분', '보습', '화장', '메이크업', '립', '아이', '페이스', '스킨',
        '샴푸', '헤어', '머리', '네일', '손톱', '바디', '워시', '비누', '데오도란트', '향수',
        '물티슈', '화장솜', '면봉', '타월', '수건',
        '여드름', '뾰루지', '블랙헤드', '화이트헤드',
        '콜라겐', '히알루론산', '나이아신아미드', '레티놀', '비타민',
        '필링', '각질제거', '스크럽',
        '마스카라', '눈썹', '파운데이션', '컨실러', '블러셔', '립스틱',
        // 브랜드
        'cerave', 'neutrogena', 'ordinary', 'paula', 'panoxyl', 'medicube', 'biodance',
        'vanicream', 'la roche', 'eos', 'native', 'method', 'melaxin', 'grace stella',
        'maybelline', 'essence', 'e.l.f', 'mighty patch', 'hero cosmetics', 'clean skin club',
        'mrs. meyer', 'nizoral', '미즈', '니조랄'
      ],
      '11111111-1111-1111-1111-111111111103': ['fashion', 'clothing', 'shoes', 'bag', 'accessory', 'wear', 'jacket', 'pants', 'shirt'],
      '11111111-1111-1111-1111-111111111104': ['health', 'vitamin', 'supplement', 'protein', 'nutrition', 'diet'],
      '11111111-1111-1111-1111-111111111105': ['kitchen', 'cooking', 'cookware', 'utensil', 'dish', 'plate', 'pot', 'pan', 'foaming'],
      '11111111-1111-1111-1111-111111111106': ['sports', 'fitness', 'exercise', 'workout', 'gym', 'running', 'yoga'],
      '11111111-1111-1111-1111-111111111107': ['baby', 'infant', 'toddler', 'kid', 'children', 'toy', 'basics'],
      '11111111-1111-1111-1111-111111111108': ['home', 'furniture', 'decor', 'interior', 'lighting', 'storage'],
    };

    // 5. 각 상품에 카테고리 할당
    console.log('3️⃣ 카테고리 할당 중...');
    let assignedCount = 0;

    for (const product of products) {
      const titleLower = product.title.toLowerCase();
      const tagsLower = product.tags?.join(' ').toLowerCase() || '';
      const searchText = `${titleLower} ${tagsLower}`;

      let assignedCategoryId: string | null = null;

      // 키워드 매칭으로 카테고리 결정
      for (const [categoryId, keywords] of Object.entries(categoryKeywords)) {
        if (keywords.some(keyword => searchText.includes(keyword))) {
          assignedCategoryId = categoryId;
          break;
        }
      }

      // 카테고리를 찾았으면 업데이트
      if (assignedCategoryId) {
        const { error: updateError } = await supabase
          .from('products')
          .update({ category_id: assignedCategoryId })
          .eq('id', product.id);

        if (updateError) {
          console.error(`   ⚠️ 상품 업데이트 실패 (${product.title.substring(0, 30)}...): ${updateError.message}`);
        } else {
          assignedCount++;
          const categoryName = categories.find(c => c.id === assignedCategoryId)?.name || '알 수 없음';
          console.log(`   ✅ "${product.title.substring(0, 40)}..." → ${categoryName}`);
        }
      } else {
        console.log(`   ⚠️ 카테고리를 찾을 수 없음: "${product.title.substring(0, 40)}..."`);
      }
    }

    // 6. 결과 확인
    console.log('\n4️⃣ 결과 확인 중...');
    const { data: finalProducts } = await supabase
      .from('products')
      .select('category_id');

    const withCategory = finalProducts?.filter(p => p.category_id !== null).length || 0;
    const withoutCategory = finalProducts?.filter(p => p.category_id === null).length || 0;

    console.log('\n📊 최종 결과:');
    console.log(`   - 전체 상품: ${finalProducts?.length || 0}개`);
    console.log(`   - 카테고리 할당 완료: ${withCategory}개`);
    console.log(`   - 카테고리 미할당: ${withoutCategory}개`);
    console.log(`   - 이번 작업에서 할당: ${assignedCount}개`);

    console.log('\n✅ 카테고리 할당 완료!');

  } catch (error) {
    console.error('\n❌ 카테고리 할당 실패:', error);
    process.exit(1);
  }
}

// 실행
assignCategories();

