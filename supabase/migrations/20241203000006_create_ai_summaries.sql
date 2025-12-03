-- AI Summaries 테이블 생성
-- AI 리뷰 요약 결과를 캐싱하는 테이블

CREATE TABLE IF NOT EXISTS public.ai_summaries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    
    -- 요약 내용
    summary TEXT NOT NULL,                    -- 전체 요약 (3-4문장)
    positive_points TEXT[] DEFAULT '{}',      -- 긍정 포인트 배열
    negative_points TEXT[] DEFAULT '{}',      -- 부정 포인트 배열
    recommendation TEXT,                      -- 추천 대상
    
    -- 분석 결과
    overall_rating DECIMAL(2, 1),             -- AI 분석 평점
    sentiment_score DECIMAL(3, 2),            -- 감성 점수 (-1.0 ~ 1.0)
    
    -- 메타 정보
    ai_provider TEXT,                         -- 사용된 AI (openai, claude, gemini)
    ai_model TEXT,                            -- 모델명 (gpt-4, claude-3 등)
    review_count INTEGER,                     -- 분석에 사용된 리뷰 수
    
    -- 상태
    is_outdated BOOLEAN DEFAULT false,        -- 새 리뷰 추가로 재생성 필요
    
    -- 타임스탬프
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,      -- 만료 시간 (24시간 후)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    
    -- 한 상품당 하나의 활성 요약
    CONSTRAINT unique_product_summary UNIQUE (product_id)
);

-- 테이블 소유자 설정
ALTER TABLE public.ai_summaries OWNER TO postgres;

-- RLS 비활성화 (개발 단계)
ALTER TABLE public.ai_summaries DISABLE ROW LEVEL SECURITY;

-- 권한 부여
GRANT ALL ON TABLE public.ai_summaries TO anon;
GRANT ALL ON TABLE public.ai_summaries TO authenticated;
GRANT ALL ON TABLE public.ai_summaries TO service_role;

-- 인덱스 생성
CREATE INDEX idx_ai_summaries_product_id ON public.ai_summaries(product_id);
CREATE INDEX idx_ai_summaries_is_outdated ON public.ai_summaries(is_outdated) WHERE is_outdated = false;

-- 코멘트
COMMENT ON TABLE public.ai_summaries IS 'AI 리뷰 요약 캐시';
COMMENT ON COLUMN public.ai_summaries.positive_points IS '긍정적인 포인트 목록';
COMMENT ON COLUMN public.ai_summaries.negative_points IS '부정적인 포인트 목록';
COMMENT ON COLUMN public.ai_summaries.is_outdated IS '새 리뷰가 추가되어 재생성이 필요한지 여부';

