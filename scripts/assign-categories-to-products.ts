/**
 * @file scripts/assign-categories-to-products.ts
 * @description 기존 상품들에 카테고리 할당
 *
 * Amazon 카테고리 텍스트나 상품 제목을 기반으로 카테고리를 자동 할당합니다.
 *
 * 사용법:
 * pnpm tsx scripts/assign-categories-to-products.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';

// 환경변수 로드
config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Amazon 카테고리를 데이터베이스 카테고리 ID로 매칭
 */
function findCategoryId(amazonCategory: string, productTitle: string, tags: string[]): string | null {
  const normalizedCategory = (amazonCategory || '').toLowerCase().trim();
  const normalizedTitle = productTitle.toLowerCase();
  const normalizedTags = tags.map(t => t.toLowerCase()).join(' ');

  // 카테고리 매핑
  const categoryMapping: Record<string, string> = {
    'beauty': 'beauty',
    'beauty & personal care': 'beauty',
    'personal care': 'beauty',
    'skincare': 'beauty',
    'makeup': 'beauty',
    'cosmetics': 'beauty',
    'serum': 'beauty',
    'skincare serum': 'beauty',
    'electronics': 'electronics',
    'computers': 'electronics',
    'cell phones': 'electronics',
    'audio': 'electronics',
    'headphones': 'electronics',
    'home & kitchen': 'kitchen',
    'kitchen': 'kitchen',
    'home improvement': 'home',
    'bedding': 'home',
    'mattress': 'home',
    'mattress pad': 'home',
    'home': 'home',
    'sports & outdoors': 'sports',
    'sports': 'sports',
    'outdoors': 'sports',
    'fitness': 'sports',
    'exercise': 'sports',
    'clothing': 'fashion',
    'shoes': 'fashion',
    'fashion': 'fashion',
    'apparel': 'fashion',
    'health & household': 'health',
    'health': 'health',
    'supplements': 'health',
    'vitamins': 'health',
    'probiotics': 'health',
    'digestive supplements': 'health',
    'baby': 'baby',
    'baby products': 'baby',
    'toys': 'baby',
  };

  // 1. Amazon 카테고리로 직접 매칭
  let matchedSlug: string | null = null;
  for (const [amazonCat, dbSlug] of Object.entries(categoryMapping)) {
    if (normalizedCategory.includes(amazonCat) || amazonCat.includes(normalizedCategory)) {
      matchedSlug = dbSlug;
      break;
    }
  }

  // 2. 태그에서 매칭
  if (!matchedSlug) {
    for (const [amazonCat, dbSlug] of Object.entries(categoryMapping)) {
      if (normalizedTags.includes(amazonCat)) {
        matchedSlug = dbSlug;
        break;
      }
    }
  }

  // 3. 제목에서 키워드로 추론 (영어 + 한글 키워드)
  if (!matchedSlug) {
    const titleKeywords: Array<{ keywords: string[]; slug: string }> = [
      // Beauty
      { keywords: ['serum', '세럼', 'skincare', '스킨케어', 'cosmetic', '화장품', 'makeup', '메이크업'], slug: 'beauty' },
      { keywords: ['cream', '크림', 'moisturizer', '보습', 'cleanser', '클렌저'], slug: 'beauty' },
      { keywords: ['toner', '토너', 'essence', '에센스', 'ampoule', '앰플'], slug: 'beauty' },
      { keywords: ['mask', '마스크', 'patch', '패치', 'cosmetic'], slug: 'beauty' },
      
      // Electronics
      { keywords: ['phone', '폰', 'headphone', '헤드폰', 'earbud', '이어폰'], slug: 'electronics' },
      { keywords: ['tablet', '태블릿', 'laptop', '랩톱', 'watch', '워치'], slug: 'electronics' },
      { keywords: ['camera', '카메라', 'computer', '컴퓨터'], slug: 'electronics' },
      
      // Kitchen/Home
      { keywords: ['coffee maker', 'coffee', '커피', '커피메이커', 'keurig'], slug: 'kitchen' },
      { keywords: ['kitchen', '주방', 'cookware', '조리도구'], slug: 'kitchen' },
      
      // Home/Interior
      { keywords: ['mattress', '매트리스', 'bedding', '침구', 'pillow', '베개'], slug: 'home' },
      
      // Sports
      { keywords: ['water bottle', '물병', 'bottle', '보틀', 'sports bottle'], slug: 'sports' },
      { keywords: ['fitness', '피트니스', 'exercise', '운동', 'workout'], slug: 'sports' },
      { keywords: ['gym', '헬스', 'running', '러닝', 'yoga', '요가'], slug: 'sports' },
      
      // Health
      { keywords: ['vitamin', '비타민', 'supplement', '영양제', 'protein', '프로틴'], slug: 'health' },
      { keywords: ['probiotic', '프로바이오틱스', 'prebiotic', '프리바이오틱스'], slug: 'health' },
      { keywords: ['nutrition', '영양', 'diet', '다이어트'], slug: 'health' },
    ];

    // 각 카테고리 그룹의 키워드 중 하나라도 매칭되면 해당 카테고리 할당
    for (const { keywords, slug } of titleKeywords) {
      if (keywords.some(keyword => normalizedTitle.includes(keyword))) {
        matchedSlug = slug;
        break;
      }
    }
  }

  return matchedSlug;
}

async function assignCategories() {
  console.log(`\n🔧 상품 카테고리 할당 시작\n`);

  // 1. 카테고리 목록 조회
  const { data: categories, error: categoriesError } = await supabase
    .from('categories')
    .select('id, slug, name')
    .eq('is_active', true);

  if (categoriesError || !categories) {
    console.error('❌ 카테고리 조회 실패:', categoriesError);
    return;
  }

  const categoryMap = new Map(categories.map(c => [c.slug, c.id]));

  // 2. 카테고리가 없는 상품 조회
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id, title, tags, source_platform')
    .is('category_id', null)
    .order('created_at', { ascending: false });

  if (productsError) {
    console.error('❌ 상품 조회 실패:', productsError);
    return;
  }

  if (!products || products.length === 0) {
    console.log('✅ 카테고리가 할당되지 않은 상품이 없습니다.\n');
    return;
  }

  console.log(`📦 ${products.length}개의 상품에 카테고리 할당 시작\n`);

  let assignedCount = 0;

  for (const product of products) {
    // 태그에서 카테고리 추출 (Amazon 크롤러가 category를 tags에 저장)
    const amazonCategory = product.tags && product.tags.length > 0 ? product.tags[0] : '';
    
    // 카테고리 매칭
    const matchedSlug = findCategoryId(amazonCategory, product.title, product.tags || []);
    
    if (matchedSlug && categoryMap.has(matchedSlug)) {
      const categoryId = categoryMap.get(matchedSlug)!;
      const categoryName = categories.find(c => c.slug === matchedSlug)?.name || matchedSlug;

      const { error: updateError } = await supabase
        .from('products')
        .update({ category_id: categoryId })
        .eq('id', product.id);

      if (updateError) {
        console.error(`   ❌ ${product.title.substring(0, 40)}... - 할당 실패:`, updateError.message);
      } else {
        console.log(`   ✅ ${product.title.substring(0, 40)}... -> ${categoryName}`);
        assignedCount++;
      }
    } else {
      console.log(`   ⚠️  ${product.title.substring(0, 40)}... - 매칭되는 카테고리 없음`);
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`✅ 카테고리 할당 완료!`);
  console.log(`   📊 총 ${products.length}개 중 ${assignedCount}개 할당됨\n`);
}

assignCategories()
  .then(() => {
    console.log('✅ 완료!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  });
