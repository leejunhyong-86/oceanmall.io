# 환경 변수 설정 가이드

이 문서는 해외직구멀티샵 프로젝트의 환경 변수 설정 방법을 설명합니다.

---

## 필수 환경 변수

`.env.local` 파일을 프로젝트 루트에 생성하고 다음 변수들을 설정하세요.

### Clerk 인증

```bash
# Clerk 대시보드에서 확인 (https://dashboard.clerk.com)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx

# 인증 라우트 설정
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/
```

### Supabase 데이터베이스

```bash
# Supabase 대시보드 > Project Settings > API에서 확인
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxx

# Service Role Key (서버 사이드 전용, 절대 클라이언트에 노출 금지!)
SUPABASE_SERVICE_ROLE_KEY=eyJxxxxx

# Storage 버킷 이름
NEXT_PUBLIC_STORAGE_BUCKET=uploads
```

### 토스페이먼츠 결제

```bash
# 토스페이먼츠 개발자센터 > API 키 > 결제위젯 연동 키에서 확인 (https://developers.tosspayments.com)
# 결제위젯 연동 키: test_gck_ 또는 live_gck_로 시작
NEXT_PUBLIC_TOSS_CLIENT_KEY=test_gck_xxxxx
TOSS_SECRET_KEY=test_gsk_xxxxx
```

---

## 환경 변수 상세 설명

### Clerk 설정

| 변수명 | 필수 | 설명 |
|--------|------|------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | ✅ | Clerk 공개 키 (클라이언트에서 사용) |
| `CLERK_SECRET_KEY` | ✅ | Clerk 비밀 키 (서버에서만 사용) |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | ✅ | 로그인 페이지 경로 |
| `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` | ✅ | 로그인 후 리다이렉트 경로 |
| `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL` | ✅ | 회원가입 후 리다이렉트 경로 |

### Supabase 설정

| 변수명 | 필수 | 설명 |
|--------|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | 공개 API 키 (RLS 정책 적용) |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | 서비스 역할 키 (RLS 우회, 서버 전용) |
| `NEXT_PUBLIC_STORAGE_BUCKET` | ⚠️ | Storage 버킷 이름 (기본값: uploads) |

### 토스페이먼츠 설정

| 변수명 | 필수 | 설명 |
|--------|------|------|
| `NEXT_PUBLIC_TOSS_CLIENT_KEY` | ✅ | 토스페이먼츠 클라이언트 키 (결제위젯 연동 키: test_gck_ 또는 live_gck_로 시작) |
| `TOSS_SECRET_KEY` | ✅ | 토스페이먼츠 시크릿 키 (결제위젯 연동 키: test_gsk_ 또는 live_gsk_로 시작, 서버 전용) |

---

## Clerk 설정 방법

### 1. Clerk 계정 생성

1. [Clerk](https://clerk.com) 접속
2. 계정 생성 및 로그인
3. 새 애플리케이션 생성

### 2. API 키 확인

1. Clerk 대시보드 접속
2. 왼쪽 메뉴에서 **API Keys** 클릭
3. `Publishable key`와 `Secret key` 복사

### 3. 소셜 로그인 설정 (선택)

1. **User & Authentication** > **Social Connections**
2. Google, GitHub 등 원하는 제공자 활성화
3. 각 제공자의 OAuth 설정 완료

### 4. 한국어 설정

프로젝트에서 이미 `@clerk/localizations`를 사용하여 한국어를 지원합니다.

```tsx
// app/layout.tsx
import { koKR } from '@clerk/localizations';

<ClerkProvider localization={koKR}>
```

---

## Supabase 설정 방법

### 1. Supabase 프로젝트 생성

1. [Supabase](https://supabase.com) 접속
2. 새 프로젝트 생성
3. 데이터베이스 비밀번호 설정 (안전하게 보관)

### 2. API 키 확인

1. Supabase 대시보드 접속
2. **Project Settings** > **API** 클릭
3. 다음 정보 확인:
   - **Project URL**: `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role secret**: `SUPABASE_SERVICE_ROLE_KEY`

### 3. 데이터베이스 스키마 설정

SQL Editor에서 마이그레이션 파일들을 순서대로 실행하거나, 통합된 `supabase/seed.sql`을 실행하세요.

```sql
-- supabase/seed.sql 실행
-- 카테고리, 상품, 외부 리뷰 샘플 데이터 포함
```

### 4. Clerk + Supabase 통합

이 프로젝트는 Clerk와 Supabase의 네이티브 통합을 사용합니다:

1. Supabase 대시보드 > **Authentication** > **Providers**
2. **Clerk** 활성화
3. Clerk 대시보드에서 Supabase 통합 설정

---

## 개발 환경 vs 프로덕션 환경

### 개발 환경 (`.env.local`)

```bash
# 개발용 Clerk 키 (테스트 모드)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx

# 개발용 Supabase (로컬 또는 개발 프로젝트)
NEXT_PUBLIC_SUPABASE_URL=https://dev-xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxxxx
```

### 프로덕션 환경 (Vercel 환경 변수)

```bash
# 프로덕션용 Clerk 키 (라이브 모드)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxxxx
CLERK_SECRET_KEY=sk_live_xxxxx

# 프로덕션용 Supabase
NEXT_PUBLIC_SUPABASE_URL=https://prod-xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxxxx
```

---

## 환경 변수 보안 주의사항

### ⚠️ 절대 공개하면 안 되는 키

- `CLERK_SECRET_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### 🔒 보안 체크리스트

- [ ] `.env.local`이 `.gitignore`에 포함되어 있는지 확인
- [ ] `NEXT_PUBLIC_` 접두사가 없는 키는 서버에서만 사용
- [ ] 프로덕션 키는 Vercel 환경 변수에만 설정
- [ ] Service Role Key는 서버 사이드 코드에서만 사용

---

## 문제 해결

### 환경 변수가 인식되지 않을 때

1. `.env.local` 파일 위치 확인 (프로젝트 루트)
2. 변수명 오타 확인
3. 개발 서버 재시작 (`pnpm dev`)

### Clerk 인증 오류

1. `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` 확인
2. Clerk 대시보드에서 도메인 설정 확인
3. 개발 모드에서는 `localhost:3000` 허용 필요

### Supabase 연결 오류

1. `NEXT_PUBLIC_SUPABASE_URL` 형식 확인 (`https://` 포함)
2. API 키가 올바른 프로젝트의 것인지 확인
3. RLS 정책 확인 (개발 중에는 비활성화 권장)

---

## 환경 변수 템플릿

`.env.example` 파일을 참고하여 `.env.local`을 생성하세요:

```bash
cp .env.example .env.local
```

그 후 실제 값으로 교체하세요.

