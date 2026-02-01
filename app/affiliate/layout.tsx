import Link from 'next/link';
import { Search, Link2, List } from 'lucide-react';

export default function AffiliateLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const navItems = [
        {
            name: '상품 검색',
            href: '/affiliate/search',
            icon: Search,
        },
        {
            name: '대량 링크 생성',
            href: '/affiliate/bulk-generate',
            icon: Link2,
        },
        {
            name: '링크 관리',
            href: '/affiliate/links',
            icon: List,
        },
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* 네비게이션 */}
            <nav className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-8">
                            <Link href="/" className="text-xl font-bold text-gray-900">
                                OceanMall
                            </Link>
                            <div className="hidden md:flex items-center gap-1">
                                {navItems.map((item) => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        <item.icon className="w-4 h-4" />
                                        {item.name}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            {/* 메인 컨텐츠 */}
            <main>{children}</main>
        </div>
    );
}
