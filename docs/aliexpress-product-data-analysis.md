# 알리익스프레스 상품 정보 분석 및 활용 가이드

## 📊 현재 API에서 제공하는 데이터

### 🖼️ 1. 이미지/영상 자료 (콘텐츠 제작용)

#### ✅ **사용 가능한 자료**
```json
{
  "product_main_image_url": "메인 이미지 1장 (고화질)",
  "product_small_image_urls": {
    "string": [
      "이미지1.jpg",
      "이미지2.jpg",
      "이미지3.jpg",
      "이미지4.jpg",
      "이미지5.jpg",
      "이미지6.jpg"  // 보통 6장 제공
    ]
  },
  "product_video_url": "상품 영상 (있는 경우)"
}
```

#### ⚠️ **한계점**
- **영상**: 대부분의 상품에 `product_video_url`이 **비어있음** (현재 테스트 결과 3개 모두 빈 문자열)
- **이미지**: 6장 정도만 제공 (상세 페이지의 모든 이미지는 아님)
- **설명 이미지**: 상세 설명에 포함된 긴 이미지들은 API로 제공되지 않음

---

## 🎯 사용자 목표별 실현 가능성 분석

### 목표 1: 오션몰 상품 페이지 자동 생성

#### ✅ **가능한 것**
1. **기본 상품 정보 자동 입력**
   ```
   - 상품명 (product_title)
   - 가격 정보 (target_sale_price, target_original_price, discount)
   - 카테고리 (first_level_category_name, second_level_category_name)
   - 평점 (evaluate_rate)
   - 판매량 (lastest_volume)
   - 커미션율 (commission_rate)
   ```

2. **이미지 갤러리 자동 구성**
   - 메인 이미지 1장 + 추가 이미지 6장 = 총 7장
   - 9:16 비율로 자동 크롭하여 릴스 스타일 적용 가능

3. **AI 상품 설명 자동 생성**
   - 상품명 + 이미지 분석 → AI로 상세 설명 생성
   - 예: Gemini Vision API로 이미지 분석 → 한국어 설명 생성

#### ⚠️ **한계점 및 해결 방법**

**문제 1: 상세 설명 이미지 부족**
- API는 갤러리 이미지만 제공, 상세 설명 이미지는 없음
- **해결책**:
  - 알리익스프레스 상세 페이지를 **크롤링**하여 추가 이미지 수집
  - Puppeteer로 `product_detail_url` 접속 → 상세 이미지 추출
  - 또는 AI가 제공된 7장 이미지로 충분한 설명 생성

**문제 2: 영상 자료 부족**
- 대부분 상품에 `product_video_url`이 비어있음
- **해결책**:
  - 상세 페이지 크롤링으로 영상 URL 추출
  - 또는 이미지 6장으로 슬라이드쇼 영상 자동 생성
  - AI 이미지 → 비디오 변환 (예: Runway, Pika Labs API)

---

### 목표 2: SNS 숏폼 영상 자동 제작

#### ✅ **가능한 것**
1. **이미지 기반 슬라이드쇼 영상**
   - 6장 이미지 → 슬라이드쇼 (각 1~2초)
   - 배경음악 + 텍스트 오버레이
   - 도구: FFmpeg, Remotion, Shotstack API

2. **AI 이미지 → 비디오 변환**
   - 정적 이미지를 동적 영상으로 변환
   - 도구: Runway Gen-2, Pika Labs, Stability AI

3. **AI 나레이션 추가**
   - 상품 설명 텍스트 → TTS (Text-to-Speech)
   - 도구: ElevenLabs, Google TTS, Azure TTS

#### ⚠️ **한계점 및 해결 방법**

**문제: 실제 상품 사용 영상 없음**
- API는 정적 이미지만 제공
- **해결책**:
  - 크롤링으로 알리익스프레스 상품 영상 추출
  - 또는 이미지 + AI 생성 영상 조합
  - 또는 유튜브에서 유사 상품 리뷰 영상 검색 (저작권 주의)

---

### 목표 3: 블로그 자동 작성

#### ✅ **가능한 것**
1. **기본 리뷰 글 자동 생성**
   ```
   제목: [상품명] 리뷰 - 가격, 장단점, 구매 가이드
   
   본문:
   - 상품 소개 (AI 생성)
   - 가격 정보 (API 데이터)
   - 주요 특징 (이미지 분석 + AI)
   - 구매 링크 (어필리에이트 링크)
   ```

2. **이미지 자동 삽입**
   - 6장 이미지를 본문에 자동 배치
   - 캡션 자동 생성

3. **SEO 최적화**
   - 메타 태그 자동 생성
   - 키워드 추출 (상품명, 카테고리)

#### ⚠️ **한계점 및 해결 방법**

**문제: 상세 스펙 정보 부족**
- API는 기본 정보만 제공 (사이즈, 재질, 스펙 등 없음)
- **해결책**:
  - 크롤링으로 상세 스펙 추출
  - 또는 AI가 이미지 분석으로 스펙 추정
  - 또는 "자세한 정보는 상품 페이지 참조" 문구 추가

---

## 🔧 개선된 데이터베이스 스키마 제안

기존 계획에서 **부족한 데이터를 보완**하기 위한 스키마:

