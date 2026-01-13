# Amazon 크롤러

Amazon 베스트셀러 상품을 크롤링하여 Supabase에 저장하는 도구입니다.

## 설치

```bash
cd tools/amazon-crawler
pnpm install
```

## 환경 설정

1. `.env` 파일 생성:

```bash
cp env.template .env
```

2. `.env` 파일에 Supabase 정보 입력:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
MAX_PRODUCTS=10
HEADLESS=true
```

또는 메인 프로젝트의 `.env` 파일을 심볼릭 링크로 연결:

```bash
# Windows
mklink .env ..\..\..\.env

# macOS/Linux  
ln -s ../../../.env .env
```

## 사용법

### 연결 테스트

```bash
pnpm test
```

### 크롤링 실행

#### 기본 크롤링 (베스트셀러)

```bash
pnpm crawl
```

#### 특정 상품 URL 직접 크롤링 (NEW!)

하나의 상품:
```bash
CRAWL_MODE=direct-url PRODUCT_URLS="https://www.amazon.com/dp/B0BZYCJK89" pnpm crawl
```

여러 상품 (쉼표로 구분):
```bash
CRAWL_MODE=direct-url PRODUCT_URLS="https://www.amazon.com/dp/B0BZYCJK89,https://www.amazon.com/dp/B08N5WRWNW,https://www.amazon.com/dp/B09XYZ1234" pnpm crawl
```

#### 키워드 검색

```bash
CRAWL_MODE=search SEARCH_KEYWORD="wireless earbuds" pnpm crawl
```

#### 신상품 크롤링

```bash
CRAWL_MODE=new-releases pnpm crawl
```

#### 인기 급상승 상품

```bash
CRAWL_MODE=movers-shakers pnpm crawl
```

## 크롤링 대상

현재 다음 Amazon 베스트셀러 카테고리에서 상품을 수집합니다:
- Electronics (전자기기)
- Beauty (뷰티)
- Home & Kitchen (홈 & 주방)

## 주요 기능

- **봇 탐지 우회**: User-Agent 설정, 랜덤 딜레이, webdriver 속성 숨김
- **상품 정보 추출**: 제목, 가격, 평점, 리뷰 수, 이미지, 영상 URL
- **자동 환율 변환**: USD → KRW (현재 1:1400 고정)
- **Supabase 연동**: products 테이블에 자동 저장

## 추출되는 데이터

| 필드 | 설명 |
|------|------|
| ASIN | Amazon 고유 상품 번호 |
| 제목 | 상품명 |
| 가격 | 현재 가격 (USD/KRW) |
| 원래 가격 | 할인 전 가격 |
| 평점 | 별점 (1-5) |
| 리뷰 수 | 고객 리뷰 개수 |
| 이미지 | 메인 이미지 및 추가 이미지 |
| 영상 | 상품 영상 URL (있는 경우) |
| 브랜드 | 제조사/브랜드명 |
| Prime | Prime 배송 여부 |

## 주의사항

⚠️ **Amazon 이용약관**: Amazon은 자동화된 크롤링을 금지합니다. 
이 도구는 교육 및 개인 학습 목적으로만 사용하세요.

⚠️ **봇 탐지**: Amazon의 강력한 봇 탐지 시스템으로 인해 
크롤링이 차단될 수 있습니다. 과도한 요청은 IP 차단을 유발할 수 있습니다.

## 문제 해결

### CAPTCHA 발생 시
- `HEADLESS=false`로 설정하여 브라우저를 직접 확인
- 요청 간격을 더 길게 조정

### 상품이 수집되지 않을 때
- Amazon 페이지 구조가 변경되었을 수 있음
- 셀렉터 업데이트 필요

