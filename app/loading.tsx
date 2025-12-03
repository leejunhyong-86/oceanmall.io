/**
 * @file app/loading.tsx
 * @description 전역 로딩 컴포넌트
 */

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="relative w-16 h-16 mx-auto mb-4">
          <div className="absolute inset-0 border-4 border-purple-200 rounded-full" />
          <div className="absolute inset-0 border-4 border-purple-600 rounded-full border-t-transparent animate-spin" />
        </div>
        <p className="text-gray-500">로딩 중...</p>
      </div>
    </div>
  );
}

