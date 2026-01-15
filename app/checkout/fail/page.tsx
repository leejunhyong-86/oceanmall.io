/**
 * @file app/checkout/fail/page.tsx
 * @description 결제 실패 페이지
 */

import Link from 'next/link';
import { XCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PaymentRetry } from '@/components/checkout/payment-retry';

export const metadata = {
  title: '결제 실패 | 오션몰',
  description: '결제 처리 중 문제가 발생했습니다.',
};

interface FailPageProps {
  searchParams: Promise<{
    code?: string;
    message?: string;
    orderId?: string;
    orderNumber?: string;
  }>;
}

export default async function CheckoutFailPage({ searchParams }: FailPageProps) {
  const { code, message, orderId, orderNumber } = await searchParams;

  const errorMessage = message || '결제 처리 중 문제가 발생했습니다.';

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-xl border p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-10 h-10 text-red-600" />
          </div>
          
          <h1 className="text-2xl font-bold mb-2">결제에 실패했습니다</h1>
          <p className="text-gray-600 mb-6">
            {errorMessage}
          </p>

          {code && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-sm">
              <p className="text-gray-500">오류 코드: {code}</p>
            </div>
          )}

          {/* 재시도 컴포넌트 (주문 정보가 있는 경우) */}
          {orderId && orderNumber ? (
            <div className="mb-6">
              <PaymentRetry
                orderId={orderId}
                orderNumber={orderNumber}
                errorCode={code}
                errorMessage={message}
              />
            </div>
          ) : (
            <div className="space-y-3 mb-6">
              <Link href="/checkout" className="block">
                <Button className="w-full bg-purple-600 hover:bg-purple-700">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  다시 시도하기
                </Button>
              </Link>
            </div>
          )}
          
          <div className="space-y-3">
            <Link href="/cart" className="block">
              <Button variant="outline" className="w-full">
                장바구니로 돌아가기
              </Button>
            </Link>
            
            <Link href="/" className="block">
              <Button variant="ghost" className="w-full">
                <Home className="w-4 h-4 mr-2" />
                홈으로 돌아가기
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
