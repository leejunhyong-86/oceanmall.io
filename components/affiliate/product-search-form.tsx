'use client';

import { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';

interface ProductSearchFormProps {
    onSearch: (params: {
        keywords: string;
        category?: string;
        sort?: string;
        hasVideo?: boolean;
    }) => void;
    isLoading?: boolean;
}

export default function ProductSearchForm({ onSearch, isLoading }: ProductSearchFormProps) {
    const [keywords, setKeywords] = useState('');
    const [category, setCategory] = useState('');
    const [sort, setSort] = useState('SALE_PRICE_ASC');
    const [hasVideo, setHasVideo] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSearch({
            keywords,
            category: category || undefined,
            sort,
            hasVideo: hasVideo || undefined,
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-4">
                {/* 검색어 입력 */}
                <div className="flex-1">
                    <label htmlFor="keywords" className="block text-sm font-medium text-gray-700 mb-1">
                        검색어
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            id="keywords"
                            value={keywords}
                            onChange={(e) => setKeywords(e.target.value)}
                            placeholder="예: wireless earbuds, phone case..."
                            className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                </div>

                {/* 카테고리 선택 */}
                <div className="w-48">
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                        카테고리
                    </label>
                    <select
                        id="category"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="">전체</option>
                        <option value="Consumer Electronics">전자기기</option>
                        <option value="Fashion">패션</option>
                        <option value="Beauty">뷰티</option>
                        <option value="Home">홈/인테리어</option>
                        <option value="Sports">스포츠</option>
                    </select>
                </div>

                {/* 정렬 */}
                <div className="w-48">
                    <label htmlFor="sort" className="block text-sm font-medium text-gray-700 mb-1">
                        정렬
                    </label>
                    <select
                        id="sort"
                        value={sort}
                        onChange={(e) => setSort(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="SALE_PRICE_ASC">낮은 가격순</option>
                        <option value="SALE_PRICE_DESC">높은 가격순</option>
                        <option value="LAST_VOLUME_DESC">인기순</option>
                    </select>
                </div>
            </div>

            {/* 영상 필터 */}
            <div className="flex items-center gap-2">
                <input
                    type="checkbox"
                    id="hasVideo"
                    checked={hasVideo}
                    onChange={(e) => setHasVideo(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="hasVideo" className="text-sm text-gray-700 cursor-pointer">
                    📹 영상 있는 상품만 검색
                </label>
            </div>

            {/* 검색 버튼 */}
            <button
                type="submit"
                disabled={isLoading || !keywords.trim()}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
            >
                {isLoading ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        검색 중...
                    </>
                ) : (
                    <>
                        <Search className="w-5 h-5" />
                        상품 검색
                    </>
                )}
            </button>
        </form>
    );
}
