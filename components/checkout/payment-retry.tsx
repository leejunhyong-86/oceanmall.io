'use client';

/**
 * @file components/checkout/payment-retry.tsx
 * @description 결제 재시도 컴포넌트
 *
 * 결제 실패 시 재시도 버튼을 표시하고, 동일한 주문으로 재결제를 시도합니다.
 * 실패 원인을 분석하여 사용자 친화적인 메시지를 표시합니다.
 */

import { useState, useTransition } from 'react';
import { RefreshCw, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface PaymentRetryProps {
  orderId: string;
  orderNumber: string;
  errorCode?: string;
  errorMessage?: string;
}

// 토스페이먼츠 에러 코드 매핑
const ERROR_MESSAGES: Record<string, string> = {
  'INVALID_CARD': '카드 정보가 올바르지 않습니다. 카드 번호를 확인해주세요.',
  'CARD_EXPIRED': '카드 유효기간이 만료되었습니다.',
  'INSUFFICIENT_BALANCE': '카드 잔액이 부족합니다.',
  'EXCEED_MAX_AMOUNT': '결제 한도를 초과했습니다.',
  'CARD_NOT_SUPPORTED': '지원하지 않는 카드입니다.',
  'NETWORK_ERROR': '네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
  'TIMEOUT': '결제 요청 시간이 초과되었습니다. 다시 시도해주세요.',
  'USER_CANCEL': '결제가 취소되었습니다.',
  'SYSTEM_ERROR': '시스템 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
};

// 재시도 가능한 에러 코드
const RETRYABLE_ERRORS = [
  'NETWORK_ERROR',
  'TIMEOUT',
  'SYSTEM_ERROR',
  'INSUFFICIENT_BALANCE',
  'EXCEED_MAX_AMOUNT',
];

export function PaymentRetry({
  orderId,
  orderNumber,
  errorCode,
  errorMessage,
}: PaymentRetryProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [retryCount, setRetryCount] = useState(0);

  const getErrorMessage = (): string => {
    if (errorCode && ERROR_MESSAGES[errorCode]) {
      return ERROR_MESSAGES[errorCode];
    }
    if (errorMessage) {
      return errorMessage;
    }
    return '결제 처리 중 문제가 발생했습니다.';
  };

  const canRetry = (): boolean => {
    if (!errorCode) return true;
    if (retryCount >= 3) return false; // 최대 3회 재시도
    return RETRYABLE_ERRORS.includes(errorCode) || !errorCode;
  };

  const handleRetry = () => {
    if (!canRetry()) {
      alert('재시도 횟수를 초과했습니다. 고객센터로 문의해주세요.');
      return;
    }

    startTransition(async () => {
      try {
        setRetryCount((prev) => prev + 1);

        // 주문 정보 다시 조회
        const orderResponse = await fetch(`/api/payments/request`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderId,
            orderNumber,
          }),
        });

        if (!orderResponse.ok) {
          const error = await orderResponse.json();
          throw new Error(error.message || '주문 조회에 실패했습니다.');
        }

        // 결제 페이지로 리다이렉트
        router.push(`/checkout?retry=true&orderId=${orderId}`);
      } catch (err) {
        console.error('재시도 오류:', err);
        alert(
          err instanceof Error
            ? err.message
            : '재시도 중 오류가 발생했습니다. 고객센터로 문의해주세요.'
        );
      }
    });
  };

  const userFriendlyMessage = getErrorMessage();
  const retryable = canRetry();

  return (
    <div className="bg-white rounded-xl border p-6 space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
          <AlertCircle className="w-5 h-5 text-red-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-lg mb-1">결제 실패</h3>
          <p className="text-gray-600">{userFriendlyMessage}</p>
          {errorCode && (
            <p className="text-xs text-gray-400 mt-1">오류 코드: {errorCode}</p>
          )}
        </div>
      </div>

      {retryable ? (
        <div className="space-y-3">
          <Button
            onClick={handleRetry}
            disabled={isPending}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                재시도 중...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                결제 다시 시도하기
              </>
            )}
          </Button>
          {retryCount > 0 && (
            <p className="text-xs text-gray-500 text-center">
              재시도 횟수: {retryCount}/3
            </p>
          )}
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            이 오류는 재시도로 해결되지 않을 수 있습니다. 고객센터로 문의해주세요.
          </p>
        </div>
      )}

      <div className="pt-4 border-t space-y-2">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => router.push('/cart')}
        >
          장바구니로 돌아가기
        </Button>
        <Button
          variant="ghost"
          className="w-full"
          onClick={() => router.push('/')}
        >
          홈으로 돌아가기
        </Button>
      </div>
    </div>
  );
}
