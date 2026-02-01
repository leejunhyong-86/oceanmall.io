/**
 * 알리익스프레스 상품 데이터베이스 액션
 */

'use server';

import { createClerkSupabaseClient } from '@/lib/supabase/server';
import type { AffiliateProduct, AffiliateLink } from '@/types/affiliate';
import type { AliExpressProductResponse } from '@/lib/aliexpress/types';

/**
 * API 응답을 DB 형식으로 변환
 */
function transformProductData(apiProduct: AliExpressProductResponse): Omit<AffiliateProduct, 'id' | 'created_at' | 'updated_at'> {
    return {
        product_id: String(apiProduct.product_id),
        title: apiProduct.product_title,

        // 카테고리
        first_level_category_id: apiProduct.first_level_category_id,
        first_level_category_name: apiProduct.first_level_category_name,
        second_level_category_id: apiProduct.second_level_category_id,
        second_level_category_name: apiProduct.second_level_category_name,

        // 가격
        target_sale_price: parseFloat(apiProduct.target_sale_price),
        target_original_price: parseFloat(apiProduct.target_original_price),
        discount_rate: parseInt(apiProduct.discount.replace('%', '')) || 0,

        // 이미지
        main_image_url: apiProduct.product_main_image_url,
        gallery_images: apiProduct.product_small_image_urls?.string || [],
        video_url: apiProduct.product_video_url || null,

        // 상품 상세
        product_detail_url: apiProduct.product_detail_url,

        // 판매자
        shop_id: apiProduct.shop_id,
        shop_name: apiProduct.shop_name,
        shop_url: apiProduct.shop_url,

        // 성과
        commission_rate: parseFloat(apiProduct.commission_rate.replace('%', '')),
        evaluate_rate: apiProduct.evaluate_rate ? parseFloat(apiProduct.evaluate_rate.replace('%', '')) : null,
        sales_volume: apiProduct.lastest_volume || 0,
    };
}

/**
 * 상품 저장 (upsert)
 */
export async function saveProduct(apiProduct: AliExpressProductResponse): Promise<AffiliateProduct | null> {
    const supabase = createClerkSupabaseClient();

    const productData = transformProductData(apiProduct);

    const { data, error } = await supabase
        .from('affiliate_products')
        .upsert(productData, {
            onConflict: 'product_id',
        })
        .select()
        .single();

    if (error) {
        console.error('Save product error:', error);
        return null;
    }

    return data;
}

/**
 * 대량 상품 저장
 */
export async function saveBulkProducts(apiProducts: AliExpressProductResponse[]): Promise<{
    success: number;
    failed: number;
}> {
    const supabase = createClerkSupabaseClient();

    const productsData = apiProducts.map(transformProductData);

    const { data, error } = await supabase
        .from('affiliate_products')
        .upsert(productsData, {
            onConflict: 'product_id',
        })
        .select();

    if (error) {
        console.error('Save bulk products error:', error);
        return { success: 0, failed: apiProducts.length };
    }

    return {
        success: data?.length || 0,
        failed: apiProducts.length - (data?.length || 0),
    };
}

/**
 * 어필리에이트 링크 저장
 */
export async function saveAffiliateLink(
    productId: string,
    promotionLink: string,
    trackingId: string
): Promise<AffiliateLink | null> {
    const supabase = createClerkSupabaseClient();

    const linkData = {
        product_id: productId,
        long_url: promotionLink,
        promotion_link: promotionLink,
        tracking_id: trackingId,
    };

    const { data, error } = await supabase
        .from('affiliate_links')
        .insert(linkData)
        .select()
        .single();

    if (error) {
        console.error('Save affiliate link error:', error);
        return null;
    }

    return data;
}

/**
 * 상품 목록 조회
 */
export async function getProducts(params: {
    page?: number;
    pageSize?: number;
    category?: string;
    search?: string;
}): Promise<{ products: AffiliateProduct[]; total: number }> {
    const supabase = createClerkSupabaseClient();

    const page = params.page || 1;
    const pageSize = params.pageSize || 20;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
        .from('affiliate_products')
        .select('*', { count: 'exact' });

    // 카테고리 필터
    if (params.category) {
        query = query.eq('first_level_category_name', params.category);
    }

    // 검색
    if (params.search) {
        query = query.ilike('title', `%${params.search}%`);
    }

    // 페이지네이션
    query = query.range(from, to).order('created_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) {
        console.error('Get products error:', error);
        return { products: [], total: 0 };
    }

    return {
        products: data || [],
        total: count || 0,
    };
}

/**
 * 상품 상세 조회
 */
export async function getProduct(productId: string): Promise<AffiliateProduct | null> {
    const supabase = createClerkSupabaseClient();

    const { data, error } = await supabase
        .from('affiliate_products')
        .select('*')
        .eq('product_id', productId)
        .single();

    if (error) {
        console.error('Get product error:', error);
        return null;
    }

    return data;
}

/**
 * 상품의 어필리에이트 링크 조회
 */
export async function getProductLinks(productId: string): Promise<AffiliateLink[]> {
    const supabase = createClerkSupabaseClient();

    const { data, error } = await supabase
        .from('affiliate_links')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Get product links error:', error);
        return [];
    }

    return data || [];
}

/**
 * 링크 클릭 수 증가
 */
export async function incrementLinkClicks(linkId: string): Promise<boolean> {
    const supabase = createClerkSupabaseClient();

    const { error } = await supabase.rpc('increment_link_clicks', {
        link_id: linkId,
    });

    if (error) {
        // RPC 함수가 없으면 수동으로 업데이트
        const { error: updateError } = await supabase
            .from('affiliate_links')
            .update({
                clicks: supabase.raw('clicks + 1'),
                last_clicked_at: new Date().toISOString(),
            })
            .eq('id', linkId);

        if (updateError) {
            console.error('Increment link clicks error:', updateError);
            return false;
        }
    }

    return true;
}
