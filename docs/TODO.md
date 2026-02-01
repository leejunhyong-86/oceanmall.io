# 해외직구멀티샵 MVP - 개발 체크리스트

## Phase 1: 프로젝트 기반 설정 (1주차) ✅

### 프로젝트 초기화
- [x] package.json 프로젝트명 변경 (`global-shop-multi`)
- [x] pnpm 의존성 설치
- [x] docs/prd.md 작성
- [x] docs/TODO.md 작성

### 데이터베이스 스키마
- [x] categories 테이블 마이그레이션
- [x] products 테이블 마이그레이션
- [x] external_reviews 테이블 마이그레이션
- [x] user_reviews 테이블 마이그레이션
- [x] ai_summaries 테이블 마이그레이션
- [x] wishlists 테이블 마이그레이션
- [x] review_votes 테이블 마이그레이션
- [x] recent_views 테이블 마이그레이션

### 디렉토리 구조
- [x] types/ 디렉토리 및 타입 정의
- [x] actions/ 디렉토리 및 Server Actions
- [x] lib/ai/ AI 서비스 추상화 레이어

---

## Phase 2: 핵심 기능 개발 (2주차) ✅

### 상품 목록 페이지 (릴스 스타일)
- [x] /products 페이지 생성
- [x] ProductCard 컴포넌트 (9:16 비율)
- [x] 호버 시 영상 재생 기능
- [x] 반응형 그리드 (4/3/2열)
- [x] 카테고리 필터
- [x] 가격순 정렬
- [x] 검색 기능

### 상품 상세 페이지
- [x] /products/[slug] 페이지 생성
- [x] 상품 정보 섹션
- [x] 영상/이미지 플레이어
- [x] AI 요약 박스 UI
- [x] 외부 리뷰 목록 (번역 토글)
- [x] 구매 링크 버튼

### AI 요약 시스템
- [x] /api/summarize-review API 라우트
- [x] AI 서비스 인터페이스 정의
- [x] Mock AI 응답 구현
- [x] 요약 결과 캐싱 로직

---

## Phase 3: 사용자 기능 (3주차) ✅

### 자체 리뷰 시스템
- [x] ReviewForm 컴포넌트
- [x] 별점 입력 UI
- [x] 리뷰 목록 컴포넌트
- [x] "도움됨" 투표 기능
- [x] Server Actions (CRUD)

### 마이페이지
- [x] /my 페이지 레이아웃
- [x] 내 리뷰 목록
- [x] 위시리스트

### 다국어 번역
- [x] 번역 토글 버튼 UI
- [x] /api/translate API 라우트
- [x] 번역 서비스 인터페이스

---

## Phase 4: 관리자 및 마무리 (4주차) ✅

### 관리자 페이지
- [x] /admin 대시보드
- [x] 상품 목록 페이지
- [x] 카테고리 관리 페이지

### UI/UX 개선
- [x] 로딩 스켈레톤
- [x] 에러 바운더리
- [x] not-found 페이지
- [x] Navbar 업데이트

### 테스트 및 배포
- [x] 주요 기능 수동 테스트 (docs/TESTING.md)
- [x] 샘플 데이터 50개 입력 (supabase/seed.sql, scripts/seed.ts)
- [x] 환경 변수 문서화 (docs/ENV.md)
- [x] Vercel 배포 설정 (docs/DEPLOY.md)

---

## Phase 5: 홈페이지 헤더 재디자인 ✅

### 히어로 헤더 컴포넌트
- [x] components/header/ 디렉토리 구조 생성
- [x] HeroHeader 컴포넌트 (메인 컨테이너)
- [x] TopBar 컴포넌트 (SNS 링크 + 사용자 메뉴)
- [x] SearchBar 컴포넌트 (초록색 테두리, 돋보기 아이콘)
- [x] SiteLogo 컴포넌트 ("해외직구멀티샵" 디자인 텍스트)

### 디자인 적용
- [x] 중세 세계지도 배경 이미지 (public/images/hero-bg.jpg)
- [x] 골드/베이지 톤 로고 텍스트
- [x] 초록색 검색창 스타일링

### 레이아웃 수정
- [x] 홈페이지에 HeroHeader 적용
- [x] Navbar 조건부 렌더링 (홈페이지에서 숨김)
- [x] 반응형 디자인 (데스크탑/태블릿/모바일)

