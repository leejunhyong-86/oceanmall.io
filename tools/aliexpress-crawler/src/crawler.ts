/**
 * @file src/crawler.ts
 * @description AliExpress 상품 크롤러
 *
 * AliExpress에서 상품 정보와 리뷰를 크롤링하여 Supabase에 저장합니다.
 *
 * 주요 기능:
 * 1. 직접 URL 크롤링
 * 2. 상품 정보 추출 (제목, 가격, 이미지)
 * 3. 리뷰 수집
 * 4. USD → KRW 환율 변환
 * 5. Supabase 자동 저장
 *
 * 사용법:
 * - CRAWL_MODE=direct-url PRODUCT_URLS="상품URL" pnpm crawl
 */

import 'dotenv/config';
import puppeteer, { Browser, Page } from 'puppeteer';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { AliExpressProduct, CrawlConfig, ProductInsert, Review } from './types.js';

// ============================================
// 환경 변수 설정
// ============================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 환경 변수가 설정되지 않았습니다.');
  console.error('   .env 파일에 다음 변수를 설정하세요:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL 또는 SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase: SupabaseClient = createClient(supabaseUrl, supabaseServiceKey);

// ============================================
// 크롤링 설정
// ============================================

type CrawlMode = 'direct-url' | 'search';

const CRAWL_MODE: CrawlMode = (process.env.CRAWL_MODE as CrawlMode) || 'direct-url';
const PRODUCT_URLS = process.env.PRODUCT_URLS || '';
const SEARCH_KEYWORD = process.env.SEARCH_KEYWORD || '';

const CONFIG: CrawlConfig = {
  headless: process.env.HEADLESS !== 'false',
  timeout: 90000,       // 90초 타임아웃 (AliExpress는 느림)
  delay: 5000,          // 요청 간 5초 대기 (봇 차단 방지)
  retryCount: 3,
  maxProducts: parseInt(process.env.MAX_PRODUCTS || '10'),
};

// 리뷰 크롤링 설정
const CRAWL_REVIEWS = process.env.CRAWL_REVIEWS !== 'false';
const MAX_REVIEWS = parseInt(process.env.MAX_REVIEWS || '20');

// 환율 (USD → KRW, 대략 1400원)
const USD_TO_KRW = 1400;

// ============================================
// 유틸리티 함수
// ============================================

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s가-힣-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 100);
}

// ============================================
// AliExpress 크롤러 클래스
// ============================================

class AliExpressCrawler {
  private browser: Browser | null = null;
  private page: Page | null = null;

  async init(): Promise<void> {
    console.log('🚀 AliExpress 크롤러 시작\n');
    console.log('✅ Supabase 연결 완료\n');

    console.log('🌐 브라우저 시작 중...');
    
    this.browser = await puppeteer.launch({
      headless: CONFIG.headless,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--disable-dev-shm-usage',
        '--lang=en-US,en',
      ],
      defaultViewport: {
        width: 1920,
        height: 1080,
      },
    });

    this.page = await this.browser.newPage();

