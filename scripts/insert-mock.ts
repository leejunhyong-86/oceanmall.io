import * as dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function insertMockData() {
    console.log('Inserting mock data for UI testing...');

    const productId = 'ALI_TEST_001';

    const { error: prodError } = await supabase.from('affiliate_products').upsert({
        product_id: productId,
        title: '[단독특가] 베이스어스 100W 고속 충전 보조배터리 대용량 20000mAh',
        target_sale_price: 29.99,
        target_original_price: 59.99,
        discount_rate: 50,
        main_image_url: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=600&q=80',
        evaluate_rate: 4.9,
        sales_volume: 15400,
        commission_rate: 8.5,
    }, { onConflict: 'product_id' });

    if (prodError) {
        console.error('Failed to insert product:', prodError);
        return;
    }

    // Delete existing link for this mock product to avoid duplicates during test
    await supabase.from('affiliate_links').delete().eq('product_id', productId);

    const { error: linkError } = await supabase.from('affiliate_links').insert({
        product_id: productId,
        long_url: 'https://ko.aliexpress.com/item/1005007137812345.html',
        promotion_link: 'https://s.click.aliexpress.com/e/_Dk12345'
    });

    if (linkError) {
        console.error('Failed to insert link:', linkError);
        return;
    }

    console.log(`✅ Success! You can now visit: http://localhost:3000/p/${productId}`);
}

insertMockData();
