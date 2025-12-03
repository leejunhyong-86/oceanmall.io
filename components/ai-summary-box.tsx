'use client';

/**
 * @file components/ai-summary-box.tsx
 * @description AI 리뷰 요약 박스 컴포넌트
 *
 * AI가 분석한 리뷰 요약을 표시합니다.
 * 긍정/부정 포인트와 추천 대상을 보여줍니다.
 */

import { useState, useEffect } from 'react';
import { Sparkles, ThumbsUp, ThumbsDown, Target, RefreshCw, Info } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

interface AISummaryBoxProps {
  productId: string;
  productName: string;
}

interface AISummaryData {
  summary: string;
  positivePoints: string[];
  negativePoints: string[];
  recommendation: string;
  overallRating: number;
  provider: string;
}

export function AISummaryBox({ productId, productName }: AISummaryBoxProps) {
  const [summary, setSummary] = useState<AISummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // AI 요약 fetch
  const fetchSummary = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/summarize-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, productName }),
      });

      if (!response.ok) {
        throw new Error('AI 요약을 불러오는데 실패했습니다.');
      }

      const data = await response.json();
      setSummary(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류');
    } finally {
      setIsLoading(false);
    }
  };

  // 컴포넌트 마운트 시 자동으로 fetch
  useEffect(() => {
    fetchSummary();
  }, [productId]);

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-purple-600 animate-pulse" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">AI 리뷰 분석 중...</h3>
            <p className="text-sm text-gray-500">리뷰를 분석하고 있습니다</p>
          </div>
        </div>
        <div className="space-y-3">
          <div className="h-4 bg-purple-100 rounded animate-pulse" />
          <div className="h-4 bg-purple-100 rounded animate-pulse w-3/4" />
          <div className="h-4 bg-purple-100 rounded animate-pulse w-1/2" />
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="bg-gray-50 rounded-2xl p-6 text-center">
        <Info className="w-10 h-10 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600 mb-4">{error}</p>
        <Button variant="outline" onClick={fetchSummary}>
          <RefreshCw className="w-4 h-4 mr-2" />
          다시 시도
        </Button>
      </div>
    );
  }

  // 요약 없음
  if (!summary) {
    return (
      <div className="bg-gray-50 rounded-2xl p-6 text-center">
        <Sparkles className="w-10 h-10 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600 mb-4">아직 AI 요약이 생성되지 않았습니다.</p>
        <Button onClick={fetchSummary}>
          <Sparkles className="w-4 h-4 mr-2" />
          AI 요약 생성하기
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-6 border border-purple-100">
      {/* 헤더 */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">AI 리뷰 요약</h3>
            <p className="text-sm text-gray-500">
              {summary.provider === 'mock' ? 'Mock AI' : summary.provider} 분석
            </p>
          </div>
        </div>

        {/* 전체 평점 */}
        <div className="text-right">
          <div className="text-2xl font-bold text-purple-600">
            {summary.overallRating.toFixed(1)}
          </div>
          <div className="text-sm text-gray-500">AI 분석 점수</div>
        </div>
      </div>

      {/* 요약 */}
      <p className="text-gray-700 mb-6 leading-relaxed">{summary.summary}</p>

      {/* 긍정/부정 포인트 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* 긍정 포인트 */}
        <div className="bg-green-50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <ThumbsUp className="w-5 h-5 text-green-600" />
            <h4 className="font-medium text-green-800">긍정 포인트</h4>
          </div>
          <ul className="space-y-2">
            {summary.positivePoints.map((point, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-green-700">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1.5 flex-shrink-0" />
                {point}
              </li>
            ))}
          </ul>
        </div>

        {/* 부정 포인트 */}
        <div className="bg-red-50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <ThumbsDown className="w-5 h-5 text-red-600" />
            <h4 className="font-medium text-red-800">주의 사항</h4>
          </div>
          <ul className="space-y-2">
            {summary.negativePoints.map((point, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-red-700">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full mt-1.5 flex-shrink-0" />
                {point}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 추천 대상 */}
      <div className="bg-purple-100 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <Target className="w-5 h-5 text-purple-600" />
          <h4 className="font-medium text-purple-800">추천 대상</h4>
        </div>
        <p className="text-sm text-purple-700">{summary.recommendation}</p>
      </div>

      {/* 새로고침 버튼 */}
      <div className="mt-4 text-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchSummary}
          className="text-purple-600 hover:text-purple-700"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          요약 새로고침
        </Button>
      </div>
    </div>
  );
}