```sql
CREATE TABLE affiliate_products (
  -- 기본 정보 (API)
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id VARCHAR(255) UNIQUE NOT NULL,
  title TEXT NOT NULL,
  category VARCHAR(100),
  
  -- 가격 정보 (API)
  price DECIMAL(10,2),
  original_price DECIMAL(10,2),
  discount_rate INTEGER,
  commission_rate DECIMAL(5,2),
  
  -- 이미지/영상 (API)
  main_image_url TEXT,
  gallery_images JSONB,  -- 6장 이미지 배열
  video_url TEXT,
  
  -- 추가 정보 (크롤링)
  detail_images JSONB,  -- 상세 설명 이미지들
  product_description TEXT,  -- 상세 설명 텍스트
  specifications JSONB,  -- 스펙 정보
  
  -- AI 생성 콘텐츠
  ai_description TEXT,  -- AI 생성 한국어 설명
  ai_short_description TEXT,  -- 짧은 설명 (SNS용)
  ai_keywords JSONB,  -- SEO 키워드
  
  -- 성과 지표 (API)
  evaluate_rate DECIMAL(3,1),
  sales_volume INTEGER,
  
  -- 메타 정보
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_crawled_at TIMESTAMP,  -- 마지막 크롤링 시간
  
  -- 상태 관리
  content_status VARCHAR(20) DEFAULT 'pending',  
  -- 'pending', 'ai_generated', 'human_reviewed', 'approved'
  
  quality_score INTEGER,  -- AI 품질 점수 (1-100)
  needs_review BOOLEAN DEFAULT TRUE
);

-- SNS 콘텐츠 테이블
CREATE TABLE generated_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id VARCHAR(255) REFERENCES affiliate_products(product_id),
  content_type VARCHAR(20),  -- 'blog', 'instagram', 'youtube', 'tiktok'
  
  -- 콘텐츠
  title TEXT,
  body TEXT,
  media_urls JSONB,  -- 이미지/영상 URL들
  
  -- AI 생성 정보
  generated_by VARCHAR(50),  -- 'gemini', 'gpt-4', 'claude'
  generation_prompt TEXT,
  
  -- 품질 관리
  quality_score INTEGER,
  human_edited BOOLEAN DEFAULT FALSE,
  approved BOOLEAN DEFAULT FALSE,
  
  -- 게시 정보
  posted_at TIMESTAMP,
  platform_post_id VARCHAR(255),
  
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🤖 AI 자동화 워크플로우 제안

### Phase 1: 기본 자동화 (검수 필요)
```
1. API로 상품 정보 가져오기
2. 이미지 7장 다운로드
3. AI로 상품 설명 생성 (Gemini Vision)
4. 품질 점수 계산 (1-100)
5. 점수 80점 이상 → 자동 승인
6. 점수 80점 미만 → 검수 대기
```

### Phase 2: 고도화 (완전 자동화)
```
1. API + 크롤링으로 상품 정보 수집
2. AI로 이미지 분석 + 설명 생성
3. AI로 품질 검수 (다른 AI 모델 사용)
4. 2개 AI 모두 승인 → 자동 게시
5. 의견 불일치 → 인간 검수
```

### Phase 3: 멀티 플랫폼 자동화
```
1. 상품 정보 수집 + AI 생성
2. 플랫폼별 콘텐츠 자동 생성:
   - 오션몰: 상세 페이지
   - 인스타그램: 이미지 + 짧은 설명
   - 유튜브: 슬라이드쇼 영상 + 긴 설명
   - 블로그: 리뷰 글 + 이미지
3. 예약 포스팅 큐에 추가
4. 자동 게시 + 성과 추적
```

---

## 💡 추천 구현 순서

### 1단계: API 데이터만 활용 (현재 가능)
- 7장 이미지 + 기본 정보로 간단한 상품 페이지 생성
- AI로 설명 생성 (Gemini Vision)
- 인간 검수 필수

### 2단계: 크롤링 추가
- Puppeteer로 상세 페이지 크롤링
- 추가 이미지 + 영상 + 스펙 정보 수집
- 더 풍부한 콘텐츠 생성 가능

### 3단계: AI 품질 검수
- 2개 AI 모델로 교차 검증
- 품질 점수 기반 자동 승인
- 인간 검수 최소화

### 4단계: 완전 자동화
- 상품 발굴 → 콘텐츠 생성 → 게시 → 성과 분석
- 인간은 전략 수립 및 최종 승인만

---

## 🚀 다음 단계 제안

1. **Phase 1 구현 시작**
   - API 데이터로 기본 상품 페이지 생성
   - Gemini Vision API로 이미지 분석 + 설명 생성
   - 검수 UI 구현

2. **크롤링 시스템 추가** (Phase 1.5)
   - 상세 이미지 + 영상 추출
   - 스펙 정보 파싱

3. **AI 품질 검수 시스템** (Phase 2)
   - 2개 AI 모델 교차 검증
   - 자동 승인 로직

4. **멀티 플랫폼 자동화** (Phase 3)
   - SNS 콘텐츠 자동 생성
   - 예약 포스팅

---

## ❓ 결론 및 질문

### ✅ **가능한 것**
- API 데이터만으로도 기본적인 자동화 가능
- AI로 설명 생성 및 품질 검수 가능
- 이미지 기반 SNS 콘텐츠 제작 가능

### ⚠️ **추가 작업 필요**
- 영상/상세 이미지는 크롤링 필요
- 완전 자동화는 AI 품질 검수 시스템 필요

### 💬 **사용자 결정 필요**
1. **Phase 1에서 크롤링을 포함할까요?**
   - 포함: 더 풍부한 콘텐츠, 구현 시간 증가
   - 미포함: 빠른 구현, 제한적 콘텐츠

2. **AI 품질 검수를 언제 도입할까요?**
   - Phase 1: 처음부터 자동화
   - Phase 2: 인간 검수 데이터 쌓은 후

3. **어떤 AI 모델을 사용할까요?**
   - Gemini 1.5 Pro (무료 한도 있음)
   - GPT-4 Vision (유료)
   - Claude 3.5 Sonnet (유료)
