-- Wishlists 테이블 생성
-- 사용자 위시리스트 (찜 목록)

CREATE TABLE IF NOT EXISTS public.wishlists (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    
    -- 메모
    note TEXT,                                -- 사용자 메모
    
    -- 가격 추적 (Phase 2)
    saved_price DECIMAL(12, 0),               -- 저장 당시 가격
    
    -- 타임스탬프
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    
    -- 한 사용자가 한 상품을 한 번만 위시리스트에 추가
    CONSTRAINT unique_user_wishlist UNIQUE (user_id, product_id)
);

-- 테이블 소유자 설정
ALTER TABLE public.wishlists OWNER TO postgres;

-- RLS 비활성화 (개발 단계)
ALTER TABLE public.wishlists DISABLE ROW LEVEL SECURITY;

-- 권한 부여
GRANT ALL ON TABLE public.wishlists TO anon;
GRANT ALL ON TABLE public.wishlists TO authenticated;
GRANT ALL ON TABLE public.wishlists TO service_role;

-- 인덱스 생성
CREATE INDEX idx_wishlists_user_id ON public.wishlists(user_id);
CREATE INDEX idx_wishlists_product_id ON public.wishlists(product_id);
CREATE INDEX idx_wishlists_created_at ON public.wishlists(created_at DESC);

-- 코멘트
COMMENT ON TABLE public.wishlists IS '사용자 위시리스트';
COMMENT ON COLUMN public.wishlists.saved_price IS '위시리스트 추가 당시 가격 (가격 변동 추적용)';