    // User-Agent 설정 (봇 감지 회피)
    await this.page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    // 추가 헤더 설정
    await this.page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    });

    // WebDriver 속성 숨기기
    await this.page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => false,
      });
    });

    console.log('✅ 브라우저 준비 완료\n');
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      console.log('\n🔒 브라우저 종료');
    }
  }

  // ============================================
  // URL 파싱
  // ============================================

  getUrlsForMode(): string[] {
    if (CRAWL_MODE === 'direct-url') {
      if (!PRODUCT_URLS) {
        console.error('❌ PRODUCT_URLS 환경변수가 설정되지 않았습니다.');
        console.error('   예시: PRODUCT_URLS="https://www.aliexpress.com/item/1005001234567890.html"');
        return [];
      }

      const urls = PRODUCT_URLS.split(',')
        .map(url => url.trim())
        .filter(url => url.length > 0);

      console.log(`📦 AliExpress 직접 지정한 URL 크롤링 시작...`);
      console.log(`   📋 ${urls.length}개의 URL이 설정되었습니다`);
      urls.forEach((url, i) => console.log(`      [${i + 1}] ${url}`));

      return urls;
    }

    return [];
  }

  // ============================================
  // 상품 상세 페이지 크롤링
  // ============================================

  async crawlProduct(url: string): Promise<AliExpressProduct | null> {
    if (!this.page) throw new Error('브라우저가 초기화되지 않았습니다.');

    console.log(`\n🔍 크롤링: ${url}`);

    try {
      console.log(`   🌐 페이지 로딩 중...`);
      
      await this.page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: CONFIG.timeout,
      });

      // 페이지 로딩 대기
      await delay(3000);

      // 봇 차단 체크
      const pageContent = await this.page.content();
      if (pageContent.includes('captcha') || pageContent.includes('robot')) {
        console.log(`   ⚠️  봇 차단 페이지 감지됨`);
        console.log(`   💡 HEADLESS=false로 설정하여 수동 확인을 고려하세요`);
      }

      // 페이지 스크롤 (lazy loading 이미지 로드)
      console.log(`   📜 페이지 스크롤 중...`);
      await this.autoScroll();
      await delay(2000);

      // 페이지 구조 분석
      console.log(`   🔍 페이지 구조 분석:`);
      const structureInfo = await this.page.evaluate(() => {
        return {
          title: document.title,
          url: window.location.href,
          hasH1: !!document.querySelector('h1'),
          hasProductTitle: !!document.querySelector('[class*="title"], [class*="Title"], h1'),
          hasPrice: !!document.querySelector('[class*="price"], [class*="Price"]'),
          hasRating: !!document.querySelector('[class*="rating"], [class*="Rating"], [class*="star"]'),
          imageCount: document.querySelectorAll('img').length,
          metaOgImage: document.querySelector('meta[property="og:image"]')?.getAttribute('content'),
        };
      });

      console.log(`      - 페이지 제목: ${structureInfo.title}`);
      console.log(`      - H1 존재: ${structureInfo.hasH1}`);
      console.log(`      - 상품명 요소: ${structureInfo.hasProductTitle}`);
      console.log(`      - 가격 요소: ${structureInfo.hasPrice}`);
      console.log(`      - 평점 요소: ${structureInfo.hasRating}`);
      console.log(`      - 이미지 개수: ${structureInfo.imageCount}`);

      // 상품 데이터 추출
      const productData = await this.extractProductData(url);

      if (!productData) {
        console.log(`   ❌ 상품 데이터 추출 실패`);
        return null;
      }

      // 리뷰 수집
      if (CRAWL_REVIEWS) {
        console.log(`   🔍 리뷰 크롤링 시작 (최대 ${MAX_REVIEWS}개)...`);
        productData.reviews = await this.extractReviews(MAX_REVIEWS);
      }

      console.log(`   ✅ "${productData.title}"`);
      console.log(`      💰 $${productData.price} (₩${Math.round(productData.price * USD_TO_KRW).toLocaleString()})`);
      if (productData.rating) {
        console.log(`      ⭐ ${productData.rating}/5 (${productData.reviewCount.toLocaleString()}개 리뷰)`);
      }
      if (productData.orders) {
        console.log(`      📦 ${productData.orders.toLocaleString()}개 주문`);
      }
      if (productData.reviews && productData.reviews.length > 0) {
        console.log(`      💬 ${productData.reviews.length}개의 리뷰 수집됨`);
      }

      return productData;

    } catch (error) {
      console.error(`   ❌ 크롤링 실패:`, error);
      return null;
    }
  }

  // ============================================
  // 상품 데이터 추출
  // ============================================

  private async extractProductData(url: string): Promise<AliExpressProduct | null> {
    if (!this.page) return null;

    try {
      const data = await this.page.evaluate(() => {
        // 제목 추출 (여러 셀렉터 시도)
        let title = '';
        const ogTitle = document.querySelector('meta[property="og:title"]');
        if (ogTitle) {
          title = ogTitle.getAttribute('content') || '';
        }
        if (!title) {
          const h1 = document.querySelector('h1');
          if (h1) title = h1.textContent?.trim() || '';
        }
        if (!title) {
          title = document.title.split('-')[0]?.trim() || '';
        }

        // 가격 추출
        let price = 0;
        let originalPrice: number | null = null;
        
        const bodyText = document.body.textContent || '';
        
        // 한국 원화 가격 찾기
        const krwMatch = bodyText.match(/₩\s*([\d,]+)/);
        if (krwMatch) {
          const krwPrice = parseInt(krwMatch[1].replace(/,/g, ''));
          price = krwPrice / 1400; // KRW -> USD 변환
        }
        
        // USD 가격 찾기
        if (price === 0) {
          const usdMatch = bodyText.match(/\$\s*([\d,]+\.?\d*)/);
          if (usdMatch) {
            price = parseFloat(usdMatch[1].replace(/,/g, ''));
          }
        }

        // 썸네일 이미지
        let thumbnailUrl = '';
        const ogImage = document.querySelector('meta[property="og:image"]');
        if (ogImage) {
          thumbnailUrl = ogImage.getAttribute('content') || '';
        }
        if (!thumbnailUrl) {
          const firstImg = document.querySelector('img[src*="alicdn"]');
          if (firstImg) {
            thumbnailUrl = firstImg.getAttribute('src') || '';
          }
        }

        // 평점
        let rating: number | null = null;
        const ratingMatch = bodyText.match(/([0-5]\.?\d*)\s*별/);
        if (!ratingMatch) {
          const ratingMatch2 = bodyText.match(/([0-5]\.?\d*)\s*(stars?|평점)/i);
          if (ratingMatch2) {
            rating = parseFloat(ratingMatch2[1]);
          }
        } else {
          rating = parseFloat(ratingMatch[1]);
        }

        // 리뷰 수
        let reviewCount = 0;
        const reviewMatch = bodyText.match(/(\d+[\d,]*)\s*(개의\s*)?리뷰/i);
        if (reviewMatch) {
          reviewCount = parseInt(reviewMatch[1].replace(/,/g, ''));
        }

        // 주문 수
        let orders: number | null = null;
        const ordersMatch = bodyText.match(/(\d+[\d,]*)\s*(명|개)?\s*(구매|판매|주문)/i);
        if (ordersMatch) {
          orders = parseInt(ordersMatch[1].replace(/,/g, ''));
        }

        // 상품 ID 추출
        const urlMatch = window.location.href.match(/\/item\/(\d+)\.html/);
        const itemId = urlMatch ? urlMatch[1] : '';

        // 설명 추출
        let description = '';
        const ogDesc = document.querySelector('meta[property="og:description"]');
        if (ogDesc) {
          description = ogDesc.getAttribute('content') || '';
        }

        return {
          title,
          price,
          originalPrice,
          thumbnailUrl,
          rating,
          reviewCount,
          orders,
          itemId,
          description,
        };
      });

      if (!data.title) {
        console.log(`   ⚠️  제목을 찾을 수 없습니다.`);
        return null;
      }

      // 추가 이미지 및 상세 이미지 수집
      const images = await this.extractImages();
      
      const product: AliExpressProduct = {
        title: data.title,
        slug: slugify(data.title) + '-' + Date.now(),
        description: data.description,
        price: data.price,
        originalPrice: data.originalPrice,
        currency: 'USD',
        discount: data.originalPrice && data.price ? 
          Math.round(((data.originalPrice - data.price) / data.originalPrice) * 100) : null,
        thumbnailUrl: data.thumbnailUrl,
        images: images.productImages,
        detailImages: images.detailImages,
        rating: data.rating,
        reviewCount: data.reviewCount,
        orders: data.orders,
        sellerName: null,
        sellerRating: null,
        storeUrl: null,
        shippingFrom: null,
        estimatedDelivery: null,
        itemId: data.itemId,
        sourceUrl: url,
        crawledAt: new Date().toISOString(),
      };

      console.log(`      📷 ${images.productImages.length}개의 상품 이미지 수집`);
      console.log(`      🖼️  ${images.detailImages.length}개의 상세 이미지 수집`);

      return product;

    } catch (error) {
      console.error(`   ❌ 데이터 추출 실패:`, error);
      return null;
    }
  }

  // ============================================
  // 이미지 추출
  // ============================================

  private async extractImages(): Promise<{ productImages: string[], detailImages: string[] }> {
    if (!this.page) return { productImages: [], detailImages: [] };

    try {
      const imageData = await this.page.evaluate(() => {
        const productImages: string[] = [];
        const detailImages: string[] = [];
        const seenUrls = new Set<string>();

        // 상품 갤러리 이미지 수집
        const galleryImages = document.querySelectorAll('img[src*="alicdn"]');
        galleryImages.forEach((img: any) => {
          let src = img.getAttribute('src') || img.getAttribute('data-src');
          if (src && src.includes('alicdn.com')) {
            // 작은 크기 패턴 제외 (다양한 형식)
            // /48x48., -48-48., _48x48, 등
            if (src.match(/[\/_-]\d{1,3}[\-x]\d{1,3}[\._]/)) {
              return;
            }

            // tps (Taobao Picture Service) 작은 크기 제외
            if (src.match(/tps-\d{1,3}-\d{1,3}/)) {
              return; // tps-128-128, tps-134-32 등
            }

            // URL 정리 - 쿼리 파라미터 제거
            let cleanSrc = src.split('?')[0];
            
            // 이미 본 URL이면 skip
            if (seenUrls.has(cleanSrc)) return;
            seenUrls.add(cleanSrc);

            // 중복 체크
            if (productImages.length < 10) {
              productImages.push(cleanSrc);
            }
          }
        });

        // 상세 설명 영역의 이미지 수집
        const descriptionSelectors = [
          '.product-description img',
          '[class*="description"] img',
          '[class*="detail"] img',
          '[class*="Description"] img',
          '[class*="Detail"] img',
          '[id*="detail"] img',
          '[id*="description"] img'
        ];

        descriptionSelectors.forEach(selector => {
          const descImages = document.querySelectorAll(selector);
          descImages.forEach((img: any) => {
            let src = img.getAttribute('src') || img.getAttribute('data-src');
            if (src && src.includes('alicdn.com')) {
              // 작은 크기 패턴 제외
              if (src.match(/[\/_-]\d{1,3}[\-x]\d{1,3}[\._]/)) {
                return;
              }

              // tps 작은 크기 제외
              if (src.match(/tps-\d{1,3}-\d{1,3}/)) {
                return;
              }

              let cleanSrc = src.split('?')[0];
              
              if (!seenUrls.has(cleanSrc) && detailImages.length < 20) {
                seenUrls.add(cleanSrc);
                detailImages.push(cleanSrc);
              }
            }
          });
        });

        return { productImages, detailImages };
      });

      return imageData;

    } catch (error) {
      console.error(`   ⚠️  이미지 수집 실패:`, error);
      return { productImages: [], detailImages: [] };
    }
  }

  // ============================================
  // 리뷰 추출
  // ============================================

  private async extractReviews(maxReviews: number): Promise<Review[]> {
    if (!this.page) return [];

    const reviews: Review[] = [];

    try {
      // 리뷰 섹션으로 스크롤
      await this.page.evaluate(() => {
        const reviewSection = document.querySelector('[class*="review"], [class*="feedback"], [class*="comment"]');
        if (reviewSection) {
          reviewSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });

      await delay(2000);

      // 페이지에서 리뷰 추출 - 더 넓은 범위의 셀렉터 사용
      const reviewData = await this.page.evaluate((max) => {
        const results: any[] = [];
        
        // AliExpress 리뷰 셀렉터 (여러 버전 시도)
        const selectors = [
          '[class*="feedback-item"]',
          '[class*="review-item"]',
          '[class*="Review--item"]',
          '[class*="comment-item"]',
          '[class*="feedback-list"] > div',
          '[class*="review-list"] > div',
          '[data-spm*="review"]'
        ];

        let reviewElements: Element[] = [];
        for (const selector of selectors) {
          const elements = Array.from(document.querySelectorAll(selector));
          if (elements.length > reviewElements.length) {
            reviewElements = elements;
          }
        }

        console.log(`Found ${reviewElements.length} review elements`);

        for (let i = 0; i < Math.min(reviewElements.length, max); i++) {
          const element = reviewElements[i];
          
          // 리뷰 내용 - 더 많은 셀렉터 시도
          let content = '';
          const contentSelectors = [
            '[class*="feedback-content"]',
            '[class*="review-content"]',
            '[class*="comment-content"]',
            '[class*="buyer-feedback"]',
            '[class*="review-text"]',
            'p',
            'span'
          ];

          for (const sel of contentSelectors) {
            const contentEl = element.querySelector(sel);
            if (contentEl && contentEl.textContent && contentEl.textContent.trim().length > 10) {
              content = contentEl.textContent.trim();
              break;
            }
          }

          // 리뷰어 이름
          const nameSelectors = ['[class*="user-name"]', '[class*="reviewer-name"]', '[class*="buyer-name"]', '[class*="name"]'];
          let reviewerName: string | null = null;
          for (const sel of nameSelectors) {
            const nameEl = element.querySelector(sel);
            if (nameEl && nameEl.textContent) {
              reviewerName = nameEl.textContent.trim();
              break;
            }
          }

          // 국가
          const countryEl = element.querySelector('[class*="country"], [class*="location"], [class*="region"]');
          const country = countryEl?.textContent?.trim() || null;

          // 평점
          let rating: number | null = null;
          const ratingEl = element.querySelector('[class*="star"], [class*="rating"], [class*="rate"]');
          if (ratingEl) {
            const ratingText = ratingEl.textContent || ratingEl.getAttribute('aria-label') || ratingEl.className || '';
            const match = ratingText.match(/([0-5])/);
            if (match) rating = parseInt(match[1]);
          }

          // 날짜
          const dateEl = element.querySelector('[class*="time"], [class*="date"], time, [class*="post-time"]');
          const dateStr = dateEl?.textContent?.trim() || dateEl?.getAttribute('datetime') || null;

          if (content && content.length > 5) {
            results.push({
              content,
              reviewerName: reviewerName || 'Anonymous',
              country,
              rating,
              dateStr,
            });
          }
        }

        return results;
      }, maxReviews);

      for (const review of reviewData) {
        reviews.push({
          content: review.content,
          reviewerName: review.reviewerName,
          reviewerCountry: review.country,
          rating: review.rating,
          reviewDate: review.dateStr ? new Date(review.dateStr) : null,
          helpfulCount: 0,
          isVerifiedPurchase: true,
          sourceReviewId: null,
        });
      }

      if (reviews.length > 0) {
        console.log(`   ✅ ${reviews.length}개의 리뷰 수집 완료`);
      } else {
        console.log(`   ℹ️  리뷰를 찾을 수 없습니다 (페이지에 리뷰가 없거나 동적 로딩)`);
      }

    } catch (error) {
      console.error(`   ⚠️  리뷰 수집 실패:`, error);
    }

    return reviews;
  }

  // ============================================
  // 자동 스크롤
  // ============================================

  private async autoScroll(): Promise<void> {
    if (!this.page) return;

    await this.page.evaluate(async () => {
      await new Promise<void>((resolve) => {
        let totalHeight = 0;
        const distance = 300;
        const maxScrolls = 10;
        let scrollCount = 0;

        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;
          scrollCount++;

          if (scrollCount >= maxScrolls || totalHeight >= scrollHeight) {
            clearInterval(timer);
            resolve();
          }
        }, 300);
      });
    });
  }
}

