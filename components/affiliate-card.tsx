import Image from 'next/image';
import Link from 'next/link';
import { Star } from 'lucide-react';

interface AffiliateCardProps {
    product: {
        id: string;
        product_id: string;
        title: string;
        target_sale_price: number;
        target_original_price: number;
        discount_rate: number;
        main_image_url: string;
        evaluate_rate: number;
        sales_volume: number;
    };
    link: string; // The Affiliate Short Link
}

export function AffiliateCard({ product, link }: AffiliateCardProps) {
    return (
        <Link href={link} target="_blank" className="block w-full">
            <div className="group relative overflow-hidden rounded-2xl bg-white/5 shadow-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl border border-white/10 dark:hover:border-primary/50">

                {/* 할인율 뱃지 */}
                {product.discount_rate > 0 && (
                    <div className="absolute left-3 top-3 z-10 flex h-10 w-10 flex-col items-center justify-center rounded-full bg-red-500 font-bold text-white shadow-lg">
                        <span className="text-xs leading-none">UP TO</span>
                        <span className="text-sm leading-none">{product.discount_rate}%</span>
                    </div>
                )}

                {/* 대형 이미지 영역 (숏폼 특화: 세로로 긴 편이 좋지만 정방향으로 통일) */}
                <div className="relative aspect-square w-full overflow-hidden sm:aspect-[4/5]">
                    <Image
                        src={product.main_image_url || '/placeholder.png'}
                        alt={product.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-80" />
                </div>

                {/* 정보 영역 (이미지 하단 오버레이 또는 하단 카드) */}
                <div className="absolute bottom-0 w-full p-4 text-white">
                    <h3 className="line-clamp-2 text-lg font-bold leading-tight drop-shadow-md">
                        {product.title}
                    </h3>

                    <div className="mt-2 flex items-center justify-between">
                        <div className="flex flex-col">
                            {product.target_original_price > product.target_sale_price && (
                                <span className="text-xs text-white/70 line-through">
                                    {product.target_original_price.toLocaleString()}원
                                </span>
                            )}
                            <span className="text-2xl font-black text-red-400 drop-shadow-sm">
                                {product.target_sale_price.toLocaleString()}원
                            </span>
                        </div>

                        <div className="flex flex-col items-end">
                            <div className="flex items-center text-yellow-400">
                                <Star className="h-4 w-4 fill-current" />
                                <span className="ml-1 text-sm font-bold">{product.evaluate_rate}</span>
                            </div>
                            <span className="text-xs text-white/80">{product.sales_volume.toLocaleString()}+ 판매</span>
                        </div>
                    </div>

                    {/* 대형 CTA 버튼 */}
                    <button className="mt-4 w-full rounded-full bg-primary py-3 font-bold text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95">
                        최저가로 바로가기 ⚡️
                    </button>
                </div>
            </div>
        </Link>
    );
}
