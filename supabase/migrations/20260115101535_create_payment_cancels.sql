-- ============================================
-- 결제 취소 내역 테이블 생성
-- ============================================

CREATE TABLE payment_cancels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  transaction_key TEXT NOT NULL UNIQUE, -- 토스페이먼츠 거래 키
  cancel_amount INTEGER NOT NULL CHECK (cancel_amount > 0),
  cancel_reason TEXT NOT NULL,
  cancel_status TEXT NOT NULL CHECK (cancel_status IN ('DONE', 'PENDING', 'FAILED')),
  refundable_amount INTEGER DEFAULT 0 CHECK (refundable_amount >= 0),
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스 생성
CREATE INDEX idx_payment_cancels_order_id ON payment_cancels(order_id);
CREATE INDEX idx_payment_cancels_transaction_key ON payment_cancels(transaction_key);
CREATE INDEX idx_payment_cancels_cancel_status ON payment_cancels(cancel_status);

-- 코멘트
COMMENT ON TABLE payment_cancels IS '결제 취소 내역';
COMMENT ON COLUMN payment_cancels.transaction_key IS '토스페이먼츠 거래 키 (고유)';
COMMENT ON COLUMN payment_cancels.cancel_amount IS '취소 금액 (원)';
COMMENT ON COLUMN payment_cancels.cancel_status IS '취소 상태: DONE(완료), PENDING(대기), FAILED(실패)';
COMMENT ON COLUMN payment_cancels.refundable_amount IS '환불 가능 금액 (원)';
