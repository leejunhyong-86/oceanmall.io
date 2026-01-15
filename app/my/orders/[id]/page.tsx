/**
 * @file app/my/orders/[id]/page.tsx
 * @description 주문 상세 페이지
 */

import { auth } from '@clerk/nextjs/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Package, MapPin, Phone, User, FileText } from 'lucide-react';
import { getOrderDetail } from '@/actions/orders';
import { getRefundableAmount } from '@/actions/payments';
import { Button } from '@/components/ui/button';
import { CancelOrderButton } from '@/components/orders/cancel-order-button';
import { PaymentDetails } from '@/components/orders/payment-details';
import { RefundButton } from '@/components/orders/refund-button';
import type { OrderStatus } from '@/types';

interface OrderDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

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

export async function generateMetadata({ params }: OrderDetailPageProps) {
  const { id } = await params;
  return {
    title: `주문 상세 | 오션몰`,
    description: '주문 상세 정보를 확인하세요.',
  };
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { userId } = await auth();
  const { id } = await params;

  if (!userId) {
    redirect('/sign-in?redirect_url=/my/orders');
  }

  const order = await getOrderDetail(id);

  if (!order) {
    notFound();
  }

  // 환불 가능 금액 조회
  const refundableAmount = await getRefundableAmount(order.id);

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('ko-KR').format(value) + '원';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 상품 금액 계산
  const subtotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shippingFee = order.total_amount - subtotal;

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/my/orders">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">주문 상세</h1>
        </div>

        {/* 주문 상태 */}
        <div className="bg-white rounded-xl border p-6 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${STATUS_COLORS[order.status]}`}>
                {STATUS_LABELS[order.status]}
              </span>
              <p className="text-sm text-gray-500 mt-2">
                {formatDate(order.created_at)}
              </p>
            </div>
            {order.status === 'pending' && (
              <CancelOrderButton orderId={order.id} />
            )}
          </div>
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-gray-500">주문번호</p>
            <p className="font-mono font-medium">{order.order_number}</p>
          </div>
        </div>

        {/* 주문 상품 */}
        <div className="bg-white rounded-xl border p-6 mb-4">
          <h2 className="font-bold mb-4 flex items-center gap-2">
            <Package className="w-5 h-5" />
            주문 상품
          </h2>
          <div className="space-y-4">
            {order.items.map((item) => (
              <div key={item.id} className="flex gap-4">
                <div className="relative w-16 h-20 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                  {item.product_thumbnail ? (
                    <Image
                      src={item.product_thumbnail}
                      alt={item.product_title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-2xl opacity-30">📦</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <Link 
                    href={`/products`} 
                    className="font-medium hover:text-purple-600 line-clamp-2"
                  >
                    {item.product_title}
                  </Link>
                  <p className="text-sm text-gray-500 mt-1">
                    {formatPrice(item.price)} × {item.quantity}개
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold">{formatPrice(item.price * item.quantity)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 배송 정보 */}
        <div className="bg-white rounded-xl border p-6 mb-4">
          <h2 className="font-bold mb-4">배송 정보</h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <User className="w-4 h-4 text-gray-400 mt-0.5" />
              <div>
                <p className="text-gray-500">받는 분</p>
                <p className="font-medium">{order.shipping_name || '-'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="w-4 h-4 text-gray-400 mt-0.5" />
              <div>
                <p className="text-gray-500">연락처</p>
                <p className="font-medium">{order.shipping_phone || '-'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
              <div>
                <p className="text-gray-500">배송 주소</p>
                <p className="font-medium">{order.shipping_address || '-'}</p>
              </div>
            </div>
            {order.shipping_memo && (
              <div className="flex items-start gap-3">
                <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-gray-500">배송 메모</p>
                  <p className="font-medium">{order.shipping_memo}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 결제 정보 */}
        <div className="bg-white rounded-xl border p-6 mb-4">
          <h2 className="font-bold mb-4">결제 정보</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">상품 금액</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">배송비</span>
              <span>{shippingFee === 0 ? '무료' : formatPrice(shippingFee)}</span>
            </div>
            {order.cancelled_amount > 0 && (
              <div className="flex justify-between text-red-600">
                <span className="text-gray-500">취소된 금액</span>
                <span>-{formatPrice(order.cancelled_amount)}</span>
              </div>
            )}
            <hr className="my-2" />
            <div className="flex justify-between text-base font-bold">
              <span>총 결제 금액</span>
              <span className="text-purple-600">{formatPrice(order.total_amount)}</span>
            </div>
            {order.payment_method && (
              <div className="flex justify-between mt-2 pt-2 border-t">
                <span className="text-gray-500">결제 수단</span>
                <span>{order.payment_method}</span>
              </div>
            )}
            {order.paid_at && (
              <div className="flex justify-between">
                <span className="text-gray-500">결제 일시</span>
                <span>{formatDate(order.paid_at)}</span>
              </div>
            )}
          </div>
        </div>

        {/* 결제 상세 정보 및 환불 */}
        {order.payment_key && (
          <PaymentDetails order={order} />
        )}

        {/* 환불 버튼 (결제 완료된 주문만) */}
        {order.status === 'paid' && refundableAmount > 0 && (
          <div className="bg-white rounded-xl border p-6">
            <RefundButton order={order} refundableAmount={refundableAmount} />
          </div>
        )}
      </div>
    </main>
  );
}
