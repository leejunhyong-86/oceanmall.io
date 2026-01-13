# Instagram Graph API 설정 가이드

Instagram 피드를 웹사이트에 표시하기 위한 API 설정 가이드입니다.

## 목차
1. [Instagram Business 계정 전환](#1-instagram-business-계정-전환)
2. [Meta Developer 앱 생성](#2-meta-developer-앱-생성)
3. [Instagram Graph API 설정](#3-instagram-graph-api-설정)
4. [Access Token 발급](#4-access-token-발급)
5. [Long-lived Token으로 교환](#5-long-lived-token으로-교환)
6. [Instagram Business Account ID 조회](#6-instagram-business-account-id-조회)
7. [환경 변수 설정](#7-환경-변수-설정)

---

## 1. Instagram Business 계정 전환

Instagram Graph API를 사용하려면 반드시 **Business 계정**이어야 합니다.

### 1.1 Instagram 앱에서 전환

1. Instagram 앱 열기
2. **프로필** 탭 이동
3. 우측 상단 **메뉴(☰)** 클릭
4. **설정 및 개인정보 보호** 선택
5. **계정 유형 및 도구** 선택
6. **프로페셔널 계정으로 전환** 선택
7. **비즈니스** 선택 (크리에이터 아님)
8. 카테고리 선택 (예: 쇼핑 및 소매)
9. 완료

### 1.2 Facebook 페이지 생성 및 연결

Instagram Business 계정은 Facebook 페이지와 연결되어야 합니다.

1. [Facebook 페이지 만들기](https://www.facebook.com/pages/create) 접속
2. 페이지 이름 입력: "해외직구멀티샵" (또는 원하는 이름)
3. 카테고리 선택: "쇼핑 및 소매"
4. 페이지 생성 완료

5. Instagram에서 Facebook 페이지 연결:
   - Instagram 앱 → 설정 → 계정
   - "Facebook 페이지 링크" 선택
   - 생성한 Facebook 페이지 선택

---

## 2. Meta Developer 앱 생성

### 2.1 Meta Developer 가입

1. [Meta for Developers](https://developers.facebook.com) 접속
2. Facebook 계정으로 로그인
3. 우측 상단 **시작하기** 클릭
4. 개발자 등록 완료

### 2.2 앱 만들기

1. 상단 **내 앱** 클릭
2. **앱 만들기** 버튼 클릭
3. 앱 유형 선택: **비즈니스** (또는 "기타")
4. 앱 표시 이름: "해외직구멀티샵 웹사이트" (원하는 이름)
5. 앱 연락처 이메일 입력
6. 비즈니스 포트폴리오 선택 (없으면 건너뛰기)
7. **앱 만들기** 클릭

---

## 3. Instagram Graph API 설정

### 3.1 제품 추가 (Instagram Graph API 활성화)

**"제품 추가" 버튼 찾는 방법:**

**방법 1: 대시보드 메인 화면**
1. 앱 대시보드 메인 화면 상단 또는 중앙에 **"제품 추가"** 또는 **"Add Product"** 버튼이 있습니다
2. 클릭하면 제품 목록이 나타납니다

**방법 2: 왼쪽 사이드바**
1. 왼쪽 사이드바에서 **"이용 사례"** (Use Cases) 클릭
2. **"Instagram에서 메시지 및 콘텐츠 관리"** 항목 찾기
3. 이미 체크되어 있다면 → Instagram Graph API가 이미 추가된 것입니다! (4단계로 건너뛰기)
4. 체크되어 있지 않다면 → 클릭하여 활성화

**방법 3: 직접 검색**
1. 대시보드 상단 검색창에 **"Instagram Graph API"** 입력
2. 검색 결과에서 선택

### 3.2 Instagram Graph API 설정 완료 확인

**이미 Instagram Graph API가 추가되어 있는 경우:**
- 대시보드의 "이용 사례" 섹션에서 Instagram 관련 항목이 체크되어 있으면 완료입니다
- 바로 **4단계: Access Token 발급**으로 넘어가세요

**아직 추가되지 않은 경우:**
1. "제품 추가" 버튼 클릭
2. **"Instagram Graph API"** 검색 및 선택
3. **"설정"** 또는 **"시작하기"** 버튼 클릭
4. 단계별 가이드 따라하기

---

### 3.3 ⚠️ 오류 해결: "개발자 역할 권한 부족"

**오류 메시지:**
```
개발자 역할 권한 부족: 개발자 역할 권한이 부족합니다
```

**의미**: Instagram 계정을 앱에 연결하려면 해당 계정이 앱의 "개발자" 또는 "테스터" 역할이어야 합니다.

**해결 방법:**

#### 방법 1: 앱 역할에서 자신 추가 (가장 쉬움)

1. **Meta Developer 대시보드로 돌아가기**
   - 팝업 창은 닫아도 됩니다

2. **왼쪽 사이드바에서 "앱 역할" 클릭**
   - 또는 URL: `developers.facebook.com/apps/앱ID/roles/`

3. **"역할 추가" 또는 "Add People" 버튼 클릭**

4. **자신의 Facebook 계정 추가**
   - 이메일 주소 입력 (Facebook 로그인에 사용하는 이메일)
   - 역할 선택: **"개발자"** 또는 **"관리자"**
   - **"추가"** 클릭

5. **이메일 확인**
   - 추가한 이메일로 초대 메일이 옵니다
   - 메일의 **"수락"** 버튼 클릭

6. **다시 Instagram 계정 연결 시도**
   - Instagram API 설정 페이지로 돌아가기
   - **"계정 추가"** 버튼 다시 클릭

#### 방법 2: Instagram 테스터로 추가

1. **Meta Developer 대시보드 → 앱 역할**

2. **"Instagram 테스터" 섹션 찾기**

3. **Instagram 계정 추가**
   - Instagram 사용자명 입력 (예: `oceancialwave`)
   - **"추가"** 클릭

4. **Instagram 앱에서 승인**
   - Instagram 앱을 열면 알림이 옵니다
   - **"승인"** 또는 **"Accept"** 클릭

5. **다시 계정 연결 시도**

#### 방법 3: 앱 관리자 확인

1. **Meta Developer 대시보드 → 앱 역할**

2. **"관리자" 목록 확인**
   - 자신의 계정이 관리자로 있는지 확인
   - 없다면 방법 1로 추가

3. **Facebook 로그아웃 후 다시 로그인**
   - 브라우저에서 Facebook 로그아웃
   - 다시 로그인
   - Meta Developer 대시보드 접속

---

**여전히 오류가 발생하면:**

1. **브라우저 캐시 삭제**
   - Ctrl + Shift + Delete → 캐시 삭제

2. **시크릿 모드에서 시도**
   - Ctrl + Shift + N (Chrome) 또는 Ctrl + Shift + P (Firefox)

3. **다른 브라우저에서 시도**
   - Chrome, Edge, Firefox 등

4. **Instagram 계정이 Business 계정인지 확인**
   - Instagram 앱 → 설정 → 계정 → 계정 유형
   - "비즈니스" 또는 "프로페셔널"이어야 합니다

---

**성공하면:**
- Instagram 계정이 성공적으로 연결됩니다
- 다음 단계로 진행하세요

---

## 4. Access Token 발급 (비밀번호 받기)

**쉽게 설명**: Access Token은 Instagram API를 사용하기 위한 "비밀번호"입니다.  
하지만 이 비밀번호는 **1시간만 유효**하므로, 나중에 **60일 유효한 장기 비밀번호**로 바꿔야 합니다.

### 4.1 Graph API Explorer에서 토큰 받기

**단계별 설명:**

1. **[Graph API Explorer](https://developers.facebook.com/tools/explorer) 접속**
   - 새 탭을 열어서 접속하세요

2. **앱 선택**
   - 상단의 **"Meta 앱"** 드롭다운 클릭
   - **"oceanmall"** (또는 만든 앱 이름) 선택

3. **"User Token 생성" 버튼 클릭**
   - 오른쪽에 있는 파란색 버튼입니다

4. **권한 선택**
   - 검색창에 `pages` 입력
   - 다음 권한들을 체크:
     - ✅ `pages_show_list` (Facebook 페이지 목록 보기)
     - ✅ `pages_read_engagement` (Instagram 데이터 읽기)
   - 다른 권한은 선택하지 않아도 됩니다

5. **"토큰 생성" 클릭**
   - Facebook 로그인 창이 뜹니다
   - 로그인하고 권한 승인

6. **토큰 복사**
   - Graph API Explorer 상단에 긴 문자열이 나타납니다
   - 예: `EAAGm0...` (매우 긴 문자열)
   - **이 전체 문자열을 복사**하세요
   - ⚠️ **이 토큰은 1시간 후 만료됩니다!**

---

## 5. Long-lived Token으로 교환 (60일 유효한 비밀번호로 바꾸기)

**쉽게 설명**: 1시간짜리 토큰은 너무 짧으니, 60일 동안 쓸 수 있는 토큰으로 바꿔야 합니다.

### 5.1 앱 정보 확인 (앱 ID와 비밀번호 찾기)

1. **Meta Developer 대시보드로 돌아가기**
   - `developers.facebook.com/apps/...` 페이지

2. **왼쪽 사이드바에서 "설정" 클릭**
   - 그 다음 **"기본 설정"** 클릭

3. **앱 ID 복사**
   - "앱 ID" 항목에 숫자가 있습니다 (예: `748556824482320`)
   - 이 숫자를 복사하세요

4. **앱 시크릿 코드 복사**
   - "앱 시크릿 코드" 항목 찾기
   - **"표시"** 버튼 클릭 (비밀번호 입력 필요할 수 있음)
   - 나타난 긴 문자열 복사 (예: `a1b2c3d4e5f6...`)

### 5.2 장기 토큰으로 교환하기

**방법 1: 브라우저 주소창 사용 (가장 쉬움)**

1. 브라우저 주소창에 아래 URL을 입력하세요
2. **중괄호 안의 값들을 실제 값으로 바꾸세요**:
   ```
   https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=748556824482320&client_secret=9e21b580d22256c9d0a62187b9ecb71f&fb_exchange_token=EAAKozveeEhABQXwa3sCOlTyxCW8EEiiNaZAJv4cPHLWN2dR0zHrRZAS7VszE7dNoetsfyFTCbToPMEcgZApTNpbuwkuJJxRT61b79hlwFS7iHln0ZBTP3HDcpXNqvXzEh0S2aRc9cFJI5l2lXjEZB6ISxm48DvBnA3hBX5bOZC7Kym4AyBPUfF0a96l8BZC1tH8KeJdlGZBbhya2BZAOZAZACCc0u8EZCFZBJaclfIrhZCq9DbJyKpPInQ5cOL7gPnlfZALxDWNBwwCjlXTQCZCjIGFzGAeGjec1
   ```

3. **실제 예시** (값은 실제 값으로 바꾸세요):
   ```
   https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=748556824482320&client_secret=a1b2c3d4e5f6&fb_exchange_token=EAAGm0...1시간토큰전체...
   ```

4. **Enter 키 누르기**
   - 브라우저에 JSON 응답이 나타납니다:
   ```json
   {
     "access_token": "EAAG...새로운_긴_토큰...",
     "token_type": "bearer",
     "expires_in": 5183944
   }
   ```

5. **새로운 토큰 복사**
   - `"access_token"` 뒤의 긴 문자열을 복사하세요
   - ⭐ **이 토큰이 60일 유효한 최종 토큰입니다!**

**방법 2: 터미널 사용 (선택적)**

PowerShell이나 터미널에서:
```bash
curl "https://graph.facebook.com/v18.0/oauth/EAAKozveeEhABQUnJPgGAxk34QZAXadCAs2MPHZBDIH646dQqlQJvUlC5qMKaFLsZBz0uZB2YFuX7qv8MGzU4A7lgFelgEJLx2EJIgTcqUvmNVhgCawxBhPJFG7ylKUKJtcYri28SUVgOTLz6MRtGqULad6HEpE6SrdVriyj8a7kLwZC8XbR2VHBc3Vrt1SbGS?grant_type=fb_exchange_token&client_id=앱ID&client_secret=앱시크릿&fb_exchange_token=1시간토큰"
```

---

### 💡 요약

1. **1시간 토큰 받기**: Graph API Explorer에서 받기
2. **앱 ID와 시크릿 찾기**: Meta 대시보드 → 설정 → 기본 설정
3. **60일 토큰으로 교환**: 브라우저 주소창에 URL 입력 (값만 바꿔서)
4. **새 토큰 복사**: JSON 응답에서 `access_token` 값 복사

**이제 이 60일 토큰을 `.env.local` 파일에 저장하면 됩니다!** (다음 단계 참조)

---

## 6. Instagram Business Account ID 조회

### 6.1 Facebook Page ID 조회

```bash
# 형식
https://graph.facebook.com/v18.0/me/accounts?access_token={EAAKozveeEhABQUnJPgGAxk34QZAXadCAs2MPHZBDIH646dQqlQJvUlC5qMKaFLsZBz0uZB2YFuX7qv8MGzU4A7lgFelgEJLx2EJIgTcqUvmNVhgCawxBhPJFG7ylKUKJtcYri28SUVgOTLz6MRtGqULad6HEpE6SrdVriyj8a7kLwZC8XbR2VHBc3Vrt1SbGS}

# 실제 예시
https://graph.facebook.com/v18.0/me/accounts?access_token=EAAG...
```

**응답 예시:**
```json
{
  "data": [
    {
      "id": "987654321098765",
      "name": "해외직구멀티샵"
    }
  ]
}
```

Facebook Page ID (`987654321098765`) 복사.

### 6.2 Instagram Business Account ID 조회

```bash
# 형식
https://graph.facebook.com/v18.0/{PAGE_ID}?fields=instagram_business_account&access_token={LONG_LIVED_TOKEN}

# 실제 예시
https://graph.facebook.com/v18.0/987654321098765?fields=instagram_business_account&access_token=EAAG...
```

**응답 예시:**
```json
{
  "instagram_business_account": {
    "id": "17841405822304914"
  },
  "id": "987654321098765"
}
```

Instagram Business Account ID (`17841405822304914`) 복사.

---

## 7. 환경 변수 설정

프로젝트 루트의 `.env.local` 파일에 다음 추가:

```bash
# Instagram Graph API
NEXT_PUBLIC_INSTAGRAM_BUSINESS_ACCOUNT_ID=17841405822304914
INSTAGRAM_ACCESS_TOKEN=EAAG...장기_토큰...
```

**주의사항:**
- `NEXT_PUBLIC_` 접두사가 있는 변수는 클라이언트에 노출됩니다
- `INSTAGRAM_ACCESS_TOKEN`은 서버 전용이므로 접두사 없음
- `.env.local` 파일은 `.gitignore`에 포함되어야 합니다 (이미 포함됨)

---

## 8. API 테스트

환경 변수 설정 후 다음 URL로 테스트:

```bash
# 형식
https://graph.instagram.com/v18.0/{ACCOUNT_ID}/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp&limit=6&access_token={ACCESS_TOKEN}

# 브라우저나 curl로 실행
curl "https://graph.instagram.com/v18.0/17841405822304914/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp&limit=6&access_token=EAAG..."
```

**성공 응답:**
```json
{
  "data": [
    {
      "id": "18012345678901234",
      "caption": "신상품 입고! 🎉",
      "media_type": "IMAGE",
      "media_url": "https://scontent.cdninstagram.com/...",
      "permalink": "https://www.instagram.com/p/ABC123/",
      "timestamp": "2026-01-13T10:30:00+0000"
    }
  ],
  "paging": {
    "cursors": { "before": "...", "after": "..." }
  }
}
```

---

## 9. 주의사항

### 9.1 Access Token 만료

- **장기 토큰**: 60일 후 만료
- **갱신 방법**: 만료 전에 새로운 토큰 발급 필요
- **자동 갱신**: 프로덕션 환경에서는 자동 갱신 로직 구현 권장

### 9.2 API 제한

- **Rate Limit**: 시간당 200 요청
- **캐싱**: 1시간 캐시 적용으로 제한 회피
- **쿼터**: 무료 사용 가능

### 9.3 앱 모드

- **개발 모드**: 테스트 사용자만 접근 가능 (현재 상태)
- **라이브 모드**: 프로덕션 배포 시 Meta 앱 심사 필요
  - 개인정보처리방침 URL 필요
  - 서비스 약관 URL 필요
  - 앱 검토 신청 (1-2주 소요)

### 9.4 보안

- Access Token은 **절대 클라이언트에 노출하지 마세요**
- 환경 변수 파일은 Git에 커밋하지 마세요
- `.env.local`이 `.gitignore`에 포함되어 있는지 확인

---

## 10. 문제 해결

### "권한이 없습니다" 오류

**원인**: Instagram 계정이 Business 계정이 아님

**해결**: [1단계](#1-instagram-business-계정-전환) 다시 확인

### "페이지가 연결되지 않았습니다" 오류

**원인**: Facebook 페이지와 Instagram 연결 안 됨

**해결**: Instagram 앱 → 설정 → Facebook 페이지 링크

### "토큰이 유효하지 않습니다" 오류

**원인**: Access Token 만료 또는 잘못된 토큰

**해결**: [4-5단계](#4-access-token-발급) 다시 진행하여 새 토큰 발급

### Instagram Business Account ID를 찾을 수 없음

**원인**: Facebook 페이지에 Instagram 계정이 연결되지 않음

**해결**:
1. Facebook 페이지 → 설정 → Instagram
2. "계정 연결" 클릭
3. Instagram 로그인 및 승인

---

## 11. 추가 리소스

- [Instagram Graph API 공식 문서](https://developers.facebook.com/docs/instagram-api)
- [Access Token 디버거](https://developers.facebook.com/tools/debug/accesstoken/)
- [Graph API Explorer](https://developers.facebook.com/tools/explorer)
- [Meta for Developers 커뮤니티](https://developers.facebook.com/community/)

---

## 다음 단계

환경 변수 설정이 완료되면 개발 서버를 재시작하세요:

```bash
pnpm dev
```

Instagram 피드가 홈페이지에 자동으로 표시됩니다! 🎉
