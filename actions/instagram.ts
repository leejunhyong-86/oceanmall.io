/**
 * @file actions/instagram.ts
 * @description Instagram Graph API를 사용하여 피드 데이터를 가져오는 Server Action
 *
 * Instagram Business 계정의 최신 게시물을 조회합니다.
 * API 설정 방법은 docs/INSTAGRAM_SETUP.md 참조
 *
 * @dependencies
 * - Instagram Graph API v18.0
 * - 환경 변수: NEXT_PUBLIC_INSTAGRAM_BUSINESS_ACCOUNT_ID, INSTAGRAM_ACCESS_TOKEN
 */

'use server';

export interface InstagramPost {
  id: string;
  caption: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  media_url: string;
  thumbnail_url?: string;
  permalink: string;
  timestamp: string;
}

/**
 * Instagram 피드 가져오기
 * 
 * @param limit - 가져올 게시물 수 (기본값: 6)
 * @returns InstagramPost 배열
 * 
 * @example
 * ```typescript
 * const posts = await getInstagramFeed(6);
 * ```
 */
export async function getInstagramFeed(limit: number = 6): Promise<InstagramPost[]> {
  const accountId = process.env.NEXT_PUBLIC_INSTAGRAM_BUSINESS_ACCOUNT_ID;
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;

  // 환경 변수 확인
  if (!accountId || !accessToken) {
    console.warn('Instagram API 환경 변수가 설정되지 않았습니다.');
    console.warn('설정 방법: docs/INSTAGRAM_SETUP.md 참조');
    return [];
  }

  try {
    // Instagram Graph API 호출
    const response = await fetch(
      `https://graph.instagram.com/v18.0/${accountId}/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp&limit=${limit}&access_token=${accessToken}`,
      {
        next: { 
          revalidate: 3600 // 1시간 캐시 (Instagram 게시물은 자주 변경되지 않음)
        }
      }
    );

    if (!response.ok) {
      // 400 에러(Invalid OAuth access token)는 조용히 처리
      if (response.status === 400) {
        console.warn('Instagram API 토큰이 유효하지 않습니다. 토큰을 확인하거나 갱신해주세요.');
        return [];
      }
      // 401, 403 에러도 조용히 처리
      if (response.status === 401 || response.status === 403) {
        console.warn('Instagram API 인증 실패. 토큰을 확인해주세요.');
        return [];
      }
      const errorText = await response.text();
      console.error(`Instagram API 오류 (${response.status}):`, errorText);
      return [];
    }

    const data = await response.json();
    
    // 데이터 검증
    if (!data.data || !Array.isArray(data.data)) {
      console.error('Instagram API 응답 형식이 올바르지 않습니다:', data);
      return [];
    }

    return data.data as InstagramPost[];
  } catch (error) {
    // Instagram API 오류는 이미 처리되었으므로
    // 여기서는 조용히 빈 배열 반환
    if (error instanceof Error && error.message.includes('Instagram API')) {
      // 이미 로깅되었으므로 추가 로깅 불필요
    } else {
      console.warn('Instagram 피드 로드 중 예상치 못한 오류:', error instanceof Error ? error.message : error);
    }
    
    return [];
  }
}

/**
 * Instagram 계정 정보 가져오기 (선택적)
 * 
 * @returns 계정 기본 정보 (username, followers_count 등)
 */
export async function getInstagramAccountInfo() {
  const accountId = process.env.NEXT_PUBLIC_INSTAGRAM_BUSINESS_ACCOUNT_ID;
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;

  if (!accountId || !accessToken) {
    return null;
  }

  try {
    const response = await fetch(
      `https://graph.instagram.com/v18.0/${accountId}?fields=username,name,followers_count,follows_count,media_count,profile_picture_url&access_token=${accessToken}`,
      {
        next: { revalidate: 86400 } // 24시간 캐시 (계정 정보는 자주 변경되지 않음)
      }
    );

    if (!response.ok) {
      // 400, 401, 403 에러는 조용히 처리
      if (response.status === 400 || response.status === 401 || response.status === 403) {
        console.warn('Instagram API 인증 실패.');
        return null;
      }
      console.error(`Instagram API 오류: ${response.status}`);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Instagram 계정 정보 조회 실패:', error);
    return null;
  }
}
