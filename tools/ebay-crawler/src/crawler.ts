/**
 * @file crawler.ts
 * @description eBay 상품 크롤러
 * 
 * eBay에서 다양한 모드로 상품을 크롤링하여 Supabase에 저장합니다.
 * 
 * 주요 기능:
 * 1. Daily Deals 크롤링
 * 2. 베스트셀러 크롤링
 * 3. 트렌딩 상품 크롤링
 * 4. 키워드 검색 크롤링
 * 5. 특정 카테고리 크롤링
 * 
 * 크롤링 모드 (CRAWL_MODE 환경변수):
 * - deals: Daily Deals (기본값)
 * - bestsellers: 카테고리별 베스트셀러
 * - trending: 인기 급상승 상품
 * - search: 키워드 검색 (SEARCH_KEYWORD 필요)
 * 
 * 사용법:
 * - pnpm crawl (기본 Daily Deals 크롤링)
 * - CRAWL_MODE=bestsellers pnpm crawl
 * - CRAWL_MODE=search SEARCH_KEYWORD="wireless earbuds" pnpm crawl
 * 
 * @dependencies
 * - puppeteer: 헤드리스 브라우저 자동화
 * - @supabase/supabase-js: 데이터베이스 연동
 */

import 'dotenv/config';
import puppeteer, { Browser, Page } from 'puppeteer';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { EbayProduct, CrawlConfig, ProductInsert, Review } from './types.js';

// 환경 변수
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// 크롤링 모드 타입
type CrawlMode = 'deals' | 'bestsellers' | 'trending' | 'search';

// 카테고리 타입
type EbayCategory = 'electronics' | 'fashion' | 'home-garden' | 'collectibles' | 'toys' | 'sporting-goods' | 'all';

// 크롤링 설정
const config: CrawlConfig = {
  maxProducts: parseInt(process.env.MAX_PRODUCTS || '10'),
  headless: process.env.HEADLESS !== 'false',
  dealsUrl: 'https://www.ebay.com/deals',
};

// 크롤링 모드 및 옵션
const CRAWL_MODE: CrawlMode = (process.env.CRAWL_MODE as CrawlMode) || 'deals';
const SEARCH_KEYWORD = process.env.SEARCH_KEYWORD || '';
const CATEGORY: EbayCategory = (process.env.CATEGORY as EbayCategory) || 'all';

// 카테고리 URL 매핑
const CATEGORY_URLS: Record<EbayCategory, string> = {
  electronics: 'https://www.ebay.com/b/Electronics/bn_7000259124',
  fashion: 'https://www.ebay.com/b/Fashion/bn_7000259855',
  'home-garden': 'https://www.ebay.com/b/Home-Garden/11700',
  collectibles: 'https://www.ebay.com/b/Collectibles/1/bn_1853355',
  toys: 'https://www.ebay.com/b/Toys-Hobbies/220/bn_1865497',
  'sporting-goods': 'https://www.ebay.com/b/Sporting-Goods/888/bn_1865031',
  all: 'https://www.ebay.com/deals',
};

// USD to KRW 환율 (대략적인 값, 실제로는 API 사용 권장)
const USD_TO_KRW = 1400;

/**
 * Supabase 클라이언트 초기화
 */
function initSupabase(): SupabaseClient {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    throw new Error('Supabase 환경 변수가 설정되지 않았습니다.');
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
}

/**
 * 슬러그 생성
 */
function createSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 100);
}

/**
 * 봇 탐지 우회를 위한 브라우저 설정
 */
async function setupBrowser(): Promise<Browser> {
  const browser = await puppeteer.launch({
    headless: config.headless,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--disable-infobars',
      '--window-size=1920,1080',
      '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    ],
  });
  return browser;
}

/**
 * 페이지 설정 (봇 탐지 우회)
 */
async function setupPage(browser: Browser): Promise<Page> {
  const page = await browser.newPage();
  
  // User-Agent 설정
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  );
  
  // 뷰포트 설정
  await page.setViewport({ width: 1920, height: 1080 });
  
  // webdriver 속성 숨기기
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', {
      get: () => undefined,
    });
  });
  
  return page;
}

/**
 * 모드별 URL 목록 생성
 */
