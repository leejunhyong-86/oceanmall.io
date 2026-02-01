'use client';

import { useState } from 'react';
import { Upload, Link2, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { generateBulkLinks } from '@/lib/aliexpress/client';
import { saveAffiliateLink } from '@/actions/affiliate';

interface BulkResult {
    url: string;
    affiliateLink: string;
    success: boolean;
    error?: string;
}

export default function BulkGeneratePage() {
    const [urls, setUrls] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [results, setResults] = useState<BulkResult[]>([]);

    const handleGenerate = async () => {
        const urlList = urls
            .split('\n')
            .map((url) => url.trim())
            .filter((url) => url.length > 0);

        if (urlList.length === 0) {
            alert('URL을 입력해주세요');
            return;
        }

        setIsGenerating(true);
        setResults([]);

        try {
            const bulkResults = await generateBulkLinks(urlList);
            setResults(bulkResults);

            // 성공한 링크를 DB에 저장
            for (const result of bulkResults) {
                if (result.success && result.affiliateLink) {
                    // URL에서 product_id 추출 (간단한 방법)
                    const match = result.url.match(/\/item\/(\d+)\.html/);
                    if (match) {
                        const productId = match[1];
                        await saveAffiliateLink(
                            productId,
                            result.affiliateLink,
                            process.env.NEXT_PUBLIC_TRACKING_ID || ''
                        );
                    }
                }
            }
        } catch (error) {
            console.error('Bulk generation error:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4">
                {/* 헤더 */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        대량 링크 생성
                    </h1>
                    <p className="text-gray-600">
                        여러 개의 상품 URL을 한 번에 어필리에이트 링크로 변환하세요
                    </p>
                </div>

                {/* 입력 영역 */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
                    <label htmlFor="urls" className="block text-sm font-medium text-gray-700 mb-2">
                        상품 URL 입력 (한 줄에 하나씩)
                    </label>
                    <textarea
                        id="urls"
                        value={urls}
                        onChange={(e) => setUrls(e.target.value)}
                        placeholder="https://www.aliexpress.com/item/1005001234567890.html&#10;https://www.aliexpress.com/item/1005009876543210.html&#10;..."
                        rows={10}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                    />

                    <div className="mt-4 flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                            {urls.split('\n').filter((url) => url.trim().length > 0).length}개 URL
                        </div>

                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating || urls.trim().length === 0}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    생성 중...
                                </>
                            ) : (
                                <>
                                    <Link2 className="w-5 h-5" />
                                    링크 생성
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* 결과 */}
                {results.length > 0 && (
                    <div>
                        {/* 통계 */}
                        <div className="grid grid-cols-3 gap-4 mb-6">
                            <div className="bg-white rounded-lg shadow-sm p-4">
                                <div className="text-sm text-gray-600 mb-1">전체</div>
                                <div className="text-2xl font-bold text-gray-900">{results.length}</div>
                            </div>
                            <div className="bg-white rounded-lg shadow-sm p-4">
                                <div className="text-sm text-gray-600 mb-1">성공</div>
                                <div className="text-2xl font-bold text-green-600">{successCount}</div>
                            </div>
                            <div className="bg-white rounded-lg shadow-sm p-4">
                                <div className="text-sm text-gray-600 mb-1">실패</div>
                                <div className="text-2xl font-bold text-red-600">{failCount}</div>
                            </div>
                        </div>

                        {/* 결과 목록 */}
                        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <h2 className="text-lg font-semibold text-gray-900">생성 결과</h2>
                            </div>

                            <div className="divide-y divide-gray-200">
                                {results.map((result, index) => (
                                    <div key={index} className="px-6 py-4">
                                        <div className="flex items-start gap-3">
                                            {result.success ? (
                                                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                            ) : (
                                                <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                            )}

                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm text-gray-600 mb-1">원본 URL:</div>
                                                <div className="text-xs bg-gray-50 p-2 rounded border border-gray-200 break-all mb-2">
                                                    {result.url}
                                                </div>

                                                {result.success ? (
                                                    <>
                                                        <div className="text-sm text-gray-600 mb-1">어필리에이트 링크:</div>
                                                        <div className="text-xs bg-green-50 p-2 rounded border border-green-200 break-all">
                                                            {result.affiliateLink}
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="text-sm text-red-600">
                                                        오류: {result.error || '알 수 없는 오류'}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* 안내 */}
                {!isGenerating && results.length === 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                        <h3 className="font-medium text-blue-900 mb-2">사용 방법</h3>
                        <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                            <li>알리익스프레스 상품 URL을 한 줄에 하나씩 입력하세요</li>
                            <li>최대 100개까지 한 번에 생성할 수 있습니다</li>
                            <li>생성된 링크는 자동으로 데이터베이스에 저장됩니다</li>
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}
