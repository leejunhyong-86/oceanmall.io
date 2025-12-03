-- Recent Views 테이블 생성
-- 최근 본 상품 기록

CREATE TABLE IF NOT EXISTS public.recent_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    
    -- 타임스탬프
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    
    -- 한 사용자-상품 조합당 하나의 기록 (최신으로 갱신)
    CONSTRAINT unique_user_recent_view UNIQUE (user_id, product_id)
);

-- 테이블 소유자 설정
ALTER TABLE public.recent_views OWNER TO postgres;

-- RLS 비활성화 (개발 단계)
ALTER TABLE public.recent_views DISABLE ROW LEVEL SECURITY;

-- 권한 부여
GRANT ALL ON TABLE public.recent_views TO anon;
GRANT ALL ON TABLE public.recent_views TO authenticated;
GRANT ALL ON TABLE public.recent_views TO service_role;

-- 인덱스 생성
CREATE INDEX idx_recent_views_user_id ON public.recent_views(user_id);
CREATE INDEX idx_recent_views_viewed_at ON public.recent_views(viewed_at DESC);

-- 코멘트
COMMENT ON TABLE public.recent_views IS '최근 본 상품 기록';

