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
  console.log('🔍 Supabase 연결 테스트 시작...\n');

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ 환경 변수가 설정되지 않았습니다.');
    console.error('   .env 파일을 확인하세요.');
    process.exit(1);
  }

  console.log('✅ 환경 변수 확인됨');
  console.log(`   URL: ${supabaseUrl.substring(0, 30)}...`);
  console.log(`   Key: ${supabaseServiceKey.substring(0, 20)}...`);

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // products 테이블 조회 테스트
    const { data, error, count } = await supabase
      .from('products')
      .select('id, title, source_platform', { count: 'exact' })
      .limit(5);

    if (error) {
      console.error('\n❌ 데이터베이스 쿼리 실패:', error.message);
      process.exit(1);
    }

    console.log(`\n✅ 연결 성공! products 테이블에 ${count}개 항목 있음`);
    
    if (data && data.length > 0) {
      console.log('\n📦 최근 항목:');
      data.forEach((item, i) => {
        console.log(`   ${i + 1}. [${item.source_platform}] ${item.title}`);
      });
    }

    // 와디즈 프로젝트 수 확인
    const { count: wadizCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('source_platform', 'wadiz');

    console.log(`\n🎯 와디즈 프로젝트: ${wadizCount || 0}개`);

    console.log('\n✅ 테스트 완료!');

  } catch (err) {
    console.error('\n❌ 연결 오류:', err);
    process.exit(1);
  }
}

testConnection();

