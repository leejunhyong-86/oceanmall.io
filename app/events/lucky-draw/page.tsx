/**
 * @file app/events/lucky-draw/page.tsx
 * @description 럭키드로우 이벤트 상세 페이지
 *
 * 럭키드로우 이벤트 참여 페이지입니다.
 * 현재는 기본 레이아웃만 구현되어 있으며, 추후 실제 참여 기능을 추가할 수 있습니다.
 *
 * 디자인 컨셉:
 * - 대항해시대 테마 유지
 * - 이벤트 참여 안내
 * - 경품 정보 표시
 *
 * @dependencies
 * - @/actions/lucky-draw: 럭키드로우 이벤트 조회
 * - lucide-react: 아이콘
 */

import Link from 'next/link';
import Image from 'next/image';
import { getActiveLuckyDrawEvent } from '@/actions/lucky-draw';
import { Gift, ArrowLeft, Clock, Users, Award } from 'lucide-react';

export const metadata = {
  title: '럭키드로우 | 오션몰',
  description: '바다 건너 온 특별한 경품! 럭키드로우에 참여하세요.',
};

export default async function LuckyDrawPage() {
  const event = await getActiveLuckyDrawEvent();

  return (
    <main className="min-h-screen">
      {/* 히어로 섹션 */}
      <section className="relative py-20 overflow-hidden">
        {/* 배경 */}
        <div className="absolute inset-0">
          <Image
            src="/images/lucky-draw-port.png"
            alt="대항해시대 포트 도시"
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* 뒤로가기 - 좌측 상단 고정 (반응형) */}
        <Link
          href="/"
          className="fixed top-4 left-4 md:top-6 md:left-6 z-50 inline-flex items-center gap-2 text-amber-200 hover:text-white transition-colors bg-black/20 backdrop-blur-sm px-3 py-2 md:px-4 md:py-2 rounded-lg text-sm md:text-base"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">홈으로 돌아가기</span>
          <span className="sm:hidden">홈</span>
        </Link>

        {/* 콘텐츠 */}
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          {/* 제목 */}
          <h1 
            className="text-4xl md:text-5xl font-bold text-[var(--color-blue-50)] mb-4 grid rotate-[360deg]"
            style={{ fontFamily: '"Roboto", -apple-system, BlinkMacSystemFont, sans-serif' }}
          >
            {event?.title?.replace(/^대항해\s*/, '') || '럭키드로우'}
          </h1>

          {/* 설명 - 중앙 정렬 (반응형) */}
          <p className="relative top-5 text-xl text-amber-100 mb-8 max-w-2xl mx-auto px-4 backdrop-blur-[12px] text-center shadow-[0px_4px_12px_0px_rgba(0,0,0,0.15)]">
            {event?.description || '바다 건너 온 특별한 경품! 단 200원으로 인기템을 겟 하는 방법!'}
          </p>
        </div>
      </section>

      {/* 이벤트 안내 섹션 */}
      <section className="py-16 bg-gradient-to-b from-amber-50 to-white">
        <div className="max-w-4xl mx-auto px-4">
          {event ? (
            <>
              {/* 특징 카드 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-amber-100 text-center">
                  <div className="w-14 h-14 bg-amber-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-7 h-7 text-amber-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">매주 진행</h3>
                  <p className="text-gray-600 text-sm">
                    매주 새로운 경품으로 럭키드로우가 진행됩니다
                  </p>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-lg border border-amber-100 text-center">
                  <div className="w-14 h-14 bg-amber-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Users className="w-7 h-7 text-amber-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">누구나 참여</h3>
                  <p className="text-gray-600 text-sm">
                    회원이라면 누구나 간단하게 참여할 수 있습니다
                  </p>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-lg border border-amber-100 text-center">
                  <div className="w-14 h-14 bg-amber-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Award className="w-7 h-7 text-amber-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">다양한 경품</h3>
                  <p className="text-gray-600 text-sm">
                    해외직구 인기 상품을 경품으로 만나보세요
                  </p>
                </div>
              </div>

              {/* 참여 안내 */}
              <div className="bg-amber-50 rounded-3xl p-8 border border-amber-200">
                <h2 className="text-2xl font-bold text-amber-900 mb-6 text-center">
                  🎁 이벤트 참여 방법
                </h2>
                <ol className="space-y-4 max-w-xl mx-auto">
                  <li className="flex items-start gap-4">
                    <span className="flex-shrink-0 w-8 h-8 bg-amber-600 text-white rounded-full flex items-center justify-center font-bold">
                      1
                    </span>
                    <div>
                      <p className="font-semibold text-gray-900">회원 가입 또는 로그인</p>
                      <p className="text-gray-600 text-sm">오션몰 회원만 참여 가능합니다</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-4">
                    <span className="flex-shrink-0 w-8 h-8 bg-amber-600 text-white rounded-full flex items-center justify-center font-bold">
                      2
                    </span>
                    <div>
                      <p className="font-semibold text-gray-900">참여 버튼 클릭</p>
                      <p className="text-gray-600 text-sm">이벤트 기간 내에 참여 버튼을 클릭하세요</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-4">
                    <span className="flex-shrink-0 w-8 h-8 bg-amber-600 text-white rounded-full flex items-center justify-center font-bold">
                      3
                    </span>
                    <div>
                      <p className="font-semibold text-gray-900">당첨 확인</p>
                      <p className="text-gray-600 text-sm">매주 마감 후 당첨자를 발표합니다</p>
                    </div>
                  </li>
                </ol>
              </div>

              {/* 참여 버튼 */}
              <div className="text-center mt-12">
                <button
                  className="inline-flex items-center gap-3 px-10 py-4 bg-amber-600 hover:bg-amber-700 text-white text-xl font-bold rounded-full transition-all shadow-xl hover:shadow-2xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled
                >
                  <Gift className="w-6 h-6" />
                  참여하기 (준비 중)
                </button>
                <p className="text-gray-500 text-sm mt-4">
                  실제 참여 기능은 추후 업데이트 예정입니다
                </p>
              </div>
            </>
          ) : (
            /* 이벤트 없음 */
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Gift className="w-10 h-10 text-gray-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                현재 진행 중인 이벤트가 없습니다
              </h2>
              <p className="text-gray-600 mb-8">
                새로운 럭키드로우 이벤트를 기대해 주세요!
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-full font-semibold transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                홈으로 돌아가기
              </Link>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
