import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

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
 * AliExpress API 서명(Signature) 생성 함수
 */
function generateSignature(apiMethod: string, params: Record<string, string>) {
    const sortedKeys = Object.keys(params).sort();
    let queryStr = apiMethod;
    for (const key of sortedKeys) {
        queryStr += key + params[key];
    }
    return crypto.createHmac('md5', appSecret).update(queryStr, 'utf8').digest('hex').toUpperCase();
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

        // 이 부분은 AliExpress 공식 API 응답에 맞춰 수정해야 합니다.
        // 임시로 가짜 데이터(Mock) 처리를 해둡니다. 실제 API 호출 시 주석 해제.
        /*
        const response = await fetch(apiUrl);
        const data = await response.json();
        const products = data.aliexpress_affiliate_hotproduct_query_response.resp_result.result.current_record_count;
        */

        console.log('API 호출 대기중...', apiUrl);

        // Mock Data for DB insert
        const mockProducts = [
            {
                product_id: 'ALI_MOCK_' + Math.floor(Math.random() * 100000),
                title: '베이스어스 100W 고속 충전 보조배터리 대용량',
                target_sale_price: 29.99,
                target_original_price: 59.99,
                discount_rate: 50,
                main_image_url: 'https://ae01.alicdn.com/kf/Sc188f6fa9d0f4d38bbb828be26c483a3C/Baseus-100W-Power-Bank-20000mAh.jpg',
                evaluate_rate: 4.8,
                sales_volume: 5400,
                commission_rate: 8.5
            },
            {
                product_id: 'ALI_MOCK_' + Math.floor(Math.random() * 100000),
                title: '샤오미 스마트 공기청정기 4 컴팩트 한정 특가',
                target_sale_price: 49.50,
                target_original_price: 99.00,
                discount_rate: 50,
                main_image_url: 'https://ae01.alicdn.com/kf/S500e5eb4f42f494fa221dbb16867634fT/Xiaomi-Smart-Air-Purifier-4.jpg',
                evaluate_rate: 4.9,
                sales_volume: 12000,
                commission_rate: 6.0
            }
        ];

        let insertedCount = 0;

        for (const item of mockProducts) {
            // 1. 최소 평점 4.0 이상, 판매량 100 이상 선별
            if (item.evaluate_rate >= 4.0 && item.sales_volume >= 100) {

                // 2. DB 업데이트
                const { error } = await supabase.from('affiliate_products').upsert({
                    product_id: item.product_id,
                    title: item.title,
                    target_sale_price: item.target_sale_price,
                    target_original_price: item.target_original_price,
                    discount_rate: item.discount_rate,
                    main_image_url: item.main_image_url,
                    evaluate_rate: item.evaluate_rate,
                    sales_volume: item.sales_volume,
                    commission_rate: item.commission_rate,
                }, { onConflict: 'product_id' });

                if (error) {
                    console.error('DB Insert Error:', error);
                } else {
                    insertedCount++;
                }
            }
        }

        await notifyOpenClaw(`✅ 알리 핫딜 큐레이션 완료! 총 ${insertedCount}개의 고효율 상품이 오션몰 DB에 업데이트 되었습니다.`);

    } catch (error) {
        console.error('API Fetch failed:', error);
        await notifyOpenClaw('❌ 크롤러 런타임 에러: API 통신에 실패했습니다.');
    }
}

runCuration().catch(console.error);
