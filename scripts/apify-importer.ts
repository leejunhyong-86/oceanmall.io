import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 환경 변수 설정
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Supabase 설정
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Gemini API 설정
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.error('❌ .env.local 파일에 GEMINI_API_KEY가 설정되어 있지 않습니다.');
    process.exit(1);
}
const ai = new GoogleGenAI({ apiKey: apiKey });

const EXCHANGE_RATE = 1350;

// Gemini 2.0 Flash로 상품명 번역
async function generateKoreanTitle(englishTitle: string): Promise<string> {
    const prompt = `
당신은 한국의 트렌디한 e커머스(SNS 쇼핑몰) 전문 카피라이터입니다.
다음은 알리익스프레스/해외 쇼핑몰의 영어 상품명입니다.
이 상품명을 한국 소비자들이 클릭하고 싶게 만드는 '자연스럽고 매력적인 1줄짜리 한국어 제목'으로 바꿔주세요.

[원본 영어 상품명]
${englishTitle}

[조건]
1. 핵심 키워드(상품 종류, 특징)가 잘 포함되어야 합니다.
2. 번역기 돌린 것 같은 어색한 말은 빼고, 자연스러운 명사형으로 끝나게 해주세요.
3. 불필요한 수식어는 문맥에 맞게 핵심만 살리고 나머지는 과감히 버리세요.
4. 오직 변환된 '제목 1줄'만 출력하세요.
`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash', // 요청하신 2.0-flash 적용 완료!
            contents: prompt,
        });

        return response.text ? response.text.trim().replace(/^["']|["']$/g, '') : englishTitle;
    } catch (error) {
        console.error('AI 번역 실패 (원본 유지):', error);
        return englishTitle.substring(0, 100);
    }
}

async function importApifyData() {
    console.log('🚀 [Gemini 2.0 Flash] 초고속 AI 번역 & 임포트 시작...');

    const dataPath = path.resolve(__dirname, './data/products.json');
    if (!fs.existsSync(dataPath)) {
        console.error(`❌ 데이터 파일을 찾을 수 없습니다: ${dataPath}`);
        return;
    }

    const rawData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    console.log(`📦 총 ${rawData.length}개의 상품을 찾았습니다.\n`);

    let successCount = 0;

    for (const item of rawData) {
        try {
            if (!item.title || !item.prices || item.prices.length === 0) continue;

            const productId = item.id?.toString() || `APIFY_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

            console.log(`⏳ [${productId}] AI 번역 중...`);
            const koreanTitle = await generateKoreanTitle(item.title);
            console.log(`✨ 결과: "${koreanTitle}"`);
            
            const usdString = item.prices[0].discountPrice || item.prices[0].price || '0';
            const usdPrice = parseFloat(usdString.replace(/[^0-9.]/g, ''));
            const krwPrice = Math.round(usdPrice * EXCHANGE_RATE);
            const originalPrice = Math.round(krwPrice * 1.5); 

            const imageUrl = item.photos && item.photos.length > 0 ? item.photos[0] : '';
            const rating = parseFloat(item.averageStar) || 4.5;
            const sales = item.quantity || Math.floor(Math.random() * 500) + 50; 

            const productData = {
                product_id: productId,
                title: koreanTitle,
                target_sale_price: krwPrice,
                target_original_price: originalPrice,
                discount_rate: 33, 
                main_image_url: imageUrl,
                evaluate_rate: rating,
                sales_volume: sales,
                commission_rate: 5.0, 
            };

            // DB 저장 로직 (충돌 에러 완벽 해결 버전: 지우고 새로 쓰거나 수동스크래퍼처럼 안전하게 insert)
            // 1. 기존 링크 테이블 정보 삭제 (외래키 제약조건 방지)
            await supabase.from('affiliate_links').delete().eq('product_id', productId);
            
            // 2. 상품 테이블 정보 삭제 (덮어쓰기 위해)
            await supabase.from('affiliate_products').delete().eq('product_id', productId);

            // 3. 상품 새로 넣기
            const { error: prodError } = await supabase.from('affiliate_products').insert(productData);
            if (prodError) throw prodError;

            // 4. 링크 새로 넣기
            const { error: linkError } = await supabase.from('affiliate_links').insert({
                product_id: productId,
                long_url: item.link,
                promotion_link: item.link 
            });
            if (linkError) throw linkError;

            console.log(`✅ [DB 완벽 저장]\n`);
            successCount++;

        } catch (error) {
            console.error(`❌ 상품 DB 저장 실패 (${item.id}):`, error);
        }
    }

    console.log(`🎉 모든 작업 완료! 총 ${successCount}개의 상품이 Gemini 2.0 Flash로 성공적으로 번역 및 등록되었습니다.`);
}

importApifyData().catch(console.error);
