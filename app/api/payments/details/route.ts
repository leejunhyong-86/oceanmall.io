/**
 * @file app/api/payments/details/route.ts
 * @description 결제 상세 정보 조회 API - 토스페이먼츠 결제 정보 조회
 */

import { NextResponse } from 'next/server';
import { createClerkSupabaseClient } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';
import { getPaymentCancels } from '@/actions/payments';

const TOSS_SECRET_KEY = process.env.TOSS_SECRET_KEY;

export async function GET(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    if (!TOSS_SECRET_KEY) {
      return NextResponse.json(
        { success: false, error: '토스페이먼츠 시크릿 키가 설정되지 않았습니다.' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: '주문 ID가 필요합니다.' },
        { status: 400 }
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
      return NextResponse.json(
        { success: false, error: '사용자 정보를 찾을 수 없습니다.' },
        { status: 404 }
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
      return NextResponse.json(
        { success: false, error: '주문을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    if (!order.payment_key) {
      return NextResponse.json({
        success: true,
        data: {
          order,
          payment: null,
          cancels: [],
        },
      });
    }

    // 토스페이먼츠 결제 조회 API 호출
    const paymentResponse = await fetch(
      `https://api.tosspayments.com/v1/payments/${order.payment_key}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${TOSS_SECRET_KEY}:`).toString('base64')}`,
          'Content-Type': 'application/json',
        },
      }
    );

    let paymentData = null;
    if (paymentResponse.ok) {
      paymentData = await paymentResponse.json();
    } else {
      console.error('토스 결제 조회 실패:', await paymentResponse.text());
      // 결제 조회 실패해도 주문 정보는 반환
    }

    // 취소 내역 조회
    const cancels = await getPaymentCancels(orderId);

    return NextResponse.json({
      success: true,
      data: {
        order,
        payment: paymentData,
        cancels,
      },
    });
  } catch (error) {
    console.error('결제 상세 조회 오류:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '결제 상세 조회 중 오류가 발생했습니다.' 
      },
      { status: 500 }
    );
  }
}
