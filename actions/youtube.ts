/**
 * @file actions/youtube.ts
 * @description YouTube Shorts를 가져오는 Server Action
 *
 * YouTube Data API v3를 사용하여 채널의 쇼츠 영상을 가져옵니다.
 * API 설정 방법은 docs/YOUTUBE_SETUP.md 참조
 *
 * @dependencies
 * - lib/youtube/youtube-service.ts
 * - 환경 변수: YOUTUBE_API_KEY, NEXT_PUBLIC_YOUTUBE_CHANNEL_ID
 */

'use server';

import { youtubeService } from '@/lib/youtube/youtube-service';
import type { YouTubeShort } from '@/lib/youtube/youtube-service';

/**
 * YouTube Shorts 가져오기
 * 
 * @param maxResults - 가져올 쇼츠 수 (기본값: 10)
 * @returns YouTubeShort 배열
 * 
 * @example
 * ```typescript
 * const shorts = await getYouTubeShorts(12);
 * ```
 */
export async function getYouTubeShorts(maxResults: number = 10): Promise<YouTubeShort[]> {
  const channelId = process.env.NEXT_PUBLIC_YOUTUBE_CHANNEL_ID;
  const apiKey = process.env.YOUTUBE_API_KEY;

  // 환경 변수 확인
  if (!channelId || !apiKey) {
    console.warn('YouTube API 환경 변수가 설정되지 않았습니다.');
    console.warn('설정 방법: docs/YOUTUBE_SETUP.md 참조');
    return [];
  }

  try {
    // 방법 1: 최신 영상에서 쇼츠 필터링 (권장)
    const shorts = await youtubeService.getChannelShorts(channelId, 50);
    
    // 최대 개수만큼만 반환
    return shorts.slice(0, maxResults);
    
    // 방법 2 (대안): #shorts 해시태그로 검색
    // const shorts = await youtubeService.searchShorts(channelId, maxResults);
    // return shorts;
  } catch (error) {
    console.error('YouTube Shorts 로드 실패:', error);
    
    // 에러 상세 정보 로깅
    if (error instanceof Error) {
      console.error('에러 메시지:', error.message);
    }
    
    return [];
  }
}
