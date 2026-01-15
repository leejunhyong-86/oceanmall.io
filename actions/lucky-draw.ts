'use server';

/**
 * @file actions/lucky-draw.ts
 * @description 럭키드로우 이벤트 관련 Server Actions
 *
 * 럭키드로우 이벤트 조회 및 관리를 위한 서버 액션을 제공합니다.
 * 
 * 주요 기능:
 * 1. 활성화된 럭키드로우 이벤트 조회
 * 2. 이벤트 마감 시간 기반 카운트다운 데이터 제공
 *
 * @dependencies
 * - @/lib/supabase/server: Supabase 서버 클라이언트
 */

import { createClerkSupabaseClient } from '@/lib/supabase/server';
import { getPublicSupabaseClient } from '@/lib/supabase/client';
import type { LuckyDrawEvent } from '@/types';

/**
 * 활성화된 럭키드로우 이벤트 조회
 * 
 * 현재 활성화되어 있고, 마감 시간이 아직 지나지 않은 이벤트를 조회합니다.
 * 가장 최근에 생성된 이벤트 하나를 반환합니다.
 */
export async function getActiveLuckyDrawEvent(): Promise<LuckyDrawEvent | null> {
  // 환경 변수 체크
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('Supabase 환경 변수가 설정되지 않았습니다.');
    return null;
  }

  try {
    // 공개 데이터이므로 인증 불필요한 클라이언트 사용 (정적 렌더링 가능)
    const supabase = getPublicSupabaseClient();

    const { data, error } = await supabase
      .from('lucky_draw_events')
      .select('*')
      .eq('is_active', true)
      .gt('end_time', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      // PGRST116: Row not found - 활성화된 이벤트가 없는 경우
      if (error.code === 'PGRST116') {
        return null;
      }

      console.error('Error fetching lucky draw event:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      return null;
    }

    return data as LuckyDrawEvent;
  } catch (err) {
    console.error('Unexpected error in getActiveLuckyDrawEvent:', {
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

/**
 * 모든 럭키드로우 이벤트 조회 (관리자용)
 */
export async function getAllLuckyDrawEvents(): Promise<LuckyDrawEvent[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('Supabase 환경 변수가 설정되지 않았습니다.');
    return [];
  }

  try {
    const supabase = createClerkSupabaseClient();

    const { data, error } = await supabase
      .from('lucky_draw_events')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching all lucky draw events:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      return [];
    }

    return (data as LuckyDrawEvent[]) || [];
  } catch (err) {
    console.error('Unexpected error in getAllLuckyDrawEvents:', {
      error: err instanceof Error ? err.message : String(err),
    });
    return [];
  }
}
