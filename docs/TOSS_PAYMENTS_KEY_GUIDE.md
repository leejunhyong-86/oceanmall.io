# 토스페이먼츠 API 키 가이드

## 문제: "결제위젯 연동 키의 클라이언트 키로 SDK를 연동해주세요"

이 오류는 **결제위젯 연동 키** 대신 **API 개별 연동 키**를 사용했을 때 발생합니다.

## 토스페이먼츠 키 종류

토스페이먼츠에는 두 가지 키가 있습니다:

### 1. 결제위젯 연동 키 (Widget Key) ✅ **이것을 사용해야 합니다**

- **형식**: `test_ck_` 또는 `live_ck_`로 시작
- **사용처**: 결제위젯 (`widgets()` 메서드)
- **예시**: `test_ck_DocsXaVQVjYGQ0Nz4wL8KwLNx`

### 2. API 개별 연동 키 (Individual API Key) ❌ **이것은 사용하지 마세요**

- **형식**: 다른 형식 (예: `test_gck_` 등)
- **사용처**: 결제창, 브랜드페이, 자동결제(빌링)
- **예시**: `test_gck_docs_OaPz8L5KdmQXkzRZ3y47BMw6`

## 올바른 키 확인 방법

### 1. 토스페이먼츠 개발자센터 접속

1. [토스페이먼츠 개발자센터](https://developers.tosspayments.com) 접속
2. 로그인

### 2. API 키 메뉴로 이동

1. 좌측 메뉴에서 **API 키** 클릭
2. **결제위젯 연동 키** 섹션 확인
   - **클라이언트 키**: `test_ck_` 또는 `live_ck_`로 시작하는 키
   - **시크릿 키**: `test_sk_` 또는 `live_sk_`로 시작하는 키

### 3. 키 형식 확인

**올바른 키 형식:**
```
클라이언트 키: test_ck_DocsXaVQVjYGQ0Nz4wL8KwLNx
시크릿 키: test_sk_DocsXaVQVjYGQ0Nz4wL8KwLNx
```

**잘못된 키 형식 (API 개별 연동 키):**
```
클라이언트 키: test_gck_docs_OaPz8L5KdmQXkzRZ3y47BMw6
시크릿 키: test_sk_docs_OaPz8L5KdmQXkzRZ3y47BMw6
```

## 환경 변수 설정

`.env.local` 파일에 올바른 키를 설정하세요:

```bash
# ✅ 올바른 형식: 결제위젯 연동 키
NEXT_PUBLIC_TOSS_CLIENT_KEY=test_ck_DocsXaVQVjYGQ0Nz4wL8KwLNx
TOSS_SECRET_KEY=test_sk_DocsXaVQVjYGQ0Nz4wL8KwLNx

# ❌ 잘못된 형식: API 개별 연동 키 (사용하지 마세요)
# NEXT_PUBLIC_TOSS_CLIENT_KEY=test_gck_docs_OaPz8L5KdmQXkzRZ3y47BMw6
```

## 키 확인 체크리스트

- [ ] 키가 `test_ck_` 또는 `live_ck_`로 시작하는가?
- [ ] 개발자센터의 **결제위젯 연동 키** 섹션에서 복사했는가?
- [ ] **API 개별 연동 키** 섹션이 아닌가?

## 문제 해결

### 1. 환경 변수 확인

`.env.local` 파일을 열어서 키 형식을 확인하세요:

```bash
# 올바른 형식 확인
NEXT_PUBLIC_TOSS_CLIENT_KEY=test_ck_...  # ✅
# 또는
NEXT_PUBLIC_TOSS_CLIENT_KEY=live_ck_...  # ✅
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

- **테스트 키**: `test_ck_`로 시작 (개발/테스트용)
- **라이브 키**: `live_ck_`로 시작 (프로덕션용)
- 결제위젯을 사용하는 경우 반드시 **결제위젯 연동 키**를 사용해야 합니다.
