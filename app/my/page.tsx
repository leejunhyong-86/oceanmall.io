/**
 * @file app/my/page.tsx
 * @description 마이페이지 - 위시리스트, 내 리뷰, 최근 본 상품
 */

import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getWishlist } from '@/actions/wishlists';
import { getMyReviews } from '@/actions/reviews';
import { Heart, MessageSquare, Clock, Star, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WishlistItem } from '@/components/wishlist-item';

export default async function MyPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  const [wishlist, myReviews] = await Promise.all([
    getWishlist(),
    getMyReviews(),
  ]);

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-8">마이페이지</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 위시리스트 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border p-6">
              <div className="flex items-center gap-2 mb-6">
                <Heart className="w-5 h-5 text-red-500" />
                <h2 className="text-lg font-semibold">위시리스트</h2>
                <span className="text-sm text-gray-500">({wishlist.length})</span>
              </div>

              {wishlist.length > 0 ? (
                <div className="space-y-4">
                  {wishlist.map((item) => (
                    <WishlistItem key={item.id} item={item} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Heart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>아직 위시리스트에 상품이 없습니다.</p>
                  <Link href="/products">
                    <Button variant="outline" className="mt-4">
                      상품 둘러보기
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* 내 리뷰 */}
          <div>
            <div className="bg-white rounded-xl border p-6">
              <div className="flex items-center gap-2 mb-6">
                <MessageSquare className="w-5 h-5 text-purple-500" />
                <h2 className="text-lg font-semibold">내 리뷰</h2>
                <span className="text-sm text-gray-500">({myReviews.length})</span>
              </div>

              {myReviews.length > 0 ? (
                <div className="space-y-4">
                  {myReviews.slice(0, 5).map((review) => (
                    <Link
                      key={review.id}
                      href={`/products/${review.product.slug}`}
                      className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-1 mb-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 ${
                              i < review.rating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-sm font-medium text-gray-900 line-clamp-1">
                        {review.product.title}
                      </p>
                      <p className="text-xs text-gray-500 line-clamp-2 mt-1">
                        {review.content}
                      </p>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <MessageSquare className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">작성한 리뷰가 없습니다.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

