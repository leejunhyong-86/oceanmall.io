'use client';

import { useState } from 'react';
import { Link2, Check, Copy, ExternalLink } from 'lucide-react';
import Image from 'next/image';

interface Product {
    product_id: string;
    title: string;
    main_image_url: string;
    target_sale_price: number;
    target_original_price: number;
    discount_rate: number;
    commission_rate: number;
    product_detail_url: string;
    promotion_link?: string;
}

interface LinkGeneratorProps {
    product: Product;
    onGenerate: (productId: string, productUrl: string) => Promise<string>;
}

export default function LinkGenerator({ product, onGenerate }: LinkGeneratorProps) {
    const [isGenerating, setIsGenerating] = useState(false);
    const [affiliateLink, setAffiliateLink] = useState(product.promotion_link || '');
    const [copied, setCopied] = useState(false);

    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            const link = await onGenerate(product.product_id, product.product_detail_url);
            setAffiliateLink(link);
        } catch (error) {
            console.error('Link generation error:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(affiliateLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex gap-4">
                {/* 상품 이미지 */}
                <div className="relative w-24 h-24 flex-shrink-0">
                    <Image
                        src={product.main_image_url}
                        alt={product.title}
                        fill
                        className="object-cover rounded-lg"
                    />
                </div>

                {/* 상품 정보 */}
                <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm line-clamp-2 mb-2">{product.title}</h3>

                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg font-bold text-blue-600">
                            ${product.target_sale_price}
                        </span>
                        {product.discount_rate > 0 && (
                            <>
                                <span className="text-sm text-gray-400 line-through">
                                    ${product.target_original_price}
                                </span>
                                <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded">
                                    -{product.discount_rate}%
                                </span>
                            </>
                        )}
                    </div>

                    <div className="text-xs text-gray-500">
                        커미션: {product.commission_rate}%
                    </div>
                </div>

                {/* 링크 생성 버튼 */}
                <div className="flex flex-col gap-2">
                    {!affiliateLink ? (
                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
                        >
                            <Link2 className="w-4 h-4" />
                            {isGenerating ? '생성 중...' : '링크 생성'}
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={handleCopy}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm"
                            >
                                {copied ? (
                                    <>
                                        <Check className="w-4 h-4" />
                                        복사됨!
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-4 h-4" />
                                        복사
                                    </>
                                )}
                            </button>
                            <a
                                href={affiliateLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2 text-sm"
                            >
                                <ExternalLink className="w-4 h-4" />
                                열기
                            </a>
                        </>
                    )}
                </div>
            </div>

            {/* 생성된 링크 표시 */}
            {affiliateLink && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="text-xs text-gray-500 mb-1">어필리에이트 링크:</div>
                    <div className="text-xs bg-gray-50 p-2 rounded border border-gray-200 break-all">
                        {affiliateLink}
                    </div>
                </div>
            )}
        </div>
    );
}
