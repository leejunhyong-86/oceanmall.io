/**
 * 알리익스프레스 API 클라이언트
 */

import crypto from 'crypto';
import type {
    AliExpressConfig,
    AliExpressApiParams,
    AliExpressProductQueryParams,
    AliExpressLinkGenerateParams,
    AliExpressApiResponse,
    ProductQueryResult,
    LinkGenerateResult,
} from './types';

// 환경 변수에서 설정 로드
const config: AliExpressConfig = {
    appKey: process.env.ALIEXPRESS_APP_KEY || '',
    appSecret: process.env.ALIEXPRESS_APP_SECRET || '',
    trackingId: process.env.ALIEXPRESS_TRACKING_ID || '',
};

/**
 * API 서명 생성
 */
function generateSignature(method: string, params: AliExpressApiParams): string {
    const timestamp = Date.now().toString();

    const baseParams: Record<string, string> = {
        app_key: config.appKey,
        method: method,
        timestamp: timestamp,
        sign_method: 'md5',
        format: 'json',
        v: '2.0',
    };

    // 파라미터 병합
    Object.keys(params).forEach((key) => {
        baseParams[key] = String(params[key]);
    });

    // 알파벳 순 정렬
    const sortedKeys = Object.keys(baseParams).sort();

    // 서명 문자열 생성
    let signString = config.appSecret;
    sortedKeys.forEach((key) => {
        signString += key + baseParams[key];
    });
    signString += config.appSecret;

    // MD5 해시 생성 (대문자)
    const sign = crypto.createHash('md5').update(signString).digest('hex').toUpperCase();

    // URL 파라미터 생성
    const urlParams = new URLSearchParams({
        ...baseParams,
        sign,
    });

    return urlParams.toString();
}

/**
 * 상품 검색 API
 */
export async function searchProducts(params: {
    keywords?: string;
    category_ids?: string;
    page_no?: number;
    page_size?: number;
    sort?: string;
}): Promise<ProductQueryResult> {
    const apiParams: AliExpressProductQueryParams = {
        target_currency: 'USD',
        target_language: 'EN',
        tracking_id: config.trackingId,
        page_no: String(params.page_no || 1),
        page_size: String(params.page_size || 20),
    };

    if (params.keywords) {
        apiParams.keywords = params.keywords;
    }

    if (params.category_ids) {
        apiParams.category_ids = params.category_ids;
    }

    if (params.sort) {
        apiParams.sort = params.sort;
    }

    const queryString = generateSignature('aliexpress.affiliate.product.query', apiParams);
    const url = `https://api-sg.aliexpress.com/sync?${queryString}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        const apiResponse = data.aliexpress_affiliate_product_query_response;

        if (apiResponse && apiResponse.resp_result && apiResponse.resp_result.resp_code === 200) {
            return apiResponse.resp_result.result;
        } else {
            throw new Error(`API Error: ${apiResponse?.resp_result?.resp_msg || 'Unknown error'}`);
        }
    } catch (error) {
        console.error('Search products error:', error);
        throw error;
    }
}

/**
 * 어필리에이트 링크 생성 API
 */
export async function generateAffiliateLink(productUrl: string): Promise<string> {
    const apiParams: AliExpressLinkGenerateParams = {
        promotion_link_type: '0', // 0 = 일반 링크
        source_values: productUrl,
        tracking_id: config.trackingId,
    };

    const queryString = generateSignature('aliexpress.affiliate.link.generate', apiParams);
    const url = `https://api-sg.aliexpress.com/sync?${queryString}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        const apiResponse = data.aliexpress_affiliate_link_generate_response;

        if (apiResponse && apiResponse.resp_result && apiResponse.resp_result.resp_code === 200) {
            const result: LinkGenerateResult = apiResponse.resp_result.result;
            const promotionLinks = result.promotion_links?.promotion_link || [];

            if (promotionLinks.length > 0) {
                return promotionLinks[0].promotion_link;
            } else {
                throw new Error('No promotion link generated');
            }
        } else {
            throw new Error(`API Error: ${apiResponse?.resp_result?.resp_msg || 'Unknown error'}`);
        }
    } catch (error) {
        console.error('Generate affiliate link error:', error);
        throw error;
    }
}

/**
 * 대량 링크 생성
 */
export async function generateBulkLinks(productUrls: string[]): Promise<
    Array<{
        url: string;
        affiliateLink: string;
        success: boolean;
        error?: string;
    }>
> {
    const results = await Promise.allSettled(
        productUrls.map(async (url) => {
            try {
                const affiliateLink = await generateAffiliateLink(url);
                return {
                    url,
                    affiliateLink,
                    success: true,
                };
            } catch (error) {
                return {
                    url,
                    affiliateLink: '',
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error',
                };
            }
        })
    );

    return results.map((result) => {
        if (result.status === 'fulfilled') {
            return result.value;
        } else {
            return {
                url: '',
                affiliateLink: '',
                success: false,
                error: result.reason,
            };
        }
    });
}

/**
 * API 설정 확인
 */
export function validateConfig(): boolean {
    return !!(config.appKey && config.appSecret && config.trackingId);
}

/**
 * 설정 내보내기 (테스트용)
 */
export function getConfig(): AliExpressConfig {
    return config;
}
