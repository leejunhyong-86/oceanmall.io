/**
 * @file src/test-connection.ts
 * @description Supabase 연결 테스트
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 환경 변수가 설정되지 않았습니다.');
  console.error('   .env 파일을 확인하세요.');
  process.exit(1);
}

console.log('🔍 Supabase 연결 테스트 중...\n');
console.log(`📡 URL: ${supabaseUrl}`);

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testConnection() {
  try {
    // products 테이블 쿼리 테스트
    const { data, error } = await supabase
      .from('products')
      .select('id, title, source_platform')
      .eq('source_platform', 'aliexpress')
      .limit(5);

    if (error) {
      console.error('\n❌ 연결 실패:', error.message);
      process.exit(1);
    }

    console.log('\n✅ Supabase 연결 성공!');
    
    if (data && data.length > 0) {
      console.log(`\n📦 기존 AliExpress 상품: ${data.length}개`);
      data.forEach((product, i) => {
        console.log(`   ${i + 1}. ${product.title.substring(0, 50)}...`);
      });
    } else {
      console.log('\n📦 아직 AliExpress 상품이 없습니다.');
    }

    console.log('\n✅ 크롤러를 실행할 준비가 되었습니다!');
    console.log('   실행: pnpm crawl\n');

  } catch (error) {
    console.error('\n❌ 테스트 실패:', error);
    process.exit(1);
  }
}

testConnection();
