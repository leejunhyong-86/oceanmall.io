// 간단한 YouTube API 테스트
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const channelId = process.env.NEXT_PUBLIC_YOUTUBE_CHANNEL_ID;
const apiKey = process.env.YOUTUBE_API_KEY;

console.log('YouTube API 테스트');
console.log('='.repeat(50));
console.log(`채널 ID: ${channelId ? '✅ 설정됨' : '❌ 없음'}`);
console.log(`API 키: ${apiKey ? '✅ 설정됨' : '❌ 없음'}`);

if (!channelId || !apiKey) {
    console.log('\n❌ 환경 변수가 설정되지 않았습니다.');
    process.exit(1);
}

(async () => {
    try {
        const url = `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${apiKey}`;
        console.log(`\nAPI 호출 중...`);

        const response = await fetch(url);
        console.log(`상태 코드: ${response.status} ${response.statusText}`);

        if (response.ok) {
            const data = await response.json();
            console.log('✅ 성공!');
            console.log(`채널 찾음: ${data.items?.length || 0}개`);
            if (data.items && data.items.length > 0) {
                const uploadsId = data.items[0]?.contentDetails?.relatedPlaylists?.uploads;
                console.log(`업로드 재생목록 ID: ${uploadsId}`);
            }
        } else {
            const error = await response.json();
            console.log('❌ 실패!');
            console.log('에러:', JSON.stringify(error, null, 2));

            if (response.status === 403) {
                console.log('\n💡 해결 방법:');
                console.log('1. Google Cloud Console에서 YouTube Data API v3가 활성화되었는지 확인');
                console.log('2. API 키의 "API 제한사항"에서 YouTube Data API v3가 허용되었는지 확인');
                console.log('3. 설정 변경 후 5-10분 정도 기다려 보세요');
            }
        }
    } catch (error) {
        console.log('❌ 오류:', error.message);
    }
})();
