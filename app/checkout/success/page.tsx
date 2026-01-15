/**
 * @file app/checkout/success/page.tsx
 * @description 결제 성공 페이지
 */

import Link from 'next/link';
import { CheckCircle, Package, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: '결제 완료 | 오션몰',
  description: '결제가 성공적으로 완료되었습니다.',
};

interface SuccessPageProps {
  searchParams: Promise<{
    orderNumber?: string;
  }>;
}

export default async function CheckoutSuccessPage({ searchParams }: SuccessPageProps) {
  const { orderNumber } = await searchParams;

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-xl border p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          
          <h1 className="text-2xl font-bold mb-2">결제가 완료되었습니다!</h1>
          <p className="text-gray-600 mb-6">
            주문해 주셔서 감사합니다.<br />
            빠른 배송으로 찾아뵙겠습니다.
          </p>

          {orderNumber && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-500">주문 번호</p>
              <p className="font-mono font-bold text-lg">{orderNumber}</p>
            </div>
          )}

          <div className="space-y-3">
            <Link href="/my/orders" className="block">
              <Button className="w-full bg-purple-600 hover:bg-purple-700">
                <Package className="w-4 h-4 mr-2" />
                주문 내역 확인
              </Button>
            </Link>
            
            <Link href="/" className="block">
              <Button variant="outline" className="w-full">
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
