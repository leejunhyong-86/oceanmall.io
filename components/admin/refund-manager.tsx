'use client';

/**
 * @file components/admin/refund-manager.tsx
 * @description 관리자 환불 관리 컴포넌트
 *
 * 환불 요청 목록, 일괄 환불 처리, 환불 사유 관리를 제공합니다.
 */

import { useState, useEffect } from 'react';
import { RefreshCcw, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Order, PaymentCancel } from '@/types';

interface RefundManagerProps {
  orderId: string;
}

export function RefundManager({ orderId }: RefundManagerProps) {
  const [order, setOrder] = useState<Order | null>(null);
  const [cancels, setCancels] = useState<PaymentCancel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/payments/details?orderId=${orderId}`);
        const result = await response.json();

        if (result.success) {
          setOrder(result.data.order);
          setCancels(result.data.cancels || []);
        } else {
          setError(result.error || '데이터를 불러올 수 없습니다.');
        }
      } catch (err) {
        console.error('환불 관리 데이터 조회 오류:', err);
        setError('데이터를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [orderId]);

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('ko-KR').format(value) + '원';
  };

  const formatDate = (dateString: string | null) => {
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
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border p-6">
        <div className="flex items-center gap-2 text-red-600">
          <XCircle className="w-5 h-5" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  const refundableAmount = order.balance_amount || order.total_amount - (order.cancelled_amount || 0);

  return (
    <div className="bg-white rounded-xl border p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-lg flex items-center gap-2">
          <RefreshCcw className="w-5 h-5" />
          환불 관리
        </h2>
      </div>

      {/* 환불 요약 */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
        <div className="flex justify-between">
          <span className="text-gray-600">총 결제 금액</span>
          <span className="font-bold">{formatPrice(order.total_amount)}</span>
        </div>
        {order.cancelled_amount > 0 && (
          <div className="flex justify-between text-red-600">
            <span className="text-gray-600">취소된 금액</span>
            <span className="font-medium">-{formatPrice(order.cancelled_amount)}</span>
          </div>
        )}
        <div className="flex justify-between text-green-600 pt-2 border-t">
          <span className="text-gray-600">환불 가능 금액</span>
          <span className="font-bold">{formatPrice(refundableAmount)}</span>
        </div>
      </div>

      {/* 취소 내역 */}
      {cancels.length > 0 ? (
        <div>
          <h3 className="font-semibold mb-3">취소 내역 ({cancels.length}건)</h3>
          <div className="space-y-3">
            {cancels.map((cancel) => (
              <div
                key={cancel.id}
                className="bg-gray-50 rounded-lg p-4 space-y-2 border"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-bold text-red-600">
                        -{formatPrice(cancel.cancel_amount)}
                      </span>
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
                    <p className="text-sm text-gray-600">{cancel.cancel_reason}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDate(cancel.canceled_at)}
                    </p>
                  </div>
                  {cancel.cancel_status === 'DONE' && (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <RefreshCcw className="w-12 h-12 mx-auto text-gray-300 mb-2" />
          <p>취소 내역이 없습니다.</p>
        </div>
      )}

      {/* 환불 가능 여부 안내 */}
      {order.status === 'paid' && refundableAmount > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-700">
            💡 환불 처리는 주문 상세 페이지에서 진행할 수 있습니다.
          </p>
        </div>
      )}
    </div>
  );
}
