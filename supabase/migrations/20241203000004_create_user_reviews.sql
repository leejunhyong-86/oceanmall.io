-- User Reviews 테이블 생성
-- 자체 한국어 리뷰 시스템

CREATE TABLE IF NOT EXISTS public.user_reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    
    -- 한 사용자가 한 상품에 하나의 리뷰만 작성 가능
    CONSTRAINT unique_user_product_review UNIQUE (user_id, product_id)
);

-- 테이블 소유자 설정
ALTER TABLE public.user_reviews OWNER TO postgres;

-- RLS 비활성화 (개발 단계)
ALTER TABLE public.user_reviews DISABLE ROW LEVEL SECURITY;

-- 권한 부여
GRANT ALL ON TABLE public.user_reviews TO anon;
GRANT ALL ON TABLE public.user_reviews TO authenticated;
GRANT ALL ON TABLE public.user_reviews TO service_role;

-- 인덱스 생성
CREATE INDEX idx_user_reviews_product_id ON public.user_reviews(product_id);
CREATE INDEX idx_user_reviews_user_id ON public.user_reviews(user_id);
CREATE INDEX idx_user_reviews_rating ON public.user_reviews(rating);
CREATE INDEX idx_user_reviews_created_at ON public.user_reviews(created_at DESC);
CREATE INDEX idx_user_reviews_helpful_count ON public.user_reviews(helpful_count DESC);

-- 코멘트
COMMENT ON TABLE public.user_reviews IS '자체 한국어 리뷰';
COMMENT ON COLUMN public.user_reviews.helpful_count IS '다른 사용자들의 "도움됨" 투표 수';

