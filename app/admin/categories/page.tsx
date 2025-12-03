/**
 * @file app/admin/categories/page.tsx
 * @description 관리자 카테고리 관리 페이지
 */

import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClerkSupabaseClient } from '@/lib/supabase/server';
import { Plus, Edit, FolderTree } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default async function AdminCategoriesPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  const supabase = await createClerkSupabaseClient();

  // 카테고리 및 상품 수 가져오기
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true });

  // 각 카테고리별 상품 수 조회
  const categoriesWithCount = await Promise.all(
    (categories || []).map(async (category) => {
      const { count } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', category.id);

      return {
        ...category,
        product_count: count || 0,
      };
    })
  );

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">카테고리 관리</h1>
            <p className="text-gray-500 mt-1">
              총 {categories?.length || 0}개의 카테고리
            </p>
          </div>
          <Link href="/admin/categories/new">
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Plus className="w-4 h-4 mr-2" />
              카테고리 추가
            </Button>
          </Link>
        </div>

        {/* 카테고리 목록 */}
        <div className="bg-white rounded-xl border overflow-hidden">
          {categoriesWithCount.length > 0 ? (
            <div className="divide-y">
              {categoriesWithCount.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-4 hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                      {category.image_url ? (
                        <img
                          src={category.image_url}
                          alt={category.name}
                          className="w-8 h-8 object-contain"
                        />
                      ) : (
                        <FolderTree className="w-6 h-6 text-purple-600" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{category.name}</h3>
                      <p className="text-sm text-gray-500">
                        {category.slug} • 상품 {category.product_count}개
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {category.is_active ? (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                        활성
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                        비활성
                      </span>
                    )}
                    <Link href={`/admin/categories/${category.id}/edit`}>
                      <Button size="sm" variant="ghost">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-gray-500">
              <FolderTree className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="mb-4">등록된 카테고리가 없습니다.</p>
              <Link href="/admin/categories/new">
                <Button>첫 카테고리 추가하기</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

