import { getProducts } from '@/actions/affiliate';
import Link from 'next/link';
import Image from 'next/image';
import { ExternalLink, TrendingUp, DollarSign, Eye } from 'lucide-react';

export default async function AffiliateLinksPage() {
    const { products, total } = await getProducts({
        page: 1,
        pageSize: 50,
    });

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4">
                {/* 헤더 */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        링크 관리
                    </h1>
                    <p className="text-gray-600">
                        생성된 어필리에이트 링크를 관리하세요
                    </p>
                </div>

                {/* 통계 카드 */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-600">총 상품</span>
                            <TrendingUp className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="text-2xl font-bold text-gray-900">{total}</div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-600">총 클릭</span>
                            <Eye className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="text-2xl font-bold text-gray-900">-</div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-600">전환</span>
                            <DollarSign className="w-5 h-5 text-purple-600" />
                        </div>
                        <div className="text-2xl font-bold text-gray-900">-</div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-600">수익</span>
                            <DollarSign className="w-5 h-5 text-orange-600" />
                        </div>
                        <div className="text-2xl font-bold text-gray-900">$0</div>
                    </div>
                </div>

                {/* 상품 목록 */}
                {products.length > 0 ? (
                    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            상품
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            가격
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            커미션
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            판매량
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            등록일
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            액션
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {products.map((product) => (
                                        <tr key={product.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="relative w-12 h-12 flex-shrink-0">
                                                        {product.main_image_url && (
                                                            <Image
                                                                src={product.main_image_url}
                                                                alt={product.title}
                                                                fill
                                                                className="object-cover rounded"
                                                            />
                                                        )}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="text-sm font-medium text-gray-900 line-clamp-2">
                                                            {product.title}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            ID: {product.product_id}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {product.target_sale_price.toLocaleString()}원
                                                </div>
                                                {product.discount_rate && product.discount_rate > 0 && (
                                                    <div className="text-xs text-gray-500 line-through">
                                                        {product.target_original_price.toLocaleString()}원
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm text-green-600 font-medium">
                                                    {product.commission_rate}%
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {product.sales_volume || 0}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(product.created_at).toLocaleDateString('ko-KR')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                                {product.product_detail_url && (
                                                    <a
                                                        href={product.product_detail_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                                                    >
                                                        보기
                                                        <ExternalLink className="w-3 h-3" />
                                                    </a>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
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
                                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                                />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            아직 생성된 링크가 없습니다
                        </h3>
                        <p className="text-gray-600 mb-4">
                            상품을 검색하고 어필리에이트 링크를 생성해보세요
                        </p>
                        <Link
                            href="/affiliate/search"
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            상품 검색하기
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