// ============================================
// Supabase 저장 함수
// ============================================

async function saveToSupabase(product: AliExpressProduct): Promise<boolean> {
  const priceKrw = Math.round(product.price * USD_TO_KRW);

  // 상품 이미지와 상세 이미지를 합쳐서 detail_images에 저장
  const allImages = [...product.images, ...product.detailImages];

  const productData: ProductInsert = {
    title: product.title,
    slug: product.slug,
    description: product.description,
    thumbnail_url: product.thumbnailUrl,
    video_url: null,
    original_price: product.price,
    currency: product.currency,
    price_krw: priceKrw,
    source_platform: 'aliexpress',
    source_url: product.sourceUrl,
    external_rating: product.rating,
    external_review_count: product.reviewCount,
    tags: [
      product.orders ? `${product.orders} orders` : '',
      product.discount ? `${product.discount}% off` : '',
      product.shippingFrom || '',
    ].filter(Boolean),
    is_featured: (product.orders || 0) > 1000,
    is_active: true,
    detail_images: allImages,
  };

  const { data, error } = await supabase
    .from('products')
    .insert([productData])
    .select('id')
    .single();

  if (error) {
    console.error('   ❌ 상품 저장 실패:', error.message);
    return false;
  }

  console.log(`   ✅ 상품 저장 완료: ${data.id}`);

  // 리뷰 저장
  if (product.reviews && product.reviews.length > 0) {
    const reviewInserts = product.reviews.map(review => ({
      product_id: data.id,
      content: review.content,
      reviewer_name: review.reviewerName,
      reviewer_country: review.reviewerCountry,
      rating: review.rating,
      source_language: 'en',
      source_platform: 'aliexpress',
      source_review_id: review.sourceReviewId,
      review_date: review.reviewDate?.toISOString().split('T')[0] || null,
      helpful_count: review.helpfulCount,
      is_verified_purchase: review.isVerifiedPurchase,
    }));

    const { error: reviewsError } = await supabase
      .from('external_reviews')
      .insert(reviewInserts);

    if (reviewsError) {
      console.error('   ⚠️  리뷰 저장 실패:', reviewsError.message);
    } else {
      console.log(`   ✅ ${product.reviews.length}개의 리뷰 저장 완료`);
    }
  }

  console.log('');
  return true;
}

