/**
 * @file src/test-connection.ts
 * @description Supabase 연결 테스트
 *
 * 사용법: pnpm test
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function testConnection() {
  console.log('🔍 Supabase 연결 테스트...\n');

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ 환경 변수가 설정되지 않았습니다.');
    console.error('   .env 파일을 확인하세요.\n');
    process.exit(1);
  }

  console.log(`📡 URL: ${supabaseUrl}`);
  console.log(`🔑 Key: ${supabaseServiceKey.substring(0, 20)}...`);

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // products 테이블 조회 테스트
    const { data, error, count } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('\n❌ 연결 실패:', error.message);
      process.exit(1);
    }

    console.log(`\n✅ 연결 성공!`);
    console.log(`📦 products 테이블: ${count}개 상품\n`);

    // 카테고리 확인
    const { data: categories } = await supabase
      .from('categories')
      .select('name')
      .limit(5);

    if (categories && categories.length > 0) {
      console.log('📂 카테고리 샘플:');
      categories.forEach((cat: { name: string }) => {
        console.log(`   - ${cat.name}`);
      });
    }

    console.log('\n🎉 크롤러를 실행할 준비가 되었습니다!');
    console.log('   실행: pnpm crawl\n');

  } catch (err) {
    console.error('\n❌ 오류 발생:', err);
    process.exit(1);
  }
}

testConnection();

