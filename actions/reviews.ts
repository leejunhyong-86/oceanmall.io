'use server';

/**
 * @file actions/reviews.ts
 * @description 리뷰 관련 Server Actions
 */

import { createClerkSupabaseClient } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';
import type { 
  ExternalReview, 
  UserReview, 
  UserReviewInsert,
  UserReviewWithUser 
} from '@/types';

// ============================================
// 외부 리뷰 (External Reviews)
// ============================================

/**
 * 상품의 외부 리뷰 목록 조회
 */
export async function getExternalReviews(
  productId: string,
  options?: {
    limit?: number;
    offset?: number;
  }
): Promise<ExternalReview[]> {
  const supabase = await createClerkSupabaseClient();

  let query = supabase
    .from('external_reviews')
    .select('*')
    .eq('product_id', productId)
    .order('helpful_count', { ascending: false });

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching external reviews:', error);
    return [];
  }

  return data || [];
}

// ============================================
// 자체 리뷰 (User Reviews)
// ============================================

/**
 * 상품의 자체 리뷰 목록 조회
 */
export async function getUserReviews(
  productId: string,
  options?: {
    limit?: number;
    offset?: number;
    sortBy?: 'recent' | 'helpful' | 'rating_high' | 'rating_low';
  }
): Promise<UserReviewWithUser[]> {
  const supabase = await createClerkSupabaseClient();

  let query = supabase
    .from('user_reviews')
    .select(`
      *,
      user:users(id, name, clerk_id)
    `)
    .eq('product_id', productId)
    .eq('is_visible', true);

  // 정렬
  switch (options?.sortBy) {
    case 'helpful':
      query = query.order('helpful_count', { ascending: false });
      break;
    case 'rating_high':
      query = query.order('rating', { ascending: false });
      break;
    case 'rating_low':
      query = query.order('rating', { ascending: true });
      break;
    case 'recent':
    default:
      query = query.order('created_at', { ascending: false });
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching user reviews:', error);
    return [];
  }

  return (data as UserReviewWithUser[]) || [];
}

/**
 * 리뷰 작성
 */
export async function createUserReview(
  input: Omit<UserReviewInsert, 'user_id'>
): Promise<{ success: boolean; error?: string; review?: UserReview }> {
  const { userId } = await auth();

  if (!userId) {
    return { success: false, error: '로그인이 필요합니다.' };
  }

  const supabase = await createClerkSupabaseClient();

  // Clerk ID로 내부 user ID 조회
  const { data: userData } = await supabase
    .from('users')
    .select('id')
    .eq('clerk_id', userId)
    .single();

  if (!userData) {
    return { success: false, error: '사용자 정보를 찾을 수 없습니다.' };
  }

  // 이미 리뷰를 작성했는지 확인
  const { data: existingReview } = await supabase
    .from('user_reviews')
    .select('id')
    .eq('product_id', input.product_id)
    .eq('user_id', userData.id)
    .single();

  if (existingReview) {
    return { success: false, error: '이미 이 상품에 리뷰를 작성하셨습니다.' };
  }

  // 리뷰 생성
  const { data, error } = await supabase
    .from('user_reviews')
    .insert({
      ...input,
      user_id: userData.id,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating review:', error);
    return { success: false, error: '리뷰 작성에 실패했습니다.' };
  }

  // 상품의 내부 평점 업데이트
  await updateProductInternalRating(input.product_id);

  return { success: true, review: data };
}

/**
 * 리뷰 수정
 */
export async function updateUserReview(
  reviewId: string,
  input: { title?: string; content?: string; rating?: number; images?: string[] }
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

  // 리뷰 소유자 확인 및 업데이트
  const { error } = await supabase
    .from('user_reviews')
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq('id', reviewId)
    .eq('user_id', userData.id);

  if (error) {
    console.error('Error updating review:', error);
    return { success: false, error: '리뷰 수정에 실패했습니다.' };
  }

  return { success: true };
}

/**
 * 리뷰 삭제
 */
export async function deleteUserReview(
  reviewId: string
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

  // 리뷰 정보 가져오기 (상품 ID 필요)
  const { data: reviewData } = await supabase
    .from('user_reviews')
    .select('product_id')
    .eq('id', reviewId)
    .eq('user_id', userData.id)
    .single();

  if (!reviewData) {
    return { success: false, error: '리뷰를 찾을 수 없습니다.' };
  }

  // 삭제
  const { error } = await supabase
    .from('user_reviews')
    .delete()
    .eq('id', reviewId)
    .eq('user_id', userData.id);

  if (error) {
    console.error('Error deleting review:', error);
    return { success: false, error: '리뷰 삭제에 실패했습니다.' };
  }

  // 상품의 내부 평점 업데이트
  await updateProductInternalRating(reviewData.product_id);

  return { success: true };
}

/**
 * 리뷰 "도움됨" 투표
 */
export async function voteReviewHelpful(
  reviewId: string
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

  // 이미 투표했는지 확인
  const { data: existingVote } = await supabase
    .from('review_votes')
    .select('id')
    .eq('review_id', reviewId)
    .eq('user_id', userData.id)
    .single();

  if (existingVote) {
    return { success: false, error: '이미 투표하셨습니다.' };
  }

  // 투표 추가
  const { error: voteError } = await supabase.from('review_votes').insert({
    review_id: reviewId,
    user_id: userData.id,
    vote_type: 'helpful',
  });

  if (voteError) {
    console.error('Error voting:', voteError);
    return { success: false, error: '투표에 실패했습니다.' };
  }

  // 리뷰의 helpful_count 증가
  const { error: updateError } = await supabase.rpc('increment_helpful_count', {
    review_id: reviewId,
  });

  if (updateError) {
    // RPC 실패 시 직접 업데이트
    await supabase
      .from('user_reviews')
      .update({ helpful_count: supabase.rpc('increment', { x: 1 }) })
      .eq('id', reviewId);
  }

  return { success: true };
}

/**
 * 상품의 내부 평점 업데이트 (헬퍼 함수)
 */
async function updateProductInternalRating(productId: string): Promise<void> {
  const supabase = await createClerkSupabaseClient();

  // 평균 평점 계산
  const { data: reviews } = await supabase
    .from('user_reviews')
    .select('rating')
    .eq('product_id', productId)
    .eq('is_visible', true);

  if (!reviews || reviews.length === 0) {
    await supabase
      .from('products')
      .update({
        internal_rating: null,
        internal_review_count: 0,
      })
      .eq('id', productId);
    return;
  }

  const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  await supabase
    .from('products')
    .update({
      internal_rating: Math.round(avgRating * 10) / 10,
      internal_review_count: reviews.length,
    })
    .eq('id', productId);
}

/**
 * 내 리뷰 목록 조회
 */
export async function getMyReviews(): Promise<(UserReview & { product: { title: string; slug: string; thumbnail_url: string | null } })[]> {
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
    .from('user_reviews')
    .select(`
      *,
      product:products(title, slug, thumbnail_url)
    `)
    .eq('user_id', userData.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching my reviews:', error);
    return [];
  }

  return data || [];
}

