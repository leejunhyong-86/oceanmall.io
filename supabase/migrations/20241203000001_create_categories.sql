-- Categories 테이블 생성
-- 상품 카테고리를 저장하는 테이블

CREATE TABLE IF NOT EXISTS public.categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    image_url TEXT,
    parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 테이블 소유자 설정
ALTER TABLE public.categories OWNER TO postgres;

-- RLS 비활성화 (개발 단계)
ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;

-- 권한 부여
GRANT ALL ON TABLE public.categories TO anon;
GRANT ALL ON TABLE public.categories TO authenticated;
GRANT ALL ON TABLE public.categories TO service_role;

-- 인덱스 생성
CREATE INDEX idx_categories_slug ON public.categories(slug);
CREATE INDEX idx_categories_parent_id ON public.categories(parent_id);

-- 코멘트
COMMENT ON TABLE public.categories IS '상품 카테고리';
COMMENT ON COLUMN public.categories.slug IS 'URL에 사용되는 고유 식별자';
COMMENT ON COLUMN public.categories.parent_id IS '상위 카테고리 (계층 구조 지원)';

