# 토스페이먼츠 API 키 가이드

## 문제: "결제위젯 연동 키의 클라이언트 키로 SDK를 연동해주세요"

이 오류는 **결제위젯 연동 키** 대신 **API 개별 연동 키**를 사용했을 때 발생합니다.

## 토스페이먼츠 키 종류

토스페이먼츠에는 두 가지 키가 있습니다:

### 1. 결제위젯 연동 키 (Widget Key) ✅ **이것을 사용해야 합니다**

- **형식**: `test_gck_` 또는 `live_gck_`로 시작 (2025년 기준)
- **사용처**: 결제위젯 (`widgets()` 메서드)
- **예시**: `test_gck_docs_Ovk5rk1EwkEbP0W43n07xlzm`

**참고**: 토스페이먼츠 대시보드의 "결제위젯 연동 키" 섹션에 표시되는 클라이언트 키를 사용하세요.

### 2. API 개별 연동 키 (Individual API Key) ❌ **결제위젯에는 사용하지 마세요**

- **형식**: `test_ck_` 또는 `live_ck_`로 시작
- **사용처**: 결제창, 브랜드페이, 자동결제(빌링)
- **예시**: `test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq`

## 올바른 키 확인 방법

### 1. 토스페이먼츠 개발자센터 접속

1. [토스페이먼츠 개발자센터](https://developers.tosspayments.com) 접속
2. 로그인

### 2. API 키 메뉴로 이동

1. 좌측 메뉴에서 **API 키** 클릭
2. **결제위젯 연동 키** 섹션 확인
   - **클라이언트 키**: `test_gck_` 또는 `live_gck_`로 시작하는 키 (2025년 기준)
   - **시크릿 키**: `test_gsk_` 또는 `live_gsk_`로 시작하는 키

### 3. 키 형식 확인

**올바른 키 형식 (결제위젯 연동 키):**
```
클라이언트 키: test_gck_Gv6LjeKD8aBwOowb20nk3wYxAdXy
시크릿 키: test_gsk_... (시크릿 키는 보안상 마스킹됨)
```

**잘못된 키 형식 (API 개별 연동 키 - 결제위젯에는 사용 불가):**
```
클라이언트 키: test_ck_E92LAa5PVbvBZakEWwqpV7YmpXyJ
시크릿 키: test_sk_...
```

## 환경 변수 설정

`.env.local` 파일에 올바른 키를 설정하세요:

```bash
# ✅ 올바른 형식: 결제위젯 연동 키
NEXT_PUBLIC_TOSS_CLIENT_KEY=test_gck_Gv6LjeKD8aBwOowb20nk3wYxAdXy
TOSS_SECRET_KEY=test_gsk_... (시크릿 키는 보안상 마스킹됨)

# ❌ 잘못된 형식: API 개별 연동 키 (결제위젯에는 사용 불가)
# NEXT_PUBLIC_TOSS_CLIENT_KEY=test_ck_E92LAa5PVbvBZakEWwqpV7YmpXyJ
```

## 키 확인 체크리스트

- [ ] 키가 `test_gck_` 또는 `live_gck_`로 시작하는가? (2025년 기준)
- [ ] 개발자센터의 **결제위젯 연동 키** 섹션에서 복사했는가?
- [ ] **API 개별 연동 키** 섹션이 아닌가?

## 문제 해결

### 1. 환경 변수 확인

`.env.local` 파일을 열어서 키 형식을 확인하세요:

```bash
# 올바른 형식 확인 (결제위젯 연동 키)
NEXT_PUBLIC_TOSS_CLIENT_KEY=test_gck_...  # ✅
# 또는
NEXT_PUBLIC_TOSS_CLIENT_KEY=live_gck_...  # ✅
```

### 2. 개발 서버 재시작

환경 변수를 변경한 후에는 반드시 개발 서버를 재시작하세요:

```bash
# Ctrl+C로 중지 후
pnpm dev
```

### 3. 브라우저 캐시 클리어

브라우저 캐시를 클리어하거나 시크릿 모드로 테스트하세요.

## 참고

- **결제위젯 연동 키**: `test_gck_` 또는 `live_gck_`로 시작 (결제위젯 전용)
- **API 개별 연동 키**: `test_ck_` 또는 `live_ck_`로 시작 (결제창, 브랜드페이, 자동결제용)
- 결제위젯을 사용하는 경우 반드시 **결제위젯 연동 키** (`test_gck_` 또는 `live_gck_`)를 사용해야 합니다.
- **중요**: SDK가 `test_gck_` 형식을 거부하는 경우, SDK 버전을 최신으로 업데이트하거나 토스페이먼츠 고객센터에 문의하세요.
