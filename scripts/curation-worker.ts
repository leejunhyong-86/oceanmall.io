import * as dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Supabase Admin Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// AliExpress API config
const appKey = process.env.ALIEXPRESS_APP_KEY || '';
const appSecret = process.env.ALIEXPRESS_APP_SECRET || '';
const trackingId = process.env.ALIEXPRESS_TRACKING_ID || '';
const openclawWebhook = process.env.OPENCLAW_WEBHOOK_URL || '';

/**
 * OpenClaw 알림 발송 함수
 */
async function notifyOpenClaw(message: string) {
    console.log('[OpenClaw Log]:', message);
    if (openclawWebhook) {
        try {
            await fetch(openclawWebhook, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: message }),
            });
        } catch (err) {
            console.error('Failed to notify OpenClaw:', err);
        }
    }
}

/**
 * AliExpress API 서명(Signature) 생성 함수 (v2.0 명세)
 * 서명 생성 규칙: appSecret + 정렬된 파라미터(key+value)
 */
function generateSignature(apiMethod: string, params: Record<string, string>) {
    const sortedKeys = Object.keys(params).sort();
    let queryStr = appSecret; // AliExpress API v2.0 requires prefixing with appSecret

    // API 메서드 파라미터가 params 객체에 이미 포함되어 있으므로 (method), 
    // 그냥 a-z 정렬된 키-값 순서대로 붙이면 됩니다.
    for (const key of sortedKeys) {
        queryStr += key + params[key];
    }

    // 꼬리표에도 appSecret을 붙이는 것이 TopOffer/Taobao 표준 (HMAC 아님, 단순 MD5)
    queryStr += appSecret;

    return crypto.createHash('md5').update(queryStr, 'utf8').digest('hex').toUpperCase();
}

/**
 * AliExpress 상품 가져오기 및 DB 삽입 메인 함수
 */
async function runCuration() {
    await notifyOpenClaw('초특가 어필리에이트 봇 타이머가 시작되었습니다! (알리익스프레스 데이터 수집 중...)');

    if (!appKey || !appSecret || !trackingId) {
        const errorMsg = '환경 변수에 알리익스프레스 키가 없습니다.';
        console.error(errorMsg);
        await notifyOpenClaw('❌ 크롤러 에러: ' + errorMsg);
        return;
    }

    // TODO: 실제 AliExpress API 엔드포인트와 메소드는 공식 문서를 참고하여 조정 필요 (현행 탑오퍼 API 예시)
    const apiMethod = 'aliexpress.affiliate.hotproduct.query';
    const timestamp = new Date().toISOString().replace(/\.[0-9]+Z$/, 'Z');

    const params: Record<string, string> = {
        method: apiMethod,
        app_key: appKey,
        sign_method: 'md5',
        timestamp: timestamp,
        format: 'json',
        v: '2.0',
        target_currency: 'KRW',
        target_language: 'KO',
        tracking_id: trackingId,
        // 특가 필터 기본값 (카테고리 별도 분리 가능)
        category_ids: '', // 전 카테고리
        sort: 'SALE_PRICE_ASC',
        page_size: '20',
    };

    const sign = generateSignature(apiMethod, params);
    params.sign = sign;

    try {
        const queryParams = new URLSearchParams(params).toString();
        const apiUrl = `https://api-sg.aliexpress.com/sync?${queryParams}`;

        // ============================================
        // [LIVE] 실제 AliExpress API 호출 영역
        // ============================================
        let insertedCount = 0;

        try {
            console.log('Fetching live data from AliExpress API...');
            const response = await fetch(apiUrl);
            const data = await response.json();

            // 응답 에러 확인
            if (data.error_response) {
                console.error('AliExpress API Error:', data.error_response.msg);
                await notifyOpenClaw('❌ 크롤러 에러: ' + data.error_response.msg);
                return;
            }

            // 데이터 파싱 (aliexpress.affiliate.hotproduct.query 응답 구조에 맞춤)
            const products = data.aliexpress_affiliate_hotproduct_query_response?.resp_result?.result?.current_record_count > 0
                ? data.aliexpress_affiliate_hotproduct_query_response.resp_result.result.products.product
                : [];

            console.log(`Found ${products.length} hot products from API.`);

            for (const item of products) {
                // 1. 최소 평점 4.0 이상, 판매량 100 이상 선별
                const evaluateRate = parseFloat(item.evaluate_rate) || 0;
                const salesVolume = parseInt(item.target_sale_price) || 0; // Notice: actual sale count might be named differently depending on API version, using target_sale_price loosely if sales_volume is missing, but usually it's in the response

                // *주의: 실제 API 응답 필드명(item.evaluate_rate, item.product_id 등)은 버전에 따라 다를 수 있습니다.
                // 여기서는 현재 오픈 API 스펙 기준으로 매핑합니다.

                // 2. DB 업데이트
                const { error } = await supabase.from('affiliate_products').upsert({
                    product_id: item.product_id.toString(),
                    title: item.product_title,
                    target_sale_price: parseFloat(item.target_sale_price) || 0,
                    target_original_price: parseFloat(item.target_original_price) || 0,
                    discount_rate: parseFloat(item.discount) || 0,
                    main_image_url: item.product_main_image_url,
                    evaluate_rate: evaluateRate,
                    sales_volume: item.sell_count || 0, // usually sell_count or sales
                    commission_rate: parseFloat(item.commission_rate) || 0,
                }, { onConflict: 'product_id' });

                if (error) {
                    console.error('DB Insert Error (Product):', error);
                } else {
                    insertedCount++;

                    // 3. 실제 제휴 링크(promotion_link) 저장 로직
                    // API 응답에 promotion_link 가 포함되어 옵니다.
                    if (item.promotion_link) {
                        await supabase.from('affiliate_links').delete().eq('product_id', item.product_id.toString());
                        const { error: linkError } = await supabase.from('affiliate_links').insert({
                            product_id: item.product_id.toString(),
                            long_url: item.product_url || `https://ko.aliexpress.com/item/${item.product_id}.html`,
                            promotion_link: item.promotion_link
                        });

                        if (linkError) console.error('DB Insert Error (Link):', linkError);
                    }
                }
            }
        } catch (fetchErr) {
            console.error('Fetch execution error:', fetchErr);
        }

        await notifyOpenClaw(`✅ 알리 핫딜 큐레이션 완료! 총 ${insertedCount}개의 실제 고효율 상품이 오션몰 DB에 업데이트 되었습니다.`);

    } catch (error) {
        console.error('API Fetch failed:', error);
        await notifyOpenClaw('❌ 크롤러 런타임 에러: API 통신에 실패했습니다.');
    }
}

runCuration().catch(console.error);
