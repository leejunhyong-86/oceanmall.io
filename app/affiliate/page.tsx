import Link from 'next/link';
import { Link2, Search, TrendingUp } from 'lucide-react';

export default function AffiliatePage() {
    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-7xl mx-auto px-4">
                {/* 헤더 */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">
                        알리익스프레스 어필리에이트
                    </h1>
                    <p className="text-lg text-gray-600">
                        상품을 검색하고 어필리에이트 링크를 생성하세요
                    </p>
                </div>

                {/* 기능 카드 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* 상품 검색 */}
                    <Link
                        href="/affiliate/search"
                        className="bg-white rounded-lg shadow-sm p-8 hover:shadow-md transition-shadow"
                    >
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                            <Search className="w-6 h-6 text-blue-600" />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                            상품 검색
                        </h2>
                        <p className="text-gray-600 mb-4">
                            알리익스프레스 상품을 검색하고 어필리에이트 링크를 생성하세요
                        </p>
                        <div className="text-blue-600 font-medium">
                            시작하기 →
                        </div>
                    </Link>

                    {/* 대량 링크 생성 */}
                    <Link
                        href="/affiliate/bulk-generate"
                        className="bg-white rounded-lg shadow-sm p-8 hover:shadow-md transition-shadow"
                    >
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                            <Link2 className="w-6 h-6 text-green-600" />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                            대량 링크 생성
                        </h2>
                        <p className="text-gray-600 mb-4">
                            여러 개의 상품 URL을 한 번에 어필리에이트 링크로 변환하세요
                        </p>
                        <div className="text-green-600 font-medium">
                            시작하기 →
                        </div>
                    </Link>

                    {/* 링크 관리 */}
                    <Link
                        href="/affiliate/links"
                        className="bg-white rounded-lg shadow-sm p-8 hover:shadow-md transition-shadow"
                    >
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                            <TrendingUp className="w-6 h-6 text-purple-600" />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                            링크 관리
                        </h2>
                        <p className="text-gray-600 mb-4">
                            생성된 링크를 관리하고 성과를 확인하세요
                        </p>
                        <div className="text-purple-600 font-medium">
                            시작하기 →
                        </div>
                    </Link>
                </div>

                {/* 안내 */}
                <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h3 className="font-medium text-blue-900 mb-2">시작하기 전에</h3>
                    <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                        <li>알리익스프레스 어필리에이트 프로그램에 가입되어 있어야 합니다</li>
                        <li>API 키가 환경 변수에 설정되어 있어야 합니다</li>
                        <li>생성된 링크는 자동으로 데이터베이스에 저장됩니다</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
