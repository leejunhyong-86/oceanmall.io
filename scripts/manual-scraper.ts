import * as dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

import { createClient } from '@supabase/supabase-js';
import { chromium } from 'playwright';
import * as cheerio from 'cheerio';

// Supabase Admin Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// AliExpress API config (for link generation)
const trackingId = process.env.ALIEXPRESS_TRACKING_ID || '';

/**
 * 수동/스크래핑 기반 어필리에이트 상품 등록 봇
 * API 승인 전, 일반 상품 URL 모음을 받아 DB에 넣을 수 있도록 지원하는 대체 스크립트입니다.
 */

const TARGET_URLS: string[] = [
    // 알람 맞출 상품 URL들을 여기에 넣으세요 (알리, 쿠팡 등)
    // 예시: 'https://ko.aliexpress.com/item/1005007137812345.html'
];

async function scrapeAliExpress(url: string) {
    console.log(`Scraping: ${url}`);

    // Playwright 브라우저 실행 (헤드리스 모드)
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    // 타겟 모바일 환경으로 속여 봇 탐지 회피
    await page.setExtraHTTPHeaders({
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
    });

    try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

        // 약간의 대기 (동적 컨텐츠 로딩)
        await page.waitForTimeout(2000);

        const html = await page.content();
        const $ = cheerio.load(html);

        // 오픈그래프 태그에서 추출 시도 (가장 정확함)
        const title = $('meta[property="og:title"]').attr('content') || $('title').text();
        const imageUrl = $('meta[property="og:image"]').attr('content');

        let price = $('meta[property="og:price:amount"]').attr('content');
        if (!price) {
            // Fallback: 페이지 내 특정 클래스 등 탐색 (알리 모바일 기준)
            price = $('.price--currentPriceText--V8_y_b5').text().replace(/[^0-9.]/g, '');
        }

        // Product ID 추출 (URL 내 숫자 부분)
        const match = url.match(/\/item\/(\d+)\.html/);
        const productId = match ? match[1] : `MANUAL_${Date.now()}`;

        console.log(`Found: ${title?.substring(0, 30)}... | $${price} | ${productId}`);

        if (!title || !imageUrl) {
            console.error('Failed to scrape essential information.');
            return null;
        }

        // 아주 간단한 가짜 제휴 링크 생성 (실제로는 Portals API로 변환해야 작동함)
        // API 권한이 열리기 전까지 클릭 트래킹 ID만 심어두는 기초적인 처리
        const affiliateLink = `${url}?aff_fcid=${trackingId}`;

        return {
            product_id: productId,
            title: title,
            target_sale_price: parseFloat(price as string) || 0,
            target_original_price: (parseFloat(price as string) || 0) * 1.5, // 가짜 할인가 처리
            discount_rate: 33, // 가짜 할인율
            main_image_url: imageUrl,
            evaluate_rate: 4.5, // 가짜 평점
            sales_volume: 1000, // 가짜 판매량
            commission_rate: 5.0,
            promotion_link: affiliateLink,
            source_url: url
        };

    } catch (error) {
        console.error(`Scraping failed for ${url}:`, error);
        return null;
    } finally {
        await browser.close();
    }
}

async function runManualCuration() {
    if (TARGET_URLS.length === 0) {
        console.log('TARGET_URLS 배열에 수집할 URL을 입력해주세요.');
        return;
    }

    let insertedCount = 0;

    for (const url of TARGET_URLS) {
        const product = await scrapeAliExpress(url);

        if (product) {
            // DB 업데이트
            const { error: prodError } = await supabase.from('affiliate_products').upsert({
                product_id: product.product_id,
                title: product.title,
                target_sale_price: product.target_sale_price,
                target_original_price: product.target_original_price,
                discount_rate: product.discount_rate,
                main_image_url: product.main_image_url,
                evaluate_rate: product.evaluate_rate,
                sales_volume: product.sales_volume,
                commission_rate: product.commission_rate,
            }, { onConflict: 'product_id' });

            if (prodError) console.error('DB Insert Error (Product):', prodError);

            await supabase.from('affiliate_links').delete().eq('product_id', product.product_id);
            const { error: linkError } = await supabase.from('affiliate_links').insert({
                product_id: product.product_id,
                long_url: product.source_url,
                promotion_link: product.promotion_link
            });

            if (linkError) console.error('DB Insert Error (Link):', linkError);

            if (!prodError && !linkError) insertedCount++;
        }
    }

    console.log(`✅ 수동 크롤링 완료! 총 ${insertedCount}개의 상품이 DB에 업데이트 되었습니다.`);
}

runManualCuration().catch(console.error);
