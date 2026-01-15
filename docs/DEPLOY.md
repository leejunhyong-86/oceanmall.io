# Vercel 배포 가이드

이 문서는 해외직구멀티샵 프로젝트를 Vercel에 배포하는 방법을 설명합니다.

---

## 사전 준비

### 필수 계정

1. **GitHub 계정**: 소스 코드 저장소
2. **Vercel 계정**: 배포 플랫폼 ([vercel.com](https://vercel.com))
3. **Clerk 계정**: 인증 서비스 ([clerk.com](https://clerk.com))
4. **Supabase 계정**: 데이터베이스 ([supabase.com](https://supabase.com))

### 프로덕션 환경 변수 준비

배포 전에 다음 환경 변수들을 준비하세요:

```bash
# Clerk (프로덕션 키)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxxxx
CLERK_SECRET_KEY=sk_live_xxxxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/

# Supabase (프로덕션 프로젝트)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxxxx
NEXT_PUBLIC_STORAGE_BUCKET=uploads
```

---

## 배포 단계

### 1단계: GitHub 저장소 준비

1. 프로젝트를 GitHub에 푸시

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/your-username/your-repo.git
git push -u origin main
```

2. `.gitignore` 확인 (민감한 파일 제외)

```
# .gitignore에 포함되어야 할 항목
.env
.env.local
.env.*.local
node_modules/
.next/
```

### 2단계: Vercel 프로젝트 생성

1. [Vercel 대시보드](https://vercel.com/dashboard) 접속
2. **Add New...** > **Project** 클릭
3. **Import Git Repository** 선택
4. GitHub 계정 연결 (최초 1회)
5. 배포할 저장소 선택

### 3단계: 프로젝트 설정

#### Framework Preset
- **Framework Preset**: Next.js (자동 감지됨)

#### Build & Output Settings
- **Build Command**: `pnpm build` (기본값 사용)
- **Output Directory**: `.next` (기본값 사용)
- **Install Command**: `pnpm install` (기본값 사용)

#### Root Directory
- 프로젝트 루트 그대로 사용 (변경 불필요)

### 4단계: 환경 변수 설정

1. **Environment Variables** 섹션에서 변수 추가
2. 각 변수를 하나씩 입력:

| Key | Value | Environment |
|-----|-------|-------------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_live_xxxxx` | Production |
| `CLERK_SECRET_KEY` | `sk_live_xxxxx` | Production |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/sign-in` | Production |
| `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` | `/` | Production |
| `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL` | `/` | Production |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxx.supabase.co` | Production |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJxxxxx` | Production |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJxxxxx` | Production |
| `NEXT_PUBLIC_STORAGE_BUCKET` | `uploads` | Production |
| `NEXT_PUBLIC_TOSS_CLIENT_KEY` | `test_gck_xxxxx` 또는 `live_gck_xxxxx` | Production |
| `TOSS_SECRET_KEY` | `test_gsk_xxxxx` 또는 `live_gsk_xxxxx` | Production |
| `TOSS_WEBHOOK_SECRET` | `your_webhook_secret` (선택) | Production |

3. **Environment** 선택:
   - Production: 프로덕션 배포에만 적용
   - Preview: PR 프리뷰에 적용
   - Development: 개발 환경에 적용

### 5단계: 배포 실행

1. **Deploy** 버튼 클릭
2. 빌드 로그 확인 (약 2-3분 소요)
3. 배포 완료 후 URL 확인

---

## 배포 후 설정

### Clerk 도메인 설정

1. [Clerk 대시보드](https://dashboard.clerk.com) 접속
2. **Domains** 메뉴 클릭
3. Vercel 배포 URL 추가 (예: `your-app.vercel.app`)
4. 커스텀 도메인 사용 시 해당 도메인도 추가

### Supabase 설정 확인

1. [Supabase 대시보드](https://supabase.com/dashboard) 접속
2. **Authentication** > **URL Configuration**
3. **Site URL**에 Vercel 배포 URL 추가
4. **Redirect URLs**에 다음 추가:
   - `https://your-app.vercel.app/*`
   - 커스텀 도메인 사용 시 해당 도메인도 추가

---

## 커스텀 도메인 설정 (선택)

### 1. Vercel에서 도메인 추가

1. Vercel 프로젝트 대시보드 > **Settings** > **Domains**
2. 커스텀 도메인 입력 (예: `globalshop.com`)
3. DNS 설정 안내 확인

### 2. DNS 설정

도메인 등록 업체에서 다음 설정:

**A 레코드 (루트 도메인)**
```
Type: A
Name: @
Value: 76.76.21.21
```

**CNAME 레코드 (www 서브도메인)**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

### 3. SSL 인증서

Vercel이 자동으로 Let's Encrypt SSL 인증서를 발급합니다.

---

## 자동 배포 설정

### GitHub 연동 시 자동 배포

- **main 브랜치 푸시**: 프로덕션 자동 배포
- **PR 생성**: 프리뷰 배포 자동 생성
- **PR 머지**: 프로덕션 자동 배포

### 배포 보호 (선택)

1. **Settings** > **Git** > **Deploy Hooks**
2. 특정 브랜치만 배포하도록 설정 가능

---

## 배포 확인 체크리스트

### 기능 테스트

- [ ] 홈페이지 로딩
- [ ] 상품 목록 페이지
- [ ] 상품 상세 페이지
- [ ] 로그인/회원가입
- [ ] 마이페이지
- [ ] 관리자 페이지

### 성능 확인

- [ ] Lighthouse 점수 확인 (Performance, Accessibility, SEO)
- [ ] 이미지 로딩 속도
- [ ] 페이지 전환 속도

### 보안 확인

- [ ] HTTPS 적용 확인
- [ ] 환경 변수 노출 여부 확인
- [ ] API 엔드포인트 보안

---

## 문제 해결

### 빌드 실패

1. **로그 확인**: Vercel 대시보드에서 빌드 로그 확인
2. **로컬 빌드 테스트**: `pnpm build` 로컬에서 실행
3. **의존성 확인**: `pnpm install` 후 재시도

### 환경 변수 오류

1. 변수명 오타 확인
2. 값에 따옴표 불필요 (Vercel이 자동 처리)
3. 재배포 필요 (환경 변수 변경 후)

### Clerk 인증 오류

1. Clerk 대시보드에서 도메인 설정 확인
2. `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` 확인
3. 프로덕션 키 사용 여부 확인 (pk_live_)

### Supabase 연결 오류

1. `NEXT_PUBLIC_SUPABASE_URL` 확인
2. API 키가 프로덕션 프로젝트의 것인지 확인
3. RLS 정책 확인

---

## 유용한 명령어

### Vercel CLI 설치

```bash
npm i -g vercel
```

### CLI로 배포

```bash
# 프로덕션 배포
vercel --prod

# 프리뷰 배포
vercel

# 환경 변수 설정
vercel env add VARIABLE_NAME
```

### 로그 확인

```bash
# 실시간 로그
vercel logs your-app.vercel.app

# 함수 로그
vercel logs your-app.vercel.app --follow
```

---

## 참고 링크

- [Vercel 공식 문서](https://vercel.com/docs)
- [Next.js 배포 가이드](https://nextjs.org/docs/deployment)
- [Clerk + Vercel 통합](https://clerk.com/docs/deployments/vercel)
- [Supabase + Vercel 통합](https://supabase.com/docs/guides/integrations/vercel)

