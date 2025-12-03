/**
 * @file app/admin/products/page.tsx
 * @description 관리자 상품 목록 페이지
 */

import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createClerkSupabaseClient } from '@/lib/supabase/server';
import { Plus, Edit, Trash2, Star, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default async function AdminProductsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  const supabase = await createClerkSupabaseClient();

  const { data: products } = await supabase
    .from('products')
    .select(`
      *,
      category:categories(name)
    `)
    .order('created_at', { ascending: false });

  // 가격 포맷팅
  const formatPrice = (price: number | null) => {
    if (price === null) return '-';
    return new Intl.NumberFormat('ko-KR').format(price) + '원';
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">상품 관리</h1>
            <p className="text-gray-500 mt-1">
              등록된 상품 {products?.length || 0}개
            </p>
          </div>
          <Link href="/admin/products/new">
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Plus className="w-4 h-4 mr-2" />
              상품 등록
            </Button>
          </Link>
        </div>

        {/* 상품 테이블 */}
        <div className="bg-white rounded-xl border overflow-hidden">
          {products && products.length > 0 ? (
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">상품</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">카테고리</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-gray-500">가격</th>
                  <th className="text-center px-6 py-4 text-sm font-medium text-gray-500">평점</th>
                  <th className="text-center px-6 py-4 text-sm font-medium text-gray-500">상태</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-gray-500">액션</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="relative w-12 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                          {product.thumbnail_url ? (
                            <Image
                              src={product.thumbnail_url}
                              alt={product.title}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="text-xl opacity-30">📦</span>
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 line-clamp-1">
                            {product.title}
                          </p>
                          <p className="text-sm text-gray-500">
                            {product.source_platform}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {product.category?.name || '-'}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      {formatPrice(product.price_krw)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {product.external_rating ? (
                        <div className="flex items-center justify-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm">{product.external_rating.toFixed(1)}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {product.is_featured && (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">
                            추천
                          </span>
                        )}
                        {product.is_active ? (
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                            활성
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                            비활성
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/products/${product.slug}`}>
                          <Button size="sm" variant="ghost">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Link href={`/admin/products/${product.id}/edit`}>
                          <Button size="sm" variant="ghost">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-16 text-gray-500">
              <p className="mb-4">등록된 상품이 없습니다.</p>
              <Link href="/admin/products/new">
                <Button>첫 상품 등록하기</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

