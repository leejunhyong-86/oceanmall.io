# 알리익스프레스 어필리에이트 API 설정 가이드

이 문서는 알리익스프레스 어필리에이트 프로그램 가입부터 API 키 발급까지의 전 과정을 초보자도 이해할 수 있도록 단계별로 설명합니다.

---

## 📋 목차
1. [알리익스프레스 어필리에이트란?](#1-알리익스프레스-어필리에이트란)
2. [프로그램 가입 방법](#2-프로그램-가입-방법)
3. [API 키 발급 방법](#3-api-키-발급-방법)
4. [환경 변수 설정](#4-환경-변수-설정)
5. [API 테스트](#5-api-테스트)
6. [자주 묻는 질문 (FAQ)](#6-자주-묻는-질문-faq)

---

## 1. 알리익스프레스 어필리에이트란?

### 1.1 개념 설명
**어필리에이트(Affiliate)**는 제휴 마케팅을 의미합니다. 알리익스프레스의 상품을 홍보하고, 그 링크를 통해 구매가 발생하면 **수수료(커미션)**를 받는 시스템입니다.

### 1.2 수익 구조
```
1. 상품 링크 생성 → 2. SNS/블로그에 공유 → 3. 사람들이 클릭 → 4. 구매 발생 → 5. 수수료 획득 (3~10%)
```

### 1.3 왜 API가 필요한가?
- **수동 작업**: 웹사이트에서 하나씩 링크 생성 (느림)
- **API 사용**: 프로그램으로 자동으로 수백 개 링크 생성 (빠름)

---

## 2. 프로그램 가입 방법

### 2.1 알리익스프레스 어필리에이트 프로그램 선택

알리익스프레스는 여러 어필리에이트 플랫폼을 통해 서비스를 제공합니다. 한국에서 사용 가능한 주요 플랫폼:

| 플랫폼 | 추천도 | 특징 | 가입 링크 |
|--------|--------|------|-----------|
| **AliExpress Portals** | ⭐⭐⭐⭐⭐ | 공식 플랫폼, API 제공, 한국어 지원 | [portals.aliexpress.com](https://portals.aliexpress.com) |
| **Admitad** | ⭐⭐⭐⭐ | 글로벌 네트워크, API 제공 | [admitad.com](https://www.admitad.com) |
| **Impact** | ⭐⭐⭐ | 미국 중심, 영어만 지원 | [impact.com](https://www.impact.com) |

> [!TIP]
> **초보자 추천**: AliExpress Portals를 사용하세요. 한국어를 지원하고 설정이 가장 간단합니다.

### 2.2 AliExpress Portals 가입 단계

#### Step 1: 회원가입
1. [https://portals.aliexpress.com](https://portals.aliexpress.com) 접속
2. 우측 상단 **"Sign Up"** 클릭
3. 이메일 또는 소셜 계정으로 가입
4. 이메일 인증 완료

#### Step 2: 어필리에이트 신청
1. 로그인 후 **"Affiliate Program"** 메뉴 클릭
2. **"Join Now"** 버튼 클릭
3. 다음 정보 입력:
   - **Website/Social Media URL**: 블로그, 인스타그램, 유튜브 주소 (없으면 준비 중인 사이트 URL)
   - **Traffic Source**: 트래픽 출처 (예: Social Media, Blog)
   - **Monthly Visitors**: 월 방문자 수 (예상치도 가능)
   - **Promotion Method**: 홍보 방법 (예: Instagram Posts, YouTube Videos)

> [!IMPORTANT]
> **승인 소요 시간**: 보통 1~3일 소요됩니다. 승인 메일을 기다리세요.

#### Step 3: 승인 확인
- 이메일로 승인 통지를 받으면 가입 완료!
- 대시보드에서 **"API Access"** 메뉴가 보이면 성공입니다.

---

## 3. API 키 발급 방법

### 3.1 API 키란?
API 키는 프로그램이 알리익스프레스 서버와 통신할 때 사용하는 **비밀번호**입니다. 다음 3가지가 필요합니다:

- **App Key**: 애플리케이션 ID
- **App Secret**: 비밀 키 (절대 공개하면 안 됨!)
- **Tracking ID**: 수익 추적용 ID

### 3.2 발급 단계

#### Step 1: API 애플리케이션 생성
1. [AliExpress Open Platform](https://open.aliexpress.com) 접속
2. 로그인 (Portals 계정과 동일)
3. 상단 메뉴 **"Console"** → **"App Management"** 클릭
4. **"Create App"** 버튼 클릭

#### Step 2: 애플리케이션 정보 입력
```
App Name: My Affiliate Bot (원하는 이름)
App Type: Web Application
Description: Automated affiliate link generation
Callback URL: https://yourdomain.com/callback (없으면 http://localhost:3000)
```

#### Step 3: API 권한 설정
다음 API 권한을 체크하세요:
- ✅ **Affiliate Product Search API** (상품 검색)
- ✅ **Affiliate Link Generate API** (링크 생성)
- ✅ **Affiliate Order Query API** (주문 조회)

#### Step 4: API 키 확인
- 생성 완료 후 **"App Key"**와 **"App Secret"**이 표시됩니다.
- **중요**: App Secret은 한 번만 보여주므로 즉시 복사하여 안전한 곳에 저장하세요!

#### Step 5: Tracking ID 발급
1. [Portals 대시보드](https://portals.aliexpress.com) 접속
2. **"Tools"** → **"Link Generator"** 메뉴
3. 우측 상단에 **"Your Tracking ID"** 표시 (예: `mytrackingid123`)
4. 복사하여 저장

---

## 4. 환경 변수 설정

### 4.1 .env.local 파일 수정

프로젝트 루트 디렉토리의 `.env.local` 파일을 열고 다음 내용을 추가하세요:

```env
# AliExpress Affiliate API
ALIEXPRESS_APP_KEY=your_app_key_here
ALIEXPRESS_APP_SECRET=your_app_secret_here
ALIEXPRESS_TRACKING_ID=your_tracking_id_here
```

### 4.2 실제 값 입력 예시

```env
# AliExpress Affiliate API
ALIEXPRESS_APP_KEY=12345678
ALIEXPRESS_APP_SECRET=abcdef1234567890abcdef1234567890
ALIEXPRESS_TRACKING_ID=mytrackingid123
```

> [!CAUTION]
> **보안 주의사항**
> - `.env.local` 파일은 절대 GitHub에 업로드하지 마세요!
> - `.gitignore` 파일에 `.env.local`이 포함되어 있는지 확인하세요.

### 4.3 환경 변수 확인

터미널에서 다음 명령어로 환경 변수가 제대로 설정되었는지 확인:

```bash
# PowerShell (Windows)
echo $env:ALIEXPRESS_APP_KEY

# 또는 Node.js에서 확인
node -e "console.log(process.env.ALIEXPRESS_APP_KEY)"
```

---

## 5. API 테스트

### 5.1 테스트 스크립트 실행

API가 정상적으로 작동하는지 확인하기 위해 테스트 스크립트를 실행합니다.

```bash
# 테스트 스크립트 실행
pnpm tsx scripts/test-aliexpress-api.ts
```

### 5.2 예상 결과

성공 시:
```
✅ API 연결 성공!
✅ 상품 검색 성공! (10개 상품 발견)
✅ 링크 생성 성공!
   - 원본 URL: https://www.aliexpress.com/item/...
   - 어필리에이트 링크: https://s.click.aliexpress.com/...
```

실패 시:
```
❌ API 연결 실패: Invalid App Key
→ .env.local 파일의 ALIEXPRESS_APP_KEY를 확인하세요.
```

---

## 6. 자주 묻는 질문 (FAQ)

### Q1. API 키 발급이 안 되는데 어떻게 하나요?
**A**: 다음을 확인하세요:
1. 어필리에이트 프로그램 승인이 완료되었는지 확인
2. AliExpress Open Platform에 로그인했는지 확인
3. 신용카드 또는 PayPal 계정을 등록했는지 확인 (일부 국가에서 필요)

### Q2. 한국에서 알리익스프레스 어필리에이트를 할 수 있나요?
**A**: 네, 가능합니다! 한국은 지원 국가입니다. 다만 수익 지급은 PayPal 또는 국제 송금으로만 가능합니다.

### Q3. API 호출 제한이 있나요?
**A**: 네, 무료 플랜은 다음 제한이 있습니다:
- **일일 호출 제한**: 1,000회/일
- **분당 호출 제한**: 60회/분
- 유료 플랜으로 업그레이드하면 제한이 늘어납니다.

### Q4. 어떤 API를 사용해야 하나요?
**A**: 초보자는 **AliExpress Portals API**를 추천합니다. 이유:
- 공식 API로 안정적
- 한국어 지원
- 문서가 잘 정리되어 있음
- 무료 플랜으로도 충분히 사용 가능

### Q5. API 키를 잃어버렸어요!
**A**: 
- **App Key**: 언제든지 Console에서 확인 가능
- **App Secret**: 재발급 필요 (Console → App Management → Regenerate Secret)

### Q6. 테스트 환경에서 실제 링크가 생성되나요?
**A**: 네, 테스트 환경에서도 실제 어필리에이트 링크가 생성됩니다. 하지만 수익은 실제 구매가 발생해야 발생합니다.

### Q7. 수수료율은 얼마인가요?
**A**: 상품 카테고리에 따라 다릅니다:
- 전자기기: 3~5%
- 패션/뷰티: 5~8%
- 홈/가든: 6~10%
- 평균: 약 5~7%

---

## 📚 추가 자료

### 공식 문서
- [AliExpress Portals 가이드](https://portals.aliexpress.com/help)
- [AliExpress Open Platform API 문서](https://open.aliexpress.com/doc)
- [Affiliate API Reference](https://developers.aliexpress.com/en/doc.htm?docId=108976&docType=1)

### 커뮤니티
- [AliExpress Affiliate 포럼](https://community.aliexpress.com/affiliate)
- [Reddit r/Affiliatemarketing](https://www.reddit.com/r/Affiliatemarketing)

---

## ✅ 다음 단계

API 설정이 완료되었다면 다음 단계로 진행하세요:

1. **Phase 1**: [대량 링크 생성 기능 구현](../task.md#phase-1-대량-링크-생성-기능)
2. **Phase 2**: [자동 포스팅 기능 구현](../task.md#phase-2-자동-포스팅-기능)
3. **Phase 3**: [실시간 최저가 알림 봇 구현](../task.md#phase-3-실시간-최저가-알림-봇)

---

> [!NOTE]
> 이 가이드는 2026년 1월 기준으로 작성되었습니다. 알리익스프레스의 정책이나 UI가 변경될 수 있으므로, 최신 정보는 공식 문서를 참고하세요.
