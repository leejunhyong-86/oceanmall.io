/**
 * @file lib/youtube/youtube-service.ts
 * @description YouTube Data API v3 서비스 레이어
 *
 * YouTube 채널의 영상과 쇼츠를 가져오는 기능을 제공합니다.
 * API 설정 방법은 docs/YOUTUBE_SETUP.md 참조
 *
 * @dependencies
 * - YouTube Data API v3
 * - 환경 변수: YOUTUBE_API_KEY, NEXT_PUBLIC_YOUTUBE_CHANNEL_ID
 */

export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnail: {
    default: string;
    medium: string;
    high: string;
    maxres?: string;
  };
  publishedAt: string;
  duration: string; // ISO 8601 format (e.g., "PT1M30S")
  viewCount: string;
  likeCount: string;
  commentCount: string;
}

export interface YouTubeShort extends YouTubeVideo {
  isShort: true;
}

export class YouTubeService {
  private apiKey: string;
  private baseUrl = 'https://www.googleapis.com/youtube/v3';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * 채널의 최신 영상 목록 가져오기
   * 
   * @param channelId - YouTube 채널 ID 또는 핸들 (@username)
   * @param maxResults - 최대 결과 수 (기본값: 50)
   * @returns YouTubeVideo 배열
   */
  async getChannelVideos(channelId: string, maxResults: number = 50): Promise<YouTubeVideo[]> {
    try {
      // 채널 ID가 핸들(@username) 형식인 경우 채널 ID로 변환
      let actualChannelId = channelId;
      if (channelId.startsWith('@')) {
        const channelInfo = await this.getChannelIdFromHandle(channelId);
        if (!channelInfo) {
          throw new Error(`채널을 찾을 수 없습니다: ${channelId}`);
        }
        actualChannelId = channelInfo.id;
      }

      // 1. 채널의 업로드 재생목록 ID 가져오기
      const channelResponse = await fetch(
        `${this.baseUrl}/channels?part=contentDetails&id=${actualChannelId}&key=${this.apiKey}`
      );
      
      if (!channelResponse.ok) {
        // 403 에러(API 비활성화)는 조용히 처리
        if (channelResponse.status === 403) {
          console.warn('YouTube Data API v3가 활성화되지 않았습니다. API를 활성화하려면 Google Cloud Console을 확인하세요.');
          return [];
        }
        const errorData = await channelResponse.json();
        console.error(`YouTube API 오류 (${channelResponse.status}):`, errorData);
        return [];
      }

      const channelData = await channelResponse.json();
      
      if (!channelData.items || channelData.items.length === 0) {
        console.warn('YouTube 채널을 찾을 수 없습니다.');
        return [];
      }

      const uploadsPlaylistId = channelData.items[0]?.contentDetails?.relatedPlaylists?.uploads;

      if (!uploadsPlaylistId) {
        console.warn('YouTube 업로드 재생목록을 찾을 수 없습니다.');
        return [];
      }

      // 2. 재생목록의 영상 목록 가져오기
      const playlistResponse = await fetch(
        `${this.baseUrl}/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=${maxResults}&key=${this.apiKey}`
      );

      if (!playlistResponse.ok) {
        // 403 에러(API 비활성화)는 조용히 처리
        if (playlistResponse.status === 403) {
          console.warn('YouTube Data API v3가 활성화되지 않았습니다.');
          return [];
        }
        const errorData = await playlistResponse.json();
        console.error(`YouTube API 오류 (${playlistResponse.status}):`, errorData);
        return [];
      }

      const playlistData = await playlistResponse.json();
      
      if (!playlistData.items || playlistData.items.length === 0) {
        return [];
      }

      const videoIds = playlistData.items
        .map((item: any) => item.snippet?.resourceId?.videoId)
        .filter((id: string | undefined): id is string => !!id)
        .join(',');

      if (!videoIds) {
        return [];
      }

      // 3. 영상 상세 정보 가져오기
      const videosResponse = await fetch(
        `${this.baseUrl}/videos?part=snippet,contentDetails,statistics&id=${videoIds}&key=${this.apiKey}`
      );

      if (!videosResponse.ok) {
        // 403 에러(API 비활성화)는 조용히 처리
        if (videosResponse.status === 403) {
          console.warn('YouTube Data API v3가 활성화되지 않았습니다.');
          return [];
        }
        const errorData = await videosResponse.json();
        console.error(`YouTube API 오류 (${videosResponse.status}):`, errorData);
        return [];
      }

      const videosData = await videosResponse.json();

      if (!videosData.items) {
        return [];
      }

      return videosData.items.map((item: any) => ({
        id: item.id,
        title: item.snippet.title,
        description: item.snippet.description || '',
        thumbnail: {
          default: item.snippet.thumbnails?.default?.url || '',
          medium: item.snippet.thumbnails?.medium?.url || '',
          high: item.snippet.thumbnails?.high?.url || '',
          maxres: item.snippet.thumbnails?.maxres?.url,
        },
        publishedAt: item.snippet.publishedAt,
        duration: item.contentDetails.duration,
        viewCount: item.statistics.viewCount || '0',
        likeCount: item.statistics.likeCount || '0',
        commentCount: item.statistics.commentCount || '0',
      }));
    } catch (error) {
      // 에러가 이미 처리되었거나 예상치 못한 에러인 경우
      if (error instanceof Error && error.message.includes('YouTube API 오류')) {
        // 이미 로깅되었으므로 추가 로깅 불필요
      } else {
        console.warn('YouTube API 호출 중 예상치 못한 오류:', error instanceof Error ? error.message : error);
      }
      return [];
    }
  }

