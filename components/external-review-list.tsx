'use client';

/**
 * @file components/external-review-list.tsx
 * @description 해외 리뷰 목록 컴포넌트
 *
 * 해외 쇼핑몰에서 수집된 리뷰를 표시합니다.
 * 번역 토글 기능을 포함합니다.
 */

import { useState } from 'react';
import { Star, Globe, Languages, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from './ui/button';
import type { ExternalReview } from '@/types';
import { cn } from '@/lib/utils';

interface ExternalReviewListProps {
  reviews: ExternalReview[];
  productId: string;
  totalCount: number;
}

export function ExternalReviewList({
  reviews,
  totalCount,
}: ExternalReviewListProps) {
  const [expandedReviews, setExpandedReviews] = useState<Set<string>>(new Set());
  const [showTranslation, setShowTranslation] = useState<Record<string, boolean>>({});

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

  // 번역 토글
  const toggleTranslation = (reviewId: string) => {
    setShowTranslation((prev) => ({
      ...prev,
      [reviewId]: !prev[reviewId],
    }));
  };

  // 언어 코드를 이름으로 변환
  const getLanguageName = (code: string) => {
    const languages: Record<string, string> = {
      en: '영어',
      zh: '중국어',
      ja: '일본어',
      de: '독일어',
      fr: '프랑스어',
      es: '스페인어',
    };
    return languages[code] || code;
  };

  if (reviews.length === 0) {
    return (
      <div className="bg-white rounded-xl border p-8 text-center">
        <Globe className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">아직 수집된 해외 리뷰가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 리뷰 목록 */}
      {reviews.map((review) => {
        const isExpanded = expandedReviews.has(review.id);
        const isTranslated = showTranslation[review.id];
        const content = isTranslated && review.translated_content
          ? review.translated_content
          : review.content;
        const isLong = review.content.length > 200;

        return (
          <div
            key={review.id}
            className="bg-white rounded-xl border p-5 hover:shadow-sm transition-shadow"
          >
            {/* 리뷰 헤더 */}
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">
                    {review.reviewer_name || '익명'}
                  </span>
                  {review.reviewer_country && (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                      {review.reviewer_country}
                    </span>
                  )}
                  {review.is_verified_purchase && (
                    <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">
                      인증된 구매
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  {/* 평점 */}
                  {review.rating && (
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            'w-4 h-4',
                            i < review.rating!
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-200'
                          )}
                        />
                      ))}
                    </div>
                  )}
                  {/* 날짜 */}
                  {review.review_date && (
                    <span className="text-xs text-gray-400">
                      {new Date(review.review_date).toLocaleDateString('ko-KR')}
                    </span>
                  )}
                </div>
              </div>

              {/* 원문 언어 & 번역 토글 */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">
                  {getLanguageName(review.source_language)}
                </span>
                {review.translated_content && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleTranslation(review.id)}
                    className="text-xs"
                  >
                    <Languages className="w-4 h-4 mr-1" />
                    {isTranslated ? '원문 보기' : '번역 보기'}
                  </Button>
                )}
              </div>
            </div>

            {/* 리뷰 내용 */}
            <p
              className={cn(
                'text-gray-700 leading-relaxed',
                !isExpanded && isLong && 'line-clamp-3'
              )}
            >
              {content}
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

            {/* 도움됨 카운트 */}
            {review.helpful_count > 0 && (
              <div className="mt-3 text-xs text-gray-400">
                {review.helpful_count}명에게 도움이 됨
              </div>
            )}
          </div>
        );
      })}

      {/* 더 보기 안내 */}
      {totalCount > reviews.length && (
        <div className="text-center py-4">
          <p className="text-gray-500 text-sm">
            총 {totalCount.toLocaleString()}개의 해외 리뷰 중 {reviews.length}개 표시
          </p>
        </div>
      )}
    </div>
  );
}

