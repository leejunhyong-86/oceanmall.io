'use server';

/**
 * @file actions/products.ts
 * @description 상품 관련 Server Actions
 *
 * 상품 목록 조회, 상세 조회, 검색, 등록, 수정, 삭제 등의 서버 액션을 제공합니다.
 * Server Component에서 직접 호출하거나, Client Component에서 사용할 수 있습니다.
 */

import { createClerkSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { Product, ProductWithCategory, ProductFilters, ProductSort, ProductInsert, ProductUpdate } from '@/types';

/**
 * 상품 목록 조회
 */
export async function getProducts(options?: {
  filters?: ProductFilters;
  sort?: ProductSort;
  page?: number;
  pageSize?: number;
}): Promise<{
  products: ProductWithCategory[];
  total: number;
}> {
  // 환경 변수 체크
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('Supabase 환경 변수가 설정되지 않았습니다.');
    return { products: [], total: 0 };
  }

  const supabase = createClerkSupabaseClient();

  const page = options?.page || 1;
  const pageSize = options?.pageSize || 12;
  const offset = (page - 1) * pageSize;

  // 기본 쿼리
  let query = supabase
    .from('products')
    .select(`
      *,
      category:categories(*)
    `, { count: 'exact' })
    .eq('is_active', true);

  // 필터 적용
  if (options?.filters) {
    const { category, minPrice, maxPrice, minRating, platform, search, isFeatured } = options.filters;

    if (category) {
      // 카테고리 slug로 필터
      const { data: categoryData } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', category)
        .single();

      if (categoryData) {
        query = query.eq('category_id', categoryData.id);
      }
    }

    if (minPrice !== undefined) {
      query = query.gte('price_krw', minPrice);
    }

    if (maxPrice !== undefined) {
      query = query.lte('price_krw', maxPrice);
    }

    if (minRating !== undefined) {
      query = query.gte('external_rating', minRating);
    }

    if (platform) {
      query = query.eq('source_platform', platform);
    }

    if (search) {
      query = query.ilike('title', `%${search}%`);
    }

    if (isFeatured !== undefined) {
      query = query.eq('is_featured', isFeatured);
    }
  }

  // 정렬 적용
  const sortField = options?.sort?.field || 'created_at';
  const sortDirection = options?.sort?.direction || 'desc';
  query = query.order(sortField, { ascending: sortDirection === 'asc' });

  // 페이지네이션
  query = query.range(offset, offset + pageSize - 1);

  const { data, count, error } = await query;

  if (error) {
    console.error('Error fetching products:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });
    return { products: [], total: 0 };
  }

  return {
    products: (data as ProductWithCategory[]) || [],
    total: count || 0,
  };
}

/**
 * 추천 상품 조회
 */
export async function getFeaturedProducts(limit = 8): Promise<ProductWithCategory[]> {
  // 환경 변수 체크
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('Supabase 환경 변수가 설정되지 않았습니다.');
    return [];
  }

  try {
    const supabase = createClerkSupabaseClient();

    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        category:categories(*)
      `)
      .eq('is_active', true)
      .eq('is_featured', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      // 에러 객체를 더 자세히 로깅
      console.error('Error fetching featured products:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        fullError: JSON.stringify(error, null, 2),
      });
      return [];
    }

    return (data as ProductWithCategory[]) || [];
  } catch (err) {
    // 예상치 못한 에러 처리
    console.error('Unexpected error in getFeaturedProducts:', {
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    });
    return [];
  }
}

/**
 * 상품 상세 조회 (slug로)
 */
export async function getProductBySlug(slug: string): Promise<ProductWithCategory | null> {
  // URL에서 전달된 slug를 디코딩 (URL 인코딩 → 한글)
  const decodedSlug = decodeURIComponent(slug);

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('Supabase 환경 변수가 설정되지 않았습니다.');
    return null;
  }

  const supabase = createClerkSupabaseClient();

  // .maybeSingle() 사용: 결과가 없어도 에러 대신 null 반환
  // decodedSlug를 사용하여 조회
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      category:categories(*)
    `)
    .eq('slug', decodedSlug)
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    console.error('Error fetching product:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });
    return null;
  }

  // 상품이 없으면 null 반환 (에러 없이)
  if (!data) {
    return null;
  }

  return data as ProductWithCategory;
}

/**
 * 상품 상세 조회 (ID로)
 */
