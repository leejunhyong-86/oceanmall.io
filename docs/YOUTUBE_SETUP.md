# YouTube Data API v3 설정 가이드

YouTube 채널의 쇼츠 영상을 자동으로 가져오기 위한 API 설정 가이드입니다.

## 목차
1. [Google Cloud Console 프로젝트 생성](#1-google-cloud-console-프로젝트-생성)
2. [YouTube Data API v3 활성화](#2-youtube-data-api-v3-활성화)
3. [API 키 생성](#3-api-키-생성)
4. [채널 ID 확인](#4-채널-id-확인)
5. [환경 변수 설정](#5-환경-변수-설정)
6. [API 테스트](#6-api-테스트)

---

## 1. Google Cloud Console 프로젝트 생성

### 1.1 Google Cloud Console 접속

1. [Google Cloud Console](https://console.cloud.google.com) 접속
2. Google 계정으로 로그인 (YouTube 채널과 같은 계정 권장)

### 1.2 프로젝트 생성

1. 상단의 **"프로젝트 선택"** 드롭다운 클릭
2. **"새 프로젝트"** 클릭
3. 프로젝트 정보 입력:
   - **프로젝트 이름**: "해외직구멀티샵" (또는 원하는 이름)
   - **조직**: 선택 사항
   - **위치**: 선택 사항
4. **"만들기"** 클릭
5. 프로젝트 생성 완료까지 1-2분 소요

### 1.3 프로젝트 선택

1. 상단의 **"프로젝트 선택"** 드롭다운 클릭
2. 방금 생성한 프로젝트 선택

---

## 2. YouTube Data API v3 활성화

### 2.1 API 라이브러리 접속

1. 왼쪽 메뉴에서 **"API 및 서비스"** → **"라이브러리"** 클릭
2. 또는 직접 접속: [API 라이브러리](https://console.cloud.google.com/apis/library)

### 2.2 YouTube Data API v3 검색 및 활성화

1. 검색창에 **"YouTube Data API v3"** 입력
2. **"YouTube Data API v3"** 선택
3. **"사용 설정"** 버튼 클릭
4. 활성화 완료까지 몇 초 소요

---

## 3. API 키 생성

### 3.1 사용자 인증 정보 만들기

1. 왼쪽 메뉴에서 **"API 및 서비스"** → **"사용자 인증 정보"** 클릭
2. 상단의 **"+ 사용자 인증 정보 만들기"** 클릭
3. **"API 키"** 선택

### 3.2 API 키 제한 설정 (보안 강화)

**중요**: API 키를 제한하지 않으면 누구나 사용할 수 있어 비용이 발생할 수 있습니다.

1. 생성된 API 키 옆의 **연필 아이콘** 클릭 (편집)
2. **"애플리케이션 제한사항"** 섹션:
   - **"HTTP 리퍼러(웹사이트)"** 선택
   - **"웹사이트 제한사항"**에 다음 추가:
     ```
     localhost:3000/*
     *.vercel.app/*
     yourdomain.com/*
     ```
     (실제 배포 도메인으로 교체)
3. **"API 제한사항"** 섹션:
   - **"키 제한"** 선택
   - **"YouTube Data API v3"**만 선택
4. **"저장"** 클릭

### 3.3 API 키 복사

1. 생성된 API 키를 복사하세요
   - 예: `AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz1234567`
2. ⚠️ **이 키는 나중에 `.env.local`에 저장합니다**

---

## 4. 채널 ID 확인

YouTube 채널 ID를 찾는 방법은 여러 가지가 있습니다.

### 방법 1: YouTube 채널 페이지에서 확인

1. YouTube 채널 페이지 접속
   - 예: `https://www.youtube.com/@oceancialwave`
2. 채널 페이지에서 **"정보"** 탭 클릭
3. **"공유"** 버튼 클릭
4. **"채널 ID 복사"** 선택
   - 예: `UCxxxxxxxxxxxxxxxxxxxxxxxxxx`

### 방법 2: URL에서 확인

채널 URL이 다음과 같은 형식인 경우:
```
https://www.youtube.com/channel/UCxxxxxxxxxxxxxxxxxxxxxxxxxx
```
`UC`로 시작하는 부분이 채널 ID입니다.

### 방법 3: 채널 핸들(@username) 사용

최신 YouTube API는 채널 핸들(@username)도 지원합니다:
- 예: `@oceancialwave`
- 이 경우 채널 ID 대신 핸들을 사용할 수 있습니다

### 방법 4: 온라인 도구 사용

1. [Comment Picker - YouTube Channel ID Finder](https://commentpicker.com/youtube-channel-id.php) 접속
2. 채널 URL 입력
3. 채널 ID 확인

---

## 5. 환경 변수 설정

프로젝트 루트의 `.env.local` 파일에 다음 추가:

```bash
# YouTube Data API v3
YOUTUBE_API_KEY=AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz1234567
NEXT_PUBLIC_YOUTUBE_CHANNEL_ID=UCxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**또는 채널 핸들 사용 시:**

```bash
# YouTube Data API v3
YOUTUBE_API_KEY=AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz1234567
NEXT_PUBLIC_YOUTUBE_CHANNEL_ID=@oceancialwave
```

**주의사항:**
- `YOUTUBE_API_KEY`는 서버 전용이므로 `NEXT_PUBLIC_` 접두사 없음
- `NEXT_PUBLIC_YOUTUBE_CHANNEL_ID`는 클라이언트에서도 사용되므로 접두사 필요
- `.env.local` 파일은 `.gitignore`에 포함되어야 합니다

---

## 6. API 테스트

환경 변수 설정 후 다음 URL로 테스트:

### 6.1 채널 정보 조회 테스트

브라우저 주소창에 입력 (API 키와 채널 ID를 실제 값으로 교체):

```
https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=UCxxxxxxxxxxxxxxxxxxxxxxxxxx&key=AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz1234567
```

**성공 응답:**
```json
{
  "kind": "youtube#channelListResponse",
  "items": [
    {
      "contentDetails": {
        "relatedPlaylists": {
          "uploads": "UUxxxxxxxxxxxxxxxxxxxxxxxxxx"
        }
      }
    }
  ]
}
```

### 6.2 채널 영상 목록 조회 테스트

```
https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=UUxxxxxxxxxxxxxxxxxxxxxxxxxx&maxResults=5&key=AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz1234567
```

**성공 응답:**
```json
{
  "items": [
    {
      "snippet": {
        "title": "영상 제목",
        "description": "영상 설명",
        "thumbnails": { ... }
      }
    }
  ]
}
```

---

## 7. 할당량 및 제한사항

### 7.1 무료 할당량

- **일일 쿼리 단위**: 10,000 단위
- **검색 1회**: 100 단위 소모
- **채널 정보 조회**: 1 단위 소모
- **영상 목록 조회**: 1 단위 소모

**계산 예시:**
- 하루 최대 100회 검색 가능
- 또는 10,000회 채널/영상 정보 조회 가능

### 7.2 Rate Limit

- **초당 요청 제한**: 없음 (할당량 내에서 자유롭게 사용)
- **캐싱 권장**: 1시간 캐시로 불필요한 요청 방지

### 7.3 할당량 초과 시

- API 호출 실패
- 에러 메시지: `Quota exceeded`
- 다음 날 자정(태평양 표준시)에 할당량 리셋

---

## 8. 쇼츠 영상 필터링

YouTube Shorts는 **60초 이하의 세로 영상**입니다.

### 8.1 자동 필터링

구현된 코드에서 자동으로:
1. 채널의 모든 영상 조회
2. 영상 길이 확인 (ISO 8601 duration 파싱)
3. 60초 이하 영상만 필터링
4. 쇼츠만 반환

### 8.2 대안: #shorts 해시태그 검색

또는 `#shorts` 해시태그로 검색:
```
https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=UCxxx&q=%23shorts&type=video&key=API_KEY
```

---

## 9. 문제 해결

### "API 키가 유효하지 않습니다" 오류

**원인**: API 키가 잘못되었거나 제한 설정 문제

**해결:**
1. Google Cloud Console에서 API 키 확인
2. YouTube Data API v3가 활성화되어 있는지 확인
3. API 키 제한 설정 확인 (HTTP 리퍼러 등)

### "할당량을 초과했습니다" 오류

**원인**: 일일 10,000 단위 초과

**해결:**
1. 캐싱 시간 늘리기 (1시간 → 6시간)
2. 요청 빈도 줄이기
3. 다음 날까지 대기

### "채널을 찾을 수 없습니다" 오류

**원인**: 채널 ID가 잘못되었거나 채널이 비공개

**해결:**
1. 채널 ID 다시 확인
2. 채널이 공개되어 있는지 확인
3. 채널 핸들(@username) 사용 시도

### 쇼츠가 하나도 안 나옴

**원인**: 채널에 쇼츠가 없거나 필터링 로직 문제

**해결:**
1. YouTube에서 직접 확인: `https://www.youtube.com/@username/shorts`
2. 필터링 로직 확인 (60초 이하)
3. `#shorts` 해시태그 검색 방법 시도

---

## 10. 보안 권장사항

### 10.1 API 키 보호

- ✅ `.env.local`에 저장 (Git에 커밋하지 않음)
- ✅ API 키 제한 설정 (HTTP 리퍼러, API 제한)
- ❌ 클라이언트 코드에 하드코딩 금지
- ❌ 공개 저장소에 업로드 금지

### 10.2 할당량 모니터링

1. Google Cloud Console → **"API 및 서비스"** → **"할당량"**
2. YouTube Data API v3 선택
3. 일일 사용량 확인

---

## 11. 추가 리소스

- [YouTube Data API v3 공식 문서](https://developers.google.com/youtube/v3)
- [API 참조](https://developers.google.com/youtube/v3/docs)
- [할당량 정보](https://developers.google.com/youtube/v3/getting-started#quota)
- [Google Cloud Console](https://console.cloud.google.com)

---

## 다음 단계

환경 변수 설정이 완료되면 개발 서버를 재시작하세요:

```bash
pnpm dev
```

YouTube Shorts가 홈페이지에 자동으로 표시됩니다! 🎬
