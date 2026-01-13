/**
 * @file components/home/instagram-feed-section.tsx
 * @description Instagram 최신 게시물 표시 섹션
 *
 * Instagram Business 계정의 최신 게시물을 그리드 형태로 표시합니다.
 * 각 게시물을 클릭하면 Instagram 페이지로 이동합니다.
 *
 * 주요 기능:
 * - 2x3 그리드 레이아웃 (모바일 2열, 데스크탑 6열)
 * - 호버 시 캡션 표시
 * - VIDEO/CAROUSEL 타입 아이콘 표시
 * - Instagram 팔로우 링크
 *
 * @dependencies
 * - next/image: 이미지 최적화
 * - lucide-react: 아이콘
 */

import Image from 'next/image';
import Link from 'next/link';
import { Instagram, ExternalLink, Play, Images } from 'lucide-react';
import type { InstagramPost } from '@/actions/instagram';

interface InstagramFeedSectionProps {
  posts: InstagramPost[];
  instagramUrl?: string;
}

export function InstagramFeedSection({ 
  posts, 
  instagramUrl = 'https://www.instagram.com/oceancialwave' 
}: InstagramFeedSectionProps) {
  // 게시물이 없으면 섹션을 렌더링하지 않음
  if (posts.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-gradient-to-b from-pink-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 flex items-center justify-center">
              <Instagram className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Instagram
              </h2>
              <p className="text-sm text-gray-600">
                @oceancialwave
              </p>
            </div>
          </div>
          <Link
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-pink-600 hover:text-pink-700 font-medium transition-colors group"
          >
            팔로우하기
            <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </div>

        {/* 게시물 그리드 */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={post.permalink}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative aspect-square overflow-hidden rounded-lg bg-gray-100 shadow-md hover:shadow-xl transition-all duration-300"
            >
              {/* 이미지 */}
              <Image
                src={post.media_type === 'VIDEO' && post.thumbnail_url 
                  ? post.thumbnail_url 
                  : post.media_url
                }
                alt={post.caption?.substring(0, 100) || 'Instagram post'}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-300"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
              />

              {/* 호버 오버레이 */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="text-white text-xs line-clamp-3 leading-relaxed">
                    {post.caption || '게시물 보기'}
                  </p>
                </div>
              </div>

              {/* 비디오 아이콘 */}
              {post.media_type === 'VIDEO' && (
                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm rounded-full p-1.5 group-hover:bg-pink-500 transition-colors">
                  <Play className="w-4 h-4 text-white fill-white" />
                </div>
              )}

              {/* 캐러셀 아이콘 */}
              {post.media_type === 'CAROUSEL_ALBUM' && (
                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm rounded-full p-1.5 group-hover:bg-purple-500 transition-colors">
                  <Images className="w-4 h-4 text-white" />
                </div>
              )}
            </Link>
          ))}
        </div>

        {/* 더보기 버튼 */}
        <div className="mt-8 text-center">
          <Link
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white rounded-full font-semibold hover:from-pink-600 hover:via-purple-600 hover:to-indigo-600 transition-all shadow-lg hover:shadow-xl hover:scale-105"
          >
            <Instagram className="w-5 h-5" />
            Instagram에서 더보기
          </Link>
        </div>
      </div>
    </section>
  );
}
