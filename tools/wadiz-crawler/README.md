# 와디즈 크롤러 (Wadiz Crawler)

와디즈 크라우드펀딩 플랫폼에서 프로젝트 데이터를 수집하여 Supabase에 저장하는 도구입니다.

## 📋 기능

- 와디즈 인기 프로젝트 자동 수집
- 프로젝트 상세 정보 추출 (제목, 설명, 이미지, 펀딩 정보)
- 리워드 정보 추출 (최소 리워드 금액)
- Supabase `products` 테이블에 자동 저장
- 봇 탐지 우회 기능 포함

## 🚀 설치 방법

### 1. 의존성 설치

```bash
cd tools/wadiz-crawler
pnpm install
```

### 2. 환경 변수 설정

`.env` 파일 생성:

```bash
cp env.template .env
```

`.env` 파일 편집:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

> 💡 메인 프로젝트의 `.env` 파일에서 값을 복사하세요.

## 📖 사용법

### 연결 테스트

```bash
pnpm test
```

### 크롤링 실행

```bash
pnpm crawl
```

### 개발 모드 (파일 변경 감지)

```bash
pnpm crawl:dev
```

## ⚙️ 설정

`src/crawler.ts`의 `CONFIG` 객체에서 설정을 변경할 수 있습니다:

```typescript
const CONFIG: CrawlConfig = {
  headless: true,       // false: 브라우저 창 표시 (디버깅용)
  timeout: 60000,       // 60초 타임아웃
  delay: 2000,          // 요청 간 2초 대기
  retryCount: 3,        // 실패 시 재시도 횟수
  maxProjects: 10,      // 한 번에 크롤링할 최대 프로젝트 수
};
```

## 📊 수집 데이터

| 필드 | 설명 |
|------|------|
| `title` | 프로젝트 제목 |
| `description` | 프로젝트 설명 |
| `thumbnail_url` | 썸네일 이미지 |
| `price_krw` | 최소 리워드 금액 (원) |
| `external_rating` | 달성률 기반 평점 (5점 만점) |
| `external_review_count` | 서포터 수 |
| `source_platform` | 'wadiz' |
| `source_url` | 원본 프로젝트 URL |
| `tags` | 카테고리, 달성률, 서포터 수 등 |

## 🔍 특정 프로젝트 크롤링

`src/crawler.ts`의 `targetUrls` 배열에 URL을 추가하세요:

```typescript
const targetUrls: string[] = [
  'https://www.wadiz.kr/web/campaign/detail/12345',
  'https://www.wadiz.kr/web/campaign/detail/67890',
];
```

## ⚠️ 주의사항

1. **적절한 딜레이 유지**: 너무 빠른 요청은 IP 차단을 유발할 수 있습니다.
2. **robots.txt 준수**: 와디즈의 이용약관을 확인하세요.
3. **저작권 주의**: 수집한 데이터의 상업적 사용에 주의하세요.
4. **개인정보 보호**: 사용자 개인정보는 수집하지 마세요.

## 🐛 문제 해결

### 브라우저가 열리지 않는 경우

Windows에서 Puppeteer 설치 문제:

```bash
pnpm add puppeteer
```

### 페이지 로딩 실패

`CONFIG.timeout`을 늘려보세요 (기본 60초).

### 데이터가 추출되지 않는 경우

와디즈 사이트 구조가 변경되었을 수 있습니다. 셀렉터를 업데이트하세요.

## 📝 라이선스

이 도구는 학습 및 개인 프로젝트 용도로 제작되었습니다.
상업적 사용 전 법적 검토를 권장합니다.