  /**
   * 채널 핸들(@username)에서 채널 ID 가져오기
   */
  private async getChannelIdFromHandle(handle: string): Promise<{ id: string; title: string } | null> {
    try {
      // 핸들에서 @ 제거
      const handleName = handle.replace('@', '');
      
      const response = await fetch(
        `${this.baseUrl}/channels?part=id,snippet&forHandle=${handleName}&key=${this.apiKey}`
      );

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      
      if (data.items && data.items.length > 0) {
        return {
          id: data.items[0].id,
          title: data.items[0].snippet?.title || '',
        };
      }

      return null;
    } catch (error) {
      console.error('채널 핸들 조회 실패:', error);
      return null;
    }
  }

  /**
   * 쇼츠 영상만 필터링
   * YouTube Shorts는 60초 이하의 세로 영상
   * 
   * @param channelId - YouTube 채널 ID 또는 핸들
   * @param maxResults - 최대 결과 수 (기본값: 50)
   * @returns YouTubeShort 배열
   */
  async getChannelShorts(channelId: string, maxResults: number = 50): Promise<YouTubeShort[]> {
    const videos = await this.getChannelVideos(channelId, maxResults);
    
    return videos
      .filter((video) => this.isShortVideo(video.duration))
      .map((video) => ({ ...video, isShort: true as const }));
  }

  /**
   * ISO 8601 duration을 초로 변환
   * 예: "PT1M30S" → 90
   * 
   * @param duration - ISO 8601 duration 문자열
   * @returns 초 단위 숫자
   */
  private parseDuration(duration: string): number {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;

    const hours = parseInt(match[1] || '0', 10);
    const minutes = parseInt(match[2] || '0', 10);
    const seconds = parseInt(match[3] || '0', 10);

    return hours * 3600 + minutes * 60 + seconds;
  }

  /**
   * 쇼츠 영상 여부 판단 (60초 이하)
   * 
   * @param duration - ISO 8601 duration 문자열
   * @returns 쇼츠 여부
   */
  private isShortVideo(duration: string): boolean {
    const seconds = this.parseDuration(duration);
    return seconds > 0 && seconds <= 60;
  }

  /**
   * 검색으로 쇼츠 찾기 (대안 방법)
   * #Shorts 해시태그로 검색
   * 
   * @param channelId - YouTube 채널 ID 또는 핸들
   * @param maxResults - 최대 결과 수 (기본값: 10)
   * @returns YouTubeShort 배열
   */
  async searchShorts(channelId: string, maxResults: number = 10): Promise<YouTubeShort[]> {
    try {
      // 채널 ID가 핸들인 경우 변환
      let actualChannelId = channelId;
      if (channelId.startsWith('@')) {
        const channelInfo = await this.getChannelIdFromHandle(channelId);
        if (!channelInfo) {
          return [];
        }
        actualChannelId = channelInfo.id;
      }

      // #shorts 해시태그로 검색
      const searchResponse = await fetch(
        `${this.baseUrl}/search?part=snippet&channelId=${actualChannelId}&q=%23shorts&type=video&maxResults=${maxResults}&order=date&key=${this.apiKey}`
      );

      if (!searchResponse.ok) {
        // 403 에러(API 비활성화)는 조용히 처리
        if (searchResponse.status === 403) {
          console.warn('YouTube Data API v3가 활성화되지 않았습니다.');
          return [];
        }
        const errorData = await searchResponse.json();
        console.error(`YouTube API 오류 (${searchResponse.status}):`, errorData);
        return [];
      }

      const searchData = await searchResponse.json();
      
      if (!searchData.items || searchData.items.length === 0) {
        return [];
      }

      const videoIds = searchData.items
        .map((item: any) => item.id?.videoId)
        .filter((id: string | undefined): id is string => !!id)
        .join(',');

      if (!videoIds) {
        return [];
      }

      // 영상 상세 정보 가져오기
      const videosResponse = await fetch(
        `${this.baseUrl}/videos?part=snippet,contentDetails,statistics&id=${videoIds}&key=${this.apiKey}`
      );

      if (!videosResponse.ok) {
        // 403 에러(API 비활성화)는 조용히 처리
        if (videosResponse.status === 403) {
          console.warn('YouTube Data API v3가 활성화되지 않았습니다.');
          return [];
        }
        const errorData = await videosResponse.json();
        console.error(`YouTube API 오류 (${videosResponse.status}):`, errorData);
        return [];
      }

      const videosData = await videosResponse.json();

      if (!videosData.items) {
        return [];
      }

      return videosData.items
        .filter((item: any) => this.isShortVideo(item.contentDetails.duration))
        .map((item: any) => ({
          id: item.id,
          title: item.snippet.title,
          description: item.snippet.description || '',
          thumbnail: {
            default: item.snippet.thumbnails?.default?.url || '',
            medium: item.snippet.thumbnails?.medium?.url || '',
            high: item.snippet.thumbnails?.high?.url || '',
            maxres: item.snippet.thumbnails?.maxres?.url,
          },
          publishedAt: item.snippet.publishedAt,
          duration: item.contentDetails.duration,
          viewCount: item.statistics.viewCount || '0',
          likeCount: item.statistics.likeCount || '0',
          commentCount: item.statistics.commentCount || '0',
          isShort: true as const,
        }));
    } catch (error) {
      console.error('YouTube Shorts 검색 실패:', error);
      return [];
    }
  }
}

// 싱글톤 인스턴스 export
export const youtubeService = new YouTubeService(process.env.YOUTUBE_API_KEY || '');