function getUrlsForMode(mode: CrawlMode, category: EbayCategory): string[] {
  switch (mode) {
    case 'deals':
      if (category === 'all') {
        return [
          'https://www.ebay.com/deals',
          'https://www.ebay.com/deals/tech',
          'https://www.ebay.com/deals/fashion',
          'https://www.ebay.com/deals/home-garden',
        ];
      }
      return [`https://www.ebay.com/deals/${category}`];
    
    case 'bestsellers':
      if (category === 'all') {
        return [
          'https://www.ebay.com/b/Electronics/bn_7000259124?rt=nc&_sop=16',
          'https://www.ebay.com/b/Cell-Phones-Smart-Watches-Accessories/15032/bn_1865441?rt=nc&_sop=16',
          'https://www.ebay.com/b/Computers-Tablets-Network-Hardware/58058/bn_1865247?rt=nc&_sop=16',
        ];
      }
      return [`${CATEGORY_URLS[category]}?rt=nc&_sop=16`]; // 16 = Best Match
    
    case 'trending':
      return [
        'https://www.ebay.com/deals/trending',
        'https://www.ebay.com/globaldeals',
      ];
    
    case 'search':
      if (!SEARCH_KEYWORD) {
        console.error('❌ SEARCH_KEYWORD 환경변수가 설정되지 않았습니다.');
        return [];
      }
      const encodedKeyword = encodeURIComponent(SEARCH_KEYWORD);
      return [
        `https://www.ebay.com/sch/i.html?_nkw=${encodedKeyword}&_sop=12`, // 12 = Best Match
      ];
    
    default:
      return ['https://www.ebay.com/deals'];
  }
}

/**
 * 페이지에서 상품 URL 추출
 */
async function extractProductUrls(page: Page, maxProducts: number): Promise<string[]> {
  // 상품 링크 추출
  const urls = await page.evaluate(() => {
    const links: string[] = [];
    
    // 다양한 상품 링크 셀렉터들
    const selectors = [
      'a[href*="/itm/"]',
      '.dne-itemtile-detail a',
      '.ebayui-dne-item-featured-card a',
      '.dne-itemtile a.slashui-clamp',
      '.s-item__link',
      '.srp-results a.s-item__link',
    ];
    
    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);
      elements.forEach((el) => {
        const href = el.getAttribute('href');
        if (href && href.includes('/itm/')) {
          // 상품 URL 정규화
          const match = href.match(/\/itm\/[^?]+/);
          if (match) {
            const cleanUrl = match[0].startsWith('http') 
              ? match[0].split('?')[0]
              : 'https://www.ebay.com' + match[0];
            links.push(cleanUrl);
          } else if (href.startsWith('http')) {
            links.push(href.split('?')[0]);
          }
        }
      });
    }
    
    // 중복 제거
    return [...new Set(links)];
  });
  
  return urls.slice(0, maxProducts);
}

/**
 * 상품 URL 수집 (모드별)
 */
async function getProductUrls(page: Page, maxProducts: number): Promise<string[]> {
  const modeLabel = {
    deals: 'Daily Deals',
    bestsellers: '베스트셀러',
    trending: '트렌딩',
    search: `검색: "${SEARCH_KEYWORD}"`,
  }[CRAWL_MODE];
  
  console.log(`📦 eBay ${modeLabel} 크롤링 시작...`);
  
  const categoryUrls = getUrlsForMode(CRAWL_MODE, CATEGORY);
  
  if (categoryUrls.length === 0) {
    return [];
  }
  
  const productUrls: string[] = [];
  
  for (const categoryUrl of categoryUrls) {
    if (productUrls.length >= maxProducts) break;
    
    try {
      console.log(`   🔗 접속 중: ${categoryUrl.substring(0, 60)}...`);
      
      await page.goto(categoryUrl, { 
        waitUntil: 'domcontentloaded',
        timeout: 30000 
      });
      
      // 잠시 대기 (봇 탐지 우회)
      await new Promise(r => setTimeout(r, 2000 + Math.random() * 2000));
      
      const urls = await extractProductUrls(page, maxProducts - productUrls.length);
      
      // 기존과 중복되지 않는 것만 추가
      const newUrls = urls.filter(u => !productUrls.includes(u));
      productUrls.push(...newUrls);
      
      const categoryName = categoryUrl.split('/').pop()?.split('?')[0] || 'page';
      console.log(`   📋 ${categoryName}에서 ${newUrls.length}개 상품 발견`);
      
    } catch (error) {
      console.error(`   ❌ 페이지 크롤링 실패: ${categoryUrl}`);
    }
  }
  
  return productUrls.slice(0, maxProducts);
}

