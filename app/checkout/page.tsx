/**
 * @file app/checkout/page.tsx
 * @description 결제 페이지
 *
 * 배송 정보 입력 및 토스페이먼츠 결제 위젯을 표시합니다.
 */

import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getCartItems } from '@/actions/cart';
import { CheckoutForm } from '@/components/checkout/checkout-form';

export const metadata = {
  title: '결제하기 | 오션몰',
  description: '주문 정보를 확인하고 결제를 진행하세요.',
};

export default async function CheckoutPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in?redirect_url=/checkout');
  }

  const cartItems = await getCartItems();

  if (cartItems.length === 0) {
    redirect('/cart');
  }

  // 총 금액 계산
  const subtotal = cartItems.reduce((total, item) => {
    const price = item.product?.price_krw || 0;
    return total + (price * item.quantity);
  }, 0);
  const shippingFee = subtotal >= 50000 ? 0 : 3000;
  const totalAmount = subtotal + shippingFee;

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-8">결제하기</h1>
        
        <CheckoutForm 
          cartItems={cartItems}
          subtotal={subtotal}
          shippingFee={shippingFee}
          totalAmount={totalAmount}
        />
      </div>
    </main>
  );
}
