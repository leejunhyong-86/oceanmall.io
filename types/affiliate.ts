/**
 * 알리익스프레스 어필리에이트 데이터베이스 타입 정의
 */

// 상품 정보
export interface AffiliateProduct {
    id: string;
    product_id: string;
    title: string;

    // 카테고리
    first_level_category_id?: number;
    first_level_category_name?: string;
    second_level_category_id?: number;
    second_level_category_name?: string;

    // 가격 정보
    target_sale_price?: number;
    target_original_price?: number;
    discount_rate?: number;

    // 이미지/영상
    main_image_url?: string;
    gallery_images?: string[]; // JSONB 배열
    video_url?: string;

    // 상품 상세
    product_detail_url?: string;

    // 판매자 정보
    shop_id?: number;
    shop_name?: string;
    shop_url?: string;

    // 성과 지표
    commission_rate?: number;
    evaluate_rate?: number;
    sales_volume?: number;

    // 메타 정보
    created_at: string;
    updated_at: string;
}

// 어필리에이트 링크
export interface AffiliateLink {
    id: string;
    product_id: string;

    // 링크 정보
    short_url?: string;
    long_url: string;
    promotion_link: string;

    // 추적 정보
    tracking_id?: string;

    // 성과 지표
    clicks: number;
    conversions: number;
    revenue: number;

    // 메타 정보
    created_at: string;
    last_clicked_at?: string;
}

// 가격 히스토리
export interface PriceHistory {
    id: string;
    product_id: string;

    // 가격 정보
    price: number;
    original_price?: number;
    discount_rate?: number;

    // 기록 시간
    recorded_at: string;
}

// API 응답 타입 (알리익스프레스 API)
export interface AliExpressProductResponse {
    product_id: number;
    product_title: string;
    product_main_image_url: string;
    product_small_image_urls?: {
        string: string[];
    };
    product_video_url?: string;
    product_detail_url: string;

    // 가격
    target_sale_price: string;
    target_original_price: string;
    discount: string;

    // 카테고리
    first_level_category_id: number;
    first_level_category_name: string;
    second_level_category_id: number;
    second_level_category_name: string;

    // 판매자
    shop_id: number;
    shop_name: string;
    shop_url: string;

    // 성과
    commission_rate: string;
    evaluate_rate?: string;
    lastest_volume?: number;

    // 링크
    promotion_link: string;
}

// 링크 생성 응답
export interface AliExpressLinkResponse {
    promotion_link: string;
    source_value: string;
}

// 상품 검색 필터
export interface ProductSearchFilters {
    keywords?: string;
    category?: string;
    min_price?: number;
    max_price?: number;
    sort?: 'SALE_PRICE_ASC' | 'SALE_PRICE_DESC' | 'LAST_VOLUME_DESC';
    page?: number;
    page_size?: number;
}
