'use client';

import { SignedOut, SignInButton, SignedIn, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, Package, Heart, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  const navLinks: { href: string; label: string; icon: typeof Package }[] = [];

  // 홈페이지에서는 HeroHeader를 사용하므로 Navbar를 숨김
  if (pathname === '/') {
    return null;
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b">
      <div className="flex justify-between items-center px-4 gap-4 h-16 max-w-7xl mx-auto">
        {/* 로고 */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">🛒</span>
          <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            오션몰
          </span>
        </Link>

        {/* 데스크탑 네비게이션 */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-gray-600 hover:text-purple-600 font-medium transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* 우측 액션 */}
        <div className="flex gap-3 items-center">
          <SignedIn>
            {/* 위시리스트 */}
            <Link href="/my" className="hidden sm:flex">
              <Button variant="ghost" size="icon">
                <Heart className="w-5 h-5" />
              </Button>
            </Link>
            
            {/* 관리자 */}
            <Link href="/admin" className="hidden sm:flex">
              <Button variant="ghost" size="icon">
                <Settings className="w-5 h-5" />
              </Button>
            </Link>
            
            <UserButton 
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "w-9 h-9"
                }
              }}
            />
          </SignedIn>
          
          <SignedOut>
            <SignInButton mode="modal">
              <Button className="bg-purple-600 hover:bg-purple-700">
                로그인
              </Button>
            </SignInButton>
          </SignedOut>

          {/* 모바일 메뉴 버튼 */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* 모바일 메뉴 */}
      <div
        className={cn(
          'md:hidden bg-white border-b',
          isMenuOpen ? 'block' : 'hidden'
        )}
      >
        <nav className="flex flex-col p-4 gap-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100"
              onClick={() => setIsMenuOpen(false)}
            >
              <link.icon className="w-5 h-5 text-gray-500" />
              <span className="font-medium">{link.label}</span>
            </Link>
          ))}
          <SignedIn>
            <Link
              href="/my"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100"
              onClick={() => setIsMenuOpen(false)}
            >
              <Heart className="w-5 h-5 text-gray-500" />
              <span className="font-medium">마이페이지</span>
            </Link>
            <Link
              href="/admin"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100"
              onClick={() => setIsMenuOpen(false)}
            >
              <Settings className="w-5 h-5 text-gray-500" />
              <span className="font-medium">관리자</span>
            </Link>
          </SignedIn>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
