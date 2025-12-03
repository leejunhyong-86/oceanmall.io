'use server';

/**
 * @file actions/categories.ts
 * @description 카테고리 관련 Server Actions
 */

import { createClerkSupabaseClient } from '@/lib/supabase/server';
import type { Category } from '@/types';

/**
 * 모든 활성 카테고리 조회
 */
export async function getCategories(): Promise<Category[]> {
  const supabase = await createClerkSupabaseClient();

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching categories:', error);
    return [];
  }

  return data || [];
}

/**
 * 카테고리 조회 (slug로)
 */
export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const supabase = await createClerkSupabaseClient();

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (error) {
    console.error('Error fetching category:', error);
    return null;
  }

  return data;
}

/**
 * 카테고리별 상품 수 조회
 */
export async function getCategoriesWithProductCount(): Promise<
  (Category & { product_count: number })[]
> {
  const supabase = await createClerkSupabaseClient();

  const { data: categories, error } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error || !categories) {
    console.error('Error fetching categories:', error);
    return [];
  }

  // 각 카테고리별 상품 수 조회
  const categoriesWithCount = await Promise.all(
    categories.map(async (category) => {
      const { count } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', category.id)
        .eq('is_active', true);

      return {
        ...category,
        product_count: count || 0,
      };
    })
  );

  return categoriesWithCount;
}

