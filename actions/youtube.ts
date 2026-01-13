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
    // YouTube API 오류는 이미 youtube-service에서 처리되었으므로
    // 여기서는 조용히 빈 배열 반환
    if (error instanceof Error && error.message.includes('YouTube API')) {
      // 이미 로깅되었으므로 추가 로깅 불필요
    } else {
      console.warn('YouTube Shorts 로드 중 예상치 못한 오류:', error instanceof Error ? error.message : error);
    }
    
    return [];
  }
}
