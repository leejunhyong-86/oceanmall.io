-- 알리익스프레스 어필리에이트 테이블 생성 (안전한 버전)
-- 이미 테이블이 존재하면 건너뜁니다

-- 1. 기존 테이블 삭제 (선택사항 - 주의!)
-- DROP TABLE IF EXISTS price_history CASCADE;
-- DROP TABLE IF EXISTS affiliate_links CASCADE;
-- DROP TABLE IF EXISTS affiliate_products CASCADE;

-- 1. 알리익스프레스 상품 정보 테이블
CREATE TABLE IF NOT EXISTS affiliate_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- 기본 정보 (API)
  product_id VARCHAR(255) UNIQUE NOT NULL,
  title TEXT NOT NULL,
  
  -- 카테고리
  first_level_category_id INTEGER,
  first_level_category_name VARCHAR(100),
  second_level_category_id INTEGER,
  second_level_category_name VARCHAR(100),
  
  -- 가격 정보 (USD)
  target_sale_price DECIMAL(10,2),
  target_original_price DECIMAL(10,2),
  discount_rate INTEGER,
  
  -- 이미지/영상
  main_image_url TEXT,
  gallery_images JSONB,
  video_url TEXT,
  
  -- 상품 상세
  product_detail_url TEXT,
  
  -- 판매자 정보
  shop_id BIGINT,
  shop_name VARCHAR(255),
  shop_url TEXT,
  
  -- 성과 지표
  commission_rate DECIMAL(5,2),
  evaluate_rate DECIMAL(5,2),
  sales_volume INTEGER DEFAULT 0,
  
  -- 메타 정보
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. 생성된 어필리에이트 링크 테이블
CREATE TABLE IF NOT EXISTS affiliate_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- 상품 참조
  product_id VARCHAR(255),
  
  -- 링크 정보
  short_url TEXT,
  long_url TEXT NOT NULL,
  promotion_link TEXT NOT NULL,
  
  -- 추적 정보
  tracking_id VARCHAR(255),
  
  -- 성과 지표
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  revenue DECIMAL(10,2) DEFAULT 0,
  
  -- 메타 정보
  created_at TIMESTAMP DEFAULT NOW(),
  last_clicked_at TIMESTAMP
);

-- 3. 가격 변동 히스토리 테이블
CREATE TABLE IF NOT EXISTS price_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- 상품 참조
  product_id VARCHAR(255),
  
  -- 가격 정보
  price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2),
  discount_rate INTEGER,
  
  -- 기록 시간
  recorded_at TIMESTAMP DEFAULT NOW()
);

-- 외래 키 추가 (테이블이 이미 존재하는 경우를 위해 DO 블록 사용)
DO $$
BEGIN
  -- affiliate_links 외래 키
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'affiliate_links_product_id_fkey'
  ) THEN
    ALTER TABLE affiliate_links
    ADD CONSTRAINT affiliate_links_product_id_fkey
    FOREIGN KEY (product_id) REFERENCES affiliate_products(product_id) ON DELETE CASCADE;
  END IF;

  -- price_history 외래 키
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'price_history_product_id_fkey'
  ) THEN
    ALTER TABLE price_history
    ADD CONSTRAINT price_history_product_id_fkey
    FOREIGN KEY (product_id) REFERENCES affiliate_products(product_id) ON DELETE CASCADE;
  END IF;
END $$;

-- 인덱스 생성 (이미 존재하면 무시)
CREATE INDEX IF NOT EXISTS idx_affiliate_products_category ON affiliate_products(first_level_category_name);
CREATE INDEX IF NOT EXISTS idx_affiliate_products_price ON affiliate_products(target_sale_price);
CREATE INDEX IF NOT EXISTS idx_affiliate_products_created_at ON affiliate_products(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_affiliate_links_product_id ON affiliate_links(product_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_links_created_at ON affiliate_links(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_price_history_product_id ON price_history(product_id);
CREATE INDEX IF NOT EXISTS idx_price_history_recorded_at ON price_history(recorded_at DESC);

-- RLS (Row Level Security) 정책 설정
ALTER TABLE affiliate_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 후 재생성
DROP POLICY IF EXISTS "Anyone can view affiliate products" ON affiliate_products;
DROP POLICY IF EXISTS "Anyone can view affiliate links" ON affiliate_links;
DROP POLICY IF EXISTS "Anyone can view price history" ON price_history;
DROP POLICY IF EXISTS "Authenticated users can insert affiliate products" ON affiliate_products;
DROP POLICY IF EXISTS "Authenticated users can update affiliate products" ON affiliate_products;
DROP POLICY IF EXISTS "Authenticated users can delete affiliate products" ON affiliate_products;
DROP POLICY IF EXISTS "Authenticated users can insert affiliate links" ON affiliate_links;
DROP POLICY IF EXISTS "Authenticated users can update affiliate links" ON affiliate_links;
DROP POLICY IF EXISTS "Authenticated users can insert price history" ON price_history;

-- 정책 생성
CREATE POLICY "Anyone can view affiliate products" ON affiliate_products
  FOR SELECT USING (true);

CREATE POLICY "Anyone can view affiliate links" ON affiliate_links
  FOR SELECT USING (true);

CREATE POLICY "Anyone can view price history" ON price_history
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert affiliate products" ON affiliate_products
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update affiliate products" ON affiliate_products
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete affiliate products" ON affiliate_products
  FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert affiliate links" ON affiliate_links
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update affiliate links" ON affiliate_links
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert price history" ON price_history
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '✅ 알리익스프레스 어필리에이트 테이블 설정 완료!';
  RAISE NOTICE '   - affiliate_products: 상품 정보';
  RAISE NOTICE '   - affiliate_links: 어필리에이트 링크';
  RAISE NOTICE '   - price_history: 가격 변동 히스토리';
END $$;
