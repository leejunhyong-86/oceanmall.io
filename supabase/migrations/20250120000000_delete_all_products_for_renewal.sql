-- ============================================
-- 상품 목록 리뉴얼을 위한 모든 상품 삭제
-- ============================================
-- 
-- 이 마이그레이션은 상품 목록 리뉴얼을 위해
-- 모든 상품 및 관련 데이터를 삭제합니다.
--
-- 삭제 순서 (외래키 제약조건 고려):
-- 1. order_items (products 참조, CASCADE 없음 - 수동 삭제 필요)
-- 2. carts (products 참조, ON DELETE CASCADE)
-- 3. recent_views (products 참조, ON DELETE CASCADE)
-- 4. wishlists (products 참조, ON DELETE CASCADE)
-- 5. ai_summaries (products 참조, ON DELETE CASCADE)
-- 6. user_reviews (products 참조, ON DELETE CASCADE)
-- 7. external_reviews (products 참조, ON DELETE CASCADE)
-- 8. products (최종 삭제)
--
-- 주의: 이 작업은 되돌릴 수 없습니다!
-- 주문(order_items)은 주문 정보를 보존하기 위해 삭제하지 않습니다.
-- ============================================

BEGIN;

-- 삭제 전 현재 상태 확인
DO $$
DECLARE
  product_count INTEGER;
  cart_count INTEGER;
  wishlist_count INTEGER;
  review_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO product_count FROM products;
  SELECT COUNT(*) INTO cart_count FROM carts;
  SELECT COUNT(*) INTO wishlist_count FROM wishlists;
  SELECT COUNT(*) INTO review_count FROM user_reviews;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE '삭제 전 상태:';
  RAISE NOTICE '  - 상품 수: %', product_count;
  RAISE NOTICE '  - 장바구니 아이템 수: %', cart_count;
  RAISE NOTICE '  - 위시리스트 수: %', wishlist_count;
  RAISE NOTICE '  - 리뷰 수: %', review_count;
  RAISE NOTICE '========================================';
END $$;

-- 1. order_items 삭제 (주문은 유지하되, 주문 아이템만 삭제)
-- 주문 정보는 보존하되, 상품 참조는 제거
DELETE FROM order_items;
RAISE NOTICE '주문 아이템 삭제 완료';

-- 2. carts 삭제 (ON DELETE CASCADE이지만 명시적으로 삭제)
DELETE FROM carts;
RAISE NOTICE '장바구니 삭제 완료';

-- 3. recent_views 삭제 (ON DELETE CASCADE이지만 명시적으로 삭제)
DELETE FROM recent_views;
RAISE NOTICE '최근 조회 삭제 완료';

-- 4. wishlists 삭제 (ON DELETE CASCADE이지만 명시적으로 삭제)
DELETE FROM wishlists;
RAISE NOTICE '위시리스트 삭제 완료';

-- 5. ai_summaries 삭제 (ON DELETE CASCADE이지만 명시적으로 삭제)
DELETE FROM ai_summaries;
RAISE NOTICE 'AI 요약 삭제 완료';

-- 6. user_reviews 삭제 (ON DELETE CASCADE이지만 명시적으로 삭제)
DELETE FROM user_reviews;
RAISE NOTICE '사용자 리뷰 삭제 완료';

-- 7. external_reviews 삭제 (ON DELETE CASCADE이지만 명시적으로 삭제)
DELETE FROM external_reviews;
RAISE NOTICE '외부 리뷰 삭제 완료';

-- 8. products 삭제 (최종)
DELETE FROM products;
RAISE NOTICE '상품 삭제 완료';

-- 삭제 후 확인
DO $$
DECLARE
  remaining_products INTEGER;
  remaining_carts INTEGER;
  remaining_wishlists INTEGER;
  remaining_reviews INTEGER;
  remaining_order_items INTEGER;
BEGIN
  SELECT COUNT(*) INTO remaining_products FROM products;
  SELECT COUNT(*) INTO remaining_carts FROM carts;
  SELECT COUNT(*) INTO remaining_wishlists FROM wishlists;
  SELECT COUNT(*) INTO remaining_reviews FROM user_reviews;
  SELECT COUNT(*) INTO remaining_order_items FROM order_items;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE '삭제 완료 확인:';
  RAISE NOTICE '  - 남은 상품 수: %', remaining_products;
  RAISE NOTICE '  - 남은 장바구니 아이템 수: %', remaining_carts;
  RAISE NOTICE '  - 남은 위시리스트 수: %', remaining_wishlists;
  RAISE NOTICE '  - 남은 리뷰 수: %', remaining_reviews;
  RAISE NOTICE '  - 남은 주문 아이템 수: %', remaining_order_items;
  RAISE NOTICE '========================================';
  
  -- 검증: 모든 상품이 삭제되었는지 확인
  IF remaining_products > 0 THEN
    RAISE EXCEPTION '상품 삭제 실패: %개의 상품이 남아있습니다.', remaining_products;
  END IF;
  
  RAISE NOTICE '✅ 모든 상품이 성공적으로 삭제되었습니다!';
END $$;

COMMIT;
