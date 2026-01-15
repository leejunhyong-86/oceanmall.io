/**
 * @file components/header/site-logo.tsx
 * @description 오션몰 로고 텍스트 컴포넌트
 *
 * 중세 세계지도 테마에 맞는 빈티지 스타일의 로고 텍스트를 표시합니다.
 */

import Link from 'next/link';

interface SiteLogoProps {
  className?: string;
}

export function SiteLogo({ className }: SiteLogoProps) {
  return (
    <Link href="/" className={className}>
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-wide">
        <span className="bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-200 bg-clip-text text-transparent drop-shadow-lg">
          오션몰
        </span>
      </h1>
    </Link>
  );
}
