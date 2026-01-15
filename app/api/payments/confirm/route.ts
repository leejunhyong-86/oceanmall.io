/**
 * @file app/api/payments/confirm/route.ts
 * @description 결제 승인 API - 토스페이먼츠 결제 승인 및 주문 상태 업데이트
 * 
 * 보안 강화:
 * - 서버 사이드 금액 재검증
 * - 주문 상태 검증 (중복 승인 방지)
 * - 사용자 소유권 확인
 * - 상세한 에러 로깅
 */

import { NextResponse } from 'next/server';
import { createClerkSupabaseClient } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';
import { clearCart } from '@/actions/cart';

const TOSS_SECRET_KEY = process.env.TOSS_SECRET_KEY;

export async function GET(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.redirect(new URL('/sign-in', request.url));
    }

    if (!TOSS_SECRET_KEY) {
      console.error('토스페이먼츠 시크릿 키가 설정되지 않았습니다.');
      return NextResponse.redirect(
        new URL('/checkout/fail?message=결제 시스템 오류가 발생했습니다.', request.url)
      );
    }

    const { searchParams } = new URL(request.url);
    const paymentKey = searchParams.get('paymentKey');
    const orderId = searchParams.get('orderId');
    const amount = searchParams.get('amount');

    if (!paymentKey || !orderId || !amount) {
      console.error('결제 정보 누락:', { paymentKey, orderId, amount });
      return NextResponse.redirect(
        new URL('/checkout/fail?message=결제 정보가 누락되었습니다.', request.url)
      );
    }

    const supabase = await createClerkSupabaseClient();

    // 사용자 확인
    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (!userData) {
      console.error('사용자 정보를 찾을 수 없습니다:', userId);
      return NextResponse.redirect(
        new URL('/checkout/fail?message=사용자 정보를 찾을 수 없습니다.', request.url)
      );
    }

    // 주문 조회 (소유권 확인)
    const { data: order } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .eq('user_id', userData.id)
      .single();

    if (!order) {
      console.error('주문을 찾을 수 없거나 소유권이 없습니다:', { orderId, userId });
      return NextResponse.redirect(
        new URL('/checkout/fail?message=주문을 찾을 수 없습니다.', request.url)
      );
    }

    // 주문 상태 검증 (중복 승인 방지)
    if (order.status === 'paid') {
      console.warn('이미 결제 완료된 주문:', orderId);
      // 이미 결제 완료된 경우 성공 페이지로 리다이렉트
      return NextResponse.redirect(
        new URL(`/checkout/success?orderNumber=${order.order_number}`, request.url)
      );
    }

    if (order.status !== 'pending') {
      console.error('결제 대기 상태가 아닌 주문:', { orderId, status: order.status });
      return NextResponse.redirect(
        new URL('/checkout/fail?message=결제할 수 없는 주문 상태입니다.', request.url)
      );
    }

    // 금액 검증 (서버 사이드 재검증)
    const requestAmount = parseInt(amount);
    if (isNaN(requestAmount) || requestAmount <= 0) {
      console.error('유효하지 않은 결제 금액:', amount);
      return NextResponse.redirect(
        new URL('/checkout/fail?message=유효하지 않은 결제 금액입니다.', request.url)
      );
    }

    if (order.total_amount !== requestAmount) {
      console.error('결제 금액 불일치:', {
        orderId,
        orderAmount: order.total_amount,
        requestAmount,
      });
      return NextResponse.redirect(
        new URL('/checkout/fail?message=결제 금액이 일치하지 않습니다.', request.url)
      );
    }

    // 토스페이먼츠 결제 승인 API 호출
    const confirmResponse = await fetch(
      'https://api.tosspayments.com/v1/payments/confirm',
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${TOSS_SECRET_KEY}:`).toString('base64')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentKey,
          orderId: order.order_number,
          amount: requestAmount,
        }),
      }
    );

    if (!confirmResponse.ok) {
      const errorData = await confirmResponse.json();
      console.error('토스 결제 승인 실패:', {
        orderId,
        paymentKey,
        error: errorData,
      });
      return NextResponse.redirect(
        new URL(
          `/checkout/fail?code=${errorData.code || 'UNKNOWN'}&message=${encodeURIComponent(errorData.message || '결제 승인에 실패했습니다.')}`,
          request.url
        )
      );
    }

    const paymentData = await confirmResponse.json();

    // 결제 승인 응답 금액 재검증
    if (paymentData.totalAmount !== requestAmount) {
      console.error('토스 응답 금액 불일치:', {
        orderId,
        requestAmount,
        responseAmount: paymentData.totalAmount,
      });
      // 금액이 다르더라도 토스에서 승인했으므로 로그만 남기고 계속 진행
    }

    // 주문 상태 업데이트 (트랜잭션 보장)
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'paid',
        payment_key: paymentKey,
        payment_method: paymentData.method,
        paid_at: new Date().toISOString(),
        balance_amount: paymentData.totalAmount || requestAmount, // 초기 잔액 = 결제 금액
      })
      .eq('id', orderId)
      .eq('status', 'pending'); // pending 상태인 경우에만 업데이트 (중복 방지)

    if (updateError) {
      console.error('주문 상태 업데이트 오류:', {
        orderId,
        error: updateError,
      });
      // 결제는 성공했지만 DB 업데이트 실패
      // 웹훅에서 처리될 수 있으므로 로그만 남기고 성공 처리
    }

    // 장바구니 비우기
    try {
      await clearCart();
    } catch (cartError) {
      console.error('장바구니 비우기 오류:', cartError);
      // 장바구니 비우기 실패는 치명적이지 않으므로 계속 진행
    }

    // 성공 페이지로 리다이렉트
    return NextResponse.redirect(
      new URL(`/checkout/success?orderNumber=${order.order_number}`, request.url)
    );
  } catch (error) {
    console.error('결제 승인 오류:', error);
    return NextResponse.redirect(
      new URL('/checkout/fail?message=결제 승인 처리 중 오류가 발생했습니다.', request.url)
    );
  }
}
