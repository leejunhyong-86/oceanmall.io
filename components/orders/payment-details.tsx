'use client';

/**
 * @file components/orders/payment-details.tsx
 * @description 결제 상세 정보 컴포넌트
 *
 * 주문의 결제 정보, 취소 내역, 환불 가능 금액 등을 표시합니다.
 */

import { useEffect, useState } from 'react';
import { CreditCard, Calendar, Hash, AlertCircle } from 'lucide-react';
import type { Order, PaymentCancel } from '@/types';
import { getRefundableAmount } from '@/actions/payments';
import { RefundButton } from './refund-button';

interface PaymentDetailsProps {
  order: Order;
}

interface PaymentData {
  method?: string;
  approvedAt?: string;
  totalAmount?: number;
  balanceAmount?: number;
  cancels?: Array<{
    cancelAmount: number;
    cancelReason: string;
    canceledAt: string;
    cancelStatus: string;
  }>;
}

export function PaymentDetails({ order }: PaymentDetailsProps) {
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [cancels, setCancels] = useState<PaymentCancel[]>([]);
  const [refundableAmount, setRefundableAmount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchPaymentDetails = async () => {
      if (!order.payment_key) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/payments/details?orderId=${order.id}`);
        const result = await response.json();

        if (result.success) {
          setPaymentData(result.data.payment);
          setCancels(result.data.cancels || []);
        } else {
          setError(result.error || '결제 정보를 불러올 수 없습니다.');
        }
      } catch (err) {
        console.error('결제 상세 조회 오류:', err);
        setError('결제 정보를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    const fetchRefundableAmount = async () => {
      try {
        const amount = await getRefundableAmount(order.id);
        setRefundableAmount(amount);
      } catch (err) {
        console.error('환불 가능 금액 조회 오류:', err);
      }
    };

    fetchPaymentDetails();
    fetchRefundableAmount();
  }, [order.id, order.payment_key]);

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('ko-KR').format(value) + '원';
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border p-6">
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle className="w-5 h-5" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!order.payment_key) {
    return (
      <div className="bg-white rounded-xl border p-6">
        <h2 className="font-bold mb-4">결제 정보</h2>
        <p className="text-gray-500">결제 정보가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-lg">결제 정보</h2>
        {order.status === 'paid' && refundableAmount > 0 && (
          <RefundButton order={order} refundableAmount={refundableAmount} />
        )}
      </div>

      <div className="space-y-4">
        {/* 결제 수단 */}
        <div className="flex items-start gap-3">
          <CreditCard className="w-5 h-5 text-gray-400 mt-0.5" />
          <div className="flex-1">
            <span className="text-gray-500 text-sm">결제 수단</span>
            <p className="font-medium">
              {paymentData?.method || order.payment_method || '-'}
            </p>
          </div>
        </div>

        {/* 결제 일시 */}
        <div className="flex items-start gap-3">
          <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
          <div className="flex-1">
            <span className="text-gray-500 text-sm">결제 일시</span>
            <p className="font-medium">
              {formatDate(paymentData?.approvedAt || order.paid_at)}
            </p>
          </div>
        </div>

        {/* 결제 키 */}
        <div className="flex items-start gap-3">
          <Hash className="w-5 h-5 text-gray-400 mt-0.5" />
          <div className="flex-1">
            <span className="text-gray-500 text-sm">결제 키</span>
            <p className="font-mono text-xs break-all">{order.payment_key}</p>
          </div>
        </div>

        {/* 결제 금액 */}
        <div className="pt-4 border-t">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-500">총 결제 금액</span>
            <span className="font-bold text-lg">
              {formatPrice(order.total_amount)}
            </span>
          </div>
          {order.cancelled_amount > 0 && (
            <div className="flex justify-between items-center mb-2 text-red-600">
              <span className="text-gray-500">취소된 금액</span>
              <span className="font-medium">
                -{formatPrice(order.cancelled_amount)}
              </span>
            </div>
          )}
          {refundableAmount > 0 && (
            <div className="flex justify-between items-center text-green-600">
              <span className="text-gray-500">환불 가능 금액</span>
              <span className="font-bold">
                {formatPrice(refundableAmount)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 취소 내역 */}
      {cancels.length > 0 && (
        <div className="pt-4 border-t">
          <h3 className="font-bold mb-3">취소 내역</h3>
          <div className="space-y-3">
            {cancels.map((cancel) => (
              <div
                key={cancel.id}
                className="bg-gray-50 rounded-lg p-4 space-y-2"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-red-600">
                      -{formatPrice(cancel.cancel_amount)}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {cancel.cancel_reason}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      cancel.cancel_status === 'DONE'
                        ? 'bg-green-100 text-green-700'
                        : cancel.cancel_status === 'PENDING'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {cancel.cancel_status === 'DONE'
                      ? '완료'
                      : cancel.cancel_status === 'PENDING'
                      ? '대기'
                      : '실패'}
                  </span>
                </div>
                <p className="text-xs text-gray-400">
                  {formatDate(cancel.canceled_at)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
