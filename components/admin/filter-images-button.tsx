'use client';

/**
 * @file components/admin/filter-images-button.tsx
 * @description 이미지 필터링 버튼 컴포넌트
 *
 * 관리자 페이지에서 모든 상품의 detail_images를 일괄 필터링하는 버튼입니다.
 */

import { useState, useTransition } from 'react';
import { Filter, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { filterAllProductImages } from '@/actions/image-filter';

export function FilterImagesButton() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{
    success: boolean;
    processedCount?: number;
    totalRemoved?: number;
    error?: string;
  } | null>(null);

  const handleFilter = () => {
    if (!confirm('모든 상품의 상세 이미지를 필터링하시겠습니까?\n\n제품 정보와 무관한 이미지(로고, 아이콘, 낮은 해상도 등)가 제거됩니다.')) {
      return;
    }

    startTransition(async () => {
      const result = await filterAllProductImages();
      setResult(result);

      if (result.success) {
        alert(
          `필터링 완료!\n\n` +
          `- 처리된 상품: ${result.processedCount}개\n` +
          `- 제거된 이미지: ${result.totalRemoved}개\n` +
          `- 유지된 이미지: ${result.totalFiltered}개`
        );
        // 페이지 새로고침
        window.location.reload();
      } else {
        alert(`필터링 실패: ${result.error}`);
      }
    });
  };

  return (
    <Button
      onClick={handleFilter}
      disabled={isPending}
      variant="outline"
      className="border-purple-300 text-purple-700 hover:bg-purple-50"
    >
      {isPending ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          필터링 중...
        </>
      ) : (
        <>
          <Filter className="w-4 h-4 mr-2" />
          이미지 필터링
        </>
      )}
    </Button>
  );
}