### 사용자 메뉴
- [x] YouTube, Instagram SNS 링크 버튼
- [x] 로그인/회원가입 (Clerk 연동)
- [x] 장바구니/주문조회 (준비 중 안내)
- [x] 마이쇼핑 링크

---

## Phase 6: 카테고리 네비게이션 바 ✅

### 네비게이션 바 컴포넌트
- [x] constants/navigation.ts - 카테고리 데이터 및 타입 정의
- [x] components/header/home-button.tsx - 닻 아이콘 홈 버튼
- [x] components/header/hamburger-menu.tsx - 햄버거 메뉴 및 전체 카테고리 드롭다운
- [x] components/header/category-navbar.tsx - 메인 네비게이션 바 컨테이너

### 카테고리 구조 (11개)
- 프리오더, 체험단 모집, 신상품
- 전자기기, 뷰티, 패션, 푸드
- 주방용품, 스포츠, 유아용품, 홈인테리어

### 레이아웃 적용
- [x] 홈페이지에 CategoryNavbar 적용 (HeroHeader 아래)
- [x] 반응형 디자인 (데스크탑/태블릿/모바일)

### 기능
- [x] 닻 아이콘 홈 버튼 (항구 컨셉)
- [x] 햄버거 메뉴로 전체 카테고리 펼치기
- [x] 세부 카테고리 표시
- [x] 외부 클릭 시 드롭다운 닫기
- [x] ESC 키로 드롭다운 닫기
- [x] 스티키 포지션 (스크롤 시 상단 고정)

---

## Phase 7: 오늘의 신상품 섹션 ✅

### 데이터베이스 확장
- [x] products 테이블에 discount_rate 필드 추가
- [x] products 테이블에 purchase_count 필드 추가
- [x] 마이그레이션 파일 생성

### 타입 및 API
- [x] types/database.ts - Product 인터페이스 확장
- [x] actions/products.ts - getNewProducts 함수 추가

### 컴포넌트
- [x] components/product-card.tsx - 할인율/구매자수 정보 추가
- [x] components/home/todays-new-section.tsx - 신상품 섹션 컴포넌트

### 레이아웃
- [x] app/page.tsx - CategoryNavbar 아래에 신상품 섹션 배치

### 디자인
- [x] 9:16 릴스 스타일 상품 카드 유지
- [x] 할인율 빨간색 배지
- [x] 원가 취소선 표시
- [x] 구매자 수 표시
- [x] "+ 모두보기" 버튼 (초록색 테두리)

---

## Phase 8: 럭키드로우 이벤트 섹션 ✅

### 데이터베이스
- [x] lucky_draw_events 테이블 마이그레이션

### 타입 및 API
- [x] types/database.ts - LuckyDrawEvent 인터페이스
- [x] actions/lucky-draw.ts - getActiveLuckyDrawEvent 함수

### 컴포넌트
- [x] components/home/lucky-draw-section.tsx - 럭키드로우 섹션 (실시간 타이머)
- [x] public/images/hourglass.svg - 모래시계 일러스트
- [x] public/images/lucky-draw-bg.png - 대항해시대 무역선 배경

### 페이지
- [x] app/events/lucky-draw/page.tsx - 럭키드로우 상세 페이지

### 레이아웃
- [x] app/page.tsx - 신상품 섹션 아래에 럭키드로우 섹션 배치

### 디자인
- [x] 대항해시대 지도/종이 질감 배경
- [x] 웅장한 무역선 이미지
- [x] 실시간 카운트다운 타이머 (100분의1초 포함)
- [x] 모래시계 일러스트
- [x] 바로가기 버튼 및 클릭 가능한 상품 이미지

---

## Phase 9: 이커머스 기능 ✅

### 데이터베이스
- [x] carts 테이블 마이그레이션
- [x] orders 테이블 마이그레이션
- [x] order_items 테이블 마이그레이션
- [x] Cart, Order, OrderItem 타입 정의

### 장바구니
- [x] actions/cart.ts Server Actions
- [x] /cart 장바구니 페이지
- [x] CartItem, CartSummary 컴포넌트
- [x] AddToCartButton 컴포넌트
- [x] 상품 상세 페이지에 장바구니 담기 버튼 추가

