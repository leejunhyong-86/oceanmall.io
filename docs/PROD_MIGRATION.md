# 프로덕션 환경 마이그레이션 가이드

## 문제 상황

배포 환경에서 `detail_images` 필드가 표시되지 않는 경우, 대부분 **데이터베이스 마이그레이션이 프로덕션 Supabase에 적용되지 않았기 때문**입니다.

## 해결 방법

### 방법 1: Supabase 대시보드에서 직접 실행 (권장)

1. **Supabase 대시보드 접속**
   - [Supabase Dashboard](https://supabase.com/dashboard) 접속
   - 프로덕션 프로젝트 선택

2. **SQL Editor 열기**
   - 왼쪽 메뉴에서 **SQL Editor** 클릭
   - **New query** 클릭

3. **마이그레이션 SQL 실행**
   - 다음 SQL을 복사하여 붙여넣기:

```sql
-- products 테이블에 detail_images 필드 추가
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS detail_images TEXT[] DEFAULT '{}';

-- 기존 데이터에 대한 기본값 설정
UPDATE products 
SET detail_images = '{}' 
WHERE detail_images IS NULL;

-- 코멘트 추가
COMMENT ON COLUMN products.detail_images IS '상품 상세 설명 이미지 URL 배열';
```

4. **실행**
   - **Run** 버튼 클릭
   - 성공 메시지 확인

### 방법 2: Supabase CLI 사용 (로컬에서)

1. **Supabase CLI 설치** (아직 설치하지 않은 경우)
```bash
npm install -g supabase
```

2. **프로덕션 프로젝트 연결**
```bash
supabase link --project-ref your-project-ref
```

3. **마이그레이션 적용**
```bash
supabase db push
```

### 방법 3: 마이그레이션 파일 직접 실행

1. **마이그레이션 파일 확인**
   - 파일 위치: `supabase/migrations/20260106131840_add_detail_images_to_products.sql`

2. **Supabase 대시보드에서 실행**
   - SQL Editor에서 파일 내용 복사하여 실행

## 확인 방법

마이그레이션이 적용되었는지 확인:

```sql
-- products 테이블 구조 확인
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'products' 
AND column_name = 'detail_images';
```

결과에 `detail_images` 컬럼이 보이면 성공입니다.

## 추가 확인 사항

### 1. 데이터 확인

배포 환경의 상품에 `detail_images` 데이터가 있는지 확인:

```sql
-- detail_images가 있는 상품 확인
SELECT id, title, detail_images, array_length(detail_images, 1) as image_count
FROM products
WHERE detail_images IS NOT NULL 
AND array_length(detail_images, 1) > 0
LIMIT 10;
```

### 2. 환경 변수 확인

Vercel 대시보드에서 프로덕션 환경 변수가 올바르게 설정되었는지 확인:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### 3. 재배포

마이그레이션 적용 후 Vercel에서 재배포:
- Vercel 대시보드 > 프로젝트 > **Redeploy** 클릭
- 또는 GitHub에 새로운 커밋 푸시 (자동 재배포)

## 문제 해결 체크리스트

- [ ] Supabase 대시보드에서 마이그레이션 SQL 실행 완료
- [ ] `detail_images` 컬럼이 생성되었는지 확인
- [ ] 상품 데이터에 `detail_images` 값이 있는지 확인
- [ ] Vercel 환경 변수가 올바르게 설정되었는지 확인
- [ ] 재배포 완료
- [ ] 배포 환경에서 상세 이미지 표시 확인

## 참고

- 개발 환경과 프로덕션 환경은 **별도의 Supabase 프로젝트**를 사용합니다
- 마이그레이션은 각 환경에 **개별적으로 적용**해야 합니다
- 개발 환경에만 적용된 마이그레이션은 프로덕션에 자동으로 반영되지 않습니다

