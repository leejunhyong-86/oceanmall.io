-- External Reviews 테이블 생성
-- 해외 쇼핑몰에서 수집한 리뷰를 저장하는 테이블 (수동 입력)

CREATE TABLE IF NOT EXISTS public.external_reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    
    -- 리뷰 내용
    content TEXT NOT NULL,                    -- 원문 리뷰
    translated_content TEXT,                  -- 번역된 리뷰 (한국어)
    
    -- 리뷰어 정보
    reviewer_name TEXT,
    reviewer_country TEXT,                    -- 리뷰어 국가
    
    -- 평점
    rating DECIMAL(2, 1),                     -- 0.0-5.0
    
    -- 메타 정보
    source_language TEXT DEFAULT 'en',        -- 원문 언어 코드
    source_platform TEXT,                     -- 출처 플랫폼
    source_review_id TEXT,                    -- 원본 리뷰 ID
    review_date DATE,                         -- 원본 리뷰 작성일
    
    -- 유용성
    helpful_count INTEGER DEFAULT 0,          -- 원본 사이트에서의 helpful 수
    
    -- 상태
    is_verified_purchase BOOLEAN DEFAULT false,
    is_translated BOOLEAN DEFAULT false,
    
    -- 타임스탬프
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 테이블 소유자 설정
ALTER TABLE public.external_reviews OWNER TO postgres;

-- RLS 비활성화 (개발 단계)
ALTER TABLE public.external_reviews DISABLE ROW LEVEL SECURITY;

-- 권한 부여
GRANT ALL ON TABLE public.external_reviews TO anon;
GRANT ALL ON TABLE public.external_reviews TO authenticated;
GRANT ALL ON TABLE public.external_reviews TO service_role;

-- 인덱스 생성
CREATE INDEX idx_external_reviews_product_id ON public.external_reviews(product_id);
CREATE INDEX idx_external_reviews_rating ON public.external_reviews(rating);
CREATE INDEX idx_external_reviews_source_language ON public.external_reviews(source_language);

-- 코멘트
COMMENT ON TABLE public.external_reviews IS '해외 쇼핑몰 리뷰 (수동 입력)';
COMMENT ON COLUMN public.external_reviews.content IS '원문 리뷰 내용';
COMMENT ON COLUMN public.external_reviews.translated_content IS 'AI 번역된 한국어 리뷰';

