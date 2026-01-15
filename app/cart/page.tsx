/**
 * @file app/cart/page.tsx
 * @description 장바구니 페이지
 *
 * 사용자의 장바구니 상품 목록을 표시하고,
 * 수량 조절, 삭제, 결제하기 기능을 제공합니다.
 */

import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ShoppingCart, ArrowLeft } from 'lucide-react';
import { getCartItems } from '@/actions/cart';
import { CartItem } from '@/components/cart/cart-item';
import { CartSummary } from '@/components/cart/cart-summary';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: '장바구니 | 오션몰',
  description: '장바구니에 담긴 상품을 확인하고 결제하세요.',
};

export default async function CartPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in?redirect_url=/cart');
  }

  const cartItems = await getCartItems();

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/products">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ShoppingCart className="w-6 h-6" />
              장바구니
            </h1>
            <p className="text-gray-500 mt-1">
              {cartItems.length > 0 
                ? `${cartItems.length}개의 상품이 담겨있습니다.`
                : '장바구니가 비어있습니다.'
              }
            </p>
          </div>
        </div>

        {cartItems.length > 0 ? (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* 상품 목록 */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <CartItem key={item.id} item={item} />
              ))}
            </div>

            {/* 결제 요약 */}
            <div className="lg:col-span-1">
              <CartSummary items={cartItems} />
            </div>
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-xl border">
            <ShoppingCart className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h2 className="text-xl font-semibold text-gray-600 mb-2">
              장바구니가 비어있습니다
            </h2>
            <p className="text-gray-400 mb-6">
              마음에 드는 상품을 장바구니에 담아보세요!
            </p>
            <Link href="/products">
              <Button className="bg-purple-600 hover:bg-purple-700">
                쇼핑하러 가기
              </Button>
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
