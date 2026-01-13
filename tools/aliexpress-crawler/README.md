# 🛒 AliExpress Crawler

AliExpress 상품 데이터를 크롤링하여 Supabase 쇼핑몰 데이터베이스에 저장하는 도구입니다.

## 📁 프로젝트 구조

```
aliexpress-crawler/
├── src/
│   ├── crawler.ts        # 메인 크롤러
│   ├── types.ts          # 타입 정의
│   └── test-connection.ts # DB 연결 테스트
├── package.json
├── tsconfig.json
├── .env                  # 환경 변수 (생성 필요)
├── env.template          # 환경 변수 템플릿
└── README.md
```

## 🚀 시작하기

### 1. 의존성 설치

```bash
pnpm install
```

### 2. 환경 변수 설정

`env.template`을 복사하여 `.env` 파일을 생성하고, 쇼핑몰 프로젝트의 Supabase 정보를 입력합니다:

```bash
cp env.template .env
```

```.env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Crawling Configuration
CRAWL_MODE=direct-url
PRODUCT_URLS=https://www.aliexpress.com/item/1005006234567890.html
MAX_PRODUCTS=10
HEADLESS=true

# Review Crawling
CRAWL_REVIEWS=true
MAX_REVIEWS=20
```

### 3. 연결 테스트

```bash
pnpm test
```

### 4. 크롤링 실행

```bash
pnpm crawl
```

## 📋 사용 방법

### 방법 1: 환경변수로 URL 설정

`.env` 파일에 `PRODUCT_URLS`를 설정:

```env
PRODUCT_URLS=https://www.aliexpress.com/item/1005006234567890.html
```

```bash
pnpm crawl
```

### 방법 2: 명령줄에서 직접 URL 지정

```bash
PRODUCT_URLS="https://www.aliexpress.com/item/1005006234567890.html" pnpm crawl
```

### 방법 3: 여러 상품 동시 크롤링

쉼표로 구분하여 여러 URL 지정:

```bash
PRODUCT_URLS="https://www.aliexpress.com/item/1005001111111111.html,https://www.aliexpress.com/item/1005002222222222.html" pnpm crawl
```

## ⚙️ 설정 옵션

환경변수로 조정 가능:

| 옵션 | 기본값 | 설명 |
|------|--------|------|
| `CRAWL_MODE` | `direct-url` | 크롤링 모드 (현재는 direct-url만 지원) |
| `PRODUCT_URLS` | - | 크롤링할 상품 URL (쉼표로 구분) |
| `MAX_PRODUCTS` | `10` | 한 번에 크롤링할 최대 상품 수 |
| `HEADLESS` | `true` | `false`로 설정하면 브라우저 창 표시 (디버깅용) |

### 리뷰 크롤링 옵션

| 옵션 | 기본값 | 설명 |
|------|--------|------|
| `CRAWL_REVIEWS` | `true` | 리뷰 수집 여부 |
| `MAX_REVIEWS` | `20` | 수집할 최대 리뷰 개수 |

**사용 예시:**
```bash
# 리뷰 크롤링 비활성화
CRAWL_REVIEWS=false pnpm crawl

# 최대 50개 리뷰 수집
MAX_REVIEWS=50 pnpm crawl

# 브라우저 창 표시 (봇 차단 시 유용)
HEADLESS=false pnpm crawl
```

## 📊 저장되는 데이터

### 상품 데이터 (`products` 테이블)

| AliExpress | → | products 테이블 |
|-----------|---|-----------------|
| 상품 제목 | → | `title` |
| 상품 설명 | → | `description` |
| 썸네일 이미지 | → | `thumbnail_url` |
| 가격 (USD) | → | `original_price` |
| 가격 (KRW) | → | `price_krw` |
| 할인율 | → | `discount_percentage` |
| 평균 평점 | → | `external_rating` |
| 리뷰 수 | → | `external_review_count` |
| 상품 URL | → | `source_url` |
| 태그 | → | `tags` (주문 수, 할인 정보 등) |

### 리뷰 데이터 (`external_reviews` 테이블)

| 수집 항목 | 필드명 | 설명 |
|----------|--------|------|
| 리뷰 내용 | `content` | 구매자 리뷰 |
| 작성자 이름 | `reviewer_name` | 리뷰어 |
| 작성자 국가 | `reviewer_country` | 국가 정보 |
| 평점 | `rating` | 별점 (1-5) |
| 작성일 | `review_date` | 리뷰 작성 날짜 |
| 플랫폼 | `source_platform` | 'aliexpress' |
| 언어 | `source_language` | 'en' (영어) |
| 검증된 구매 | `is_verified_purchase` | `true` |

## ⚠️ 주의사항

### 1. 봇 차단 (중요!)

AliExpress는 강력한 봇 차단 시스템을 사용합니다:

- **CAPTCHA 발생 가능**: 너무 빠른 요청 시 CAPTCHA가 나타날 수 있습니다
- **IP 제한**: 같은 IP에서 많은 요청 시 차단될 수 있습니다
- **딜레이 필수**: 기본 5초 딜레이 유지를 권장합니다

**해결 방법:**
```bash
# 브라우저 창을 표시하여 수동으로 CAPTCHA 해결
HEADLESS=false pnpm crawl

# 더 긴 딜레이 설정 (코드에서 CONFIG.delay 수정)
```

### 2. 페이지 구조 변경

AliExpress는 자주 페이지 구조를 변경합니다. 크롤링이 실패하면:

1. `HEADLESS=false`로 실행하여 페이지 확인
2. 브라우저 개발자 도구로 새로운 셀렉터 확인
3. `crawler.ts`의 셀렉터 수정

### 3. 데이터 정확성

- 가격은 변동될 수 있습니다
- 환율은 고정값(1 USD = 1400 KRW) 사용
- 일부 데이터가 누락될 수 있습니다

### 4. 법적 고려사항

- AliExpress 이용약관 확인 필요
- 상업적 사용 시 법적 검토 권장
- 개인 학습 및 연구 목적으로만 사용하세요

## 🔧 디버깅

### 브라우저 창 표시

```bash
HEADLESS=false pnpm crawl
```

### 페이지 구조 확인

크롤러는 자동으로 페이지 구조를 분석하고 로그로 출력합니다:

```
🔍 페이지 구조 분석:
   - 페이지 제목: ...
   - H1 존재: true
   - 상품명 요소: true
   - 가격 요소: true
   - 평점 요소: true
   - 이미지 개수: 42
```

### 일반적인 문제 해결

**문제: "봇 차단 페이지 감지됨"**
```bash
# 해결: Headless 모드 끄고 CAPTCHA 수동 해결
HEADLESS=false pnpm crawl
```

**문제: "제목을 찾을 수 없습니다"**
- 페이지가 완전히 로드되지 않았을 수 있음
- `crawler.ts`의 `CONFIG.timeout` 값 증가

**문제: 리뷰가 수집되지 않음**
- AliExpress의 리뷰 섹션이 동적으로 로드될 수 있음
- 리뷰 탭 클릭이 필요할 수 있음 (향후 개선 예정)

## 🌟 향후 개선 계획

- [ ] 검색 모드 지원
- [ ] 카테고리별 크롤링
- [ ] 더 많은 리뷰 수집 (페이지네이션)
- [ ] 이미지 다운로드 및 로컬 저장
- [ ] 프록시 지원
- [ ] 더 강력한 봇 차단 우회

## 📝 라이선스

이 프로젝트는 학습 및 개인 용도로만 사용하세요.
