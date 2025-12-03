'use server';

/**
 * @file actions/wishlists.ts
 * @description 위시리스트 관련 Server Actions
 */

import { createClerkSupabaseClient } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';
import type { WishlistWithProduct } from '@/types';

/**
 * 위시리스트 목록 조회
 */
export async function getWishlist(): Promise<WishlistWithProduct[]> {
  const { userId } = await auth();

  if (!userId) {
    return [];
  }

  const supabase = await createClerkSupabaseClient();

  // 사용자 확인
  const { data: userData } = await supabase
    .from('users')
    .select('id')
    .eq('clerk_id', userId)
    .single();

  if (!userData) {
    return [];
  }

  const { data, error } = await supabase
    .from('wishlists')
    .select(`
      *,
      product:products(*)
    `)
    .eq('user_id', userData.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching wishlist:', error);
    return [];
  }

  return (data as WishlistWithProduct[]) || [];
}

/**
 * 위시리스트에 상품 추가
 */
export async function addToWishlist(
  productId: string,
  note?: string
): Promise<{ success: boolean; error?: string }> {
  const { userId } = await auth();

  if (!userId) {
    return { success: false, error: '로그인이 필요합니다.' };
  }

  const supabase = await createClerkSupabaseClient();

  // 사용자 확인
  const { data: userData } = await supabase
    .from('users')
    .select('id')
    .eq('clerk_id', userId)
    .single();

  if (!userData) {
    return { success: false, error: '사용자 정보를 찾을 수 없습니다.' };
  }

  // 이미 추가되어 있는지 확인
  const { data: existing } = await supabase
    .from('wishlists')
    .select('id')
    .eq('user_id', userData.id)
    .eq('product_id', productId)
    .single();

  if (existing) {
    return { success: false, error: '이미 위시리스트에 추가된 상품입니다.' };
  }

  // 상품의 현재 가격 가져오기
  const { data: productData } = await supabase
    .from('products')
    .select('price_krw')
    .eq('id', productId)
    .single();

  // 위시리스트에 추가
  const { error } = await supabase.from('wishlists').insert({
    user_id: userData.id,
    product_id: productId,
    note: note || null,
    saved_price: productData?.price_krw || null,
  });

  if (error) {
    console.error('Error adding to wishlist:', error);
    return { success: false, error: '위시리스트 추가에 실패했습니다.' };
  }

  return { success: true };
}

/**
 * 위시리스트에서 상품 제거
 */
export async function removeFromWishlist(
  productId: string
): Promise<{ success: boolean; error?: string }> {
  const { userId } = await auth();

  if (!userId) {
    return { success: false, error: '로그인이 필요합니다.' };
  }

  const supabase = await createClerkSupabaseClient();

  // 사용자 확인
  const { data: userData } = await supabase
    .from('users')
    .select('id')
    .eq('clerk_id', userId)
    .single();

  if (!userData) {
    return { success: false, error: '사용자 정보를 찾을 수 없습니다.' };
  }

  const { error } = await supabase
    .from('wishlists')
    .delete()
    .eq('user_id', userData.id)
    .eq('product_id', productId);

  if (error) {
    console.error('Error removing from wishlist:', error);
    return { success: false, error: '위시리스트에서 제거에 실패했습니다.' };
  }

  return { success: true };
}

/**
 * 위시리스트 토글 (추가/제거)
 */
export async function toggleWishlist(
  productId: string
): Promise<{ success: boolean; isInWishlist: boolean; error?: string }> {
  const { userId } = await auth();

  if (!userId) {
    return { success: false, isInWishlist: false, error: '로그인이 필요합니다.' };
  }

  const supabase = await createClerkSupabaseClient();

  // 사용자 확인
  const { data: userData } = await supabase
    .from('users')
    .select('id')
    .eq('clerk_id', userId)
    .single();

  if (!userData) {
    return { success: false, isInWishlist: false, error: '사용자 정보를 찾을 수 없습니다.' };
  }

  // 이미 추가되어 있는지 확인
  const { data: existing } = await supabase
    .from('wishlists')
    .select('id')
    .eq('user_id', userData.id)
    .eq('product_id', productId)
    .single();

  if (existing) {
    // 이미 있으면 제거
    const result = await removeFromWishlist(productId);
    return { ...result, isInWishlist: false };
  } else {
    // 없으면 추가
    const result = await addToWishlist(productId);
    return { ...result, isInWishlist: true };
  }
}

/**
 * 위시리스트 여부 확인
 */
export async function isInWishlist(productId: string): Promise<boolean> {
  const { userId } = await auth();

  if (!userId) {
    return false;
  }

  const supabase = await createClerkSupabaseClient();

  // 사용자 확인
  const { data: userData } = await supabase
    .from('users')
    .select('id')
    .eq('clerk_id', userId)
    .single();

  if (!userData) {
    return false;
  }

  const { data } = await supabase
    .from('wishlists')
    .select('id')
    .eq('user_id', userData.id)
    .eq('product_id', productId)
    .single();

  return !!data;
}

