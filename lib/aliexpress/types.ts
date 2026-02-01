/**
 * 알리익스프레스 API 타입 정의
 */

export interface AliExpressConfig {
    appKey: string;
    appSecret: string;
    trackingId: string;
}

export interface AliExpressApiParams {
    [key: string]: string | number;
}

export interface AliExpressProductQueryParams {
    target_currency?: string;
    target_language?: string;
    keywords?: string;
    category_ids?: string;
    page_no?: string;
    page_size?: string;
    sort?: string;
    tracking_id: string;
}

export interface AliExpressLinkGenerateParams {
    promotion_link_type: string;
    source_values: string;
    tracking_id: string;
}

export interface AliExpressApiResponse<T> {
    resp_result: {
        resp_code: number;
        resp_msg: string;
        result: T;
    };
    request_id: string;
}

export interface ProductQueryResult {
    products?: {
        product: Array<{
            product_id: number;
            product_title: string;
            product_main_image_url: string;
            product_small_image_urls?: {
                string: string[];
            };
            product_video_url?: string;
            product_detail_url: string;
            target_sale_price: string;
            target_original_price: string;
            discount: string;
            first_level_category_id: number;
            first_level_category_name: string;
            second_level_category_id: number;
            second_level_category_name: string;
            shop_id: number;
            shop_name: string;
            shop_url: string;
            commission_rate: string;
            evaluate_rate?: string;
            lastest_volume?: number;
            promotion_link: string;
        }>;
    };
    total_record_count?: number;
}

export interface LinkGenerateResult {
    promotion_links?: {
        promotion_link: Array<{
            promotion_link: string;
            source_value: string;
        }>;
    };
}
