# 마이그레이션 오류 해결 가이드

## 오류: "relation payment_cancels already exists"

이 오류는 `payment_cancels` 테이블이 이미 존재할 때 발생합니다.

### 해결 방법

**방법 1: 안전한 마이그레이션 실행 (권장)**

Supabase SQL Editor에서 다음 SQL을 실행하세요:

```sql
-- payment_cancels 테이블 확인 및 수정
CREATE TABLE IF NOT EXISTS payment_cancels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  transaction_key TEXT NOT NULL UNIQUE,
  cancel_amount INTEGER NOT NULL CHECK (cancel_amount > 0),
  cancel_reason TEXT NOT NULL,
  cancel_status TEXT NOT NULL CHECK (cancel_status IN ('DONE', 'PENDING', 'FAILED')),
  refundable_amount INTEGER DEFAULT 0 CHECK (refundable_amount >= 0),
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스 생성 (없으면 생성)
CREATE INDEX IF NOT EXISTS idx_payment_cancels_order_id ON payment_cancels(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_cancels_transaction_key ON payment_cancels(transaction_key);
CREATE INDEX IF NOT EXISTS idx_payment_cancels_cancel_status ON payment_cancels(cancel_status);
```

**방법 2: 기존 테이블 확인 후 필요한 컬럼만 추가**

테이블이 이미 존재한다면, 구조를 확인하고 필요한 컬럼만 추가:

```sql
-- 테이블 구조 확인
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'payment_cancels'
ORDER BY ordinal_position;
```

필요한 컬럼이 없다면 추가:

```sql
-- 예시: refundable_amount 컬럼이 없다면
ALTER TABLE payment_cancels 
  ADD COLUMN IF NOT EXISTS refundable_amount INTEGER DEFAULT 0 CHECK (refundable_amount >= 0);
```

### orders 테이블 확장 (이미 실행했는지 확인)

```sql
-- 컬럼이 이미 있는지 확인
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'orders' 
  AND column_name IN ('balance_amount', 'cancelled_amount');

-- 없으면 추가
ALTER TABLE orders 
  ADD COLUMN IF NOT EXISTS balance_amount INTEGER DEFAULT 0 CHECK (balance_amount >= 0),
  ADD COLUMN IF NOT EXISTS cancelled_amount INTEGER DEFAULT 0 CHECK (cancelled_amount >= 0);
```

### 확인 쿼리

모든 마이그레이션이 제대로 적용되었는지 확인:

```sql
-- payment_cancels 테이블 확인
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'payment_cancels'
ORDER BY ordinal_position;

-- orders 테이블의 새 컬럼 확인
SELECT 
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_name = 'orders' 
  AND column_name IN ('balance_amount', 'cancelled_amount');
```

### 다음 단계

마이그레이션이 완료되면:
1. 개발 서버 재시작: `pnpm dev`
2. 결제 테스트 진행
