-- Products 테이블 생성
-- 해외직구 상품 정보를 저장하는 테이블

CREATE TABLE IF NOT EXISTS public.products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- 기본 정보
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    
    -- 미디어 (릴스 스타일)
    thumbnail_url TEXT,           -- 9:16 썸네일 이미지
    video_url TEXT,               -- 리뷰 영상 URL
    images TEXT[] DEFAULT '{}',   -- 추가 이미지 배열
    
    -- 가격 정보
    original_price DECIMAL(12, 2),        -- 원본 가격 (외화)
    currency TEXT DEFAULT 'USD',           -- 통화 코드
    price_krw DECIMAL(12, 0),             -- 한화 환산 가격
    
    -- 상품 출처
    source_platform TEXT NOT NULL,        -- 아마존, 알리익스프레스 등
    source_url TEXT NOT NULL,             -- 원본 상품 링크
    source_product_id TEXT,               -- 원본 사이트 상품 ID
    
    -- 평점 정보
    external_rating DECIMAL(2, 1),        -- 외부 사이트 평점 (0.0-5.0)
    external_review_count INTEGER DEFAULT 0,
    internal_rating DECIMAL(2, 1),        -- 자체 리뷰 평점
    internal_review_count INTEGER DEFAULT 0,
    
    -- 분류
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    tags TEXT[] DEFAULT '{}',
    
    -- 메타
    is_featured BOOLEAN DEFAULT false,    -- 추천 상품
    is_active BOOLEAN DEFAULT true,
    view_count INTEGER DEFAULT 0,
    
    -- 타임스탬프
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 테이블 소유자 설정
ALTER TABLE public.products OWNER TO postgres;

-- RLS 비활성화 (개발 단계)
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;

-- 권한 부여
GRANT ALL ON TABLE public.products TO anon;
GRANT ALL ON TABLE public.products TO authenticated;
GRANT ALL ON TABLE public.products TO service_role;

-- 인덱스 생성
CREATE INDEX idx_products_slug ON public.products(slug);
CREATE INDEX idx_products_category_id ON public.products(category_id);
CREATE INDEX idx_products_source_platform ON public.products(source_platform);
CREATE INDEX idx_products_is_featured ON public.products(is_featured) WHERE is_featured = true;
CREATE INDEX idx_products_is_active ON public.products(is_active) WHERE is_active = true;
CREATE INDEX idx_products_created_at ON public.products(created_at DESC);

-- Full-text 검색을 위한 인덱스
CREATE INDEX idx_products_title_search ON public.products USING gin(to_tsvector('simple', title));

-- 코멘트
COMMENT ON TABLE public.products IS '해외직구 상품 정보';
COMMENT ON COLUMN public.products.thumbnail_url IS '9:16 비율의 릴스 스타일 썸네일';
COMMENT ON COLUMN public.products.video_url IS '상품 리뷰 영상 (호버 시 재생)';
COMMENT ON COLUMN public.products.source_platform IS '상품 출처 플랫폼 (amazon, aliexpress, iherb 등)';

