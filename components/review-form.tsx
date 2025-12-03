'use client';

/**
 * @file components/review-form.tsx
 * @description 리뷰 작성 폼 컴포넌트
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Star, Camera, X, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { createUserReview } from '@/actions/reviews';
import { cn } from '@/lib/utils';

const reviewSchema = z.object({
  title: z.string().max(100, '제목은 100자 이내로 입력해주세요').optional(),
  content: z.string().min(10, '최소 10자 이상 작성해주세요').max(1000, '1000자 이내로 작성해주세요'),
  rating: z.number().min(1, '별점을 선택해주세요').max(5),
  purchase_platform: z.string().optional(),
});

type ReviewFormData = z.infer<typeof reviewSchema>;

interface ReviewFormProps {
  productId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ReviewForm({ productId, onSuccess, onCancel }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: 0,
    },
  });

  // 별점 선택
  const handleRatingClick = (value: number) => {
    setRating(value);
    setValue('rating', value);
  };

  // 폼 제출
  const onSubmit = async (data: ReviewFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await createUserReview({
        product_id: productId,
        title: data.title || null,
        content: data.content,
        rating: data.rating,
        purchase_platform: data.purchase_platform || null,
      });

      if (result.success) {
        onSuccess?.();
      } else {
        setError(result.error || '리뷰 작성에 실패했습니다.');
      }
    } catch {
      setError('리뷰 작성 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* 에러 메시지 */}
      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* 별점 */}
      <div>
        <Label className="block mb-2">별점 *</Label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => handleRatingClick(value)}
              onMouseEnter={() => setHoverRating(value)}
              onMouseLeave={() => setHoverRating(0)}
              className="p-1 focus:outline-none"
            >
              <Star
                className={cn(
                  'w-8 h-8 transition-colors',
                  (hoverRating || rating) >= value
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                )}
              />
            </button>
          ))}
          {rating > 0 && (
            <span className="ml-2 text-sm text-gray-500">{rating}점</span>
          )}
        </div>
        {errors.rating && (
          <p className="text-red-500 text-sm mt-1">{errors.rating.message}</p>
        )}
      </div>

      {/* 제목 */}
      <div>
        <Label htmlFor="title" className="block mb-2">
          제목 (선택)
        </Label>
        <Input
          id="title"
          placeholder="리뷰 제목을 입력해주세요"
          {...register('title')}
        />
        {errors.title && (
          <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
        )}
      </div>

      {/* 내용 */}
      <div>
        <Label htmlFor="content" className="block mb-2">
          리뷰 내용 *
        </Label>
        <Textarea
          id="content"
          placeholder="상품 사용 후기를 자세히 작성해주세요 (최소 10자)"
          rows={5}
          {...register('content')}
        />
        {errors.content && (
          <p className="text-red-500 text-sm mt-1">{errors.content.message}</p>
        )}
      </div>

      {/* 구매 플랫폼 */}
      <div>
        <Label htmlFor="purchase_platform" className="block mb-2">
          구매 플랫폼 (선택)
        </Label>
        <Input
          id="purchase_platform"
          placeholder="예: 아마존, 알리익스프레스"
          {...register('purchase_platform')}
        />
      </div>

      {/* 버튼 */}
      <div className="flex gap-3 pt-4">
        <Button
          type="submit"
          className="flex-1 bg-purple-600 hover:bg-purple-700"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              제출 중...
            </>
          ) : (
            '리뷰 작성'
          )}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            취소
          </Button>
        )}
      </div>
    </form>
  );
}

