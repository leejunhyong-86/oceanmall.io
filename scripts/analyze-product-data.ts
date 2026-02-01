/**
 * 알리익스프레스 상품 정보 상세 분석 스크립트
 * 
 * 실행 방법:
 * pnpm tsx scripts/analyze-product-data.ts
 */

import crypto from 'crypto';
import { config } from 'dotenv';
import { resolve } from 'path';
import { writeFileSync } from 'fs';

// .env.local 파일 로드
config({ path: resolve(process.cwd(), '.env.local') });

const APP_KEY = process.env.ALIEXPRESS_APP_KEY;
const APP_SECRET = process.env.ALIEXPRESS_APP_SECRET;
const TRACKING_ID = process.env.ALIEXPRESS_TRACKING_ID;

console.log('🔍 알리익스프레스 상품 정보 상세 분석 시작...\n');

if (!APP_KEY || !APP_SECRET || !TRACKING_ID) {
    console.error('❌ 환경 변수가 설정되지 않았습니다!');
    process.exit(1);
}

/**
 * API 서명 생성
 */
function generateSignature(method: string, params: Record<string, any>): string {
    const timestamp = Date.now().toString();

    const baseParams = {
        app_key: APP_KEY,
        method: method,
        timestamp: timestamp,
        sign_method: 'md5',
        format: 'json',
        v: '2.0',
        ...params
    };

    const sortedKeys = Object.keys(baseParams).sort();

    let signString = APP_SECRET;
    sortedKeys.forEach(key => {
        signString += key + baseParams[key];
    });
    signString += APP_SECRET;

    const sign = crypto.createHash('md5').update(signString).digest('hex').toUpperCase();

    const urlParams = new URLSearchParams({
        ...baseParams,
        sign
    });

    return urlParams.toString();
}

/**
 * 상품 검색 및 상세 정보 분석
 */
async function analyzeProductData() {
    console.log('📦 상품 검색 중...\n');

    try {
        // 1. 상품 검색
        const params = {
            target_currency: 'USD',
            target_language: 'EN',
            keywords: 'wireless earbuds',
            page_no: '1',
            page_size: '3',
            tracking_id: TRACKING_ID,
            sort: 'SALE_PRICE_ASC'
        };

        const queryString = generateSignature('aliexpress.affiliate.product.query', params);
        const url = `https://api-sg.aliexpress.com/sync?${queryString}`;

        const response = await fetch(url);
        const data = await response.json();

        const apiResponse = data.aliexpress_affiliate_product_query_response;

        if (apiResponse && apiResponse.resp_result && apiResponse.resp_result.resp_code === 200) {
            const result = apiResponse.resp_result.result;
            const products = result.products?.product || [];

            console.log(`✅ ${products.length}개 상품 발견!\n`);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

            // 각 상품의 모든 필드 분석
            products.forEach((product: any, index: number) => {
                console.log(`\n📱 상품 ${index + 1}: ${product.product_title}\n`);
                console.log('🔑 사용 가능한 모든 필드:\n');

                Object.keys(product).forEach(key => {
                    const value = product[key];
                    const type = typeof value;
                    const preview = type === 'string' && value.length > 100
                        ? value.substring(0, 100) + '...'
                        : value;

                    console.log(`   ${key} (${type}): ${preview}`);
                });

                console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
            });

            // JSON 파일로 저장
            const outputPath = resolve(process.cwd(), 'scripts', 'product-data-sample.json');
            writeFileSync(outputPath, JSON.stringify(products, null, 2), 'utf-8');
            console.log(`\n💾 전체 데이터를 파일로 저장했습니다: ${outputPath}\n`);

            // 중요 필드 요약
            console.log('\n📊 중요 필드 요약:\n');
            console.log('🖼️  이미지/영상 관련:');
            console.log('   - product_main_image_url: 메인 이미지');
            console.log('   - product_small_image_urls: 작은 이미지들');
            console.log('   - product_video_url: 상품 영상 (있는 경우)\n');

            console.log('💰 가격 정보:');
            console.log('   - target_sale_price: 판매가');
            console.log('   - target_original_price: 원가');
            console.log('   - discount: 할인율\n');

            console.log('📝 상품 정보:');
            console.log('   - product_title: 상품명');
            console.log('   - product_detail_url: 상세 페이지 URL');
            console.log('   - category_name: 카테고리');
            console.log('   - shop_title: 판매자명\n');

            console.log('📈 성과 지표:');
            console.log('   - commission_rate: 커미션율');
            console.log('   - sale_price: 판매가');
            console.log('   - evaluate_rate: 평점\n');

            return products;
        } else {
            console.error('❌ 상품 검색 실패');
            return null;
        }
    } catch (error) {
        console.error('❌ 에러 발생:', error);
        return null;
    }
}

/**
 * 상품 상세 정보 가져오기 (Product Details API)
 */
async function getProductDetails(productId: string) {
    console.log(`\n🔍 상품 상세 정보 조회: ${productId}\n`);

    try {
        const params = {
            product_ids: productId,
            target_currency: 'USD',
            target_language: 'EN',
            tracking_id: TRACKING_ID
        };

        const queryString = generateSignature('aliexpress.affiliate.productdetail.get', params);
        const url = `https://api-sg.aliexpress.com/sync?${queryString}`;

        const response = await fetch(url);
        const data = await response.json();

        console.log('📦 상세 정보 응답:\n');
        console.log(JSON.stringify(data, null, 2));

        return data;
    } catch (error) {
        console.error('❌ 에러 발생:', error);
        return null;
    }
}

/**
 * 메인 실행
 */
async function main() {
    const products = await analyzeProductData();

    if (products && products.length > 0) {
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ 분석 완료!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        console.log('💡 다음 단계:');
        console.log('   1. product-data-sample.json 파일을 확인하세요');
        console.log('   2. 필요한 필드를 선택하여 데이터베이스 스키마를 설계하세요');
        console.log('   3. 이미지/영상 URL을 활용하여 콘텐츠를 자동 생성하세요\n');
    }
}

main().catch(console.error);
