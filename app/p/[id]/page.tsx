import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

// 단일 상품 랜딩 페이지 (Meta 광고 유입 타겟)
export default async function ProductLandingPage({ params }: { params: { id: string } }) {
    const supabase = createClient();

    // URL의 마지막 부분이 상품 ID이므로 (e.g. ALI_12345)
    const { data: product } = await supabase
        .from('affiliate_products')
        .select('*')
        .eq('product_id', params.id)
        .single();

    if (!product) {
        notFound();
    }

    // 연결된 Affiliate Link를 가져옵니다. (없으면 기본 상품 링크로 Fallback 가능하게 처리)
    const { data: affiliateLink } = await supabase
        .from('affiliate_links')
        .select('promotion_link')
        .eq('product_id', params.id)
        .single();

    const buyLink = affiliateLink?.promotion_link || product.product_detail_url || '#';

    return (
        <div className="min-h-screen bg-black text-white">
            {/* 초심플 랜딩 영역: 스크롤 없이 주요 정보가 다 보이도록 강제 (100vh) */}
            <main className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden">

                {/* 화려한 배경 블러 효과 */}
                <div className="absolute inset-0 z-0">
                    <Image
                        src={product.main_image_url}
                        alt="background blur"
                        fill
                        className="object-cover opacity-30 blur-3xl"
                    />
                    <div className="absolute inset-0 bg-black/60" />
                </div>

                <div className="z-10 w-full max-w-md px-6 py-12">
                    {/* 상품 대형 썸네일 */}
                    <div className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl border border-white/20 shadow-2xl">
                        <Image
                            src={product.main_image_url}
                            alt={product.title}
                            fill
                            className="object-cover"
                            priority
                        />
                        {product.discount_rate > 0 && (
                            <div className="absolute right-4 top-4 flex h-16 w-16 animate-bounce flex-col items-center justify-center rounded-full bg-red-600 font-black text-white shadow-2xl">
                                <span className="text-sm">특가</span>
                                <span className="text-lg">-{product.discount_rate}%</span>
                            </div>
                        )}

                        {/* 하단 그라데이션 및 이름 오버레이 */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent px-6 pb-6 pt-24 text-center">
                            <h1 className="text-2xl font-black leading-tight tracking-tight drop-shadow-xl sm:text-3xl">
                                {product.title}
                            </h1>
                        </div>
                    </div>

                    {/* 가격 및 정보 영역 */}
                    <div className="mt-8 flex flex-col items-center justify-center space-y-2 text-center">
                        {product.target_original_price > product.target_sale_price && (
                            <p className="text-base text-gray-400 line-through">
                                정상가 ${product.target_original_price}
                            </p>
                        )}
                        <p className="text-5xl font-black text-red-500 drop-shadow-md">
                            ${product.target_sale_price}
                        </p>

                        <div className="mt-4 flex flex-wrap justify-center gap-2">
                            <span className="rounded-full bg-yellow-500/20 px-3 py-1 text-sm font-bold text-yellow-500">
                                ⭐ {product.evaluate_rate} / 5.0
                            </span>
                            <span className="rounded-full bg-white/10 px-3 py-1 text-sm font-bold text-white">
                                🔥 {product.sales_volume.toLocaleString()}+ 누적 판매
                            </span>
                        </div>
                    </div>

                    {/* 거대한 CTA 버튼 */}
                    <div className="mt-10 w-full animate-in fade-in slide-in-from-bottom-8 duration-1000">
                        <Link href={buyLink} target="_blank" className="block w-full">
                            <button className="flex w-full items-center justify-center rounded-full bg-gradient-to-r from-red-600 to-pink-600 py-5 text-xl font-black text-white shadow-[0_0_40px_-10px_rgba(220,38,38,0.8)] transition-all hover:scale-105 active:scale-95">
                                지금 초특가로 구매하기 🚀
                            </button>
                        </Link>
                    </div>

                    <div className="mt-6 text-center text-xs text-gray-500">
                        * 안전한 알리익스프레스 공식 페이지로 이동합니다.
                    </div>
                </div>
            </main>
        </div>
    );
}
