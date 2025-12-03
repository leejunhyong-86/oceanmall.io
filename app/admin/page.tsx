/**
 * @file app/admin/page.tsx
 * @description 관리자 대시보드 페이지
 *
 * 상품, 카테고리, 리뷰 관리 기능을 제공합니다.
 */

import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClerkSupabaseClient } from '@/lib/supabase/server';
import {
  Package,
  FolderTree,
  MessageSquare,
  Star,
  TrendingUp,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default async function AdminPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  // TODO: 관리자 권한 확인 로직 추가

  const supabase = await createClerkSupabaseClient();

  // 통계 데이터 가져오기
  const [productsCount, categoriesCount, reviewsCount] = await Promise.all([
    supabase.from('products').select('*', { count: 'exact', head: true }),
    supabase.from('categories').select('*', { count: 'exact', head: true }),
    supabase.from('user_reviews').select('*', { count: 'exact', head: true }),
  ]);

  const stats = [
    {
      label: '등록된 상품',
      value: productsCount.count || 0,
      icon: Package,
      color: 'bg-blue-500',
      href: '/admin/products',
    },
    {
      label: '카테고리',
      value: categoriesCount.count || 0,
      icon: FolderTree,
      color: 'bg-green-500',
      href: '/admin/categories',
    },
    {
      label: '한국 리뷰',
      value: reviewsCount.count || 0,
      icon: MessageSquare,
      color: 'bg-purple-500',
      href: '/admin/reviews',
    },
  ];

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">관리자 대시보드</h1>
            <p className="text-gray-500 mt-1">
              상품과 리뷰를 관리합니다.
            </p>
          </div>
          <Link href="/admin/products/new">
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Plus className="w-4 h-4 mr-2" />
              상품 등록
            </Button>
          </Link>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {stats.map((stat) => (
            <Link
              key={stat.label}
              href={stat.href}
              className="bg-white rounded-xl border p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-gray-500 text-sm">{stat.label}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* 빠른 작업 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 상품 관리 */}
          <div className="bg-white rounded-xl border p-6">
            <h2 className="text-lg font-semibold mb-4">상품 관리</h2>
            <div className="space-y-3">
              <Link
                href="/admin/products"
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Package className="w-5 h-5 text-gray-500" />
                  <span>상품 목록 보기</span>
                </div>
                <span className="text-gray-400">→</span>
              </Link>
              <Link
                href="/admin/products/new"
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Plus className="w-5 h-5 text-gray-500" />
                  <span>새 상품 등록</span>
                </div>
                <span className="text-gray-400">→</span>
              </Link>
              <Link
                href="/admin/external-reviews"
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Star className="w-5 h-5 text-gray-500" />
                  <span>외부 리뷰 입력</span>
                </div>
                <span className="text-gray-400">→</span>
              </Link>
            </div>
          </div>

          {/* 카테고리 관리 */}
          <div className="bg-white rounded-xl border p-6">
            <h2 className="text-lg font-semibold mb-4">카테고리 관리</h2>
            <div className="space-y-3">
              <Link
                href="/admin/categories"
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FolderTree className="w-5 h-5 text-gray-500" />
                  <span>카테고리 목록 보기</span>
                </div>
                <span className="text-gray-400">→</span>
              </Link>
              <Link
                href="/admin/categories/new"
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Plus className="w-5 h-5 text-gray-500" />
                  <span>새 카테고리 추가</span>
                </div>
                <span className="text-gray-400">→</span>
              </Link>
            </div>
          </div>
        </div>

        {/* 안내 메시지 */}
        <div className="mt-8 bg-purple-50 rounded-xl p-6 border border-purple-100">
          <h3 className="font-semibold text-purple-900 mb-2">💡 관리자 가이드</h3>
          <ul className="text-sm text-purple-700 space-y-2">
            <li>• <strong>상품 등록</strong>: 9:16 비율의 세로 이미지와 영상을 권장합니다.</li>
            <li>• <strong>외부 리뷰</strong>: 해외 쇼핑몰에서 복사한 리뷰를 입력해주세요.</li>
            <li>• <strong>AI 요약</strong>: 리뷰가 10개 이상 등록되면 AI 요약이 생성됩니다.</li>
            <li>• <strong>추천 상품</strong>: 상품 등록 시 "추천" 옵션을 체크하면 홈에 노출됩니다.</li>
          </ul>
        </div>
      </div>
    </main>
  );
}