/**
 * eBay 리뷰 크롤링 함수
 * 참고: eBay는 상품 리뷰가 적고 판매자 피드백 위주이므로 기본 구조만 제공
 */
async function extractEbayReviews(
  page: Page, 
  itemId: string, 
  maxReviews: number = 10
): Promise<Review[]> {
  try {
    console.log(`   ⚠️  eBay는 판매자 피드백 위주로 상품 리뷰가 제한적입니다`);
    // eBay는 상품 리뷰 시스템이 판매자 피드백 중심이므로
    // 실제 상품 리뷰 크롤링은 제한적입니다.
    // 필요 시 페이지 구조 분석 후 구현 가능
    return [];
  } catch (error) {
    console.error(`   ⚠️  eBay 리뷰 크롤링 생략`);
    return [];
  }
}

/**
 * 개별 상품 상세 정보 추출
 */
async function extractProductDetails(page: Page, url: string): Promise<EbayProduct | null> {
  try {
    await page.goto(url, { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });
    
    // 랜덤 대기 (봇 탐지 우회)
    await new Promise(r => setTimeout(r, 1500 + Math.random() * 1500));
    
    const productData = await page.evaluate(() => {
      // Item ID 추출
      const itemIdMatch = window.location.pathname.match(/\/itm\/(\d+)/);
      const itemId = itemIdMatch ? itemIdMatch[1] : '';
      
      // 제목 추출
      const titleEl = document.querySelector('h1.x-item-title__mainTitle span') ||
                      document.querySelector('h1[itemprop="name"]') ||
                      document.querySelector('.x-item-title');
      const title = titleEl ? titleEl.textContent?.trim() || '' : '';
      
      // 현재 가격 추출
      const priceEl = document.querySelector('.x-price-primary span[itemprop="price"]') ||
                      document.querySelector('.x-price-primary .ux-textspans') ||
                      document.querySelector('[data-testid="x-price-primary"]') ||
                      document.querySelector('.x-bin-price__content .ux-textspans');
      let priceText = priceEl ? priceEl.textContent?.trim() || '' : '';
      const priceMatch = priceText.match(/[\d,]+\.?\d*/);
      const price = priceMatch ? parseFloat(priceMatch[0].replace(/,/g, '')) : null;
      
      // 원래 가격 추출 (할인 전)
      const originalPriceEl = document.querySelector('.x-price-primary .ux-textspans--STRIKETHROUGH') ||
                              document.querySelector('.x-additional-info .ux-textspans--STRIKETHROUGH');
      const originalPriceText = originalPriceEl ? originalPriceEl.textContent?.trim() || '' : '';
      const originalPriceMatch = originalPriceText.match(/[\d,]+\.?\d*/);
      const originalPrice = originalPriceMatch ? parseFloat(originalPriceMatch[0].replace(/,/g, '')) : null;
      
      // 경매 정보
      const bidCountEl = document.querySelector('[data-testid="x-bid-count"]') ||
                         document.querySelector('.x-bid-count');
      const bidCountText = bidCountEl ? bidCountEl.textContent?.trim() || '' : '';
      const bidCountMatch = bidCountText.match(/(\d+)/);
      const bidCount = bidCountMatch ? parseInt(bidCountMatch[1]) : null;
      
      const timeLeftEl = document.querySelector('.x-timer-min-width') ||
                         document.querySelector('[data-testid="x-time-left"]');
      const timeLeft = timeLeftEl ? timeLeftEl.textContent?.trim() || null : null;
      
      // Buy It Now 여부
      const isBuyItNow = !!document.querySelector('[data-testid="x-bin-action"]') ||
                         !!document.querySelector('.x-bin-price');
      
      // 판매자 정보
      const sellerEl = document.querySelector('.x-sellercard-atf__info__about-seller a') ||
                       document.querySelector('[data-testid="str-title"] a');
      const seller = sellerEl ? sellerEl.textContent?.trim() || null : null;
      
      // 판매자 피드백 점수
      const feedbackEl = document.querySelector('.x-sellercard-atf__info__feedback span') ||
                         document.querySelector('[data-testid="str-feedback"]');
      const feedbackText = feedbackEl ? feedbackEl.textContent?.trim() || '' : '';
      const feedbackMatch = feedbackText.match(/([\d.]+)%/);
      const sellerFeedbackScore = feedbackMatch ? parseFloat(feedbackMatch[1]) : null;
      
      // 상품 상태
      const conditionEl = document.querySelector('[data-testid="x-item-condition"]') ||
                          document.querySelector('.x-item-condition-text span');
      const condition = conditionEl ? conditionEl.textContent?.trim() || null : null;
      
      // 메인 이미지 URL 추출
      const mainImageEl = document.querySelector('.ux-image-carousel-item img') ||
                          document.querySelector('[data-testid="ux-image-magnify-container"] img') ||
                          document.querySelector('.img-wrapper img');
      let thumbnailUrl = '';
      if (mainImageEl) {
        thumbnailUrl = mainImageEl.getAttribute('src') || 
                       mainImageEl.getAttribute('data-src') || '';
        // 고해상도 이미지 URL로 변환
        thumbnailUrl = thumbnailUrl.replace(/s-l\d+/, 's-l1600');
      }
      
      // 추가 이미지 URL들
      const imageUrls: string[] = [];
      const imageElements = document.querySelectorAll('.ux-image-carousel-item img, .ux-image-filmstrip-carousel-item img');
      imageElements.forEach((img) => {
        let src = img.getAttribute('src') || img.getAttribute('data-src');
        if (src && src.includes('ebay')) {
          src = src.replace(/s-l\d+/, 's-l1600');
          imageUrls.push(src);
        }
      });
      
      // 카테고리 추출
      const categoryEl = document.querySelector('.x-breadcrumb__link span:last-child') ||
                         document.querySelector('[itemprop="itemListElement"]:last-child span');
      const category = categoryEl ? categoryEl.textContent?.trim() || '' : '';
      
      // 배송 정보
      const shippingEl = document.querySelector('[data-testid="x-shipping-cost"]') ||
                         document.querySelector('.ux-labels-values--shipping .ux-textspans');
      const shippingCost = shippingEl ? shippingEl.textContent?.trim() || null : null;
      const freeShipping = shippingCost?.toLowerCase().includes('free') || false;
      
      // 판매자 위치
      const locationEl = document.querySelector('[data-testid="x-item-location"]') ||
                         document.querySelector('.ux-labels-values--itemLocation .ux-textspans');
      const location = locationEl ? locationEl.textContent?.trim() || null : null;
      
      // 상품 설명
      const descriptionEl = document.querySelector('#desc_div') ||
                            document.querySelector('[data-testid="item-description"]');
      const description = descriptionEl ? descriptionEl.textContent?.trim().substring(0, 500) || '' : '';
      
      return {
        itemId,
        title,
        price,
        originalPrice,
        bidCount,
        timeLeft,
        isBuyItNow,
        seller,
        sellerFeedbackScore,
        condition,
        thumbnailUrl,
        imageUrls: imageUrls.slice(0, 5),
        category,
        shippingCost,
        freeShipping,
        location,
        description,
      };
    });
    
    if (!productData.title || !productData.itemId) {
      return null;
    }
    
    // rating 계산 (판매자 피드백을 5점 만점으로 변환)
    const rating = productData.sellerFeedbackScore 
      ? Math.round((productData.sellerFeedbackScore / 100) * 5 * 10) / 10 
      : 0;
    
    return {
      itemId: productData.itemId,
      title: productData.title,
      slug: createSlug(productData.title) + `-${Date.now()}`,
      description: productData.description,
      thumbnailUrl: productData.thumbnailUrl,
      imageUrls: productData.imageUrls,
      videoUrl: null, // eBay에서는 영상 추출이 복잡하므로 생략
      price: productData.price,
      originalPrice: productData.originalPrice,
      priceKrw: productData.price ? Math.round(productData.price * USD_TO_KRW) : null,
      currency: 'USD',
      bidCount: productData.bidCount,
      timeLeft: productData.timeLeft,
      isBuyItNow: productData.isBuyItNow,
      rating,
      reviewCount: 0, // eBay는 상품 리뷰보다 판매자 피드백 위주
      category: productData.category,
      condition: productData.condition,
      seller: productData.seller,
      sellerFeedbackScore: productData.sellerFeedbackScore,
      shippingCost: productData.shippingCost,
      freeShipping: productData.freeShipping,
      location: productData.location,
      sourceUrl: url,
      crawledAt: new Date(),
      reviews: [], // eBay는 판매자 피드백 위주로 상품 리뷰 크롤링 제한적
    };

  } catch (error) {
    console.error(`   ❌ 상품 추출 실패: ${url}`);
    return null;
  }
}

