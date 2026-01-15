/**
 * @file scripts/update-mattress-category.ts
 * @description 매트리스 관련 상품의 카테고리를 홈인테리어로 변경
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

async function updateMattressCategory() {
  console.log(`\n🔧 매트리스 상품 카테고리 변경 시작\n`);

  // 1. 홈인테리어 카테고리 ID 조회
  const { data: homeCategory, error: categoryError } = await supabase
    .from('categories')
    .select('id, name')
    .eq('slug', 'home')
    .single();

  if (categoryError || !homeCategory) {
    console.error('❌ 홈인테리어 카테고리를 찾을 수 없습니다:', categoryError);
    return;
  }

  console.log(`✅ 홈인테리어 카테고리 찾음: ${homeCategory.name} (${homeCategory.id})\n`);

  // 2. 매트리스 관련 상품 조회 (제목에 mattress, 매트리스, bedding, 침구 포함)
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id, title, category_id')
    .or('title.ilike.%mattress%,title.ilike.%매트리스%,title.ilike.%bedding%,title.ilike.%침구%,title.ilike.%pillow%,title.ilike.%베개%');

  if (productsError) {
    console.error('❌ 상품 조회 실패:', productsError);
    return;
  }

  if (!products || products.length === 0) {
    console.log('✅ 매트리스 관련 상품이 없습니다.\n');
    return;
  }

  console.log(`📦 ${products.length}개의 매트리스 관련 상품을 찾았습니다.\n`);

  let updatedCount = 0;

  for (const product of products) {
    // 이미 홈인테리어 카테고리인 경우 건너뛰기
    if (product.category_id === homeCategory.id) {
      console.log(`   ⏭️  ${product.title.substring(0, 40)}... - 이미 홈인테리어`);
      continue;
    }

    console.log(`📝 변경: ${product.title.substring(0, 50)}...`);

    const { error: updateError } = await supabase
      .from('products')
      .update({ category_id: homeCategory.id })
      .eq('id', product.id);

    if (updateError) {
      console.error(`   ❌ 변경 실패:`, updateError.message);
    } else {
      console.log(`   ✅ 홈인테리어로 변경 완료`);
      updatedCount++;
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`✅ 카테고리 변경 완료!`);
  console.log(`   📊 총 ${products.length}개 중 ${updatedCount}개 변경됨\n`);
}

updateMattressCategory()
  .then(() => {
    console.log('✅ 완료!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  });
