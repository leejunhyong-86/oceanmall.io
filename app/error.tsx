'use client';

/**
 * @file app/error.tsx
 * @description 전역 에러 바운더리
 */

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // 에러 로깅 서비스에 전송 (예: Sentry)
    console.error('Application Error:', error);
  }, [error]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center px-4 max-w-md">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-8 h-8 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          오류가 발생했습니다
        </h1>
        <p className="text-gray-600 mb-6">
          죄송합니다. 예상치 못한 오류가 발생했습니다.
          <br />
          잠시 후 다시 시도해주세요.
        </p>
        {error.digest && (
          <p className="text-xs text-gray-400 mb-6">
            오류 코드: {error.digest}
          </p>
        )}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={reset} className="bg-purple-600 hover:bg-purple-700">
            <RefreshCw className="w-4 h-4 mr-2" />
            다시 시도
          </Button>
          <Link href="/">
            <Button variant="outline">
              <Home className="w-4 h-4 mr-2" />
              홈으로 이동
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}

