/**
 * @migration add_detail_images_to_products
 * @description products 테이블에 detail_images 필드 추가
 * 
 * 상품의 상세 설명 이미지 URL 배열을 저장하는 필드입니다.
 * 기존 images 필드는 갤러리용으로 유지됩니다.
 */

-- products 테이블에 detail_images 필드 추가
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS detail_images TEXT[] DEFAULT '{}';

-- 기존 데이터에 대한 기본값 설정 (이미 있는 데이터는 빈 배열로 초기화)
UPDATE products 
SET detail_images = '{}' 
WHERE detail_images IS NULL;

-- 코멘트 추가
COMMENT ON COLUMN products.detail_images IS '상품 상세 설명 이미지 URL 배열';

