# 결제 시스템 테스트 가이드

## 1. 사전 준비

### 1.1 데이터베이스 마이그레이션 실행

**Supabase Dashboard에서 실행:**

1. [Supabase Dashboard](https://supabase.com/dashboard) 접속
2. 프로젝트 선택
3. **SQL Editor** 클릭
4. **New query** 클릭
5. 다음 파일들을 순서대로 실행:

**파일 1: `supabase/migrations/20260115101535_create_payment_cancels.sql`**
```sql
-- 결제 취소 내역 테이블 생성
CREATE TABLE payment_cancels (
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

CREATE INDEX idx_payment_cancels_order_id ON payment_cancels(order_id);
CREATE INDEX idx_payment_cancels_transaction_key ON payment_cancels(transaction_key);
CREATE INDEX idx_payment_cancels_cancel_status ON payment_cancels(cancel_status);
```

**파일 2: `supabase/migrations/20260115101536_extend_orders_table.sql`**
```sql
-- 주문 테이블 컬럼 추가
ALTER TABLE orders 
  ADD COLUMN IF NOT EXISTS balance_amount INTEGER DEFAULT 0 CHECK (balance_amount >= 0),
  ADD COLUMN IF NOT EXISTS cancelled_amount INTEGER DEFAULT 0 CHECK (cancelled_amount >= 0);
```

### 1.2 환경 변수 확인

`.env.local` 파일에 다음 변수가 설정되어 있는지 확인:

```bash
NEXT_PUBLIC_TOSS_CLIENT_KEY=test_ck_xxxxx
TOSS_SECRET_KEY=test_sk_xxxxx
```

## 2. 개발 서버 실행

```bash
pnpm dev
```

## 3. 결제 테스트 시나리오

### 3.1 정상 결제 플로우

1. **상품 추가**
   - 홈페이지에서 상품 선택
   - 장바구니에 추가

2. **결제 페이지 이동**
   - 장바구니에서 "결제하기" 클릭
   - `/checkout` 페이지로 이동

3. **배송 정보 입력**
   - 받는 분 이름
   - 연락처
   - 배송 주소
   - 배송 메모 (선택)

4. **결제 진행**
   - 토스페이먼츠 결제 위젯에서 결제 수단 선택
   - 테스트 카드 정보 입력:
     - 카드번호: `1234-5678-9012-3456`
     - 유효기간: `12/34`
     - CVC: `123`
     - 비밀번호: `123456`

5. **결제 완료 확인**
   - `/checkout/success` 페이지로 리다이렉트
   - 주문 번호 확인
   - `/my/orders`에서 주문 내역 확인

### 3.2 환불 테스트

1. **주문 상세 페이지 이동**
   - `/my/orders`에서 결제 완료된 주문 클릭
   - 또는 `/my/orders/[orderId]` 직접 접근

2. **환불 요청**
   - "환불 요청" 버튼 클릭
   - 환불 금액 입력 (전액 또는 부분)
   - 취소 사유 입력
   - "환불 요청" 클릭

3. **환불 완료 확인**
   - 주문 상태가 `cancelled`로 변경
   - 취소 내역이 표시됨
   - 환불 가능 금액이 0으로 변경

### 3.3 부분 환불 테스트

1. **결제 완료된 주문 선택**
2. **부분 환불**
   - 환불 금액을 총 금액보다 작게 입력
   - 예: 총 10,000원 중 5,000원만 환불
3. **확인**
   - 주문 상태는 `paid` 유지
   - `balance_amount`가 남은 금액으로 업데이트
   - `cancelled_amount`가 취소된 금액으로 업데이트

### 3.4 결제 실패 테스트

1. **결제 진행 중 취소**
   - 결제창에서 취소 버튼 클릭
   - `/checkout/fail` 페이지로 이동
   - 재시도 버튼 확인

2. **에러 코드 확인**
   - 실패 페이지에서 에러 코드 확인
   - 사용자 친화적 메시지 표시 확인

## 4. 관리자 기능 테스트

### 4.1 관리자 주문 관리

1. **관리자 페이지 접근**
   - `/admin` 접근
   - 관리자 권한 확인

2. **주문 목록 조회**
   - `/admin/orders` 접근
   - 전체 주문 목록 확인
   - 주문 상태별 필터링 테스트

3. **주문 상세 확인**
   - 주문 번호 클릭
   - 주문 상세 정보 확인
   - 환불 내역 확인

## 5. 테스트 체크리스트

### 기본 기능
- [ ] 장바구니에 상품 추가
- [ ] 결제 페이지에서 배송 정보 입력
- [ ] 토스페이먼츠 결제 위젯 표시
- [ ] 테스트 카드로 결제 성공
- [ ] 결제 완료 후 성공 페이지 표시
- [ ] 주문 내역에 주문 추가됨

### 환불 기능
- [ ] 결제 완료된 주문에서 환불 버튼 표시
- [ ] 전액 환불 성공
- [ ] 부분 환불 성공
- [ ] 취소 내역 저장 확인
- [ ] 주문 상태 업데이트 확인

### 관리자 기능
- [ ] 관리자 주문 목록 조회
- [ ] 주문 상태별 필터링
- [ ] 주문 상세 정보 확인

### 에러 처리
- [ ] 결제 실패 시 에러 메시지 표시
- [ ] 재시도 버튼 동작 확인
- [ ] 네트워크 오류 처리 확인

## 6. 문제 해결

### 마이그레이션 오류

**오류: "column already exists"**
- 이미 컬럼이 존재하는 경우, `IF NOT EXISTS` 구문으로 안전하게 처리됨
- 무시하고 진행 가능

**오류: "table already exists"**
- `payment_cancels` 테이블이 이미 있는 경우
- 테이블 구조 확인 후 필요시 수정

### 결제 위젯이 표시되지 않을 때

1. **환경 변수 확인**
   ```bash
   # .env.local 파일 확인
   NEXT_PUBLIC_TOSS_CLIENT_KEY=test_ck_xxxxx
   ```

2. **브라우저 콘솔 확인**
   - F12로 개발자 도구 열기
   - Console 탭에서 에러 확인

3. **토스페이먼츠 키 확인**
   - [토스페이먼츠 개발자센터](https://developers.tosspayments.com)
   - 내 개발 정보에서 키 확인

### 환불 버튼이 보이지 않을 때

1. **주문 상태 확인**
   - 주문 상태가 `paid`인지 확인
   - `pending` 상태는 환불 불가

2. **환불 가능 금액 확인**
   - `balance_amount > 0`인지 확인
   - 이미 전액 환불된 경우 버튼 숨김

3. **결제 키 확인**
   - `payment_key`가 있는지 확인
   - 결제 완료된 주문만 환불 가능

## 7. 테스트 카드 정보

토스페이먼츠 테스트 환경에서 사용할 수 있는 카드:

```
카드번호: 1234-5678-9012-3456
유효기간: 12/34
CVC: 123
비밀번호: 123456
```

**참고:** 테스트 카드로 실제 결제는 발생하지 않습니다.

## 8. 다음 단계

테스트가 완료되면:

1. **프로덕션 배포 준비**
   - 테스트 키 → 라이브 키로 변경
   - 웹훅 URL 설정
   - 웹훅 시크릿 키 설정

2. **모니터링 설정**
   - 결제 로그 확인
   - 에러 알림 설정 (선택)

3. **문서화**
   - 운영 가이드 작성
   - 고객 지원 가이드 작성
