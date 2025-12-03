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
- [ ] 주요 기능 수동 테스트
- [ ] 샘플 데이터 50개 입력
- [ ] 환경 변수 문서화
- [ ] Vercel 배포 설정

---

## 다음 단계 (MVP 이후)

- [ ] 상품 등록/수정 폼 구현
- [ ] 카테고리 추가/수정 폼 구현
- [ ] 외부 리뷰 입력 폼 구현
- [ ] 실제 AI API 연동 (OpenAI/Claude/Gemini)
- [ ] E2E 테스트 (Playwright)
- [ ] 성능 최적화 (이미지, 번들)
- [ ] 접근성 개선
- [ ] 다크 모드

---

## 참고 문서

- [PRD](./prd.md) - 제품 요구사항
- [기획서](./newproject.md) - 상세 기획서
- [AGENTS.md](../AGENTS.md) - 기술 가이드