export async function getProductById(id: string): Promise<ProductWithCategory | null> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('Supabase 환경 변수가 설정되지 않았습니다.');
    return null;
  }

  const supabase = createClerkSupabaseClient();

  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      category:categories(*)
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching product:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });
    return null;
  }

  return data as ProductWithCategory;
}

/**
 * 조회수 증가
 */
export async function incrementViewCount(productId: string): Promise<void> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('Supabase 환경 변수가 설정되지 않았습니다.');
    return;
  }

  const supabase = createClerkSupabaseClient();

  const { error } = await supabase.rpc('increment_view_count', { product_id: productId });

  // RPC가 없으면 직접 업데이트
  if (error) {
    await supabase
      .from('products')
      .update({ view_count: 1 })
      .eq('id', productId);
  }
}

/**
 * 오늘의 신상품 조회 (최근 등록된 상품)
 */
export async function getNewProducts(limit = 4): Promise<ProductWithCategory[]> {
  // 환경 변수 체크
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('Supabase 환경 변수가 설정되지 않았습니다.');
    return [];
  }

  try {
    const supabase = createClerkSupabaseClient();

    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        category:categories(*)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching new products:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      return [];
    }

    return (data as ProductWithCategory[]) || [];
  } catch (err) {
    console.error('Unexpected error in getNewProducts:', {
      error: err instanceof Error ? err.message : String(err),
    });
    return [];
  }
}

/**
 * 관련 상품 조회
 */
export async function getRelatedProducts(
  productId: string,
  categoryId: string | null,
  limit = 4
): Promise<Product[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('Supabase 환경 변수가 설정되지 않았습니다.');
    return [];
  }

  const supabase = createClerkSupabaseClient();

  let query = supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .neq('id', productId)
    .limit(limit);

  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }

  const { data, error } = await query.order('view_count', { ascending: false });

  if (error) {
    console.error('Error fetching related products:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });
    return [];
  }

  return data || [];
}

/**
 * 상품 등록 (관리자)
 */
export async function createProduct(
  data: ProductInsert
): Promise<{ success: boolean; productId?: string; error?: string }> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return { success: false, error: 'Supabase 환경 변수가 설정되지 않았습니다.' };
  }

  const supabase = await createClerkSupabaseClient();

  // slug 중복 체크
  const { data: existing } = await supabase
    .from('products')
    .select('id')
    .eq('slug', data.slug)
    .single();

  if (existing) {
    return { success: false, error: '이미 사용 중인 URL 슬러그입니다.' };
  }

  const { data: product, error } = await supabase
    .from('products')
    .insert(data)
    .select()
    .single();

  if (error) {
    console.error('상품 등록 오류:', error);
    return { success: false, error: '상품 등록에 실패했습니다.' };
  }

  revalidatePath('/admin/products');
  revalidatePath('/products');
  
  return { success: true, productId: product.id };
}

/**
 * 상품 수정 (관리자)
 */
export async function updateProduct(
  id: string,
  data: ProductUpdate
): Promise<{ success: boolean; error?: string }> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return { success: false, error: 'Supabase 환경 변수가 설정되지 않았습니다.' };
  }

  const supabase = await createClerkSupabaseClient();

  // slug 중복 체크 (자기 자신 제외)
  if (data.slug) {
    const { data: existing } = await supabase
      .from('products')
      .select('id')
      .eq('slug', data.slug)
      .neq('id', id)
      .single();

    if (existing) {
      return { success: false, error: '이미 사용 중인 URL 슬러그입니다.' };
    }
  }

  const { error } = await supabase
    .from('products')
    .update(data)
    .eq('id', id);

  if (error) {
    console.error('상품 수정 오류:', error);
    return { success: false, error: '상품 수정에 실패했습니다.' };
  }

  revalidatePath('/admin/products');
  revalidatePath('/products');
  revalidatePath(`/products/${data.slug || ''}`);
  
  return { success: true };
}

/**
 * 상품 삭제 (관리자)
 */
export async function deleteProduct(
  id: string
): Promise<{ success: boolean; error?: string }> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return { success: false, error: 'Supabase 환경 변수가 설정되지 않았습니다.' };
  }

  const supabase = await createClerkSupabaseClient();

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('상품 삭제 오류:', error);
    return { success: false, error: '상품 삭제에 실패했습니다.' };
  }

  revalidatePath('/admin/products');
  revalidatePath('/products');
  
  return { success: true };
}

