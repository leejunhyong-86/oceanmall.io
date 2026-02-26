import { createClerkSupabaseClient } from '@/lib/supabase/server';
import { AffiliateCard } from '@/components/affiliate-card';
import { Layers } from 'lucide-react';

export const revalidate = 3600; // 1시간 캐싱

// 숏폼 스타일 디스커버리 피드 (메타 광고 이탈 유저 탐색용)
export default async function ExplorePage() {
    const supabase = createClerkSupabaseClient();

    // 최신 특가/베스트 상품 로드 (가장 효율이 좋은 것들을 먼저 띄움)
    const { data: products } = await supabase
        .from('affiliate_products')
        .select(`
      *,
      affiliate_links (
        promotion_link
      )
    `)
        .order('sales_volume', { ascending: false })
        .limit(20);

    return (
        <div className="min-h-screen bg-neutral-950 pb-20 pt-8 text-white">
            <div className="container mx-auto max-w-lg px-4">

                {/* 헤더 */}
                <div className="mb-8 space-y-2 text-center">
                    <div className="flex items-center justify-center space-x-2 text-primary">
                        <Layers className="h-8 w-8" />
                        <h1 className="text-3xl font-black tracking-tight">핫딜 숏폼 피드</h1>
                    </div>
                    <p className="text-sm text-neutral-400">
                        실시간 최고 할인율 상품만 모아서 보여드립니다. 스와이프하며 구경하세요!
                    </p>
                </div>

                {/* 무한 스크롤 & 스니펫 피드 형태로 상품 목록 나열 (단순 스크롤 형태지만 UI는 숏폼 카드형) */}
                <div className="flex flex-col gap-8">
                    {products?.map((product) => {
                        // 조인된 affiliate_links 에서 프로모션 링크 추출, 없으면 상세 url로 처리
                        // @ts-ignore
                        const promoLink = product.affiliate_links?.[0]?.promotion_link || product.product_detail_url || `/p/${product.product_id}`;

                        return (
                            <div key={product.id} className="w-full snap-center">
                                <AffiliateCard product={product} link={promoLink} />
                            </div>
                        );
                    })}

                    {!products || products.length === 0 && (
                        <div className="py-20 text-center text-neutral-500">
                            아직 수집된 핫딜 상품이 없습니다. 봇이 데이터를 가져오길 기다려주세요!
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
