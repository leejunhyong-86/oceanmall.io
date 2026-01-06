'use server';

/**
 * @file actions/image-filter.ts
 * @description 이미지 필터링 관련 Server Actions
 */

import { getServiceRoleClient } from '@/lib/supabase/service-role';
import { filterProductDetailImages } from '@/lib/utils/image-filter';
import { revalidatePath } from 'next/cache';

/**
 * 특정 상품의 detail_images 필터링
 */
export async function filterProductImages(
  productId: string
): Promise<{ success: boolean; filteredCount?: number; removedCount?: number; error?: string }> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { success: false, error: 'Supabase 환경 변수가 설정되지 않았습니다.' };
  }

  try {
    const supabase = getServiceRoleClient();

    // 상품 조회
    const { data: product, error: fetchError } = await supabase
      .from('products')
      .select('id, detail_images')
      .eq('id', productId)
      .single();

    if (fetchError || !product) {
      return { success: false, error: '상품을 찾을 수 없습니다.' };
    }

    const originalImages = product.detail_images || [];
    const filteredImages = filterProductDetailImages(originalImages);
    const removedCount = originalImages.length - filteredImages.length;

    // 필터링된 이미지가 다르면 업데이트
    if (removedCount > 0) {
      const { error: updateError } = await supabase
        .from('products')
        .update({ detail_images: filteredImages })
        .eq('id', productId);

      if (updateError) {
        return { success: false, error: '이미지 필터링 업데이트 실패' };
      }

      revalidatePath('/admin/products');
      revalidatePath(`/products/${productId}`);
    }

    return {
      success: true,
      filteredCount: filteredImages.length,
      removedCount,
    };
  } catch (error) {
    console.error('이미지 필터링 오류:', error);
    return { success: false, error: '이미지 필터링 중 오류가 발생했습니다.' };
  }
}

/**
 * 모든 상품의 detail_images 일괄 필터링
 */
export async function filterAllProductImages(): Promise<{
  success: boolean;
  processedCount?: number;
  totalFiltered?: number;
  totalRemoved?: number;
  error?: string;
}> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { success: false, error: 'Supabase 환경 변수가 설정되지 않았습니다.' };
  }

  try {
    const supabase = getServiceRoleClient();

    // 모든 상품 조회
    const { data: products, error: fetchError } = await supabase
      .from('products')
      .select('id, detail_images');

    if (fetchError) {
      return { success: false, error: '상품 조회 실패' };
    }

    if (!products || products.length === 0) {
      return { success: true, processedCount: 0, totalFiltered: 0, totalRemoved: 0 };
    }

    let processedCount = 0;
    let totalFiltered = 0;
    let totalRemoved = 0;

    // 각 상품 필터링
    for (const product of products) {
      const originalImages = product.detail_images || [];
      if (originalImages.length === 0) continue;

      const filteredImages = filterProductDetailImages(originalImages);
      const removedCount = originalImages.length - filteredImages.length;

      if (removedCount > 0) {
        await supabase
          .from('products')
          .update({ detail_images: filteredImages })
          .eq('id', product.id);

        processedCount++;
        totalFiltered += filteredImages.length;
        totalRemoved += removedCount;
      }
    }

    revalidatePath('/admin/products');

    return {
      success: true,
      processedCount,
      totalFiltered,
      totalRemoved,
    };
  } catch (error) {
    console.error('일괄 이미지 필터링 오류:', error);
    return { success: false, error: '일괄 필터링 중 오류가 발생했습니다.' };
  }
}

