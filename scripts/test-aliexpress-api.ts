/**
 * AliExpress Affiliate API 연결 테스트 스크립트
 * 
 * 실행 방법:
 * pnpm tsx scripts/test-aliexpress-api.ts
 */

import crypto from 'crypto';
import { config } from 'dotenv';
import { resolve } from 'path';

// .env.local 파일 로드
config({ path: resolve(process.cwd(), '.env.local') });

// 환경 변수 확인
const APP_KEY = process.env.ALIEXPRESS_APP_KEY;
const APP_SECRET = process.env.ALIEXPRESS_APP_SECRET;
const TRACKING_ID = process.env.ALIEXPRESS_TRACKING_ID;

console.log('🔍 알리익스프레스 API 테스트 시작...\n');

// 환경 변수 확인
console.log('📋 환경 변수 확인:');
console.log(`   APP_KEY: ${APP_KEY ? '✅ 설정됨' : '❌ 없음'}`);
console.log(`   APP_SECRET: ${APP_SECRET ? '✅ 설정됨' : '❌ 없음'}`);
console.log(`   TRACKING_ID: ${TRACKING_ID ? '✅ 설정됨' : '❌ 없음'}\n`);

if (!APP_KEY || !APP_SECRET || !TRACKING_ID) {
    console.error('❌ 환경 변수가 설정되지 않았습니다!');
    console.error('   .env.local 파일을 확인하세요.\n');
    process.exit(1);
}

/**
 * AliExpress API 서명 생성
 * @param method API 메서드명
 * @param params API 파라미터
 * @returns 서명된 URL
 */
function generateSignature(method: string, params: Record<string, any>): string {
    // 타임스탬프 추가
    const timestamp = Date.now().toString();

    // 기본 파라미터
    const baseParams = {
        app_key: APP_KEY,
        method: method,
        timestamp: timestamp,
        sign_method: 'md5',
        format: 'json',
        v: '2.0',
        ...params
    };

    // 파라미터를 알파벳 순으로 정렬
    const sortedKeys = Object.keys(baseParams).sort();

    // 서명 문자열 생성
    let signString = APP_SECRET;
    sortedKeys.forEach(key => {
        signString += key + baseParams[key];
    });
    signString += APP_SECRET;

    // MD5 해시 생성 (대문자)
    const sign = crypto.createHash('md5').update(signString).digest('hex').toUpperCase();

    // URL 파라미터 생성
    const urlParams = new URLSearchParams({
        ...baseParams,
        sign
    });

    return urlParams.toString();
}

/**
 * 테스트 1: 상품 검색 API
 */
async function testProductSearch() {
    console.log('🔍 테스트 1: 상품 검색 API');

    try {
        const params = {
            target_currency: 'USD',
            target_language: 'EN',
            keywords: 'phone case',
            page_no: '1',
            page_size: '5',
            tracking_id: TRACKING_ID
        };

        const queryString = generateSignature('aliexpress.affiliate.product.query', params);
        const url = `https://api-sg.aliexpress.com/sync?${queryString}`;

        console.log('   요청 URL:', url.substring(0, 100) + '...\n');

        const response = await fetch(url);
        const data = await response.json();

        // AliExpress API 응답 구조 확인
        const apiResponse = data.aliexpress_affiliate_product_query_response;

        if (apiResponse && apiResponse.resp_result && apiResponse.resp_result.resp_code === 200) {
            console.log('   ✅ 상품 검색 성공!');

            const result = apiResponse.resp_result.result;
            const products = result.products?.product || [];

            console.log(`   📦 검색된 상품 수: ${products.length}개\n`);

            if (products.length > 0) {
                const product = products[0];
                console.log('   📱 첫 번째 상품:');
                console.log(`      제목: ${product.product_title}`);
                console.log(`      가격: $${product.target_sale_price}`);
                console.log(`      커미션율: ${product.commission_rate}%\n`);
            }
            return true;
        } else {
            console.error('   ❌ 상품 검색 실패');
            console.error('   응답:', JSON.stringify(data, null, 2));
            return false;
        }
    } catch (error) {
        console.error('   ❌ 에러 발생:', error);
        return false;
    }
}

/**
 * 테스트 2: 어필리에이트 링크 생성 API
 */
async function testLinkGeneration() {
    console.log('🔗 테스트 2: 어필리에이트 링크 생성 API');

    try {
        const params = {
            promotion_link_type: '0', // 0 = 일반 링크
            source_values: 'https://www.aliexpress.com/item/1005001234567890.html',
            tracking_id: TRACKING_ID
        };

        const queryString = generateSignature('aliexpress.affiliate.link.generate', params);
        const url = `https://api-sg.aliexpress.com/sync?${queryString}`;

        console.log('   요청 URL:', url.substring(0, 100) + '...\n');

        const response = await fetch(url);
        const data = await response.json();

        // AliExpress API 응답 구조 확인
        const apiResponse = data.aliexpress_affiliate_link_generate_response;

        if (apiResponse && apiResponse.resp_result && apiResponse.resp_result.resp_code === 200) {
            console.log('   ✅ 링크 생성 성공!');

            const result = apiResponse.resp_result.result;
            const promotionLinks = result.promotion_links?.promotion_link || [];

            if (promotionLinks.length > 0) {
                const link = promotionLinks[0];
                console.log(`   🔗 원본 URL: ${params.source_values}`);
                console.log(`   🔗 어필리에이트 링크: ${link.promotion_link}\n`);
            }
            return true;
        } else {
            console.error('   ❌ 링크 생성 실패');
            console.error('   응답:', JSON.stringify(data, null, 2));
            return false;
        }
    } catch (error) {
        console.error('   ❌ 에러 발생:', error);
        return false;
    }
}

/**
 * 메인 테스트 실행
 */
async function main() {
    const test1 = await testProductSearch();
    const test2 = await testLinkGeneration();

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 테스트 결과 요약:');
    console.log(`   상품 검색 API: ${test1 ? '✅ 성공' : '❌ 실패'}`);
    console.log(`   링크 생성 API: ${test2 ? '✅ 성공' : '❌ 실패'}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (test1 && test2) {
        console.log('🎉 모든 테스트 통과! API 연동이 정상적으로 작동합니다.');
        console.log('   다음 단계: Phase 1 (대량 링크 생성 기능) 구현을 시작할 수 있습니다.\n');
    } else {
        console.log('⚠️  일부 테스트가 실패했습니다.');
        console.log('   API 키와 권한 설정을 확인해주세요.\n');
    }
}

// 실행
main().catch(console.error);
