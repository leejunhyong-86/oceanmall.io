/**
 * @file app/admin/orders/page.tsx
 * @description 관리자 주문 관리 페이지
 *
 * 전체 주문 목록 조회, 주문 상태별 필터링, 환불/취소 처리를 제공합니다.
 */

import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClerkSupabaseClient } from '@/lib/supabase/server';
import { getServiceRoleClient } from '@/lib/supabase/service-role';
import { isAdmin } from '@/lib/admin';
import { ShoppingBag, ArrowLeft, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { OrderWithItems } from '@/types';

export const metadata = {
  title: '주문 관리 | 관리자',
  description: '전체 주문 목록을 관리합니다.',
};

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  // 관리자 권한 확인
  const adminStatus = await isAdmin(userId);
  if (!adminStatus) {
    redirect('/');
  }

  const params = await searchParams;
  const statusFilter = params.status;

  // 서비스 역할 클라이언트 사용 (관리자는 모든 주문 조회 가능)
  const supabase = getServiceRoleClient();

  // 주문 목록 조회
  let query = supabase
    .from('orders')
    .select(`
      *,
      items:order_items(*),
      user:users(id, name, clerk_id)
    `)
    .order('created_at', { ascending: false });

  // 상태 필터 적용
  if (statusFilter && statusFilter !== 'all') {
    query = query.eq('status', statusFilter);
  }

  const { data: orders, error } = await query;

  if (error) {
    console.error('주문 목록 조회 오류:', error);
  }

  const ordersList = (orders as OrderWithItems[]) || [];

  // 주문 상태별 통계
  const { data: statusCounts } = await supabase
    .from('orders')
    .select('status');

  const stats = {
    all: statusCounts?.length || 0,
    pending: statusCounts?.filter((o) => o.status === 'pending').length || 0,
    paid: statusCounts?.filter((o) => o.status === 'paid').length || 0,
    shipping: statusCounts?.filter((o) => o.status === 'shipping').length || 0,
    delivered: statusCounts?.filter((o) => o.status === 'delivered').length || 0,
    cancelled: statusCounts?.filter((o) => o.status === 'cancelled').length || 0,
  };

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

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-700',
      paid: 'bg-green-100 text-green-700',
      shipping: 'bg-blue-100 text-blue-700',
      delivered: 'bg-purple-100 text-purple-700',
      cancelled: 'bg-red-100 text-red-700',
    };

    const labels = {
      pending: '결제 대기',
      paid: '결제 완료',
      shipping: '배송 중',
      delivered: '배송 완료',
      cancelled: '취소됨',
    };

    return (
      <span
        className={`px-2 py-1 rounded text-xs font-medium ${
          styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-700'
        }`}
      >
        {labels[status as keyof typeof labels] || status}
      </span>
    );
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/admin">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ShoppingBag className="w-6 h-6" />
              주문 관리
            </h1>
            <p className="text-gray-500 mt-1">
              전체 주문 목록을 조회하고 관리합니다.
            </p>
          </div>
        </div>

        {/* 상태별 통계 */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <Link
            href="/admin/orders"
            className={`bg-white rounded-xl border p-4 text-center hover:shadow-md transition-shadow ${
              !statusFilter || statusFilter === 'all'
                ? 'border-purple-500 bg-purple-50'
                : ''
            }`}
          >
            <p className="text-2xl font-bold">{stats.all}</p>
            <p className="text-sm text-gray-500">전체</p>
          </Link>
          <Link
            href="/admin/orders?status=pending"
            className={`bg-white rounded-xl border p-4 text-center hover:shadow-md transition-shadow ${
              statusFilter === 'pending' ? 'border-yellow-500 bg-yellow-50' : ''
            }`}
          >
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            <p className="text-sm text-gray-500">결제 대기</p>
          </Link>
          <Link
            href="/admin/orders?status=paid"
            className={`bg-white rounded-xl border p-4 text-center hover:shadow-md transition-shadow ${
              statusFilter === 'paid' ? 'border-green-500 bg-green-50' : ''
            }`}
          >
            <p className="text-2xl font-bold text-green-600">{stats.paid}</p>
            <p className="text-sm text-gray-500">결제 완료</p>
          </Link>
          <Link
            href="/admin/orders?status=shipping"
            className={`bg-white rounded-xl border p-4 text-center hover:shadow-md transition-shadow ${
              statusFilter === 'shipping' ? 'border-blue-500 bg-blue-50' : ''
            }`}
          >
            <p className="text-2xl font-bold text-blue-600">{stats.shipping}</p>
            <p className="text-sm text-gray-500">배송 중</p>
          </Link>
          <Link
            href="/admin/orders?status=delivered"
            className={`bg-white rounded-xl border p-4 text-center hover:shadow-md transition-shadow ${
              statusFilter === 'delivered' ? 'border-purple-500 bg-purple-50' : ''
            }`}
          >
            <p className="text-2xl font-bold text-purple-600">{stats.delivered}</p>
            <p className="text-sm text-gray-500">배송 완료</p>
          </Link>
          <Link
            href="/admin/orders?status=cancelled"
            className={`bg-white rounded-xl border p-4 text-center hover:shadow-md transition-shadow ${
              statusFilter === 'cancelled' ? 'border-red-500 bg-red-50' : ''
            }`}
          >
            <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
            <p className="text-sm text-gray-500">취소됨</p>
          </Link>
        </div>

        {/* 주문 목록 */}
        <div className="bg-white rounded-xl border">
          {ordersList.length === 0 ? (
            <div className="text-center py-20">
              <ShoppingBag className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h2 className="text-xl font-semibold text-gray-600 mb-2">
                주문이 없습니다
              </h2>
              <p className="text-gray-400">
                {statusFilter
                  ? '해당 상태의 주문이 없습니다.'
                  : '아직 등록된 주문이 없습니다.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      주문 번호
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      주문자
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      상품
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      결제 금액
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      상태
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      주문 일시
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      관리
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {ordersList.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <Link
                          href={`/my/orders/${order.id}`}
                          className="font-mono text-sm text-purple-600 hover:underline"
                        >
                          {order.order_number}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {(order as any).user?.name || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="max-w-xs">
                          <p className="font-medium line-clamp-1">
                            {order.items?.[0]?.product_title || '-'}
                          </p>
                          {order.items && order.items.length > 1 && (
                            <p className="text-gray-500 text-xs">
                              외 {order.items.length - 1}건
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">
                        {formatPrice(order.total_amount)}
                        {order.cancelled_amount > 0 && (
                          <span className="text-red-600 text-xs block">
                            (취소: {formatPrice(order.cancelled_amount)})
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">{getStatusBadge(order.status)}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {formatDate(order.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/my/orders/${order.id}`}>
                          <Button variant="ghost" size="sm">
                            상세보기
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
