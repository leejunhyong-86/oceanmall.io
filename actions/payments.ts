'use server';

/**
 * @file actions/payments.ts
 * @description 결제 관련 Server Actions
 *
 * 환불, 부분 취소 등의 결제 관련 서버 액션을 제공합니다.
 */

import { createClerkSupabaseClient } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import type { PaymentCancel, PaymentCancelInsert } from '@/types';

const TOSS_SECRET_KEY = process.env.TOSS_SECRET_KEY;

/**
 * 주문의 취소 내역 조회
 */
export async function getPaymentCancels(orderId: string): Promise<PaymentCancel[]> {
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

  // 주문 소유권 확인
  const { data: order } = await supabase
    .from('orders')
    .select('id, user_id')
    .eq('id', orderId)
    .eq('user_id', userData.id)
    .single();

  if (!order) {
    return [];
  }

  // 취소 내역 조회
  const { data: cancels, error } = await supabase
    .from('payment_cancels')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('취소 내역 조회 오류:', error);
    return [];
  }

  return (cancels as PaymentCancel[]) || [];
}

/**
 * 환불 가능 금액 계산
 */
export async function getRefundableAmount(orderId: string): Promise<number> {
  const { userId } = await auth();

  if (!userId) {
    return 0;
  }

  const supabase = await createClerkSupabaseClient();

  // 사용자 확인
  const { data: userData } = await supabase
    .from('users')
    .select('id')
    .eq('clerk_id', userId)
    .single();

  if (!userData) {
    return 0;
  }

  // 주문 조회
  const { data: order } = await supabase
    .from('orders')
    .select('id, total_amount, balance_amount, cancelled_amount, status, payment_key, user_id')
    .eq('id', orderId)
    .eq('user_id', userData.id)
    .single();

  if (!order || !order.payment_key) {
    return 0;
  }

  // 결제 완료된 주문만 환불 가능
  if (order.status !== 'paid') {
    return 0;
  }

  // 잔액 반환 (부분 취소 후 남은 금액)
  return order.balance_amount || order.total_amount - (order.cancelled_amount || 0);
}

/**
 * 취소 내역 저장
 */
export async function savePaymentCancel(
  cancelData: PaymentCancelInsert
): Promise<{ success: boolean; error?: string; cancelId?: string }> {
  const supabase = await createClerkSupabaseClient();

  const { data: cancel, error } = await supabase
    .from('payment_cancels')
    .insert(cancelData)
    .select()
    .single();

  if (error) {
    console.error('취소 내역 저장 오류:', error);
    return { success: false, error: '취소 내역 저장에 실패했습니다.' };
  }

  return { success: true, cancelId: cancel.id };
}

/**
 * 주문의 취소 금액 업데이트
 */
export async function updateOrderCancelAmount(
  orderId: string,
  cancelAmount: number
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClerkSupabaseClient();

  // 현재 주문 정보 조회
  const { data: order } = await supabase
    .from('orders')
    .select('total_amount, cancelled_amount, balance_amount')
    .eq('id', orderId)
    .single();

  if (!order) {
    return { success: false, error: '주문을 찾을 수 없습니다.' };
  }

  const newCancelledAmount = (order.cancelled_amount || 0) + cancelAmount;
  const newBalanceAmount = order.total_amount - newCancelledAmount;

  // 주문 상태 결정
  let newStatus: 'paid' | 'cancelled' = 'paid';
  if (newBalanceAmount <= 0) {
    newStatus = 'cancelled';
  }

  // 주문 업데이트
  const { error } = await supabase
    .from('orders')
    .update({
      cancelled_amount: newCancelledAmount,
      balance_amount: newBalanceAmount,
      status: newStatus,
    })
    .eq('id', orderId);

  if (error) {
    console.error('주문 업데이트 오류:', error);
    return { success: false, error: '주문 업데이트에 실패했습니다.' };
  }

  revalidatePath('/my/orders');
  revalidatePath(`/my/orders/${orderId}`);
  return { success: true };
}
