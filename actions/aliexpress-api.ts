/**
 * 알리익스프레스 API 서버 액션
 * 클라이언트에서 직접 API를 호출하지 않고 서버 액션을 통해 호출
 */

'use server';

import { searchProducts as searchProductsClient, generateAffiliateLink as generateAffiliateLinkClient } from '@/lib/aliexpress/client';

/**
 * 상품 검색 서버 액션
 */
export async function searchProductsAction(params: {
    keywords?: string;
    category_ids?: string;
    page_no?: number;
    page_size?: number;
    sort?: string;
}) {
    try {
        const result = await searchProductsClient(params);
        return { success: true, data: result };
    } catch (error) {
        console.error('Search products action error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * 어필리에이트 링크 생성 서버 액션
 */
export async function generateAffiliateLinkAction(productUrl: string) {
    try {
        const link = await generateAffiliateLinkClient(productUrl);
        return { success: true, data: link };
    } catch (error) {
        console.error('Generate affiliate link action error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}
