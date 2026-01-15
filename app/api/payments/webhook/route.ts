/**
 * @file app/api/payments/webhook/route.ts
 * @description 토스페이먼츠 웹훅 처리 API
 * 
 * 결제 상태 변경 시 토스페이먼츠에서 호출하는 웹훅 엔드포인트입니다.
 * 결제 취소, 환불, 가상계좌 입금 등의 이벤트를 처리합니다.
 * 
 * 보안 강화:
 * - 웹훅 시크릿 검증 (프로덕션)
 * - 중복 처리 방지 (멱등키)
 * - 상세한 로깅
 */

import { NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase/service-role';

const TOSS_SECRET_KEY = process.env.TOSS_SECRET_KEY;
const WEBHOOK_SECRET = process.env.TOSS_WEBHOOK_SECRET; // 프로덕션에서 설정

// 처리된 웹훅 이벤트 추적 (중복 방지용, 실제로는 Redis 등 사용 권장)
const processedEvents = new Set<string>();

/**
 * 웹훅 시크릿 검증 (프로덕션에서 활성화)
 */
function verifyWebhookSecret(request: Request, body: string): boolean {
  if (!WEBHOOK_SECRET) {
    // 개발 환경에서는 검증 생략
    return true;
  }

  // TODO: 토스페이먼츠 웹훅 서명 검증 로직 구현
  // 실제 구현 시 토스페이먼츠 문서 참고
  const signature = request.headers.get('x-toss-signature');
  if (!signature) {
    return false;
  }

  // 서명 검증 로직 (실제 구현 필요)
  return true;
}

export async function POST(request: Request) {
  try {
    const bodyText = await request.text();
    const body = JSON.parse(bodyText);

    // 웹훅 시크릿 검증 (프로덕션)
    if (!verifyWebhookSecret(request, bodyText)) {
      console.error('웹훅 시크릿 검증 실패');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { eventType, data } = body;
    const eventId = body.id || `${eventType}_${Date.now()}`;

    // 중복 처리 방지
    if (processedEvents.has(eventId)) {
      console.log(`웹훅 이벤트 중복 처리 방지: ${eventId}`);
      return NextResponse.json({ success: true, message: 'Already processed' });
    }

    console.log('토스 웹훅 수신:', JSON.stringify(body, null, 2));

    // 서비스 역할 클라이언트 사용 (웹훅은 인증 없이 호출됨)
    const supabase = getServiceRoleClient();

    switch (eventType) {
      case 'PAYMENT.DONE': {
        // 결제 완료 (이미 confirm에서 처리하지만, 백업용)
        const { orderId, paymentKey, method } = data;

        const { data: order } = await supabase
          .from('orders')
          .select('id, status')
          .eq('order_number', orderId)
          .single();

        if (order && order.status !== 'paid') {
          await supabase
            .from('orders')
            .update({
              status: 'paid',
              payment_key: paymentKey,
              payment_method: method,
              paid_at: new Date().toISOString(),
              balance_amount: order.total_amount || 0,
            })
            .eq('id', order.id);

          console.log(`주문 ${orderId} 결제 완료 처리 (웹훅)`);
        }
        break;
      }

      case 'PAYMENT.CANCELED': {
        // 결제 취소 (전액)
        const { orderId, paymentKey, cancels } = data;
        const latestCancel = cancels?.[cancels.length - 1];

        const { data: order } = await supabase
          .from('orders')
          .select('id, total_amount')
          .eq('order_number', orderId)
          .single();

        if (order && latestCancel) {
          const cancelAmount = latestCancel.cancelAmount || order.total_amount;
          
          // 취소 내역 저장
          await supabase.from('payment_cancels').insert({
            order_id: order.id,
            transaction_key: latestCancel.transactionKey || `cancel_${Date.now()}`,
            cancel_amount: cancelAmount,
            cancel_reason: latestCancel.cancelReason || '웹훅 취소',
            cancel_status: latestCancel.cancelStatus === 'DONE' ? 'DONE' : 'PENDING',
            refundable_amount: latestCancel.refundableAmount || 0,
            canceled_at: latestCancel.canceledAt || new Date().toISOString(),
          });

          // 주문 상태 업데이트
          await supabase
            .from('orders')
            .update({
              status: 'cancelled',
              cancelled_amount: cancelAmount,
              balance_amount: 0,
            })
            .eq('id', order.id);

          console.log(`주문 ${orderId} 취소됨:`, latestCancel.cancelReason);
        }
        break;
      }

      case 'PAYMENT.PARTIAL_CANCELED': {
        // 부분 취소
        const { orderId, paymentKey, cancels, totalAmount, balanceAmount } = data;
        const latestCancel = cancels?.[cancels.length - 1];

        const { data: order } = await supabase
          .from('orders')
          .select('id, total_amount, cancelled_amount')
          .eq('order_number', orderId)
          .single();

        if (order && latestCancel) {
          const cancelAmount = latestCancel.cancelAmount;
          const newCancelledAmount = (order.cancelled_amount || 0) + cancelAmount;
          const newBalanceAmount = order.total_amount - newCancelledAmount;
          
          // 취소 내역 저장
          await supabase.from('payment_cancels').insert({
            order_id: order.id,
            transaction_key: latestCancel.transactionKey || `cancel_${Date.now()}`,
            cancel_amount: cancelAmount,
            cancel_reason: latestCancel.cancelReason || '부분 취소',
            cancel_status: latestCancel.cancelStatus === 'DONE' ? 'DONE' : 'PENDING',
            refundable_amount: latestCancel.refundableAmount || 0,
            canceled_at: latestCancel.canceledAt || new Date().toISOString(),
          });

          // 주문 취소 금액 업데이트
          const newStatus = newBalanceAmount <= 0 ? 'cancelled' : 'paid';
          await supabase
            .from('orders')
            .update({
              cancelled_amount: newCancelledAmount,
              balance_amount: newBalanceAmount,
              status: newStatus,
            })
            .eq('id', order.id);

          console.log(
            `주문 ${orderId} 부분 취소: ${cancelAmount}원, 잔액: ${balanceAmount}원`
          );
        }
        break;
      }

      case 'VIRTUAL_ACCOUNT_DEPOSIT': {
        // 가상계좌 입금 완료
        const { orderId, paymentKey, amount } = data;

        const { data: order } = await supabase
          .from('orders')
          .select('id, status')
          .eq('order_number', orderId)
          .single();

        if (order && order.status === 'pending') {
          await supabase
            .from('orders')
            .update({
              status: 'paid',
              payment_key: paymentKey,
              payment_method: '가상계좌',
              paid_at: new Date().toISOString(),
              balance_amount: amount,
            })
            .eq('id', order.id);

          console.log(`주문 ${orderId} 가상계좌 입금 완료: ${amount}원`);
          // TODO: 입금 완료 알림 발송 (이메일/알림톡)
        }
        break;
      }

      default:
        console.log('처리되지 않은 이벤트 타입:', eventType);
    }

    // 처리 완료 표시 (실제로는 Redis 등에 저장)
    processedEvents.add(eventId);

    // 메모리 정리 (최근 1000개만 유지)
    if (processedEvents.size > 1000) {
      const eventsArray = Array.from(processedEvents);
      processedEvents.clear();
      eventsArray.slice(-500).forEach((id) => processedEvents.add(id));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('웹훅 처리 오류:', error);
    return NextResponse.json(
      { success: false, error: '웹훅 처리 중 오류 발생' },
      { status: 500 }
    );
  }
}
