/**
 * @file scripts/reset-lucky-draw-time.ts
 * @description 럭키드로우 이벤트의 남은 시간을 리셋하는 스크립트
 *
 * 활성화된 럭키드로우 이벤트의 end_time을 현재 시간 + 7일로 업데이트합니다.
 *
 * 사용법:
 * pnpm tsx scripts/reset-lucky-draw-time.ts
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

async function resetLuckyDrawTime() {
  console.log(`\n🔧 럭키드로우 이벤트 시간 리셋 시작\n`);

  // 1. 현재 활성화된 이벤트 조회
  const { data: activeEvent, error: fetchError } = await supabase
    .from('lucky_draw_events')
    .select('id, title, end_time, is_active')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (fetchError) {
    if (fetchError.code === 'PGRST116') {
      console.log('⚠️  활성화된 럭키드로우 이벤트가 없습니다.');
      console.log('💡 새 이벤트를 생성하시겠습니까?');
      return;
    }
    console.error('❌ 이벤트 조회 실패:', fetchError);
    return;
  }

  if (!activeEvent) {
    console.log('⚠️  활성화된 럭키드로우 이벤트가 없습니다.');
    return;
  }

  console.log(`📦 현재 활성화된 이벤트:`);
  console.log(`   - 제목: ${activeEvent.title}`);
  console.log(`   - 현재 마감 시간: ${new Date(activeEvent.end_time).toLocaleString('ko-KR')}`);
  console.log(`   - ID: ${activeEvent.id}\n`);

  // 2. end_time을 현재 시간 + 7일로 업데이트
  const newEndTime = new Date();
  newEndTime.setDate(newEndTime.getDate() + 7);

  console.log(`🔄 마감 시간을 리셋합니다...`);
  console.log(`   - 새로운 마감 시간: ${newEndTime.toLocaleString('ko-KR')}\n`);

  const { data: updatedEvent, error: updateError } = await supabase
    .from('lucky_draw_events')
    .update({ end_time: newEndTime.toISOString() })
    .eq('id', activeEvent.id)
    .select('id, title, end_time')
    .single();

  if (updateError) {
    console.error('❌ 업데이트 실패:', updateError);
    return;
  }

  console.log(`✅ 럭키드로우 이벤트 시간이 리셋되었습니다!`);
  console.log(`\n📊 업데이트된 정보:`);
  console.log(`   - 제목: ${updatedEvent.title}`);
  console.log(`   - 새로운 마감 시간: ${new Date(updatedEvent.end_time).toLocaleString('ko-KR')}`);
  console.log(`   - 남은 시간: 약 7일\n`);
}

resetLuckyDrawTime()
  .then(() => {
    console.log('✅ 완료!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  });
