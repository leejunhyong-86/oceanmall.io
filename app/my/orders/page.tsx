/**
 * @file app/my/orders/page.tsx
 * @description 주문 목록 페이지
 */

import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Package, ChevronRight, ArrowLeft } from 'lucide-react';
import { getMyOrders, getOrderCounts } from '@/actions/orders';
import { Button } from '@/components/ui/button';
import type { OrderStatus } from '@/types';

export const metadata = {
  title: '주문 내역 | 오션몰',
  description: '주문 내역을 확인하세요.',
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: '결제 대기',
  paid: '결제 완료',
  shipping: '배송 중',
  delivered: '배송 완료',
  cancelled: '주문 취소',
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  paid: 'bg-blue-100 text-blue-700',
  shipping: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-500',
};

export default async function OrdersPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in?redirect_url=/my/orders');
  }

  const [orders, counts] = await Promise.all([
    getMyOrders(),
    getOrderCounts(),
  ]);

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('ko-KR').format(value) + '원';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/my">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Package className="w-6 h-6" />
              주문 내역
            </h1>
            <p className="text-gray-500 mt-1">
              총 {orders.length}개의 주문
            </p>
          </div>
        </div>

        {/* 주문 상태 요약 */}
        <div className="grid grid-cols-5 gap-2 mb-8">
          {(Object.keys(STATUS_LABELS) as OrderStatus[]).map((status) => (
            <div 
              key={status}
              className="bg-white rounded-lg border p-3 text-center"
            >
              <p className="text-2xl font-bold">{counts[status]}</p>
              <p className="text-xs text-gray-500">{STATUS_LABELS[status]}</p>
            </div>
          ))}
        </div>

        {/* 주문 목록 */}
        {orders.length > 0 ? (
          <div className="space-y-4">
            {orders.map((order) => (
              <Link 
                key={order.id}
                href={`/my/orders/${order.id}`}
                className="block"
              >
                <div className="bg-white rounded-xl border p-4 hover:shadow-md transition-shadow">
                  {/* 주문 헤더 */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${STATUS_COLORS[order.status]}`}>
                        {STATUS_LABELS[order.status]}
                      </span>
                      <span className="text-sm text-gray-500">
                        {formatDate(order.created_at)}
                      </span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>

                  {/* 주문 번호 */}
                  <p className="text-xs text-gray-400 mb-3">
                    주문번호: {order.order_number}
                  </p>

                  {/* 상품 목록 */}
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-2">
                      {order.items.slice(0, 3).map((item, index) => (
                        <div 
                          key={item.id}
                          className="relative w-12 h-14 bg-gray-100 rounded border-2 border-white overflow-hidden"
                          style={{ zIndex: 3 - index }}
                        >
                          {item.product_thumbnail ? (
                            <Image
                              src={item.product_thumbnail}
                              alt={item.product_title}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="text-lg opacity-30">📦</span>
                            </div>
                          )}
                        </div>
                      ))}
                      {order.items.length > 3 && (
                        <div className="w-12 h-14 bg-gray-100 rounded border-2 border-white flex items-center justify-center">
                          <span className="text-xs text-gray-500">+{order.items.length - 3}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium line-clamp-1">
                        {order.items[0]?.product_title}
                        {order.items.length > 1 && ` 외 ${order.items.length - 1}건`}
                      </p>
                      <p className="text-sm text-gray-500">
                        {order.items.reduce((sum, item) => sum + item.quantity, 0)}개 상품
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-bold text-purple-600">
                        {formatPrice(order.total_amount)}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-xl border">
            <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h2 className="text-xl font-semibold text-gray-600 mb-2">
              주문 내역이 없습니다
            </h2>
            <p className="text-gray-400 mb-6">
              첫 주문을 해보세요!
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
