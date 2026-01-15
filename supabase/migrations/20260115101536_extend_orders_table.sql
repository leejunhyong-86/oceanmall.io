-- ============================================
-- 주문 테이블 컬럼 추가 (잔액, 취소 금액)
-- ============================================

ALTER TABLE orders 
  ADD COLUMN IF NOT EXISTS balance_amount INTEGER DEFAULT 0 CHECK (balance_amount >= 0),
  ADD COLUMN IF NOT EXISTS cancelled_amount INTEGER DEFAULT 0 CHECK (cancelled_amount >= 0);

-- 코멘트
COMMENT ON COLUMN orders.balance_amount IS '결제 잔액 (원) - 부분 취소 후 남은 금액';
COMMENT ON COLUMN orders.cancelled_amount IS '취소된 총 금액 (원)';
