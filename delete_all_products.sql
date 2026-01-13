-- ============================================
-- 상품 목록 리뉴얼을 위한 모든 상품 삭제
-- ============================================
-- 
-- Supabase Dashboard > SQL Editor에서 실행하세요
-- 
-- 주의: 이 작업은 되돌릴 수 없습니다!
-- ============================================

-- 1. 외부 리뷰 삭제
DELETE FROM external_reviews;

-- 2. 내부 리뷰 삭제
DELETE FROM internal_reviews;

-- 3. 위시리스트 삭제
DELETE FROM wishlists;

-- 4. 장바구니 아이템 삭제
DELETE FROM cart_items;

-- 5. 주문 아이템 삭제 (주문은 유지)
DELETE FROM order_items;

-- 6. 최근 조회 삭제
DELETE FROM recent_views;

-- 7. AI 요약 삭제
DELETE FROM ai_summaries;

-- 8. 상품 삭제
DELETE FROM products;

-- 삭제 확인
SELECT 
  (SELECT COUNT(*) FROM products) as remaining_products,
  (SELECT COUNT(*) FROM external_reviews) as remaining_external_reviews,
  (SELECT COUNT(*) FROM internal_reviews) as remaining_internal_reviews;
