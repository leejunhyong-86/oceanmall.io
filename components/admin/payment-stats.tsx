'use client';

/**
 * @file components/admin/payment-stats.tsx
 * @description 결제 통계 컴포넌트
 *
 * 일별/월별 매출 통계, 결제 수단별 비율, 환불률 통계를 제공합니다.
 */

import { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, CreditCard, RefreshCcw } from 'lucide-react';

interface PaymentStatsProps {
  period?: 'day' | 'week' | 'month';
}

interface StatsData {
  totalRevenue: number;
  totalOrders: number;
  refundRate: number;
  paymentMethods: {
    method: string;
    count: number;
    amount: number;
  }[];
}

export function PaymentStats({ period = 'month' }: PaymentStatsProps) {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // TODO: 실제 API 엔드포인트로 교체
        // const response = await fetch(`/api/admin/payment-stats?period=${period}`);
        // const result = await response.json();
        
        // 임시 데이터 (실제 구현 시 API로 교체)
        const mockStats: StatsData = {
          totalRevenue: 0,
          totalOrders: 0,
          refundRate: 0,
          paymentMethods: [],
        };
        
        setStats(mockStats);
      } catch (err) {
        console.error('통계 조회 오류:', err);
        setError('통계를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [period]);

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('ko-KR').format(value) + '원';
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border p-6">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* 주요 통계 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">총 매출</p>
              <p className="text-2xl font-bold">{formatPrice(stats.totalRevenue)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">총 주문 수</p>
              <p className="text-2xl font-bold">{stats.totalOrders.toLocaleString()}건</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <RefreshCcw className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">환불률</p>
              <p className="text-2xl font-bold">{stats.refundRate.toFixed(1)}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">결제 수단</p>
              <p className="text-2xl font-bold">{stats.paymentMethods.length}종</p>
            </div>
          </div>
        </div>
      </div>

      {/* 결제 수단별 통계 */}
      {stats.paymentMethods.length > 0 && (
        <div className="bg-white rounded-xl border p-6">
          <h3 className="font-bold mb-4">결제 수단별 통계</h3>
          <div className="space-y-3">
            {stats.paymentMethods.map((method, index) => {
              const percentage = stats.totalRevenue > 0
                ? (method.amount / stats.totalRevenue) * 100
                : 0;

              return (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{method.method || '기타'}</span>
                    <div className="text-right">
                      <span className="font-bold">{formatPrice(method.amount)}</span>
                      <span className="text-sm text-gray-500 ml-2">
                        ({method.count}건, {percentage.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 안내 메시지 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-700">
          💡 통계 데이터는 실시간으로 업데이트됩니다. 더 자세한 통계는 관리자 대시보드에서 확인할 수 있습니다.
        </p>
      </div>
    </div>
  );
}
