'use client';

/**
 * @file components/user-review-list.tsx
 * @description 자체 한국어 리뷰 목록 컴포넌트
 */

import { useState } from 'react';
import Image from 'next/image';
import { Star, ThumbsUp, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from './ui/button';
import { voteReviewHelpful } from '@/actions/reviews';
import type { UserReviewWithUser } from '@/types';
import { cn } from '@/lib/utils';

interface UserReviewListProps {
  reviews: UserReviewWithUser[];
  productId: string;
  totalCount: number;
}

export function UserReviewList({
  reviews,
  totalCount,
}: UserReviewListProps) {
  const [expandedReviews, setExpandedReviews] = useState<Set<string>>(new Set());
  const [votedReviews, setVotedReviews] = useState<Set<string>>(new Set());
  const [localHelpfulCounts, setLocalHelpfulCounts] = useState<Record<string, number>>({});

  // 리뷰 펼치기/접기
  const toggleExpand = (reviewId: string) => {
    const newExpanded = new Set(expandedReviews);
    if (newExpanded.has(reviewId)) {
      newExpanded.delete(reviewId);
    } else {
      newExpanded.add(reviewId);
    }
    setExpandedReviews(newExpanded);
  };

  // 도움됨 투표
  const handleVote = async (reviewId: string) => {
    if (votedReviews.has(reviewId)) return;

    const result = await voteReviewHelpful(reviewId);
    if (result.success) {
      setVotedReviews((prev) => new Set([...prev, reviewId]));
      setLocalHelpfulCounts((prev) => ({
        ...prev,
        [reviewId]: (prev[reviewId] || reviews.find(r => r.id === reviewId)?.helpful_count || 0) + 1,
      }));
    }
  };

  // 상대 시간 표시
  const getRelativeTime = (date: string) => {
    const now = new Date();
    const reviewDate = new Date(date);
    const diffInDays = Math.floor((now.getTime() - reviewDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return '오늘';
    if (diffInDays === 1) return '어제';
    if (diffInDays < 7) return `${diffInDays}일 전`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)}주 전`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)}개월 전`;
    return `${Math.floor(diffInDays / 365)}년 전`;
  };

  if (reviews.length === 0) {
    return (
      <div className="bg-white rounded-xl border p-8 text-center">
        <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 mb-4">아직 작성된 리뷰가 없습니다.</p>
        <p className="text-sm text-gray-400">
          이 상품을 구매하셨다면 첫 번째 리뷰를 작성해주세요!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 리뷰 목록 */}
      {reviews.map((review) => {
        const isExpanded = expandedReviews.has(review.id);
        const isLong = review.content.length > 200;
        const hasVoted = votedReviews.has(review.id);
        const helpfulCount = localHelpfulCounts[review.id] ?? review.helpful_count;

        return (
          <div
            key={review.id}
            className="bg-white rounded-xl border p-5 hover:shadow-sm transition-shadow"
          >
            {/* 리뷰 헤더 */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                {/* 프로필 아바타 */}
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 font-medium">
                    {review.user.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{review.user.name}</span>
                    {review.is_verified && (
                      <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">
                        인증됨
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {/* 평점 */}
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            'w-3.5 h-3.5',
                            i < review.rating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-200'
                          )}
                        />
                      ))}
                    </div>
                    {/* 날짜 */}
                    <span className="text-xs text-gray-400">
                      {getRelativeTime(review.created_at)}
                    </span>
                  </div>
                </div>
              </div>

              {/* 구매 플랫폼 */}
              {review.purchase_platform && (
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {review.purchase_platform}에서 구매
                </span>
              )}
            </div>

            {/* 리뷰 제목 */}
            {review.title && (
              <h4 className="font-medium text-gray-900 mb-2">{review.title}</h4>
            )}

            {/* 리뷰 내용 */}
            <p
              className={cn(
                'text-gray-700 leading-relaxed',
                !isExpanded && isLong && 'line-clamp-3'
              )}
            >
              {review.content}
            </p>

            {/* 더보기/접기 버튼 */}
            {isLong && (
              <button
                onClick={() => toggleExpand(review.id)}
                className="text-purple-600 text-sm mt-2 flex items-center hover:underline"
              >
                {isExpanded ? (
                  <>
                    접기 <ChevronUp className="w-4 h-4 ml-1" />
                  </>
                ) : (
                  <>
                    더보기 <ChevronDown className="w-4 h-4 ml-1" />
                  </>
                )}
              </button>
            )}

            {/* 리뷰 이미지 */}
            {review.images && review.images.length > 0 && (
              <div className="flex gap-2 mt-4 overflow-x-auto">
                {review.images.map((image, idx) => (
                  <div
                    key={idx}
                    className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100"
                  >
                    <Image
                      src={image}
                      alt={`리뷰 이미지 ${idx + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* 액션 버튼 */}
            <div className="flex items-center gap-4 mt-4 pt-4 border-t">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleVote(review.id)}
                disabled={hasVoted}
                className={cn(
                  'text-gray-500',
                  hasVoted && 'text-purple-600'
                )}
              >
                <ThumbsUp className={cn('w-4 h-4 mr-1.5', hasVoted && 'fill-purple-600')} />
                도움됨 {helpfulCount > 0 && `(${helpfulCount})`}
              </Button>
            </div>
          </div>
        );
      })}

      {/* 더 보기 안내 */}
      {totalCount > reviews.length && (
        <div className="text-center py-4">
          <p className="text-gray-500 text-sm">
            총 {totalCount}개의 리뷰 중 {reviews.length}개 표시
          </p>
        </div>
      )}
    </div>
  );
}

