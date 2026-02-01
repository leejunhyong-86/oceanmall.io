'use client';

import { useState } from 'react';
import ProductSearchForm from '@/components/affiliate/product-search-form';
import LinkGenerator from '@/components/affiliate/link-generator';
import { searchProductsAction, generateAffiliateLinkAction } from '@/actions/aliexpress-api';
import { saveProduct, saveAffiliateLink } from '@/actions/affiliate';
import { AlertCircle } from 'lucide-react';

// 상품 타입 정의
interface Product {
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
}

export default function AffiliateSearchPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSearch = async (params: {
        keywords: string;
        category?: string;
        sort?: string;
        hasVideo?: boolean;
    }) => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await searchProductsAction({
                keywords: params.keywords,
                page_size: 20,
                sort: params.sort,
            });

            if (!response.success) {
                throw new Error(response.error || '검색 실패');
            }

            const result = response.data;
            let productList = result.products?.product || [];

            // 영상 필터 적용
            if (params.hasVideo) {
                productList = productList.filter(p => p.product_video_url && p.product_video_url.trim() !== '');
            }

            setProducts(productList);

            // 검색된 상품을 DB에 저장
            if (productList.length > 0) {
                for (const product of productList) {
                    await saveProduct(product);
                }
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : '검색 중 오류가 발생했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerateLink = async (productId: string, productUrl: string): Promise<string> => {
        try {
            const response = await generateAffiliateLinkAction(productUrl);

            if (!response.success) {
                throw new Error(response.error || '링크 생성 실패');
            }

            const link = response.data;

            // 링크를 DB에 저장
            await saveAffiliateLink(productId, link, process.env.NEXT_PUBLIC_TRACKING_ID || '');

            return link;
        } catch (err) {
            throw new Error('링크 생성 실패');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4">
                {/* 헤더 */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        알리익스프레스 상품 검색
                    </h1>
                    <p className="text-gray-600">
                        상품을 검색하고 어필리에이트 링크를 생성하세요
                    </p>
                </div>

                {/* 검색 폼 */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
                    <ProductSearchForm onSearch={handleSearch} isLoading={isLoading} />
                </div>

                {/* 에러 메시지 */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <h3 className="font-medium text-red-900 mb-1">오류 발생</h3>
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    </div>
                )}

                {/* 검색 결과 */}
                {products.length > 0 && (
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold text-gray-900">
                                검색 결과 ({products.length}개)
                            </h2>
                        </div>

                        <div className="space-y-4">
                            {products.map((product) => (
                                <LinkGenerator
                                    key={product.product_id}
                                    product={{
                                        product_id: String(product.product_id),
                                        title: product.product_title,
                                        main_image_url: product.product_main_image_url,
                                        target_sale_price: parseFloat(product.target_sale_price),
                                        target_original_price: parseFloat(product.target_original_price),
                                        discount_rate: parseInt(product.discount.replace('%', '')) || 0,
                                        commission_rate: parseFloat(product.commission_rate.replace('%', '')),
                                        product_detail_url: product.product_detail_url,
                                        promotion_link: product.promotion_link,
                                    }}
                                    onGenerate={handleGenerateLink}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* 검색 전 안내 */}
                {!isLoading && products.length === 0 && !error && (
                    <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                        <div className="text-gray-400 mb-4">
                            <svg
                                className="w-16 h-16 mx-auto"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            상품을 검색해보세요
                        </h3>
                        <p className="text-gray-600">
                            검색어를 입력하고 검색 버튼을 클릭하세요
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
