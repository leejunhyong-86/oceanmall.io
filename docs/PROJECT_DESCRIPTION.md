# 해외직구멀티샵 - 프로젝트 종합 설명서

> AI 기반 리뷰 통합 플랫폼으로 해외직구의 정보 탐색 시간을 90% 단축하는 Next.js 15 풀스택 애플리케이션

**작성일**: 2025년 1월  
**버전**: 1.0 (MVP)  
**프로젝트명**: global-shop-multi  
**개발 기간**: 4주 (MVP 기준)

---

## 목차

1. [프로젝트 개요](#1-프로젝트-개요)
2. [기술 스택 상세](#2-기술-스택-상세)
3. [아키텍처 및 구조](#3-아키텍처-및-구조)
4. [데이터베이스 스키마](#4-데이터베이스-스키마)
5. [주요 기능 상세](#5-주요-기능-상세)
6. [API 및 Server Actions](#6-api-및-server-actions)
7. [컴포넌트 구조](#7-컴포넌트-구조)
8. [인증 및 보안](#8-인증-및-보안)
9. [외부 서비스 통합](#9-외부-서비스-통합)
10. [개발 프로세스](#10-개발-프로세스)
11. [배포 및 운영](#11-배포-및-운영)
12. [향후 계획](#12-향후-계획)

---

## 1. 프로젝트 개요

### 1.1 비전 및 목표

**핵심 가치 제안**: "전세계 인기 상품의 리뷰를 AI가 한눈에 요약해드립니다."

해외직구멀티샵은 여러 해외 쇼핑몰에 흩어진 상품 정보와 리뷰를 한 곳에 모아, AI 기술로 요약하여 제공하는 큐레이션 플랫폼입니다. 바쁜 2030 직장인들이 점심시간이나 퇴근 후 짧은 시간 안에 신뢰할 수 있는 구매 결정을 내릴 수 있도록 돕습니다.

### 1.2 해결하려는 문제

**2030 직장인 해외직구 이용자의 주요 Pain Points:**

1. **시간 부족 문제**
   - 여러 해외 쇼핑몰(아마존, 알리익스프레스, iHerb 등)을 일일이 방문하여 상품을 비교하는 데 평균 30-60분 소요
   - 퇴근 후나 점심시간 등 제한된 시간에 효율적인 쇼핑 불가능

2. **언어 장벽**
   - 영어, 중국어, 일본어 등 외국어 리뷰를 이해하기 어려움
   - 번역기를 사용해도 맥락과 뉘앙스를 정확히 파악하기 힘듦

3. **정보 분산**
   - 같은 상품에 대한 리뷰가 여러 사이트에 흩어져 있어 종합적인 평가가 어려움
   - 리뷰 수가 많을수록 핵심 정보를 찾기 위해 스크롤하는 시간 증가

4. **신뢰성 검증 어려움**
   - 가짜 리뷰와 진짜 리뷰 구분 어려움
   - 어떤 리뷰를 신뢰해야 할지 판단 기준 부족

### 1.3 솔루션 개요

**핵심 기능 3가지:**

1. **AI 리뷰 인텔리전스**
   - Gemini/ChatGPT/Claude를 활용한 수백 개 리뷰의 자동 요약
   - 긍정 포인트와 부정 포인트를 명확하게 구분
   - 감성 분석을 통한 전체 평가 시각화

2. **다국어 리뷰 통합 & 번역**
   - 여러 쇼핑몰의 리뷰를 한 곳에서 확인
   - 실시간 한글 번역으로 언어 장벽 제거
   - 자체 한국어 리뷰 시스템으로 신뢰성 강화

3. **큐레이션 중심 쇼핑**
   - 검증된 인기 상품만 엄선하여 제공
   - 카테고리별 베스트 상품 추천
   - 원클릭으로 원본 쇼핑몰 이동 (구매 편의성)

### 1.4 목표 사용자

- **Primary**: 2030 직장인 해외직구 이용자
- **특징**: 
  - 시간이 부족하고, 효율적인 쇼핑을 원함
  - 영어 리뷰를 읽는 데 어려움을 겪음
  - 여러 사이트를 비교하는 것이 번거로움

### 1.5 핵심 성과 지표

| 지표 | 목표 |
|------|------|
| 등록 상품 수 | 50개 이상 |
| 베타 테스터 | 30명 이상 |
| AI 요약 생성 | 100회 이상 |
| 자체 리뷰 | 20개 이상 |
| 평균 세션 시간 | 3분 이상 |
| 구매 결정 시간 단축 | 30분 → 5분 (83% 단축) |

---

## 2. 기술 스택 상세

### 2.1 프론트엔드

#### Next.js 15.5.6
- **App Router**: 최신 라우팅 시스템 사용
- **Server Components**: 기본적으로 서버 컴포넌트 사용, 성능 최적화
- **Server Actions**: API Routes 대신 Server Actions 우선 사용
- **Streaming**: 점진적 페이지 로딩 지원
- **Turbopack**: 빠른 개발 서버 (옵션)

#### React 19
- **Async Request APIs**: `cookies()`, `headers()`, `params` 등이 비동기로 변경
- **Server Components 우선**: 클라이언트 컴포넌트는 필요한 경우에만 사용
- **최신 훅 및 패턴**: 최신 React 기능 활용

#### TypeScript
- **Strict Mode**: 엄격한 타입 체크
- **타입 안정성**: 모든 코드에 타입 정의 필수
- **인터페이스 우선**: 타입보다 인터페이스 사용 권장

### 2.2 스타일링

#### Tailwind CSS v4
- **설정 파일 없음**: `app/globals.css`에만 설정
- **유틸리티 우선**: 빠른 스타일링
- **반응형 디자인**: 모바일 퍼스트 접근

#### shadcn/ui
- **Radix UI 기반**: 접근성 높은 컴포넌트
- **커스터마이징 가능**: 컴포넌트를 직접 수정 가능
- **타입 안전**: TypeScript 완전 지원

#### lucide-react
- **아이콘 라이브러리**: 일관된 아이콘 디자인
- **트리 쉐이킹**: 필요한 아이콘만 번들에 포함

### 2.3 백엔드

#### Next.js Server Actions
- **타입 안전**: TypeScript로 완전한 타입 체크
- **직접 데이터베이스 접근**: API 레이어 없이 직접 접근
- **자동 에러 처리**: Next.js가 자동으로 에러 처리

#### Next.js API Routes
- **제한적 사용**: 웹훅, 외부 API 연동 등 불가피한 경우에만 사용
- **현재 사용 예시**:
  - `/api/sync-user`: Clerk → Supabase 사용자 동기화
  - `/api/summarize-review`: AI 리뷰 요약
  - `/api/translate`: 다국어 번역
  - `/api/payments/*`: 토스페이먼츠 결제 연동

### 2.4 데이터베이스

#### Supabase (PostgreSQL)
- **관계형 데이터베이스**: PostgreSQL 기반
- **Row Level Security (RLS)**: 개발 중 비활성화, 프로덕션에서 활성화
- **실시간 기능**: Supabase Realtime 지원 (향후 활용)
- **Storage**: 파일 저장소 (이미지, 영상 등)

#### 마이그레이션 시스템
- **파일 명명 규칙**: `YYYYMMDDHHmmss_description.sql`
- **버전 관리**: Git으로 마이그레이션 파일 관리
- **롤백 지원**: 필요 시 이전 버전으로 롤백 가능

### 2.5 인증

#### Clerk
- **소셜 로그인**: Google, 이메일 등 다양한 방식 지원
- **한국어 UI**: 한국어 로컬라이제이션 적용
- **Supabase 통합**: 네이티브 통합 방식 사용 (2025년 권장)
- **JWT 템플릿 불필요**: Clerk의 최신 통합 방식 사용

#### 사용자 동기화
- **자동 동기화**: Clerk 로그인 시 자동으로 Supabase `users` 테이블에 동기화
- **SyncUserProvider**: 앱 전역에서 사용자 동기화 실행
- **API Route**: `/api/sync-user`에서 실제 동기화 로직 처리

### 2.6 폼 관리

#### React Hook Form
- **성능 최적화**: 불필요한 리렌더링 최소화
- **간단한 API**: 사용하기 쉬운 API 제공

#### Zod
- **스키마 검증**: TypeScript와 완벽한 통합
- **런타임 검증**: 클라이언트 및 서버에서 모두 검증 가능
- **타입 추론**: Zod 스키마에서 TypeScript 타입 자동 생성

### 2.7 결제 시스템

#### 토스페이먼츠
- **결제 위젯**: 클라이언트 사이드 결제 위젯
- **서버 사이드 승인**: 결제 승인은 서버에서 처리
- **웹훅**: 결제 상태 변경 시 웹훅으로 알림

### 2.8 외부 API 통합

#### Instagram Graph API
- **게시물 가져오기**: Instagram 최신 게시물 표시
- **장기 액세스 토큰**: 60일 만료 토큰 갱신 필요

#### YouTube Data API v3
- **Shorts 영상**: YouTube Shorts 영상 가져오기
- **채널 정보**: 채널 정보 및 최신 영상 조회

### 2.9 개발 도구

#### pnpm
- **패키지 매니저**: 빠른 설치 및 디스크 공간 절약
- **모노레포 지원**: 향후 모노레포 구조로 확장 가능

#### ESLint
- **코드 품질**: 일관된 코드 스타일 유지
- **Next.js 설정**: Next.js 권장 설정 사용

#### TypeScript
- **타입 체크**: 컴파일 타임 타입 검사
- **에디터 지원**: VSCode 등에서 자동완성 지원

---

## 3. 아키텍처 및 구조

### 3.1 디렉토리 구조

```
nextjs-supabase-boilerplate-main/
├── app/                          # Next.js App Router
│   ├── admin/                    # 관리자 페이지
│   │   ├── categories/           # 카테고리 관리
│   │   └── products/            # 상품 관리
│   ├── api/                      # API Routes
│   │   ├── payments/             # 결제 API
│   │   ├── summarize-review/    # AI 요약 API
│   │   ├── sync-user/           # 사용자 동기화 API
│   │   └── translate/           # 번역 API
│   ├── auth-test/                # 인증 테스트 페이지
│   ├── cart/                     # 장바구니 페이지
│   ├── checkout/                 # 결제 페이지
│   ├── events/                   # 이벤트 페이지
│   │   └── lucky-draw/          # 럭키드로우
│   ├── my/                       # 마이페이지
│   │   └── orders/              # 주문 조회
│   ├── products/                 # 상품 페이지
│   │   └── [slug]/              # 상품 상세
│   ├── storage-test/             # 스토리지 테스트
│   ├── layout.tsx                # Root Layout
│   ├── page.tsx                  # 홈페이지
│   ├── globals.css               # 전역 스타일
│   ├── loading.tsx               # 로딩 UI
│   ├── error.tsx                 # 에러 UI
│   └── not-found.tsx            # 404 페이지
│
├── actions/                      # Server Actions
│   ├── cart.ts                   # 장바구니 액션
│   ├── categories.ts             # 카테고리 액션
│   ├── instagram.ts              # Instagram 액션
│   ├── lucky-draw.ts             # 럭키드로우 액션
│   ├── orders.ts                 # 주문 액션
│   ├── products.ts               # 상품 액션
│   ├── reviews.ts                # 리뷰 액션
│   ├── wishlists.ts              # 위시리스트 액션
│   └── youtube.ts                # YouTube 액션
│
├── components/                   # React 컴포넌트
│   ├── admin/                    # 관리자 컴포넌트
│   ├── cart/                     # 장바구니 컴포넌트
│   ├── checkout/                 # 결제 컴포넌트
│   ├── header/                   # 헤더 컴포넌트
│   │   ├── hero-header.tsx       # 히어로 헤더
│   │   ├── category-navbar.tsx   # 카테고리 네비게이션
│   │   ├── top-bar.tsx           # 상단 바
│   │   └── search-bar.tsx       # 검색 바
│   ├── home/                     # 홈페이지 컴포넌트
│   │   ├── todays-new-section.tsx
│   │   ├── lucky-draw-section.tsx
│   │   ├── instagram-feed-section.tsx
│   │   └── youtube-shorts-section.tsx
│   ├── orders/                   # 주문 컴포넌트
│   ├── providers/                  # Context Providers
│   │   └── sync-user-provider.tsx
│   ├── ui/                       # shadcn/ui 컴포넌트
│   ├── add-to-cart-button.tsx
│   ├── ai-summary-box.tsx
│   ├── category-card.tsx
│   ├── product-card.tsx
│   ├── product-detail.tsx
│   ├── product-filters.tsx
│   ├── product-grid.tsx
│   ├── review-form.tsx
│   └── wishlist-item.tsx
│
├── constants/                    # 상수 정의
│   └── navigation.ts             # 네비게이션 데이터
│
├── hooks/                        # Custom React Hooks
│   └── use-sync-user.ts          # 사용자 동기화 훅
│
├── lib/                          # 유틸리티 및 설정
│   ├── supabase/                 # Supabase 클라이언트
│   │   ├── clerk-client.ts       # Client Component용
│   │   ├── server.ts              # Server Component용
│   │   ├── service-role.ts       # 관리자용
│   │   └── client.ts              # 공개 데이터용
│   └── utils.ts                  # 공통 유틸리티
│
├── public/                       # 정적 파일
│   ├── images/                   # 이미지 파일
│   └── icons/                    # 아이콘 파일
│
├── scripts/                      # 스크립트
│   ├── seed.ts                   # 시드 데이터 생성
│   └── filter-detail-images.ts  # 이미지 필터링
│
├── supabase/                     # Supabase 관련 파일
│   ├── migrations/               # 데이터베이스 마이그레이션
│   ├── config.toml              # Supabase 설정
│   └── seed.sql                  # 시드 SQL
│
├── tools/                        # 크롤러 도구 (모노레포)
│   ├── kickstarter-crawler/     # 킥스타터 크롤러
│   ├── wadiz-crawler/           # 와디즈 크롤러
│   ├── amazon-crawler/           # 아마존 크롤러
│   └── shopee-crawler/          # 쇼피 크롤러
│
├── types/                        # TypeScript 타입 정의
│   └── database.ts              # 데이터베이스 타입
│
├── .cursor/                      # Cursor AI 규칙
│   └── rules/                    # 개발 컨벤션
│
├── middleware.ts                 # Next.js 미들웨어
├── server.js                     # 프로덕션 서버
├── package.json
├── tsconfig.json
├── next.config.ts
├── README.md
├── AGENTS.md
└── CLAUDE.md
```

### 3.2 아키텍처 패턴

#### Server Components 우선
- **기본 원칙**: 모든 컴포넌트는 Server Component로 시작
- **클라이언트 컴포넌트**: 인터랙션이 필요한 경우에만 `'use client'` 사용
- **성능 최적화**: 서버에서 데이터를 가져와 초기 로딩 속도 향상

#### Server Actions 우선
- **API Routes 대신**: 가능하면 Server Actions 사용
- **타입 안전**: TypeScript로 완전한 타입 체크
- **직접 DB 접근**: API 레이어 없이 직접 데이터베이스 접근

#### 환경별 클라이언트 분리
- **clerk-client.ts**: Client Component용 (인증된 사용자)
- **server.ts**: Server Component용 (인증된 사용자)
- **service-role.ts**: 관리자 권한 작업
- **client.ts**: 공개 데이터용 (인증 불필요)

### 3.3 데이터 흐름

```
사용자 요청
    ↓
Next.js Middleware (Clerk 인증 확인)
    ↓
Server Component (데이터 fetch)
    ↓
Server Actions / API Routes
    ↓
Supabase Client (환경별)
    ↓
PostgreSQL Database
    ↓
응답 반환
```

### 3.4 인증 흐름

```
1. 사용자 로그인 (Clerk)
   ↓
2. Clerk 세션 토큰 생성
   ↓
3. SyncUserProvider가 자동 실행
   ↓
4. /api/sync-user API 호출
   ↓
5. Supabase users 테이블에 사용자 정보 저장/업데이트
   ↓
6. Supabase 클라이언트가 Clerk 토큰으로 인증
   ↓
7. RLS 정책으로 데이터 접근 제어
```

---

## 4. 데이터베이스 스키마

### 4.1 테이블 구조

#### users
Clerk 인증과 연동되는 사용자 정보

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'user',  -- 'user' | 'admin'
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### categories
상품 카테고리

```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  parent_id UUID REFERENCES categories(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### products
해외직구 상품 정보

```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  
  -- 미디어 (릴스 스타일)
  thumbnail_url TEXT,           -- 9:16 썸네일 이미지
  video_url TEXT,               -- 리뷰 영상 URL
  images TEXT[] DEFAULT '{}',   -- 추가 이미지 배열
  detail_images TEXT[] DEFAULT '{}',  -- 상세 이미지 배열
  
  -- 가격 정보
  original_price DECIMAL(12, 2),        -- 원본 가격 (외화)
  currency TEXT DEFAULT 'USD',           -- 통화 코드
  price_krw DECIMAL(12, 0),             -- 한화 환산 가격
  discount_rate INTEGER DEFAULT 0,      -- 할인율 (%)
  
  -- 상품 출처
  source_platform TEXT NOT NULL,        -- 아마존, 알리익스프레스 등
  source_url TEXT NOT NULL,             -- 원본 상품 링크
  source_product_id TEXT,               -- 원본 사이트 상품 ID
  
  -- 평점 정보
  external_rating DECIMAL(2, 1),        -- 외부 사이트 평점 (0.0-5.0)
  external_review_count INTEGER DEFAULT 0,
  internal_rating DECIMAL(2, 1),        -- 자체 리뷰 평점
  internal_review_count INTEGER DEFAULT 0,
  
  -- 분류
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  tags TEXT[] DEFAULT '{}',
  
  -- 메타
  is_featured BOOLEAN DEFAULT false,    -- 추천 상품
  is_active BOOLEAN DEFAULT true,
  view_count INTEGER DEFAULT 0,
  purchase_count INTEGER DEFAULT 0,      -- 구매자 수
  
  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
```

#### external_reviews
해외 쇼핑몰의 외부 리뷰

```sql
CREATE TABLE external_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  
  -- 리뷰 내용
  author_name TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  content TEXT NOT NULL,
  language TEXT,  -- 'en', 'zh', 'ja' 등
  
  -- 출처
  source_platform TEXT,
  source_url TEXT,
  source_review_id TEXT,
  
  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
```

#### user_reviews
자체 한국어 리뷰 시스템

```sql
CREATE TABLE user_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- 리뷰 내용
  title TEXT,
  content TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  
  -- 미디어
  images TEXT[] DEFAULT '{}',               -- 리뷰 이미지 URL 배열
  
  -- 구매 정보
  purchase_platform TEXT,                   -- 구매한 플랫폼
  purchase_date DATE,                       -- 구매일
  
  -- 상호작용
  helpful_count INTEGER DEFAULT 0,          -- "도움됨" 투표 수
  
  -- 상태
  is_verified BOOLEAN DEFAULT false,        -- 인증된 구매 리뷰
  is_visible BOOLEAN DEFAULT true,          -- 노출 여부
  
  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  
  -- 한 사용자가 한 상품에 하나의 리뷰만 작성 가능
  CONSTRAINT unique_user_product_review UNIQUE (user_id, product_id)
);
```

#### ai_summaries
AI 리뷰 요약 결과 캐싱

```sql
CREATE TABLE ai_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  
  -- 요약 내용
  overall_rating DECIMAL(2, 1),           -- 전체 평점
  positive_points TEXT[],                  -- 긍정 포인트 배열
  negative_points TEXT[],                  -- 부정 포인트 배열
  recommended_for TEXT[],                  -- 추천 대상 배열
  summary_text TEXT,                       -- 요약 텍스트
  
  -- 메타
  review_count INTEGER,                    -- 분석한 리뷰 수
  ai_model TEXT,                          -- 사용한 AI 모델
  language TEXT DEFAULT 'ko',              -- 요약 언어
  
  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  
  -- 한 상품당 하나의 요약만 유지
  CONSTRAINT unique_product_summary UNIQUE (product_id)
);
```

#### wishlists
위시리스트

```sql
CREATE TABLE wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  
  -- 한 사용자가 한 상품을 중복으로 저장할 수 없음
  CONSTRAINT unique_user_product_wishlist UNIQUE (user_id, product_id)
);
```

#### carts
장바구니

```sql
CREATE TABLE carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  
  -- 한 사용자가 한 상품을 중복으로 담을 수 없음
  CONSTRAINT unique_user_product_cart UNIQUE (user_id, product_id)
);
```

#### orders
주문 정보

```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  order_number TEXT NOT NULL UNIQUE,
  status order_status NOT NULL DEFAULT 'pending',
  total_amount INTEGER NOT NULL CHECK (total_amount >= 0),
  
  -- 배송 정보
  shipping_name TEXT,
  shipping_phone TEXT,
  shipping_address TEXT,
  shipping_memo TEXT,
  
  -- 결제 정보 (토스페이먼츠)
  payment_key TEXT,
  payment_method TEXT,
  paid_at TIMESTAMPTZ,
  
  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### order_items
주문 상품

```sql
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price INTEGER NOT NULL CHECK (price >= 0),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### lucky_draw_events
럭키드로우 이벤트

```sql
CREATE TABLE lucky_draw_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  prize_image_url TEXT,
  prize_product_id UUID REFERENCES products(id),
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### recent_views
최근 본 상품

```sql
CREATE TABLE recent_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  
  -- 한 사용자가 한 상품을 여러 번 볼 수 있지만, 최신 시점만 유지
  CONSTRAINT unique_user_product_recent_view UNIQUE (user_id, product_id)
);
```

#### review_votes
리뷰 "도움됨" 투표

```sql
CREATE TABLE review_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES user_reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  
  -- 한 사용자가 한 리뷰에 하나의 투표만 가능
  CONSTRAINT unique_user_review_vote UNIQUE (user_id, review_id)
);
```

### 4.2 인덱스

성능 최적화를 위한 주요 인덱스:

- `products`: `slug`, `category_id`, `is_featured`, `is_active`, `created_at`
- `user_reviews`: `product_id`, `user_id`, `rating`, `created_at`, `helpful_count`
- `external_reviews`: `product_id`, `created_at`
- `wishlists`: `user_id`, `product_id`
- `carts`: `user_id`, `product_id`
- `orders`: `user_id`, `order_number`, `status`, `created_at`
- `order_items`: `order_id`, `product_id`
- `recent_views`: `user_id`, `viewed_at`

### 4.3 Row Level Security (RLS)

**개발 단계**: RLS 비활성화 (빠른 개발을 위해)

**프로덕션 단계**: RLS 활성화 및 정책 설정

예시 정책:

```sql
-- 사용자는 자신의 데이터만 조회 가능
CREATE POLICY "Users can view their own data"
  ON user_reviews FOR SELECT
  USING (auth.jwt()->>'sub' = (SELECT clerk_id FROM users WHERE id = user_id));

-- 사용자는 자신의 데이터만 삽입 가능
CREATE POLICY "Users can insert their own data"
  ON user_reviews FOR INSERT
  WITH CHECK (auth.jwt()->>'sub' = (SELECT clerk_id FROM users WHERE id = user_id));
```

---

## 5. 주요 기능 상세

### 5.1 홈페이지

#### HeroHeader
- **중세 세계지도 배경**: 대항해시대 컨셉의 히어로 헤더
- **로고**: "해외직구멀티샵" 골드/베이지 톤 텍스트
- **검색창**: 초록색 테두리, 돋보기 아이콘
- **SNS 링크**: YouTube, Instagram 링크 버튼
- **사용자 메뉴**: 로그인/회원가입, 장바구니, 주문조회, 마이쇼핑

#### CategoryNavbar
- **11개 카테고리**: 프리오더, 체험단 모집, 신상품, 전자기기, 뷰티, 패션, 푸드, 주방용품, 스포츠, 유아용품, 홈인테리어
- **햄버거 메뉴**: 모바일에서 전체 카테고리 펼치기
- **스티키 포지션**: 스크롤 시 상단 고정

#### Today's New Section
- **오늘의 신상품**: 최근 등록된 상품 4개 표시
- **9:16 릴스 스타일**: 세로형 썸네일
- **할인 정보**: 할인율 빨간색 배지, 원가 취소선
- **구매자 수**: "N명 구매중" 표시

#### Lucky Draw Section
- **대항해시대 테마**: 무역선 배경 이미지
- **실시간 타이머**: 마감까지 남은 시간 (일/시/분/초/1/100초)
- **모래시계 일러스트**: 시각적 효과
- **경품 이미지**: 클릭 가능한 상품 이미지

#### Instagram Feed Section
- **최신 게시물**: Instagram 최신 6개 게시물 표시
- **그리드 레이아웃**: 반응형 그리드
- **Instagram 링크**: 클릭 시 Instagram 프로필로 이동

#### YouTube Shorts Section
- **최신 쇼츠**: YouTube Shorts 최신 12개 영상 표시
- **썸네일**: 영상 썸네일 이미지
- **YouTube 링크**: 클릭 시 YouTube 영상으로 이동

### 5.2 상품 목록 페이지 (`/products`)

#### 릴스 스타일 그리드
- **9:16 비율**: 세로형 썸네일
- **호버 효과**: 호버 시 영상 자동 재생 (무음)
- **반응형**: 데스크탑 4열, 태블릿 3열, 모바일 2열

#### 필터링 및 정렬
- **카테고리 필터**: 카테고리별 상품 필터링
- **가격순 정렬**: 낮은 가격순, 높은 가격순
- **검색 기능**: 제목, 설명으로 검색
- **추천 상품 필터**: `is_featured=true` 상품만 표시

#### 상품 카드 정보
- **썸네일**: 9:16 비율 이미지
- **제목**: 상품명
- **가격**: 할인율, 할인가, 원가
- **구매자 수**: "N명 구매중" 표시
- **평점**: 별점 표시

### 5.3 상품 상세 페이지 (`/products/[slug]`)

#### 상품 정보 섹션
- **이미지 갤러리**: 썸네일, 영상, 추가 이미지
- **상품명**: 제목
- **가격 정보**: 할인율, 할인가, 원가
- **평점**: 외부 평점, 자체 평점
- **설명**: 상품 설명
- **구매 링크**: 원본 쇼핑몰로 이동하는 버튼
- **장바구니 담기**: 장바구니에 추가 버튼

#### AI 요약 박스
- **전체 평가**: 평점 시각화
- **긍정 포인트**: AI가 추출한 긍정적인 내용
- **부정 포인트**: AI가 추출한 부정적인 내용
- **추천 대상**: 이 상품을 추천할 만한 대상

#### 외부 리뷰 목록
- **리뷰 목록**: 해외 쇼핑몰의 리뷰 표시
- **번역 토글**: 원문/번역 전환
- **평점**: 별점 표시
- **작성자**: 리뷰 작성자명

#### 자체 리뷰 목록
- **한국어 리뷰**: 자체 리뷰 시스템의 리뷰
- **별점**: 1-5점 별점
- **이미지**: 리뷰 이미지
- **"도움됨" 투표**: 다른 사용자가 도움이 되었다고 투표
- **리뷰 작성**: 로그인한 사용자가 리뷰 작성 가능

### 5.4 장바구니 (`/cart`)

#### 장바구니 아이템
- **상품 정보**: 썸네일, 제목, 가격
- **수량 조절**: 수량 증가/감소 버튼
- **삭제**: 장바구니에서 제거
- **총액 계산**: 수량 × 가격

#### 장바구니 요약
- **총 상품 금액**: 모든 상품의 합계
- **배송비**: 배송비 정보 (향후 추가)
- **총 결제 금액**: 최종 결제 금액
- **결제하기 버튼**: 결제 페이지로 이동

### 5.5 결제 (`/checkout`)

#### 배송 정보 입력
- **이름**: 받는 사람 이름
- **전화번호**: 연락처
- **주소**: 배송 주소
- **배송 메모**: 배송 시 요청사항

#### 결제 위젯 (토스페이먼츠)
- **결제 수단 선택**: 카드, 계좌이체 등
- **결제 금액**: 최종 결제 금액
- **결제 버튼**: 결제 진행

#### 결제 프로세스
1. 사용자가 결제 정보 입력
2. `/api/payments/request`로 주문 생성
3. 토스페이먼츠 결제 위젯으로 결제 진행
4. `/api/payments/confirm`으로 결제 승인
5. `/checkout/success` 또는 `/checkout/fail`로 리다이렉트

### 5.6 주문 조회 (`/my/orders`)

#### 주문 목록
- **주문 번호**: 고유 주문 번호
- **주문일**: 주문한 날짜
- **상품 정보**: 주문한 상품 목록
- **주문 상태**: pending, paid, shipping, delivered, cancelled
- **총 금액**: 주문 총액

#### 주문 상세 (`/my/orders/[id]`)
- **주문 정보**: 주문 번호, 주문일, 상태
- **상품 목록**: 주문한 상품 상세 정보
- **배송 정보**: 배송지 정보
- **결제 정보**: 결제 수단, 결제일
- **취소 버튼**: 주문 취소 (pending 상태일 때만)

### 5.7 마이페이지 (`/my`)

#### 내 리뷰
- **작성한 리뷰 목록**: 내가 작성한 리뷰 표시
- **리뷰 수정/삭제**: 리뷰 수정 및 삭제 가능

#### 위시리스트
- **저장한 상품**: 위시리스트에 추가한 상품 목록
- **상품 제거**: 위시리스트에서 제거

### 5.8 관리자 페이지 (`/admin`)

#### 상품 관리
- **상품 목록**: 모든 상품 목록 표시
- **상품 등록**: 새 상품 등록 (`/admin/products/new`)
- **상품 수정**: 상품 정보 수정 (`/admin/products/[id]/edit`)
- **상품 삭제**: 상품 삭제

#### 카테고리 관리
- **카테고리 목록**: 모든 카테고리 목록
- **카테고리 등록**: 새 카테고리 등록
- **카테고리 수정**: 카테고리 정보 수정
- **카테고리 삭제**: 카테고리 삭제

---

## 6. API 및 Server Actions

### 6.1 Server Actions

#### products.ts
```typescript
// 상품 목록 가져오기
getProducts(filters?: ProductFilters): Promise<Product[]>

// 추천 상품 가져오기
getFeaturedProducts(limit?: number): Promise<Product[]>

// 신상품 가져오기
getNewProducts(limit?: number): Promise<Product[]>

// 상품 상세 가져오기
getProductBySlug(slug: string): Promise<Product | null>

// 상품 검색
searchProducts(query: string): Promise<Product[]>
```

#### reviews.ts
```typescript
// 상품의 리뷰 가져오기
getProductReviews(productId: string): Promise<UserReview[]>

// 리뷰 작성
createReview(data: ReviewInsert): Promise<UserReview>

// 리뷰 수정
updateReview(reviewId: string, data: Partial<ReviewInsert>): Promise<UserReview>

// 리뷰 삭제
deleteReview(reviewId: string): Promise<void>

// "도움됨" 투표
voteReview(reviewId: string): Promise<void>
```

#### cart.ts
```typescript
// 장바구니 가져오기
getCart(): Promise<CartItem[]>

// 장바구니에 추가
addToCart(productId: string, quantity?: number): Promise<void>

// 장바구니 수량 업데이트
updateCartItem(productId: string, quantity: number): Promise<void>

// 장바구니에서 제거
removeFromCart(productId: string): Promise<void>

// 장바구니 비우기
clearCart(): Promise<void>
```

#### orders.ts
```typescript
// 주문 목록 가져오기
getOrders(): Promise<Order[]>

// 주문 상세 가져오기
getOrderById(orderId: string): Promise<Order | null>

// 주문 취소
cancelOrder(orderId: string): Promise<void>
```

#### wishlists.ts
```typescript
// 위시리스트 가져오기
getWishlist(): Promise<WishlistItem[]>

// 위시리스트에 추가
addToWishlist(productId: string): Promise<void>

// 위시리스트에서 제거
removeFromWishlist(productId: string): Promise<void>
```

#### instagram.ts
```typescript
// Instagram 피드 가져오기
getInstagramFeed(limit?: number): Promise<InstagramPost[]>
```

#### youtube.ts
```typescript
// YouTube Shorts 가져오기
getYouTubeShorts(limit?: number): Promise<YouTubeShort[]>
```

#### lucky-draw.ts
```typescript
// 활성 럭키드로우 이벤트 가져오기
getActiveLuckyDrawEvent(): Promise<LuckyDrawEvent | null>
```

### 6.2 API Routes

#### `/api/sync-user` (POST)
Clerk 사용자를 Supabase users 테이블에 동기화

**요청**:
```typescript
{
  clerkId: string;
  name: string;
  email?: string;
}
```

**응답**:
```typescript
{
  success: boolean;
  user?: User;
  error?: string;
}
```

#### `/api/summarize-review` (POST)
AI를 사용하여 리뷰 요약 생성

**요청**:
```typescript
{
  productId: string;
  reviews: Review[];
}
```

**응답**:
```typescript
{
  overallRating: number;
  positivePoints: string[];
  negativePoints: string[];
  recommendedFor: string[];
  summaryText: string;
}
```

#### `/api/translate` (POST)
다국어 텍스트를 한국어로 번역

**요청**:
```typescript
{
  text: string;
  sourceLanguage: string;
  targetLanguage: string;
}
```

**응답**:
```typescript
{
  translatedText: string;
}
```

#### `/api/payments/request` (POST)
주문 생성 및 결제 요청

**요청**:
```typescript
{
  items: CartItem[];
  shippingInfo: ShippingInfo;
}
```

**응답**:
```typescript
{
  orderId: string;
  orderNumber: string;
  paymentKey: string;
  amount: number;
}
```

#### `/api/payments/confirm` (POST)
결제 승인

**요청**:
```typescript
{
  paymentKey: string;
  orderId: string;
  amount: number;
}
```

**응답**:
```typescript
{
  success: boolean;
  order?: Order;
  error?: string;
}
```

#### `/api/payments/webhook` (POST)
토스페이먼츠 웹훅 처리

**요청**: 토스페이먼츠 웹훅 페이로드

**응답**:
```typescript
{
  success: boolean;
}
```

---

## 7. 컴포넌트 구조

### 7.1 헤더 컴포넌트

#### HeroHeader
- **위치**: `components/header/hero-header.tsx`
- **기능**: 메인 히어로 헤더 (로고, 검색창, 사용자 메뉴)
- **하위 컴포넌트**: TopBar, SearchBar, SiteLogo

#### CategoryNavbar
- **위치**: `components/header/category-navbar.tsx`
- **기능**: 카테고리 네비게이션 바
- **하위 컴포넌트**: HomeButton, HamburgerMenu

### 7.2 홈페이지 컴포넌트

#### TodaysNewSection
- **위치**: `components/home/todays-new-section.tsx`
- **기능**: 오늘의 신상품 섹션

#### LuckyDrawSection
- **위치**: `components/home/lucky-draw-section.tsx`
- **기능**: 럭키드로우 이벤트 섹션 (실시간 타이머)

#### InstagramFeedSection
- **위치**: `components/home/instagram-feed-section.tsx`
- **기능**: Instagram 피드 섹션

#### YouTubeShortsSection
- **위치**: `components/home/youtube-shorts-section.tsx`
- **기능**: YouTube Shorts 섹션

### 7.3 상품 컴포넌트

#### ProductCard
- **위치**: `components/product-card.tsx`
- **기능**: 상품 카드 (9:16 릴스 스타일)
- **특징**: 호버 시 영상 자동 재생

#### ProductGrid
- **위치**: `components/product-grid.tsx`
- **기능**: 상품 그리드 레이아웃

#### ProductDetail
- **위치**: `components/product-detail.tsx`
- **기능**: 상품 상세 정보 표시

#### ProductFilters
- **위치**: `components/product-filters.tsx`
- **기능**: 상품 필터링 UI

### 7.4 리뷰 컴포넌트

#### ReviewForm
- **위치**: `components/review-form.tsx`
- **기능**: 리뷰 작성 폼

#### UserReviewList
- **위치**: `components/user-review-list.tsx`
- **기능**: 자체 리뷰 목록

#### ExternalReviewList
- **위치**: `components/external-review-list.tsx`
- **기능**: 외부 리뷰 목록 (번역 토글 포함)

#### AISummaryBox
- **위치**: `components/ai-summary-box.tsx`
- **기능**: AI 리뷰 요약 박스

### 7.5 장바구니 컴포넌트

#### CartItem
- **위치**: `components/cart/cart-item.tsx`
- **기능**: 장바구니 아이템 표시

#### CartSummary
- **위치**: `components/cart/cart-summary.tsx`
- **기능**: 장바구니 요약 (총액 계산)

#### AddToCartButton
- **위치**: `components/add-to-cart-button.tsx`
- **기능**: 장바구니에 추가 버튼

### 7.6 결제 컴포넌트

#### CheckoutForm
- **위치**: `components/checkout/checkout-form.tsx`
- **기능**: 결제 폼 (배송 정보 + 결제 위젯)

### 7.7 관리자 컴포넌트

#### ProductForm
- **위치**: `components/admin/product-form.tsx`
- **기능**: 상품 등록/수정 폼

#### CategoryForm
- **위치**: `components/admin/category-form.tsx`
- **기능**: 카테고리 등록/수정 폼

---

## 8. 인증 및 보안

### 8.1 Clerk 인증

#### 인증 방식
- **소셜 로그인**: Google, 이메일 등
- **한국어 UI**: Clerk 한국어 로컬라이제이션 적용
- **세션 관리**: Clerk가 자동으로 세션 관리

#### 미들웨어 설정
```typescript
// middleware.ts
export default clerkMiddleware((auth, req) => {
  // 보호된 라우트 설정
  if (req.nextUrl.pathname.startsWith('/admin')) {
    auth().protect();
  }
});
```

### 8.2 Supabase 인증 통합

#### 네이티브 통합
- **JWT 템플릿 불필요**: Clerk의 최신 통합 방식 사용
- **토큰 자동 전달**: Clerk 세션 토큰이 자동으로 Supabase에 전달
- **RLS 정책**: `auth.jwt()->>'sub'`로 Clerk user ID 확인

#### 사용자 동기화
- **자동 동기화**: 로그인 시 자동으로 Supabase users 테이블에 동기화
- **SyncUserProvider**: 앱 전역에서 사용자 동기화 실행
- **API Route**: `/api/sync-user`에서 실제 동기화 로직 처리

### 8.3 Row Level Security (RLS)

#### 개발 단계
- **RLS 비활성화**: 빠른 개발을 위해 RLS 비활성화
- **권한 부여**: anon, authenticated, service_role에 모든 권한 부여

#### 프로덕션 단계
- **RLS 활성화**: 모든 테이블에 RLS 활성화
- **정책 설정**: 사용자별 데이터 접근 제어
- **보안 강화**: 민감한 데이터 보호

### 8.4 환경 변수 보안

#### 클라이언트 사이드
- **NEXT_PUBLIC_**: 클라이언트에서 접근 가능한 환경 변수
- **공개 키만**: 공개해도 안전한 키만 사용

#### 서버 사이드
- **SECRET_KEY**: 서버에서만 접근 가능한 비밀 키
- **절대 공개 금지**: service_role 키 등은 절대 공개하지 않음

---

## 9. 외부 서비스 통합

### 9.1 Instagram Graph API

#### 설정
- **장기 액세스 토큰**: 60일 만료 토큰 사용
- **토큰 갱신**: 60일마다 토큰 갱신 필요
- **환경 변수**: `INSTAGRAM_ACCESS_TOKEN`

#### 기능
- **게시물 가져오기**: Instagram 최신 게시물 가져오기
- **이미지 표시**: 게시물 이미지를 홈페이지에 표시
- **링크 연결**: Instagram 프로필로 이동

### 9.2 YouTube Data API v3

#### 설정
- **API 키**: YouTube Data API v3 키 사용
- **환경 변수**: `YOUTUBE_API_KEY`

#### 기능
- **Shorts 영상**: YouTube Shorts 영상 가져오기
- **썸네일 표시**: 영상 썸네일 이미지 표시
- **링크 연결**: YouTube 영상으로 이동

### 9.3 토스페이먼츠

#### 설정
- **클라이언트 키**: 클라이언트 사이드에서 사용
- **시크릿 키**: 서버 사이드에서 사용
- **환경 변수**: `NEXT_PUBLIC_TOSS_CLIENT_KEY`, `TOSS_SECRET_KEY`

#### 기능
- **결제 위젯**: 클라이언트 사이드 결제 위젯
- **결제 승인**: 서버 사이드에서 결제 승인
- **웹훅**: 결제 상태 변경 시 웹훅으로 알림

### 9.4 AI 서비스 (향후)

#### OpenAI
- **GPT-4**: 리뷰 요약에 사용 (향후)
- **환경 변수**: `OPENAI_API_KEY`

#### Claude
- **Claude API**: 리뷰 요약에 사용 (향후)
- **환경 변수**: `CLAUDE_API_KEY`

#### Gemini
- **Gemini API**: 리뷰 요약에 사용 (향후)
- **환경 변수**: `GEMINI_API_KEY`

---

## 10. 개발 프로세스

### 10.1 개발 환경 설정

#### 필수 요구사항
- Node.js v18 이상
- pnpm (패키지 매니저)
- Git

#### 초기 설정
```bash
# 저장소 클론
git clone <repository-url>
cd nextjs-supabase-boilerplate-main

# 의존성 설치
pnpm install

# 환경 변수 설정
cp .env.example .env
# .env 파일에 필요한 값 입력

# 개발 서버 실행
pnpm dev
```

### 10.2 데이터베이스 마이그레이션

#### 마이그레이션 실행
```bash
# Supabase Dashboard에서 SQL Editor 사용
# 또는 Supabase CLI 사용
supabase db push
```

#### 마이그레이션 파일 생성
- **명명 규칙**: `YYYYMMDDHHmmss_description.sql`
- **예시**: `20241203000001_create_categories.sql`

### 10.3 개발 워크플로우

#### 기능 개발
1. **기능 명세 작성**: PRD 또는 TODO.md 참고
2. **데이터베이스 스키마**: 필요 시 마이그레이션 생성
3. **Server Actions**: 데이터 로직 구현
4. **컴포넌트**: UI 컴포넌트 구현
5. **페이지**: 페이지 라우트 구현
6. **테스트**: 수동 테스트 및 자동화 테스트

#### 코드 리뷰
- **타입 안전성**: TypeScript 타입 체크
- **코드 스타일**: ESLint 규칙 준수
- **성능**: 불필요한 리렌더링 최소화
- **접근성**: WCAG 가이드라인 준수

### 10.4 테스트

#### 수동 테스트
- **기능 테스트**: 주요 기능 동작 확인
- **UI 테스트**: 사용자 인터페이스 확인
- **반응형 테스트**: 다양한 화면 크기에서 테스트

#### 자동화 테스트 (향후)
- **E2E 테스트**: Playwright 사용
- **단위 테스트**: Jest 사용
- **통합 테스트**: API 및 Server Actions 테스트

### 10.5 배포

#### Vercel 배포
1. **프로젝트 연결**: Vercel에 GitHub 저장소 연결
2. **환경 변수 설정**: Vercel 대시보드에서 환경 변수 설정
3. **자동 배포**: Git push 시 자동 배포

#### 환경 변수 설정
- **프로덕션**: Vercel 대시보드에서 설정
- **프리뷰**: Pull Request마다 프리뷰 환경 생성
- **개발**: 로컬 `.env` 파일 사용

---

## 11. 배포 및 운영

### 11.1 배포 환경

#### Vercel
- **호스팅**: Vercel에서 Next.js 앱 호스팅
- **CDN**: 글로벌 CDN으로 빠른 로딩 속도
- **자동 배포**: Git push 시 자동 배포

#### Supabase
- **데이터베이스**: Supabase PostgreSQL 데이터베이스
- **Storage**: Supabase Storage 사용
- **인증**: Clerk와 Supabase 통합

### 11.2 모니터링

#### 에러 추적 (향후)
- **Sentry**: 에러 추적 및 모니터링
- **로그 분석**: Vercel Analytics 사용

#### 성능 모니터링 (향후)
- **Vercel Analytics**: 페이지 로딩 속도 모니터링
- **Core Web Vitals**: 사용자 경험 지표 모니터링

### 11.3 백업 및 복구

#### 데이터베이스 백업
- **Supabase 자동 백업**: Supabase가 자동으로 백업
- **수동 백업**: 필요 시 수동으로 백업 생성

#### 복구 절차
1. **백업 확인**: 최신 백업 확인
2. **데이터베이스 복구**: Supabase 대시보드에서 복구
3. **검증**: 복구 후 데이터 검증

### 11.4 확장성

#### 수평 확장
- **Vercel 자동 확장**: 트래픽에 따라 자동 확장
- **Supabase 확장**: 필요 시 Supabase 플랜 업그레이드

#### 성능 최적화
- **이미지 최적화**: Next.js Image 컴포넌트 사용
- **코드 스플리팅**: 자동 코드 스플리팅
- **캐싱**: 적절한 캐싱 전략 사용

---

## 12. 향후 계획

### 12.1 단기 계획 (1-3개월)

#### AI 리뷰 요약 고도화
- **실제 AI API 연동**: OpenAI, Claude, Gemini API 연동
- **감정 분석**: 리뷰 감정 분석 기능 추가
- **키워드 추출**: 주요 키워드 자동 추출

#### 크롤링 시스템 고도화
- **자동 크롤링**: 정기적으로 상품 정보 크롤링
- **가격 추적**: 가격 변동 추적 및 알림
- **리뷰 크롤링**: 외부 리뷰 자동 크롤링

#### 결제 시스템 개선
- **다양한 결제 수단**: 추가 결제 수단 지원
- **결제 내역 관리**: 결제 내역 상세 관리

### 12.2 중기 계획 (3-6개월)

#### 모바일 앱
- **React Native**: 모바일 앱 개발
- **푸시 알림**: 가격 변동, 재입고 알림 등

#### 개인화 추천
- **AI 추천**: 사용자 행동 기반 상품 추천
- **맞춤형 피드**: 개인화된 상품 피드

#### 커뮤니티 기능
- **리뷰 댓글**: 리뷰에 댓글 작성
- **Q&A**: 상품 Q&A 기능
- **커뮤니티 게시판**: 사용자 간 정보 공유

### 12.3 장기 계획 (6개월 이상)

#### 글로벌 확장
- **다국어 지원**: 영어, 중국어, 일본어 등
- **다른 국가 시장**: 해외 시장 진출

#### 라이브 커머스
- **라이브 스트리밍**: 상품 소개 라이브 스트리밍
- **실시간 구매**: 라이브 중 실시간 구매

#### B2B 서비스
- **판매자 플랫폼**: 판매자용 대시보드
- **수수료 모델**: 거래 수수료 수익 모델

---

## 부록

### A. 주요 파일 경로

- **홈페이지**: `app/page.tsx`
- **상품 목록**: `app/products/page.tsx`
- **상품 상세**: `app/products/[slug]/page.tsx`
- **장바구니**: `app/cart/page.tsx`
- **결제**: `app/checkout/page.tsx`
- **주문 조회**: `app/my/orders/page.tsx`
- **관리자**: `app/admin/page.tsx`

### B. 환경 변수 목록

```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_STORAGE_BUCKET=uploads

# 토스페이먼츠
NEXT_PUBLIC_TOSS_CLIENT_KEY=
TOSS_SECRET_KEY=

# Instagram
INSTAGRAM_ACCESS_TOKEN=

# YouTube
YOUTUBE_API_KEY=

# AI (향후)
OPENAI_API_KEY=
CLAUDE_API_KEY=
GEMINI_API_KEY=
```

### C. 참고 문서

- [PRD](./prd.md) - 제품 요구사항 문서
- [기획서](./newproject.md) - 상세 기획서
- [AGENTS.md](../AGENTS.md) - 기술 가이드
- [TODO.md](./TODO.md) - 개발 체크리스트
- [INSTAGRAM_SETUP.md](./INSTAGRAM_SETUP.md) - Instagram 설정 가이드
- [YOUTUBE_SETUP.md](./YOUTUBE_SETUP.md) - YouTube 설정 가이드
- [DEPLOY.md](./DEPLOY.md) - 배포 가이드
- [TESTING.md](./TESTING.md) - 테스트 가이드

---

**문서 버전**: 1.0  
**최종 업데이트**: 2025년 1월  
**작성자**: 개발팀