### 결제 (토스페이먼츠)
- [x] @tosspayments/tosspayments-sdk 설치
- [x] 환경 변수 설정 (NEXT_PUBLIC_TOSS_CLIENT_KEY, TOSS_SECRET_KEY)
- [x] /checkout 결제 페이지
- [x] CheckoutForm 컴포넌트 (배송정보 + 결제위젯)
- [x] /api/payments/request 주문 생성 API
- [x] /api/payments/confirm 결제 승인 API
- [x] /api/payments/webhook 웹훅 API
- [x] /checkout/success 결제 성공 페이지
- [x] /checkout/fail 결제 실패 페이지

### 주문조회
- [x] actions/orders.ts Server Actions
- [x] /my/orders 주문 목록 페이지
- [x] /my/orders/[id] 주문 상세 페이지
- [x] CancelOrderButton 컴포넌트

### 상품 관리 (관리자)
- [x] /admin/products/new 상품 등록 페이지
- [x] /admin/products/[id]/edit 상품 수정 페이지
- [x] ProductForm 컴포넌트

### UI 업데이트
- [x] TopBar 장바구니/주문조회 링크 연결
- [x] 장바구니 아이템 개수 뱃지

---

## Phase 10: UI 단순화 및 정리 ✅

### 홈페이지 정리
- [x] Features Section 삭제 (AI 리뷰 요약, 다국어 번역, 한국어 리뷰) - 추후 재디자인 예정
- [x] Categories Section 삭제 (상단 CategoryNavbar로 대체)
- [x] 불필요한 import 정리 (getCategories, CategoryCard, Sparkles, Globe, MessageSquare)

### 럭키드로우 페이지 정리
- [x] "대항해" 텍스트 제거 (제목: "럭키드로우"로 단순화)
- [x] 상단 선물 배지 아이콘 제거

### Navbar 정리
- [x] "상품" 메뉴 링크 제거 (CategoryNavbar로 대체)
- [x] navLinks 배열 비움

---

## Phase 11: 크롤링 시스템 ✅

### 크롤러 도구 (Monorepo)
- [x] tools/kickstarter-crawler - 킥스타터 프로젝트 크롤러
- [x] tools/wadiz-crawler - 와디즈 프로젝트 크롤러
- [x] tools/amazon-crawler - 아마존 베스트셀러 크롤러
- [x] tools/shopee-crawler - 쇼피 태국 크롤러 (⚠️ 봇 탐지로 제한됨)
- [x] Puppeteer 기반 헤드리스 브라우저 크롤링
- [x] Cloudflare 봇 탐지 우회 로직
- [x] 최소 리워드 금액 추출 ($5/1,000원 이하 제외)
- [x] Supabase products 테이블 자동 저장

### 영상 URL 크롤링
- [x] 킥스타터 프로젝트 영상 URL 추출
- [x] 와디즈 프로젝트 영상 URL 추출
- [x] 아마존/쇼피 상품 영상 URL 추출
- [x] ProductCard 호버 시 영상 자동 재생 (기존 구현)

---

## Phase 12: 크롤링 고도화 (향후)

### 가격 정보 개선
- [ ] products 테이블에 price_min, price_max 필드 추가
- [ ] "29,000원 ~ 199,000원" 형태로 가격 범위 표시
- [ ] rewards 테이블 신규 생성 (모든 리워드 티어 저장)
- [ ] 실시간 환율 API 연동 (USD → KRW 자동 변환)

### AI 리뷰 분석
- [ ] 리뷰/댓글 크롤링 기능 추가
- [ ] OpenAI API 연동하여 리뷰 요약
- [ ] 감정 분석 및 키워드 추출
- [ ] ai_summaries 테이블에 결과 저장

### 미디어 크롤링 강화
- [ ] 갤러리 이미지 다중 크롤링
- [ ] 영상 썸네일 자동 생성 (첫 프레임 추출)
- [ ] 이미지 9:16 비율 자동 크롭

---

## 다음 단계 (향후 작업)