// ============================================
// 메인 실행
// ============================================

async function main() {
  console.log('═'.repeat(60));
  console.log('🛒 AliExpress 크롤러');
  console.log('═'.repeat(60));
  console.log();
  console.log('📋 설정:');
  console.log(`   - 크롤링 모드: ${CRAWL_MODE}`);
  console.log(`   - 최대 상품 수: ${CONFIG.maxProducts}`);
  console.log(`   - Headless 모드: ${CONFIG.headless}`);
  console.log(`   - 리뷰 수집: ${CRAWL_REVIEWS ? `최대 ${MAX_REVIEWS}개` : '비활성화'}`);
  console.log();

  const crawler = new AliExpressCrawler();
  await crawler.init();

  const urls = crawler.getUrlsForMode();

  if (urls.length === 0) {
    console.log('❌ 크롤링할 URL이 없습니다.');
    await crawler.close();
    return;
  }

  console.log(`   ✅ ${urls.length}개의 상품 URL 준비 완료\n`);

  let successCount = 0;

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    console.log(`\n[${i + 1}/${urls.length}] 크롤링 중: ${url}`);

    const product = await crawler.crawlProduct(url);

    if (product) {
      const saved = await saveToSupabase(product);
      if (saved) successCount++;
    }

    // 다음 상품 전 대기
    if (i < urls.length - 1) {
      await delay(CONFIG.delay);
    }
  }

  console.log('\n' + '═'.repeat(60));
  console.log('✅ 크롤링 완료!');
  console.log(`   📊 총 ${urls.length}개 중 ${successCount}개 저장 성공`);
  console.log('═'.repeat(60) + '\n');

  await crawler.close();
}

main().catch(error => {
  console.error('❌ 크롤러 실행 중 오류 발생:', error);
  process.exit(1);
});
