/**
 * @file app/api/payments/cancel/route.ts
 * @description 결제 취소/환불 API - 토스페이먼츠 결제 취소 처리
 */

import { NextResponse } from 'next/server';
import { createClerkSupabaseClient } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';
import { savePaymentCancel, updateOrderCancelAmount, getRefundableAmount } from '@/actions/payments';
import { nanoid } from 'nanoid';

const TOSS_SECRET_KEY = process.env.TOSS_SECRET_KEY;

interface CancelRequestBody {
  orderId: string;
  cancelAmount?: number; // 부분 취소 금액 (없으면 전액 취소)
  cancelReason: string;
  refundReceiveAccount?: {
    bankCode: string;
    accountNumber: string;
    holderName: string;
  };
}

export async function POST(request: Request) {
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

    const body: CancelRequestBody = await request.json();
    const { orderId, cancelAmount, cancelReason, refundReceiveAccount } = body;

    if (!orderId || !cancelReason) {
      return NextResponse.json(
        { success: false, error: '주문 ID와 취소 사유는 필수입니다.' },
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

    // 결제 완료된 주문만 취소 가능
    if (order.status !== 'paid') {
      return NextResponse.json(
        { success: false, error: '결제 완료된 주문만 취소할 수 있습니다.' },
        { status: 400 }
      );
    }

    if (!order.payment_key) {
      return NextResponse.json(
        { success: false, error: '결제 정보가 없습니다.' },
        { status: 400 }
      );
    }

    // 환불 가능 금액 확인
    const refundableAmount = await getRefundableAmount(orderId);
    
    // 취소할 금액 결정
    const amountToCancel = cancelAmount || refundableAmount;

    if (amountToCancel <= 0) {
      return NextResponse.json(
        { success: false, error: '환불 가능한 금액이 없습니다.' },
        { status: 400 }
      );
    }

    if (amountToCancel > refundableAmount) {
      return NextResponse.json(
        { success: false, error: `환불 가능한 금액(${refundableAmount.toLocaleString()}원)을 초과했습니다.` },
        { status: 400 }
      );
    }

    // 멱등키 생성 (중복 취소 방지)
    const idempotencyKey = `cancel_${orderId}_${Date.now()}_${nanoid(8)}`;

    // 토스페이먼츠 결제 취소 API 호출
    const cancelRequestBody: any = {
      cancelReason: cancelReason,
      cancelAmount: amountToCancel,
    };

    // 가상계좌 환불 시 계좌 정보 추가
    if (refundReceiveAccount) {
      cancelRequestBody.refundReceiveAccount = refundReceiveAccount;
    }

    const cancelResponse = await fetch(
      `https://api.tosspayments.com/v1/payments/${order.payment_key}/cancel`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${TOSS_SECRET_KEY}:`).toString('base64')}`,
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey, // 멱등키 헤더
        },
        body: JSON.stringify(cancelRequestBody),
      }
    );

    if (!cancelResponse.ok) {
      const errorData = await cancelResponse.json();
      console.error('토스 결제 취소 실패:', errorData);
      return NextResponse.json(
        { 
          success: false, 
          error: errorData.message || '결제 취소에 실패했습니다.',
          code: errorData.code,
        },
        { status: cancelResponse.status }
      );
    }

    const cancelData = await cancelResponse.json();

    // 취소 내역에서 transaction_key 추출
    const latestCancel = cancelData.cancels?.[cancelData.cancels.length - 1];
    const transactionKey = latestCancel?.transactionKey;

    if (!transactionKey) {
      console.error('취소 거래 키를 찾을 수 없습니다:', cancelData);
      return NextResponse.json(
        { success: false, error: '취소 거래 키를 찾을 수 없습니다.' },
        { status: 500 }
      );
    }

    // 취소 내역 저장
    const cancelSaveResult = await savePaymentCancel({
      order_id: orderId,
      transaction_key: transactionKey,
      cancel_amount: amountToCancel,
      cancel_reason: cancelReason,
      cancel_status: latestCancel?.cancelStatus === 'DONE' ? 'DONE' : 'PENDING',
      refundable_amount: latestCancel?.refundableAmount || 0,
      canceled_at: latestCancel?.canceledAt || new Date().toISOString(),
    });

    if (!cancelSaveResult.success) {
      console.error('취소 내역 저장 실패:', cancelSaveResult.error);
      // 취소는 성공했지만 DB 저장 실패 - 로그만 남기고 계속 진행
    }

    // 주문의 취소 금액 업데이트
    const updateResult = await updateOrderCancelAmount(orderId, amountToCancel);

    if (!updateResult.success) {
      console.error('주문 업데이트 실패:', updateResult.error);
      // 취소는 성공했지만 주문 업데이트 실패 - 로그만 남기고 계속 진행
    }

    return NextResponse.json({
      success: true,
      data: {
        orderId,
        cancelAmount: amountToCancel,
        transactionKey,
        balanceAmount: cancelData.balanceAmount,
        cancelStatus: latestCancel?.cancelStatus,
      },
    });
  } catch (error) {
    console.error('결제 취소 오류:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '결제 취소 처리 중 오류가 발생했습니다.' 
      },
      { status: 500 }
    );
  }
}
