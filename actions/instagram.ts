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
      const errorText = await response.text();
      throw new Error(`Instagram API 오류 (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    
    // 데이터 검증
    if (!data.data || !Array.isArray(data.data)) {
      console.error('Instagram API 응답 형식이 올바르지 않습니다:', data);
      return [];
    }

    return data.data as InstagramPost[];
  } catch (error) {
    console.error('Instagram 피드 로드 실패:', error);
    
    // 에러 상세 정보 로깅
    if (error instanceof Error) {
      console.error('에러 메시지:', error.message);
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
      throw new Error(`Instagram API 오류: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Instagram 계정 정보 조회 실패:', error);
    return null;
  }
}
