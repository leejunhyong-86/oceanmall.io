import { createClient } from "@supabase/supabase-js";

/**
 * 공개 데이터용 Supabase 클라이언트 (인증 불필요)
 * 
 * 환경 변수가 없을 때를 대비하여 함수로 제공
 */
export function getPublicSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
    console.error('   NEXT_PUBLIC_SUPABASE_URL과 NEXT_PUBLIC_SUPABASE_ANON_KEY를 .env.local에 설정하세요.');
    throw new Error(
      'Supabase 환경 변수가 설정되지 않았습니다. NEXT_PUBLIC_SUPABASE_URL과 NEXT_PUBLIC_SUPABASE_ANON_KEY를 확인하세요.'
    );
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

// 레거시 호환성을 위한 lazy export (모듈 로드 시 에러 방지)
let _supabaseClient: ReturnType<typeof createClient> | null = null;

export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get(_target, prop) {
    if (!_supabaseClient) {
      try {
        _supabaseClient = getPublicSupabaseClient();
      } catch (error) {
        console.error('Supabase 클라이언트 초기화 실패:', error);
        // 더미 객체 반환하여 앱이 크래시되지 않도록 함
        return () => {
          console.warn('Supabase 환경 변수가 설정되지 않아 사용할 수 없습니다.');
        };
      }
    }
    return (_supabaseClient as any)[prop];
  },
});