- [ ] SNS 링크 실제 URL 연결
- [ ] 카테고리 추가/수정 폼 구현
- [ ] 외부 리뷰 입력 폼 구현
- [ ] 실제 AI API 연동 (OpenAI/Claude/Gemini)
- [ ] E2E 테스트 (Playwright)
- [ ] 성능 최적화 (이미지, 번들)
- [ ] 접근성 개선
- [ ] 다크 모드

---

## Phase 13: 알리익스프레스 어필리에이트 API 설정 (Phase 0) ✅

### API 발급 및 설정
- [x] 알리익스프레스 어필리에이트 프로그램 가입
- [x] API 키 발급 (App Key, App Secret, Tracking ID)
- [x] 환경 변수 설정 (.env.local)
- [x] docs/aliexpress-api-setup.md 가이드 문서 작성

### API 연동 테스트
- [x] scripts/test-aliexpress-api.ts 테스트 스크립트 작성
- [x] API 연결 테스트
- [x] 상품 검색 API 테스트
- [x] 링크 생성 API 테스트

---

## Phase 14: 대량 링크 생성 기능 (Phase 1) ✅

### 데이터베이스
- [x] affiliate_products 테이블 마이그레이션
- [x] affiliate_links 테이블 마이그레이션
- [x] price_history 테이블 마이그레이션

### API 클라이언트
- [x] lib/aliexpress/client.ts - API 클라이언트 구현
- [x] lib/aliexpress/types.ts - TypeScript 타입 정의
- [x] 상품 검색 함수
- [x] 어필리에이트 링크 생성 함수

### UI 구현
- [x] /affiliate/search 상품 검색 페이지
- [x] /affiliate/bulk-generate 대량 링크 생성 페이지
- [x] /affiliate/links 링크 관리 페이지
- [x] components/affiliate/product-search-form.tsx
- [x] components/affiliate/link-generator.tsx

### 기능 테스트
- [ ] 상품 검색 기능 테스트 (사용자 테스트 필요)
- [ ] 대량 링크 생성 (10개 이상) 테스트 (사용자 테스트 필요)
- [ ] 생성된 링크 클릭 확인 (사용자 테스트 필요)

---

## Phase 15: 자동 포스팅 기능 (Phase 2)

### 소셜 미디어 API 통합
- [ ] lib/social/instagram.ts - Meta Graph API 클라이언트
- [ ] lib/social/youtube.ts - YouTube Data API 확장
- [ ] lib/social/tistory.ts - 티스토리 API 클라이언트

### 스케줄러 시스템
- [ ] scheduled_posts 테이블 마이그레이션
- [ ] lib/scheduler/cron.ts - Cron Jobs 설정
- [ ] /api/cron/auto-post 자동 포스팅 API

### UI 구현
- [ ] /affiliate/posts 포스팅 관리 페이지
- [ ] components/affiliate/post-scheduler.tsx

### 기능 테스트
- [ ] 인스타그램 자동 포스팅 테스트
- [ ] 유튜브 커뮤니티 포스팅 테스트
- [ ] 티스토리 블로그 포스팅 테스트
- [ ] 예약 포스팅 기능 테스트

---

## Phase 16: 실시간 최저가 알림 봇 (Phase 3)

### 가격 모니터링 시스템
- [ ] alert_subscriptions 테이블 마이그레이션
- [ ] lib/monitoring/price-tracker.ts - 가격 추적 로직
- [ ] /api/cron/check-prices - 가격 체크 Cron Job

### 알림 봇 구현
- [ ] lib/notifications/telegram.ts - Telegram Bot API
- [ ] lib/notifications/kakao.ts - 카카오톡 비즈니스 API
- [ ] /api/webhook/telegram - Telegram 웹훅 핸들러

### UI 구현
- [ ] /affiliate/alerts 알림 설정 페이지
- [ ] components/affiliate/alert-settings.tsx

### 기능 테스트
- [ ] 텔레그램 봇 명령어 테스트
- [ ] 가격 하락 알림 수신 확인
- [ ] 카카오톡 알림톡 수신 확인
- [ ] 알림 구독 해지 기능 확인

---

## 참고 문서

- [PRD](./prd.md) - 제품 요구사항
- [기획서](./newproject.md) - 상세 기획서
- [AGENTS.md](../AGENTS.md) - 기술 가이드
- [알리익스프레스 API 설정 가이드](./aliexpress-api-setup.md) - API 발급 방법
