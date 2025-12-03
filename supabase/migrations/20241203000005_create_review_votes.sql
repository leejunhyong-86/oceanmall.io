-- Review Votes 테이블 생성
-- 리뷰 "도움됨" 투표 기록

CREATE TABLE IF NOT EXISTS public.review_votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    review_id UUID NOT NULL REFERENCES public.user_reviews(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- 투표 타입 (확장 가능)
    vote_type TEXT DEFAULT 'helpful' CHECK (vote_type IN ('helpful', 'not_helpful')),
    
    -- 타임스탬프
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    
    -- 한 사용자가 한 리뷰에 한 번만 투표
    CONSTRAINT unique_user_review_vote UNIQUE (user_id, review_id)
);

-- 테이블 소유자 설정
ALTER TABLE public.review_votes OWNER TO postgres;

-- RLS 비활성화 (개발 단계)
ALTER TABLE public.review_votes DISABLE ROW LEVEL SECURITY;

-- 권한 부여
GRANT ALL ON TABLE public.review_votes TO anon;
GRANT ALL ON TABLE public.review_votes TO authenticated;
GRANT ALL ON TABLE public.review_votes TO service_role;

-- 인덱스 생성
CREATE INDEX idx_review_votes_review_id ON public.review_votes(review_id);
CREATE INDEX idx_review_votes_user_id ON public.review_votes(user_id);

-- 코멘트
COMMENT ON TABLE public.review_votes IS '리뷰 투표 기록';

