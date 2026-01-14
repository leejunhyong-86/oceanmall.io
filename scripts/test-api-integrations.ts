/**
 * @file scripts/test-api-integrations.ts
 * @description Instagram 및 YouTube API 통합 테스트 스크립트
 * 
 * 이 스크립트는 환경 변수와 API 연결을 테스트합니다.
 * 
 * 실행 방법:
 * npx tsx scripts/test-api-integrations.ts
 */

// 환경 변수 로드
const dotenv = require('dotenv');
const path = require('path');

// .env.local 파일 로드
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

(async () => {

    console.log('='.repeat(80));
    console.log('Instagram & YouTube API 통합 테스트');
    console.log('='.repeat(80));
    console.log('');

    // ============================================================================
    // 1. 환경 변수 확인
    // ============================================================================
    console.log('📋 1. 환경 변수 확인');
    console.log('-'.repeat(80));

    const envVars = {
        instagram: {
            accountId: process.env.NEXT_PUBLIC_INSTAGRAM_BUSINESS_ACCOUNT_ID,
            accessToken: process.env.INSTAGRAM_ACCESS_TOKEN,
        },
        youtube: {
            channelId: process.env.NEXT_PUBLIC_YOUTUBE_CHANNEL_ID,
            apiKey: process.env.YOUTUBE_API_KEY,
        }
    };

    // Instagram 환경 변수
    console.log('\n🔸 Instagram:');
    console.log(`  NEXT_PUBLIC_INSTAGRAM_BUSINESS_ACCOUNT_ID: ${envVars.instagram.accountId ? '✅ 설정됨' : '❌ 없음'}`);
    if (envVars.instagram.accountId) {
        console.log(`    값: ${envVars.instagram.accountId}`);
    }
    console.log(`  INSTAGRAM_ACCESS_TOKEN: ${envVars.instagram.accessToken ? '✅ 설정됨' : '❌ 없음'}`);
    if (envVars.instagram.accessToken) {
        console.log(`    값: ${envVars.instagram.accessToken.substring(0, 20)}...${envVars.instagram.accessToken.substring(envVars.instagram.accessToken.length - 10)}`);
    }

    // YouTube 환경 변수
    console.log('\n🔸 YouTube:');
    console.log(`  NEXT_PUBLIC_YOUTUBE_CHANNEL_ID: ${envVars.youtube.channelId ? '✅ 설정됨' : '❌ 없음'}`);
    if (envVars.youtube.channelId) {
        console.log(`    값: ${envVars.youtube.channelId}`);
    }
    console.log(`  YOUTUBE_API_KEY: ${envVars.youtube.apiKey ? '✅ 설정됨' : '❌ 없음'}`);
    if (envVars.youtube.apiKey) {
        console.log(`    값: ${envVars.youtube.apiKey.substring(0, 20)}...`);
    }

    console.log('');

    // ============================================================================
    // 2. Instagram API 테스트
    // ============================================================================
    console.log('📋 2. Instagram API 테스트');
    console.log('-'.repeat(80));

    async function testInstagramAPI() {
        if (!envVars.instagram.accountId || !envVars.instagram.accessToken) {
            console.log('❌ Instagram 환경 변수가 설정되지 않았습니다.');
            return;
        }

        try {
            console.log('\n🔸 Instagram Graph API 호출 중...');

            // 방법 1: graph.instagram.com (현재 코드)
            console.log('\n  방법 1: graph.instagram.com (Basic Display API)');
            const url1 = `https://graph.instagram.com/v18.0/${envVars.instagram.accountId}/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp&limit=6&access_token=${envVars.instagram.accessToken}`;

            const response1 = await fetch(url1);
            console.log(`    상태 코드: ${response1.status} ${response1.statusText}`);

            if (response1.ok) {
                const data1 = await response1.json();
                console.log(`    ✅ 성공! ${data1.data?.length || 0}개의 게시물을 가져왔습니다.`);
                if (data1.data && data1.data.length > 0) {
                    console.log(`    첫 번째 게시물: ${data1.data[0].id}`);
                }
            } else {
                const error1 = await response1.json();
                console.log(`    ❌ 실패: ${error1.error?.message || JSON.stringify(error1)}`);

                // 방법 2: graph.facebook.com (Business Account용)
                console.log('\n  방법 2: graph.facebook.com (Business Account용)');
                const url2 = `https://graph.facebook.com/v18.0/${envVars.instagram.accountId}/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp&limit=6&access_token=${envVars.instagram.accessToken}`;

                const response2 = await fetch(url2);
                console.log(`    상태 코드: ${response2.status} ${response2.statusText}`);

                if (response2.ok) {
                    const data2 = await response2.json();
                    console.log(`    ✅ 성공! ${data2.data?.length || 0}개의 게시물을 가져왔습니다.`);
                    if (data2.data && data2.data.length > 0) {
                        console.log(`    첫 번째 게시물: ${data2.data[0].id}`);
                    }
                    console.log('\n    💡 제안: graph.facebook.com을 사용하도록 코드를 수정하세요.');
                } else {
                    const error2 = await response2.json();
                    console.log(`    ❌ 실패: ${error2.error?.message || JSON.stringify(error2)}`);
                }
            }

            // 토큰 정보 확인
            console.log('\n  토큰 정보 확인:');
            const debugUrl = `https://graph.facebook.com/debug_token?input_token=${envVars.instagram.accessToken}&access_token=${envVars.instagram.accessToken}`;
            const debugResponse = await fetch(debugUrl);

            if (debugResponse.ok) {
                const debugData = await debugResponse.json();
                console.log(`    토큰 타입: ${debugData.data?.type || '알 수 없음'}`);
                console.log(`    유효 여부: ${debugData.data?.is_valid ? '✅ 유효' : '❌ 무효'}`);
                if (debugData.data?.expires_at) {
                    const expiresAt = new Date(debugData.data.expires_at * 1000);
                    console.log(`    만료 시간: ${expiresAt.toLocaleString('ko-KR')}`);
                } else {
                    console.log(`    만료 시간: 없음 (장기 토큰)`);
                }
                console.log(`    스코프: ${debugData.data?.scopes?.join(', ') || '없음'}`);
            }
        } catch (error) {
            console.log(`❌ 오류: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    await testInstagramAPI();

    console.log('');

    // ============================================================================
    // 3. YouTube API 테스트
    // ============================================================================
    console.log('📋 3. YouTube API 테스트');
    console.log('-'.repeat(80));

    async function testYouTubeAPI() {
        if (!envVars.youtube.channelId || !envVars.youtube.apiKey) {
            console.log('❌ YouTube 환경 변수가 설정되지 않았습니다.');
            return;
        }

        try {
            console.log('\n🔸 YouTube Data API v3 호출 중...');

            // 1. 채널 정보 가져오기
            console.log('\n  1. 채널 정보 확인:');
            const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${envVars.youtube.channelId}&key=${envVars.youtube.apiKey}`;

            const channelResponse = await fetch(channelUrl);
            console.log(`    상태 코드: ${channelResponse.status} ${channelResponse.statusText}`);

            if (channelResponse.ok) {
                const channelData = await channelResponse.json();
                console.log(`    ✅ 성공! 채널을 찾았습니다.`);

                const uploadsPlaylistId = channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
                if (uploadsPlaylistId) {
                    console.log(`    업로드 재생목록 ID: ${uploadsPlaylistId}`);

                    // 2. 최신 영상 가져오기
                    console.log('\n  2. 최신 영상 가져오기:');
                    const playlistUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=10&key=${envVars.youtube.apiKey}`;

                    const playlistResponse = await fetch(playlistUrl);
                    console.log(`    상태 코드: ${playlistResponse.status} ${playlistResponse.statusText}`);

                    if (playlistResponse.ok) {
                        const playlistData = await playlistResponse.json();
                        console.log(`    ✅ 성공! ${playlistData.items?.length || 0}개의 영상을 가져왔습니다.`);

                        if (playlistData.items && playlistData.items.length > 0) {
                            const videoIds = playlistData.items
                                .map((item: any) => item.snippet?.resourceId?.videoId)
                                .filter((id: string) => !!id)
                                .join(',');

                            // 3. 영상 상세 정보 가져오기
                            console.log('\n  3. 영상 상세 정보 가져오기:');
                            const videosUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${videoIds}&key=${envVars.youtube.apiKey}`;

                            const videosResponse = await fetch(videosUrl);
                            console.log(`    상태 코드: ${videosResponse.status} ${videosResponse.statusText}`);

                            if (videosResponse.ok) {
                                const videosData = await videosResponse.json();
                                console.log(`    ✅ 성공! ${videosData.items?.length || 0}개의 영상 정보를 가져왔습니다.`);

                                // 쇼츠 필터링
                                const shorts = videosData.items?.filter((item: any) => {
                                    const duration = item.contentDetails.duration;
                                    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
                                    if (!match) return false;
                                    const hours = parseInt(match[1] || '0', 10);
                                    const minutes = parseInt(match[2] || '0', 10);
                                    const seconds = parseInt(match[3] || '0', 10);
                                    const totalSeconds = hours * 3600 + minutes * 60 + seconds;
                                    return totalSeconds > 0 && totalSeconds <= 60;
                                });

                                console.log(`    쇼츠 영상: ${shorts?.length || 0}개`);
                                if (shorts && shorts.length > 0) {
                                    console.log(`    첫 번째 쇼츠: ${shorts[0].snippet.title}`);
                                }
                            } else {
                                const error = await videosResponse.json();
                                console.log(`    ❌ 실패: ${error.error?.message || JSON.stringify(error)}`);
                            }
                        }
                    } else {
                        const error = await playlistResponse.json();
                        console.log(`    ❌ 실패: ${error.error?.message || JSON.stringify(error)}`);
                    }
                }
            } else {
                const error = await channelResponse.json();
                console.log(`    ❌ 실패: ${error.error?.message || JSON.stringify(error)}`);

                if (channelResponse.status === 403) {
                    console.log('\n    💡 해결 방법:');
                    console.log('    1. Google Cloud Console (https://console.cloud.google.com) 접속');
                    console.log('    2. 프로젝트 선택');
                    console.log('    3. "API 및 서비스" > "라이브러리" 이동');
                    console.log('    4. "YouTube Data API v3" 검색 및 활성화');
                }
            }
        } catch (error) {
            console.log(`❌ 오류: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    await testYouTubeAPI();

    console.log('');
    console.log('='.repeat(80));
    console.log('테스트 완료');
    console.log('='.repeat(80));
})();