/**
 * Supabase에 상품 저장
 */
async function saveToSupabase(
  supabase: SupabaseClient,
  product: EbayProduct
): Promise<boolean> {
  try {
    const productInsert: ProductInsert = {
      title: product.title,
      slug: product.slug,
      description: product.description || null,
      thumbnail_url: product.thumbnailUrl || null,
      video_url: product.videoUrl,
      original_price: product.originalPrice || product.price,
      currency: 'USD',
      price_krw: product.priceKrw,
      source_platform: 'ebay',
      source_url: product.sourceUrl,
      external_rating: product.rating || null,
      external_review_count: product.reviewCount || 0,
      tags: [
        product.category,
        product.condition || '',
        product.freeShipping ? 'Free Shipping' : '',
        product.seller || '',
      ].filter(Boolean),
      is_featured: product.rating >= 4.5 || product.freeShipping,
      is_active: true,
      category_id: null,
    };
    
    const { data, error } = await supabase
      .from('products')
      .insert(productInsert)
      .select()
      .single();
    
    if (error) {
      console.error(`   ❌ DB 저장 오류:`, error.message);
      return false;
    }
    
    console.log(`   ✅ 저장 완료: ${product.title.substring(0, 50)}...`);
    return true;
    
  } catch (error) {
    console.error(`   ❌ 저장 실패:`, error);
    return false;
  }
}

