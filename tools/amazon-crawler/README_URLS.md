# URL 목록 파일로 크롤링하기

이전에 크롤링했던 URL 목록을 파일로 저장하고 다시 크롤링할 수 있습니다.

## 사용법

### 1. URL 목록 파일 작성

`urls.txt` 파일을 열고 크롤링할 Amazon 상품 URL을 한 줄에 하나씩 입력하세요:

```
https://www.amazon.com/dp/B0BZYCJK89
https://www.amazon.com/dp/B08N5WRWNW
https://www.amazon.com/dp/B09XYZ1234
```

**참고**: 
- `#`로 시작하는 줄은 주석으로 처리됩니다
- 빈 줄은 무시됩니다
- URL은 `amazon.com` 또는 `amzn.to`를 포함해야 합니다

### 2. 크롤링 실행

#### 방법 1: URL 목록 확인 후 수동 실행

```bash
cd tools/amazon-crawler
pnpm crawl:urls
```

이 명령어는 `urls.txt` 파일의 URL 목록을 읽어서 크롤링 명령어를 출력합니다.

#### 방법 2: 자동 실행

```bash
cd tools/amazon-crawler
pnpm crawl:urls --run
```

이 명령어는 URL 목록을 읽어서 자동으로 크롤링을 시작합니다.

## 백업

크롤링 실행 시 `urls-backup.txt` 파일에 URL 목록이 자동으로 백업됩니다.

## 예시

### urls.txt 파일 예시

```
# Amazon 상품 URL 목록
# 2025년 1월 크롤링 목록

https://www.amazon.com/dp/B0BZYCJK89
https://www.amazon.com/dp/B08N5WRWNW
https://www.amazon.com/dp/B09XYZ1234
https://www.amazon.com/dp/B0ABCD1234
```

### 실행 결과

```
📋 URL 목록 파일에서 크롤링할 상품 읽기...

✅ 4개의 URL을 찾았습니다:

   [1] https://www.amazon.com/dp/B0BZYCJK89
   [2] https://www.amazon.com/dp/B08N5WRWNW
   [3] https://www.amazon.com/dp/B09XYZ1234
   [4] https://www.amazon.com/dp/B0ABCD1234

💾 URL 목록이 urls-backup.txt에 백업되었습니다.

🚀 크롤링 실행 명령어:

   CRAWL_MODE=direct-url PRODUCT_URLS="https://www.amazon.com/dp/B0BZYCJK89,https://www.amazon.com/dp/B08N5WRWNW,https://www.amazon.com/dp/B09XYZ1234,https://www.amazon.com/dp/B0ABCD1234" pnpm crawl
```

## 주의사항

- URL 목록이 많을 경우 크롤링에 시간이 오래 걸릴 수 있습니다
- Amazon의 봇 탐지로 인해 일부 URL이 차단될 수 있습니다
- 크롤링 전에 Supabase 연결을 확인하세요 (`pnpm test`)
