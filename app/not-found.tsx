/**
 * @file app/not-found.tsx
 * @description 404 Not Found 페이지
 */

import Link from 'next/link';
import { Home, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center px-4">
        <div className="text-8xl mb-4">🔍</div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          페이지를 찾을 수 없습니다
        </h1>
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
          URL을 확인하시거나 아래 버튼을 통해 이동해주세요.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/">
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Home className="w-4 h-4 mr-2" />
              홈으로 이동
            </Button>
          </Link>
          <Link href="/products">
            <Button variant="outline">
              <Search className="w-4 h-4 mr-2" />
              상품 둘러보기
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}