/**
 * 메인 크롤링 함수
 */
async function main() {
  console.log('🚀 eBay 크롤러 시작\n');
  console.log(`📋 설정:`);
  console.log(`   - 크롤링 모드: ${CRAWL_MODE}`);
  if (CRAWL_MODE === 'search') {
    console.log(`   - 검색 키워드: ${SEARCH_KEYWORD}`);
  }
  if (CATEGORY !== 'all') {
    console.log(`   - 카테고리: ${CATEGORY}`);
  }
  console.log(`   - 최대 상품 수: ${config.maxProducts}`);
  console.log(`   - Headless 모드: ${config.headless}`);
  console.log('');
  
  // Supabase 초기화
  const supabase = initSupabase();
  console.log('✅ Supabase 연결 완료\n');
  
  // 브라우저 시작
  console.log('🌐 브라우저 시작 중...');
  const browser = await setupBrowser();
  const page = await setupPage(browser);
  console.log('✅ 브라우저 준비 완료\n');
  
  try {
    // 상품 URL 수집
    const productUrls = await getProductUrls(page, config.maxProducts);
    console.log(`\n📦 총 ${productUrls.length}개 상품 URL 수집 완료\n`);
    
    if (productUrls.length === 0) {
      console.log('⚠️ 수집된 상품이 없습니다. eBay의 봇 탐지로 인해 차단되었을 수 있습니다.');
      await browser.close();
      return;
    }
    
    // 각 상품 상세 정보 추출 및 저장
    let successCount = 0;
    
    for (let i = 0; i < productUrls.length; i++) {
      const url = productUrls[i];
      console.log(`\n[${i + 1}/${productUrls.length}] 크롤링 중: ${url}`);
      
      const product = await extractProductDetails(page, url);
      
      if (product) {
        console.log(`   📝 "${product.title.substring(0, 40)}..."`);
        console.log(`   💰 $${product.price || '가격 없음'} (₩${product.priceKrw?.toLocaleString() || '-'})`);
        console.log(`   📦 상태: ${product.condition || '정보 없음'}`);
        console.log(`   🚚 배송: ${product.freeShipping ? '무료 배송' : product.shippingCost || '정보 없음'}`);
        if (product.bidCount !== null) {
          console.log(`   🔨 입찰: ${product.bidCount}건 (남은 시간: ${product.timeLeft || '정보 없음'})`);
        }
        
        const saved = await saveToSupabase(supabase, product);
        if (saved) successCount++;
      }
      
      // 요청 간 딜레이 (봇 탐지 우회)
      if (i < productUrls.length - 1) {
        const delay = 3000 + Math.random() * 3000;
        console.log(`   ⏳ ${Math.round(delay / 1000)}초 대기...`);
        await new Promise(r => setTimeout(r, delay));
      }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log(`✅ 크롤링 완료!`);
    console.log(`   📊 총 ${productUrls.length}개 중 ${successCount}개 저장 성공`);
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('❌ 크롤링 중 오류 발생:', error);
  } finally {
    await browser.close();
    console.log('\n🔒 브라우저 종료');
  }
}

// 실행
main().catch(console.error);
