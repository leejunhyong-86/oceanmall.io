-- ============================================
-- 상품 목록 리뉴얼을 위한 모든 상품 삭제
-- ============================================
-- 
-- 이 마이그레이션은 상품 목록 리뉴얼을 위해
-- 모든 상품 및 관련 데이터를 삭제합니다.
--
-- 삭제 순서:
-- 1. 외부 리뷰 (external_reviews)
-- 2. 내부 리뷰 (internal_reviews)
-- 3. 위시리스트 (wishlists)
-- 4. 장바구니 아이템 (cart_items)
-- 5. 주문 아이템 (order_items) - 주문은 유지
-- 6. 상품 (products)
--
-- 주의: 이 작업은 되돌릴 수 없습니다!
-- ============================================

BEGIN;

-- 1. 외부 리뷰 삭제
DELETE FROM external_reviews;
RAISE NOTICE '외부 리뷰 삭제 완료';

-- 2. 내부 리뷰 삭제
DELETE FROM internal_reviews;
RAISE NOTICE '내부 리뷰 삭제 완료';

-- 3. 위시리스트 삭제
DELETE FROM wishlists;
RAISE NOTICE '위시리스트 삭제 완료';

-- 4. 장바구니 아이템 삭제
DELETE FROM cart_items;
RAISE NOTICE '장바구니 아이템 삭제 완료';

-- 5. 주문 아이템 삭제 (주문은 유지)
DELETE FROM order_items;
RAISE NOTICE '주문 아이템 삭제 완료';

-- 6. 최근 조회 삭제
DELETE FROM recent_views;
RAISE NOTICE '최근 조회 삭제 완료';

-- 7. AI 요약 삭제
DELETE FROM ai_summaries;
RAISE NOTICE 'AI 요약 삭제 완료';

-- 8. 상품 삭제
DELETE FROM products;
RAISE NOTICE '상품 삭제 완료';

-- 삭제 확인
DO $$
DECLARE
  remaining_products INTEGER;
  remaining_reviews INTEGER;
BEGIN
  SELECT COUNT(*) INTO remaining_products FROM products;
  SELECT COUNT(*) INTO remaining_reviews FROM external_reviews;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE '삭제 완료 확인:';
  RAISE NOTICE '  - 남은 상품 수: %', remaining_products;
  RAISE NOTICE '  - 남은 외부 리뷰 수: %', remaining_reviews;
  RAISE NOTICE '========================================';
END $$;

COMMIT;
