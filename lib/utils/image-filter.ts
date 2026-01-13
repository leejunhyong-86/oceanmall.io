/**
 * @file lib/utils/image-filter.ts
 * @description 이미지 필터링 유틸리티
 * 
 * 제품 정보와 무관한 이미지(로고, 아이콘, 낮은 해상도 등)를 필터링합니다.
 */

/**
 * 이미지 URL이 제품 상세 이미지로 적합한지 확인
 */
export function isValidProductDetailImage(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  const urlLower = url.toLowerCase();

  // 기본 필터링: 유효한 HTTP URL인지 확인
  if (!url.startsWith('http')) {
    return false;
  }

  // 제품 정보와 무관한 이미지 패턴 제외
  const excludePatterns = [
    'icon', 'logo', 'badge', 'button', 'play', 'info', 'arrow',
    'star', 'rating', 'prime', 'sponsor', 'ad', 'banner',
    'thumbnail', 'thumb', 'small', 'tiny', 'mini',
    'avatar', 'profile', 'user', 'account',
    'checkmark', 'check', 'x-mark', 'close', 'cancel',
    'loading', 'spinner', 'loader', 'skeleton',
    'placeholder', 'empty', 'default', 'no-image',
    'pixel', 'tracking', 'beacon', 'analytics'
  ];

  const shouldExclude = excludePatterns.some(pattern => urlLower.includes(pattern));
  if (shouldExclude) {
    return false;
  }

  // AliExpress 이미지 크기 필터링
  // 패턴: tps-128-128, tps-134-32, 21x21 등
  const aliSizeMatch = url.match(/tps-(\d+)-(\d+)/);
  if (aliSizeMatch) {
    const width = parseInt(aliSizeMatch[1]);
    const height = parseInt(aliSizeMatch[2]);
    // 200px 미만은 제외 (로고, 아이콘 등)
    if (width < 200 || height < 200) {
      return false;
    }
  }

  // URL에 크기가 명시된 경우 (예: 128-128, 21x21 등)
  const sizeInUrlMatch = url.match(/[\/\-_](\d+)[-x](\d+)/);
  if (sizeInUrlMatch) {
    const width = parseInt(sizeInUrlMatch[1]);
    const height = parseInt(sizeInUrlMatch[2]);
    // 200px 미만은 제외
    if (width < 200 || height < 200) {
      return false;
    }
  }

  // Amazon URL에서 해상도 정보 추출
  const resolutionMatch = url.match(/\._AC_SL(\d+)_\./);
  if (resolutionMatch) {
    const resolution = parseInt(resolutionMatch[1]);
    // 500px 미만은 제외
    if (resolution < 500) {
      return false;
    }
  }

  // data:image나 blob: URL 제외
  if (url.includes('data:image') || url.startsWith('blob:')) {
    return false;
  }

  return true;
}

/**
 * 이미지 URL 배열에서 유효한 이미지만 필터링
 */
export function filterProductDetailImages(images: string[]): string[] {
  if (!Array.isArray(images)) {
    return [];
  }

  return images.filter(img => isValidProductDetailImage(img));
}

/**
 * 이미지 URL에서 해상도 정보 추출
 */
export function extractImageResolution(url: string): number | null {
  const match = url.match(/\._AC_SL(\d+)_\./);
  return match ? parseInt(match[1]) : null;
}

/**
 * 이미지 URL을 고해상도로 변환 (Amazon URL 패턴)
 */
export function convertToHighResolution(url: string): string {
  // 썸네일 URL을 고해상도로 변환 시도
  return url.replace(/\._[A-Z0-9_]+_\./, '.');
}

