/**
 * @file crawler.ts
 * @description Amazon 상품 크롤러
 *
 * Amazon에서 다양한 모드로 상품을 크롤링하여 Supabase에 저장합니다.
 *
 * 주요 기능:
 * 1. 베스트셀러 크롤링
 * 2. 신상품 크롤링
 * 3. Movers & Shakers (인기 급상승) 크롤링
 * 4. 키워드 검색 크롤링
 * 5. 특정 카테고리 크롤링
 *
 * 크롤링 모드 (CRAWL_MODE 환경변수):
 * - bestsellers: 베스트셀러 (기본값)
 * - new-releases: 신상품
 * - movers-shakers: 인기 급상승 상품
 * - search: 키워드 검색 (SEARCH_KEYWORD 필요)
 *
 * 사용법:
 * - pnpm crawl (기본 베스트셀러 크롤링)
 * - CRAWL_MODE=new-releases pnpm crawl
 * - CRAWL_MODE=search SEARCH_KEYWORD="wireless earbuds" pnpm crawl
 *
 * @dependencies
 * - puppeteer: 헤드리스 브라우저 자동화
 * - @supabase/supabase-js: 데이터베이스 연동
 */

import 'dotenv/config';
import puppeteer, { Browser, Page } from 'puppeteer';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { AmazonProduct, CrawlConfig, ProductInsert, Review } from './types.js';

// 환경 변수
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// 크롤링 모드 타입
type CrawlMode = 'bestsellers' | 'new-releases' | 'movers-shakers' | 'search' | 'direct-url';

// 카테고리 타입
type AmazonCategory = 'electronics' | 'beauty' | 'home-garden' | 'fashion' | 'toys' | 'books' | 'all';

// 크롤링 설정
const config: CrawlConfig = {
  maxProducts: parseInt(process.env.MAX_PRODUCTS || '1'), // 테스트용 기본값 1
  headless: process.env.HEADLESS === 'true', // 기본값 false (브라우저 직접 띄움)
  bestSellersUrl: 'https://www.amazon.com/events/wintersale', // 시작점 변경
};

// 크롤링 모드 및 옵션
const CRAWL_MODE: CrawlMode = (process.env.CRAWL_MODE as CrawlMode) || 'bestsellers';
const SEARCH_KEYWORD = process.env.SEARCH_KEYWORD || '';
const CATEGORY: AmazonCategory = (process.env.CATEGORY as AmazonCategory) || 'all';

// 직접 URL 크롤링을 위한 환경변수
const PRODUCT_URLS = process.env.PRODUCT_URLS || ''; // 쉼표로 구분된 URL 목록

// 카테고리별 URL 매핑
const CATEGORY_URLS: Record<AmazonCategory, { bestsellers: string; newReleases: string; moversShakers: string }> = {
  electronics: {
    bestsellers: 'https://www.amazon.com/Best-Sellers-Electronics/zgbs/electronics/',
    newReleases: 'https://www.amazon.com/gp/new-releases/electronics/',
    moversShakers: 'https://www.amazon.com/gp/movers-and-shakers/electronics/',
  },
  beauty: {
    bestsellers: 'https://www.amazon.com/Best-Sellers-Beauty/zgbs/beauty/',
    newReleases: 'https://www.amazon.com/gp/new-releases/beauty/',
    moversShakers: 'https://www.amazon.com/gp/movers-and-shakers/beauty/',
  },
  'home-garden': {
    bestsellers: 'https://www.amazon.com/Best-Sellers-Home-Kitchen/zgbs/home-garden/',
    newReleases: 'https://www.amazon.com/gp/new-releases/home-garden/',
    moversShakers: 'https://www.amazon.com/gp/movers-and-shakers/home-garden/',
  },
  fashion: {
    bestsellers: 'https://www.amazon.com/Best-Sellers-Clothing-Shoes-Jewelry/zgbs/fashion/',
    newReleases: 'https://www.amazon.com/gp/new-releases/fashion/',
    moversShakers: 'https://www.amazon.com/gp/movers-and-shakers/fashion/',
  },
  toys: {
    bestsellers: 'https://www.amazon.com/Best-Sellers-Toys-Games/zgbs/toys-and-games/',
    newReleases: 'https://www.amazon.com/gp/new-releases/toys-and-games/',
    moversShakers: 'https://www.amazon.com/gp/movers-and-shakers/toys-and-games/',
  },
  books: {
    bestsellers: 'https://www.amazon.com/Best-Sellers-Books/zgbs/books/',
    newReleases: 'https://www.amazon.com/gp/new-releases/books/',
    moversShakers: 'https://www.amazon.com/gp/movers-and-shakers/books/',
  },
  all: {
    bestsellers: 'https://www.amazon.com/gp/bestsellers/',
    newReleases: 'https://www.amazon.com/gp/new-releases/',
    moversShakers: 'https://www.amazon.com/gp/movers-and-shakers/',
  },
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
function getUrlsForMode(mode: CrawlMode, category: AmazonCategory): string[] {
  switch (mode) {
    case 'bestsellers':
      // 시작점을 wintersale 이벤트 페이지로 변경
      return ['https://www.amazon.com/events/wintersale'];

    case 'new-releases':
      if (category === 'all') {
        return [
          CATEGORY_URLS.electronics.newReleases,
          CATEGORY_URLS.beauty.newReleases,
          CATEGORY_URLS['home-garden'].newReleases,
        ];
      }
      return [CATEGORY_URLS[category].newReleases];

    case 'movers-shakers':
      if (category === 'all') {
        return [
          CATEGORY_URLS.electronics.moversShakers,
          CATEGORY_URLS.beauty.moversShakers,
          CATEGORY_URLS['home-garden'].moversShakers,
        ];
      }
      return [CATEGORY_URLS[category].moversShakers];

    case 'search':
      if (!SEARCH_KEYWORD) {
        console.error('❌ SEARCH_KEYWORD 환경변수가 설정되지 않았습니다.');
        return [];
      }
      const encodedKeyword = encodeURIComponent(SEARCH_KEYWORD);
      return [
        `https://www.amazon.com/s?k=${encodedKeyword}`,
      ];

    case 'direct-url':
      if (!PRODUCT_URLS) {
        console.error('❌ PRODUCT_URLS 환경변수가 설정되지 않았습니다.');
        console.error('   예시: PRODUCT_URLS="https://www.amazon.com/dp/B0BZYCJK89,https://www.amazon.com/dp/B08N5WRWNW"');
        return [];
      }
      // 쉼표로 구분된 URL을 배열로 변환하고 공백 제거
      const urls = PRODUCT_URLS.split(',').map(url => url.trim()).filter(url => url.length > 0);
      
      // URL을 정규화 (쿼리 파라미터 제거, Amazon 도메인 확인)
      const normalizedUrls = urls.map(url => {
        try {
          // ASIN 추출
          const asinMatch = url.match(/\/dp\/([A-Z0-9]{10})/);
          if (asinMatch) {
            const asin = asinMatch[1];
            // 표준 Amazon 상품 URL로 변환
            return `https://www.amazon.com/dp/${asin}`;
          }
          // URL에 /dp/가 없으면 그대로 반환 (에러 처리는 나중에)
          return url.split('?')[0]; // 최소한 쿼리 파라미터는 제거
        } catch (e) {
          console.error(`   ⚠️ URL 파싱 실패: ${url}`);
          return url;
        }
      });
      
      console.log(`   📋 ${normalizedUrls.length}개의 URL이 설정되었습니다`);
      normalizedUrls.forEach((url, idx) => {
        console.log(`      [${idx + 1}] ${url}`);
      });
      
      return normalizedUrls;

    default:
      return [CATEGORY_URLS.all.bestsellers];
  }
}

/**
 * 페이지에서 상품 URL 추출 (wintersale 페이지 구조 분석 포함)
 */
async function extractProductUrls(page: Page): Promise<string[]> {
  // 먼저 페이지 구조를 분석
  const pageStructure = await page.evaluate(() => {
    const info: any = {
      url: window.location.href,
      title: document.title,
      // 다양한 상품 링크 셀렉터 시도
      selectors: {
        'a[href*="/dp/"]': document.querySelectorAll('a[href*="/dp/"]').length,
        'a.a-link-normal[href*="/dp/"]': document.querySelectorAll('a.a-link-normal[href*="/dp/"]').length,
        'a[data-asin]': document.querySelectorAll('a[data-asin]').length,
        '.s-result-item a[href*="/dp/"]': document.querySelectorAll('.s-result-item a[href*="/dp/"]').length,
        '[data-component-type="s-search-result"] a[href*="/dp/"]': document.querySelectorAll('[data-component-type="s-search-result"] a[href*="/dp/"]').length,
        '.s-card-container a[href*="/dp/"]': document.querySelectorAll('.s-card-container a[href*="/dp/"]').length,
        '[data-asin]': document.querySelectorAll('[data-asin]').length,
      },
      // 페이지에 있는 모든 링크 샘플
      linkSamples: Array.from(document.querySelectorAll('a[href*="/dp/"]')).slice(0, 5).map((el: any) => ({
        href: el.getAttribute('href'),
        text: el.textContent?.trim().substring(0, 50),
        classes: el.className,
      })),
      // 페이지 구조 확인
      hasSearchResults: document.querySelector('.s-result-list') !== null,
      hasProductGrid: document.querySelector('[data-component-type="s-search-result"]') !== null,
      hasCardContainer: document.querySelector('.s-card-container') !== null,
    };
    return info;
  });

  console.log(`   🔍 페이지 구조 분석:`);
  console.log(`      - 페이지 제목: ${pageStructure.title}`);
  console.log(`      - URL: ${pageStructure.url}`);
  console.log(`      - 검색 결과 리스트: ${pageStructure.hasSearchResults}`);
  console.log(`      - 상품 그리드: ${pageStructure.hasProductGrid}`);
  console.log(`      - 카드 컨테이너: ${pageStructure.hasCardContainer}`);
  console.log(`   📊 셀렉터별 링크 개수:`);
  Object.entries(pageStructure.selectors).forEach(([selector, count]) => {
    console.log(`      - ${selector}: ${count}개`);
  });
  if (pageStructure.linkSamples.length > 0) {
    console.log(`   🔗 링크 샘플 (처음 3개):`);
    pageStructure.linkSamples.slice(0, 3).forEach((sample: any, idx: number) => {
      console.log(`      [${idx + 1}] ${sample.href?.substring(0, 80)}...`);
    });
  }

  // 가장 많이 찾은 셀렉터 사용
  const bestSelector = Object.entries(pageStructure.selectors)
    .sort(([, a]: any, [, b]: any) => b - a)[0]?.[0] || 'a[href*="/dp/"]';

  console.log(`   ✅ 사용할 셀렉터: ${bestSelector}`);

  return await page.evaluate((selector) => {
    const links: string[] = [];
    const productElements = document.querySelectorAll(selector);

    productElements.forEach((el: any) => {
      const href = el.getAttribute('href');
      if (href && href.includes('/dp/')) {
        // ASIN 추출하여 깔끔한 URL 생성
        const asinMatch = href.match(/\/dp\/([A-Z0-9]{10})/);
        if (asinMatch) {
          const fullUrl = href.startsWith('http')
            ? href.split('?')[0] // 쿼리 파라미터 제거
            : `https://www.amazon.com${href.split('?')[0]}`;
          links.push(fullUrl);
        }
      }
    });

    // 중복 제거
    return [...new Set(links)];
  }, bestSelector);
}

/**
 * 상품 URL 수집 (모드별)
 */
async function getProductUrls(page: Page, maxProducts: number): Promise<string[]> {
  const modeLabel = {
    bestsellers: 'Winter Sale',
    'new-releases': '신상품',
    'movers-shakers': '인기 급상승',
    search: `검색: "${SEARCH_KEYWORD}"`,
    'direct-url': '직접 지정한 URL',
  }[CRAWL_MODE];

  console.log(`📦 Amazon ${modeLabel} 크롤링 시작...`);
  
  // 직접 URL 모드인 경우, 상품 페이지를 크롤링할 필요 없이 바로 URL 반환
  if (CRAWL_MODE === 'direct-url') {
    const urls = getUrlsForMode(CRAWL_MODE, CATEGORY);
    console.log(`   ✅ ${urls.length}개의 상품 URL 준비 완료`);
    return urls;
  }

  const categoryUrls = getUrlsForMode(CRAWL_MODE, CATEGORY);

  if (categoryUrls.length === 0) {
    return [];
  }

  const productUrls: string[] = [];

  for (const categoryUrl of categoryUrls) {
    if (productUrls.length >= maxProducts) break;

    try {
      console.log(`   🔗 접속 중: ${categoryUrl}`);

      await page.goto(categoryUrl, {
        waitUntil: 'networkidle0', // 페이지가 완전히 로드될 때까지 대기
        timeout: 60000
      });

      // 페이지가 완전히 로드될 때까지 대기 (브라우저가 보이므로 사용자가 확인 가능)
      console.log(`   ⏳ 페이지 로딩 대기 중... (브라우저에서 확인 가능)`);
      await new Promise(r => setTimeout(r, 5000)); // 5초 대기

      // 페이지 스크롤하여 lazy loading된 상품들 로드
      console.log(`   📜 페이지 스크롤 중...`);
      await page.evaluate(async () => {
        await new Promise<void>((resolve) => {
          let totalHeight = 0;
          const distance = 500;
          const timer = setInterval(() => {
            const scrollHeight = document.body.scrollHeight;
            window.scrollBy(0, distance);
            totalHeight += distance;

            if (totalHeight >= scrollHeight) {
              clearInterval(timer);
              setTimeout(() => resolve(), 2000); // 스크롤 완료 후 2초 대기
            }
          }, 200);
        });
      });

      const urls = await extractProductUrls(page);

      productUrls.push(...urls.slice(0, maxProducts - productUrls.length));
      const categoryName = categoryUrl.split('/').filter(Boolean).pop() || 'page';
      console.log(`   📋 ${categoryName}에서 ${urls.length}개 상품 발견`);
      console.log(`   ✅ 추출된 상품 URL (처음 3개):`);
      urls.slice(0, 3).forEach((url, idx) => {
        console.log(`      [${idx + 1}] ${url}`);
      });

    } catch (error) {
      console.error(`   ❌ 카테고리 크롤링 실패: ${categoryUrl}`);
      console.error(`   에러:`, error);
    }
  }

  return productUrls.slice(0, maxProducts);
}

/**
 * Amazon 리뷰 크롤링 함수 (개선된 버전)
 * 전략 1: 상품 페이지 자체에서 리뷰 추출 (이미 로드된 페이지 활용)
 * 전략 2: 실패 시 리뷰 페이지로 이동 시도
 */
async function extractAmazonReviews(
  page: Page, 
  asin: string, 
  maxReviews: number = 20
): Promise<Review[]> {
  try {
    console.log(`   📝 리뷰 수집 시작 (목표: ${maxReviews}개)...`);
    
    // 전략 1: 현재 상품 페이지에서 리뷰 추출 (가장 안전)
    console.log(`   🔍 상품 페이지 내 리뷰 추출 중...`);
    
    // 리뷰 섹션으로 스크롤
    try {
      await page.evaluate(() => {
        const reviewSection = document.querySelector('#reviewsMedley') || 
                             document.querySelector('#customer-reviews') ||
                             document.querySelector('[data-hook="reviews-medley-footer"]');
        if (reviewSection) {
          reviewSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
      await new Promise(r => setTimeout(r, 2000));
    } catch (e) {
      console.log(`   ℹ️  리뷰 섹션 스크롤 실패, 계속 진행...`);
    }
    
    // 상품 페이지에서 리뷰 추출
    let reviews = await page.evaluate((max) => {
      const reviewElements = document.querySelectorAll('[data-hook="review"]');
      const results: any[] = [];
      
      console.log(`Found ${reviewElements.length} review elements on product page`);
      
      for (let i = 0; i < Math.min(reviewElements.length, max); i++) {
        const el = reviewElements[i];
        
        // 리뷰 내용
        const contentEl = el.querySelector('[data-hook="review-body"] span') ||
                         el.querySelector('[data-hook="review-body"]') ||
                         el.querySelector('.review-text');
        const content = contentEl?.textContent?.trim() || '';
        
        // 리뷰어 정보
        const reviewerEl = el.querySelector('.a-profile-name') ||
                          el.querySelector('[data-hook="review-author"]');
        const reviewerName = reviewerEl?.textContent?.trim() || null;
        
        // 평점
        const ratingEl = el.querySelector('[data-hook="review-star-rating"]') ||
                        el.querySelector('.review-rating');
        const ratingText = ratingEl?.textContent?.trim() || '';
        const ratingMatch = ratingText.match(/(\d+\.?\d*)/);
        const rating = ratingMatch ? parseFloat(ratingMatch[1]) : null;
        
        // 날짜
        const dateEl = el.querySelector('[data-hook="review-date"]') ||
                      el.querySelector('.review-date');
        const dateText = dateEl?.textContent?.trim() || '';
        const dateMatch = dateText.match(/on (.+?)$/) || dateText.match(/(\w+ \d+, \d{4})/);
        const reviewDate = dateMatch ? dateMatch[1] : null;
        
        // 도움됨 수
        const helpfulEl = el.querySelector('[data-hook="helpful-vote-statement"]');
        const helpfulText = helpfulEl?.textContent?.trim() || '';
        const helpfulMatch = helpfulText.match(/(\d+)/);
        const helpfulCount = helpfulMatch ? parseInt(helpfulMatch[1]) : 0;
        
        // 검증된 구매
        const verifiedEl = el.querySelector('[data-hook="avp-badge"]');
        const isVerifiedPurchase = !!verifiedEl;
        
        // 리뷰 ID
        const reviewId = el.getAttribute('data-review-id') || null;
        
        if (content && content.length > 10) { // 최소 길이 확인
          results.push({
            content,
            reviewerName,
            reviewerCountry: null,
            rating,
            reviewDate,
            helpfulCount,
            isVerifiedPurchase,
            sourceReviewId: reviewId,
          });
        }
      }
      
      return results;
    }, maxReviews);
    
    console.log(`   ✅ 상품 페이지에서 ${reviews.length}개의 리뷰 수집`);
    
    // 전략 2: 충분하지 않으면 리뷰 페이지로 이동 시도
    if (reviews.length < maxReviews && reviews.length < 5) {
      console.log(`   🔄 더 많은 리뷰를 위해 리뷰 페이지로 이동 시도...`);
      
      try {
        // "See all reviews" 링크 찾기
        const reviewPageUrl = await page.evaluate(() => {
          const seeAllLink = document.querySelector('a[data-hook="see-all-reviews-link-foot"]') ||
                            document.querySelector('a[href*="/product-reviews/"]');
          return seeAllLink ? seeAllLink.getAttribute('href') : null;
        });
        
        if (reviewPageUrl) {
          const fullUrl = reviewPageUrl.startsWith('http') 
            ? reviewPageUrl 
            : `https://www.amazon.com${reviewPageUrl}`;
          
          console.log(`   🌐 리뷰 페이지 접속: ${fullUrl}`);
          
          // 봇처럼 보이지 않도록 랜덤 대기
          await new Promise(r => setTimeout(r, 3000 + Math.random() * 3000));
          
          // 리뷰 페이지로 이동
          await page.goto(fullUrl, { 
            waitUntil: 'domcontentloaded', 
            timeout: 30000 
          });
          
          // 페이지 로드 후 대기
          await new Promise(r => setTimeout(r, 3000 + Math.random() * 2000));
          
          // CAPTCHA 확인
          const hasCaptcha = await page.evaluate(() => {
            return document.body.textContent?.includes('Enter the characters you see below') ||
                   document.querySelector('form[action*="captcha"]') !== null;
          });
          
          if (hasCaptcha) {
            console.log(`   ⚠️  CAPTCHA 감지됨 - 상품 페이지 리뷰만 사용합니다`);
            // 상품 페이지에서 수집한 리뷰 반환
          } else {
            // 리뷰 페이지에서 추가 리뷰 추출
            const additionalReviews = await page.evaluate((max, existing) => {
              const reviewElements = document.querySelectorAll('[data-hook="review"]');
              const results: any[] = [];
              
              for (let i = 0; i < Math.min(reviewElements.length, max); i++) {
                const el = reviewElements[i];
                
                const contentEl = el.querySelector('[data-hook="review-body"] span');
                const content = contentEl?.textContent?.trim() || '';
                
                const reviewerEl = el.querySelector('.a-profile-name');
                const reviewerName = reviewerEl?.textContent?.trim() || null;
                
                const ratingEl = el.querySelector('[data-hook="review-star-rating"]');
                const ratingText = ratingEl?.textContent?.trim() || '';
                const ratingMatch = ratingText.match(/(\d+\.?\d*)/);
                const rating = ratingMatch ? parseFloat(ratingMatch[1]) : null;
                
                const dateEl = el.querySelector('[data-hook="review-date"]');
                const dateText = dateEl?.textContent?.trim() || '';
                const dateMatch = dateText.match(/on (.+?)$/);
                const reviewDate = dateMatch ? dateMatch[1] : null;
                
                const helpfulEl = el.querySelector('[data-hook="helpful-vote-statement"]');
                const helpfulText = helpfulEl?.textContent?.trim() || '';
                const helpfulMatch = helpfulText.match(/(\d+)/);
                const helpfulCount = helpfulMatch ? parseInt(helpfulMatch[1]) : 0;
                
                const verifiedEl = el.querySelector('[data-hook="avp-badge"]');
                const isVerifiedPurchase = !!verifiedEl;
                
                const reviewId = el.getAttribute('data-review-id') || null;
                
                // 중복 체크
                const isDuplicate = existing.some((r: any) => 
                  r.sourceReviewId && reviewId && r.sourceReviewId === reviewId
                );
                
                if (content && content.length > 10 && !isDuplicate) {
                  results.push({
                    content,
                    reviewerName,
                    reviewerCountry: null,
                    rating,
                    reviewDate,
                    helpfulCount,
                    isVerifiedPurchase,
                    sourceReviewId: reviewId,
                  });
                }
              }
              
              return results;
            }, maxReviews, reviews);
            
            console.log(`   ✅ 리뷰 페이지에서 ${additionalReviews.length}개의 추가 리뷰 수집`);
            reviews = [...reviews, ...additionalReviews].slice(0, maxReviews);
          }
        }
      } catch (error) {
        console.log(`   ⚠️  리뷰 페이지 접근 실패, 상품 페이지 리뷰만 사용합니다`);
      }
    }
    
    // Date 객체로 변환
    const processedReviews: Review[] = reviews.map(r => ({
      ...r,
      reviewDate: r.reviewDate ? new Date(r.reviewDate) : null,
    }));
    
    console.log(`   ✅ 총 ${processedReviews.length}개의 리뷰 수집 완료`);
    
    return processedReviews;
    
  } catch (error) {
    console.error(`   ❌ 리뷰 크롤링 실패:`, error);
    return [];
  }
}

/**
 * 개별 상품 상세 정보 추출
 */
async function extractProductDetails(page: Page, url: string): Promise<AmazonProduct | null> {
  try {
    console.log(`   🌐 페이지 로딩 중...`);
    await page.goto(url, {
      waitUntil: 'domcontentloaded', // networkidle0은 너무 오래 걸릴 수 있음
      timeout: 30000
    });

    // 랜덤 대기 (봇 탐지 우회)
    await new Promise(r => setTimeout(r, 3000 + Math.random() * 2000));

    // 페이지가 봇 차단 페이지인지 확인
    const isBlocked = await page.evaluate(() => {
      const bodyText = document.body.textContent || '';
      return bodyText.includes('captcha') ||
             bodyText.includes('robot') ||
             bodyText.includes('unusual traffic') ||
             document.querySelector('form[action*="captcha"]') !== null;
    });

    if (isBlocked) {
      console.log(`   ⚠️  봇 차단 페이지 감지됨 - CAPTCHA 또는 차단 페이지일 수 있습니다`);
      console.log(`   💡 해결 방법: HEADLESS=false로 설정하여 브라우저를 직접 확인하세요`);
    }

    // 페이지를 스크롤하여 lazy loading된 이미지들을 로드
    console.log(`   📜 페이지 스크롤 중...`);
    await page.evaluate(async () => {
      await new Promise<void>((resolve) => {
        let totalHeight = 0;
        const distance = 500;
        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;

          if (totalHeight >= scrollHeight) {
            clearInterval(timer);
            setTimeout(() => resolve(), 1000);
          }
        }, 100);
      });
    });

    // 스크롤 후 추가 대기
    await new Promise(r => setTimeout(r, 2000));

    // 디버깅: 페이지 구조 및 요소 확인
    const pageInfo = await page.evaluate(() => {
      const info: any = {
        pageTitle: document.title,
        url: window.location.href,
        hasContentGrid: document.querySelector('.content-grid-wrapper') !== null,
        hasContentGridRow: document.querySelector('.content-grid-row-wrapper') !== null,
        hasContentGridBlock: document.querySelector('.content-grid-block') !== null,
        hasAppleRiver: document.querySelector('[id*="apple-river-image-container"]') !== null,
        allImageContainers: Array.from(document.querySelectorAll('[id*="image-container"]')).map(el => el.id),
        allContentGrids: Array.from(document.querySelectorAll('[class*="content-grid"]')).map(el => el.className),

        // 제목 찾기 시도
        titleSelectors: {
          productTitle: document.querySelector('#productTitle')?.textContent?.trim() || null,
          productTitleSpan: document.querySelector('span#productTitle')?.textContent?.trim() || null,
          h1Title: document.querySelector('h1.a-size-large')?.textContent?.trim() || null,
          h1Any: document.querySelector('h1')?.textContent?.trim() || null,
          titleMeta: document.querySelector('meta[property="og:title"]')?.getAttribute('content') || null,
        },

        // 이미지 요소 확인
        imageCount: document.querySelectorAll('img').length,
        amazonImageCount: document.querySelectorAll('img[src*="media-amazon.com"], img[src*="images"]').length,

        // 주요 요소 존재 여부
        hasProductTitle: document.querySelector('#productTitle') !== null,
        hasPrice: document.querySelector('.a-price') !== null,
        hasRating: document.querySelector('#acrPopover') !== null,
      };
      return info;
    });

    console.log(`   🔍 페이지 구조 분석:`);
    console.log(`      - 페이지 제목: ${pageInfo.pageTitle.substring(0, 60)}...`);
    console.log(`      - URL: ${pageInfo.url}`);
    console.log(`      - content-grid-wrapper: ${pageInfo.hasContentGrid}`);
    console.log(`      - content-grid-row-wrapper: ${pageInfo.hasContentGridRow}`);
    console.log(`      - content-grid-block: ${pageInfo.hasContentGridBlock}`);
    console.log(`      - apple-river-image-container: ${pageInfo.hasAppleRiver}`);
    console.log(`      - 이미지 컨테이너 개수: ${pageInfo.allImageContainers.length}`);
    console.log(`      - 전체 이미지 개수: ${pageInfo.imageCount}`);
    console.log(`      - Amazon 이미지 개수: ${pageInfo.amazonImageCount}`);
    console.log(`      - #productTitle 존재: ${pageInfo.hasProductTitle}`);
    console.log(`      - 가격 요소 존재: ${pageInfo.hasPrice}`);
    console.log(`      - 평점 요소 존재: ${pageInfo.hasRating}`);

    // 제목 찾기 시도 결과 출력
    console.log(`   📝 제목 찾기 시도 결과:`);
    Object.entries(pageInfo.titleSelectors).forEach(([key, value]) => {
      if (value) {
        console.log(`      ✅ ${key}: ${String(value).substring(0, 60)}...`);
      } else {
        console.log(`      ❌ ${key}: 없음`);
      }
    });

    if (pageInfo.allImageContainers.length > 0) {
      console.log(`      - 컨테이너 ID 예시: ${pageInfo.allImageContainers.slice(0, 3).join(', ')}`);
    }

    const productData = await page.evaluate(() => {
      // ASIN 추출
      var asinMatch = window.location.pathname.match(/\/dp\/([A-Z0-9]{10})/);
      var asin = asinMatch ? asinMatch[1] : '';

      // 제목 추출 (여러 셀렉터 시도)
      var title = '';
      var titleSelectors = [
        '#productTitle',
        'span#productTitle',
        'h1.a-size-large',
        'h1#title',
        'h1',
        'meta[property="og:title"]',
        '[data-feature-name="title"]',
        '.product-title',
      ];

      for (var i = 0; i < titleSelectors.length; i++) {
        var el = document.querySelector(titleSelectors[i]);
        if (el) {
          if (el.tagName === 'META') {
            title = el.getAttribute('content') || '';
          } else {
            title = el.textContent?.trim() || '';
          }
          if (title && title.length > 0) {
            break;
          }
        }
      }

      // 가격 추출 (개선된 버전 - 더 많은 셀렉터와 방법 시도)
      // Amazon의 가격 구조: .a-price .a-offscreen에 실제 가격이 있음
      // 예: "$69.00" 또는 "$33.92"
      var price = null;
      var originalPrice = null;
      
      // 현재 가격 추출 (정확한 버전 - 우선순위 기반)
      // Amazon의 가격 구조를 정확히 파악하여 추출
      var priceSelectors = [
        { selector: '.a-price .a-offscreen', priority: 1 },  // 가장 정확한 셀렉터 (최우선)
        { selector: '.priceToPay .a-offscreen', priority: 2 },  // 결제 가격
        { selector: '#priceblock_ourprice', priority: 3 },
        { selector: '#priceblock_dealprice', priority: 3 },
        { selector: '#priceblock_saleprice', priority: 3 },
        { selector: '[data-a-color="price"] .a-offscreen', priority: 4 },
      ];
      
      // 우선순위가 높은 셀렉터부터 시도
      priceSelectors.sort(function(a, b) { return a.priority - b.priority; });
      
      for (var i = 0; i < priceSelectors.length; i++) {
        var priceEl = document.querySelector(priceSelectors[i].selector);
        if (priceEl) {
          var priceText = priceEl.textContent?.trim() || priceEl.getAttribute('textContent') || '';
          
          // 가격 텍스트에서 숫자와 소수점 추출 (예: "$32.90" -> 32.90)
          // 정규식: $ 기호와 쉼표 제거, 소수점 포함
          var priceMatch = priceText.match(/\$?\s*([\d,]+\.?\d{2})/);  // 소수점 2자리 강제
          if (!priceMatch) {
            priceMatch = priceText.match(/\$?\s*([\d,]+\.?\d*)/);  // 소수점 1자리 또는 없음
          }
          
          if (priceMatch) {
            var priceStr = priceMatch[1].replace(/,/g, '');
            var parsedPrice = parseFloat(priceStr);
            // 가격이 합리적인 범위 내에 있는지 확인 (예: $0.01 ~ $1,000)
            // Amazon 대부분의 상품은 $1,000 이하
            if (parsedPrice > 0 && parsedPrice <= 1000) {
              price = parsedPrice;
              break;  // 첫 번째 유효한 가격을 찾으면 중단
            }
          }
        }
      }
      
      // 위 방법으로 가격을 찾지 못한 경우: .a-price-whole과 .a-price-fraction 조합 시도
      if (!price) {
        var priceContainer = document.querySelector('.a-price');
        if (priceContainer) {
          var priceWholeEl = priceContainer.querySelector('.a-price-whole');
          var priceFractionEl = priceContainer.querySelector('.a-price-fraction');
          if (priceWholeEl && priceFractionEl) {
            var wholeText = priceWholeEl.textContent?.trim() || '';
            var fractionText = priceFractionEl.textContent?.trim() || '';
            var wholeMatch = wholeText.match(/([\d,]+)/);
            var fractionMatch = fractionText.match(/(\d{1,2})/);  // 소수점은 최대 2자리
            if (wholeMatch && fractionMatch) {
              var whole = parseFloat(wholeMatch[1].replace(/,/g, ''));
              var fraction = parseFloat(fractionMatch[1]);
              // 소수점이 1자리인 경우 (예: 32.9)와 2자리인 경우 (예: 32.90) 처리
              var combinedPrice = whole + (fraction / Math.pow(10, fractionMatch[1].length));
              if (combinedPrice > 0 && combinedPrice <= 1000) {
                price = combinedPrice;
              }
            }
          }
        }
      }
      
      // 원래 가격 추출 (할인 전 가격)
      var originalPriceSelectors = [
        '.a-text-price .a-offscreen',
        '.a-price[data-a-strike] .a-offscreen',
        '.a-price.a-text-price .a-offscreen',
      ];
      
      for (var j = 0; j < originalPriceSelectors.length; j++) {
        var originalPriceEl = document.querySelector(originalPriceSelectors[j]);
        if (originalPriceEl) {
          var originalPriceText = originalPriceEl.textContent?.trim() || originalPriceEl.getAttribute('textContent') || '';
          var originalPriceMatch = originalPriceText.match(/\$?\s*([\d,]+\.?\d*)/);
          if (originalPriceMatch) {
            var originalPriceStr = originalPriceMatch[1].replace(/,/g, '');
            var parsedOriginalPrice = parseFloat(originalPriceStr);
            if (parsedOriginalPrice > 0 && parsedOriginalPrice <= 10000) {
              originalPrice = parsedOriginalPrice;
              break;
            }
          }
        }
      }

      // 평점 추출
      var ratingEl = document.querySelector('#acrPopover') ||
                     document.querySelector('.a-icon-star-small');
      var ratingText = ratingEl ? ratingEl.getAttribute('title') || ratingEl.textContent || '' : '';
      var ratingMatch = ratingText.match(/([\d.]+)\s*out\s*of\s*5/i) || ratingText.match(/([\d.]+)/);
      var rating = ratingMatch ? parseFloat(ratingMatch[1]) : 0;

      // 리뷰 수 추출
      var reviewEl = document.querySelector('#acrCustomerReviewText');
      var reviewText = reviewEl ? reviewEl.textContent?.trim() || '' : '';
      var reviewMatch = reviewText.match(/([\d,]+)/);
      var reviewCount = reviewMatch ? parseInt(reviewMatch[1].replace(/,/g, '')) : 0;

      // 메인 이미지 URL 추출
      var mainImageEl = document.querySelector('#landingImage') ||
                        document.querySelector('#imgBlkFront') ||
                        document.querySelector('.a-dynamic-image');
      var thumbnailUrl = '';
      if (mainImageEl) {
        thumbnailUrl = mainImageEl.getAttribute('data-old-hires') ||
                       mainImageEl.getAttribute('src') || '';
      }

      // 추가 이미지 URL들 (이미지 갤러리)
      var imageUrls: string[] = [];
      var imageElements = document.querySelectorAll('#altImages img');
      imageElements.forEach(function(img) {
        var src = img.getAttribute('src');
        if (src && src.includes('images')) {
          // 고해상도 이미지 URL로 변환
          var highResSrc = src.replace(/\._[A-Z0-9_]+_\./, '.');
          imageUrls.push(highResSrc);
        }
      });

      // 상품 상세 페이지의 detail images 추출 (content-grid-wrapper 내 이미지들)
      var detailImages: string[] = [];

      // 여러 셀렉터 시도 (더 포괄적으로)
      var selectors = [
        '.content-grid-wrapper .content-grid-block img',
        '.content-grid-wrapper img',
        '.content-grid-row-wrapper .content-grid-block img',
        '.content-grid-row-wrapper img',
        '#content-grid-wrapper img',
        '[id*="apple-river-image-container"] img',
        '[id*="image-container"] img',
        '[class*="content-grid"] img',
        '#productDescription_feature_div img',
        '#feature-bullets img',
        '.a-section img[src*="media-amazon.com"]',
        'img[src*="G/01/apple"]',
        'img[src*="Product_Page"]'
      ];

      var allDetailImages = new Set<string>();

      for (var i = 0; i < selectors.length; i++) {
        var elements = document.querySelectorAll(selectors[i]);
        elements.forEach(function(img) {
          // src, data-a-hires, data-src 등 다양한 속성 확인
          var src = img.getAttribute('src') ||
                   img.getAttribute('data-a-hires') ||
                   img.getAttribute('data-src') ||
                   img.getAttribute('data-lazy-src') ||
                   '';

          // 이미지 요소의 실제 크기 확인
          var imgWidth = img.naturalWidth || img.width || 0;
          var imgHeight = img.naturalHeight || img.height || 0;
          var computedStyle = window.getComputedStyle(img);
          var displayWidth = parseInt(computedStyle.width) || 0;
          var displayHeight = parseInt(computedStyle.height) || 0;

          // 유효한 이미지 URL인지 확인
          if (src &&
              (src.includes('media-amazon.com') || src.includes('images')) &&
              !src.includes('pixel') &&
              !src.includes('data:image') &&
              !src.includes('placeholder') &&
              src.startsWith('http')) {
            
            // 제품 정보와 무관한 이미지 필터링 (URL 패턴 기반)
            var urlLower = src.toLowerCase();
            var excludePatterns = [
              'icon', 'logo', 'badge', 'button', 'play', 'info', 'arrow',
              'star', 'rating', 'prime', 'sponsor', 'ad', 'banner',
              'thumbnail', 'thumb', 'small', 'tiny', 'mini',
              'avatar', 'profile', 'user', 'account',
              'checkmark', 'check', 'x-mark', 'close', 'cancel',
              'loading', 'spinner', 'loader', 'skeleton',
              'placeholder', 'empty', 'default', 'no-image'
            ];
            
            var shouldExclude = excludePatterns.some(function(pattern) {
              return urlLower.includes(pattern);
            });

            // 이미지 크기 필터링 (너무 작은 이미지 제외)
            // 최소 크기: 200x200 픽셀 또는 표시 크기 150x150 픽셀
            var isTooSmall = (imgWidth > 0 && imgWidth < 200) || 
                            (imgHeight > 0 && imgHeight < 200) ||
                            (displayWidth > 0 && displayWidth < 150) ||
                            (displayHeight > 0 && displayHeight < 150);

            // 이미지 비율 필터링 (너무 극단적인 비율 제외 - 정사각형 또는 가로형만 허용)
            var aspectRatio = imgWidth > 0 && imgHeight > 0 ? imgWidth / imgHeight : 1;
            var isExtremeRatio = aspectRatio > 3 || aspectRatio < 0.33; // 3:1 또는 1:3 이상 제외

            // Amazon URL에서 해상도 정보 추출 (예: ._AC_SL1500_. → 1500px)
            var resolutionMatch = src.match(/\._AC_SL(\d+)_\./);
            var resolution = resolutionMatch ? parseInt(resolutionMatch[1]) : null;
            var isLowResolution = resolution !== null && resolution < 500; // 500px 미만 제외

            // 필터링 통과 조건
            if (!shouldExclude && 
                !isTooSmall && 
                !isExtremeRatio && 
                !isLowResolution) {
              // 고해상도 이미지 URL 우선 사용
              var highResSrc = img.getAttribute('data-a-hires') || src;
              // 썸네일 URL을 고해상도로 변환 시도 (Amazon URL 패턴)
              highResSrc = highResSrc.replace(/\._[A-Z0-9_]+_\./, '.');
              // URL 정규화 (중복 제거)
              if (highResSrc && !allDetailImages.has(highResSrc)) {
                allDetailImages.add(highResSrc);
              }
            }
          }
        });
      }

      // Set을 배열로 변환
      detailImages = Array.from(allDetailImages);

      // 만약 위의 셀렉터로 찾지 못했다면, 페이지의 모든 Amazon 이미지 URL을 찾기
      if (detailImages.length === 0) {
        var allAmazonImgs = document.querySelectorAll('img[src*="media-amazon.com"], img[src*="images"], img[data-a-hires*="media-amazon.com"]');
        allAmazonImgs.forEach(function(img) {
          var src = img.getAttribute('src') || img.getAttribute('data-a-hires') || '';
          
          // 이미지 요소의 실제 크기 확인
          var imgWidth = img.naturalWidth || img.width || 0;
          var imgHeight = img.naturalHeight || img.height || 0;
          var computedStyle = window.getComputedStyle(img);
          var displayWidth = parseInt(computedStyle.width) || 0;
          var displayHeight = parseInt(computedStyle.height) || 0;

          // 제품 정보와 무관한 이미지 필터링 (URL 패턴 기반)
          var urlLower = src.toLowerCase();
          var excludePatterns = [
            'icon', 'logo', 'badge', 'button', 'play', 'info', 'arrow',
            'star', 'rating', 'prime', 'sponsor', 'ad', 'banner',
            'thumbnail', 'thumb', 'small', 'tiny', 'mini',
            'avatar', 'profile', 'user', 'account',
            'checkmark', 'check', 'x-mark', 'close', 'cancel',
            'loading', 'spinner', 'loader', 'skeleton',
            'placeholder', 'empty', 'default', 'no-image'
          ];
          
          var shouldExclude = excludePatterns.some(function(pattern) {
            return urlLower.includes(pattern);
          });

          // 이미지 크기 필터링
          var isTooSmall = (imgWidth > 0 && imgWidth < 200) || 
                          (imgHeight > 0 && imgHeight < 200) ||
                          (displayWidth > 0 && displayWidth < 150) ||
                          (displayHeight > 0 && displayHeight < 150);

          // 이미지 비율 필터링
          var aspectRatio = imgWidth > 0 && imgHeight > 0 ? imgWidth / imgHeight : 1;
          var isExtremeRatio = aspectRatio > 3 || aspectRatio < 0.33;

          // Amazon URL에서 해상도 정보 추출
          var resolutionMatch = src.match(/\._AC_SL(\d+)_\./);
          var resolution = resolutionMatch ? parseInt(resolutionMatch[1]) : null;
          var isLowResolution = resolution !== null && resolution < 500;

          // 상품 상세 이미지로 보이는 것만 필터링
          if (src &&
              src.startsWith('http') &&
              !src.includes('pixel') &&
              !src.includes('data:image') &&
              !src.includes('placeholder') &&
              (src.includes('Product_Page') || src.includes('G/01/') || src.match(/\/[A-Z0-9]{10}\./)) &&
              !shouldExclude &&
              !isTooSmall &&
              !isExtremeRatio &&
              !isLowResolution) {
            var highResSrc = img.getAttribute('data-a-hires') || src;
            highResSrc = highResSrc.replace(/\._[A-Z0-9_]+_\./, '.');
            if (!allDetailImages.has(highResSrc)) {
              allDetailImages.add(highResSrc);
            }
          }
        });
        detailImages = Array.from(allDetailImages);
      }

      // 영상 URL 추출 (있는 경우)
      var videoUrl: string | null = null;
      var videoEl = document.querySelector('video source') || document.querySelector('video');
      if (videoEl) {
        videoUrl = videoEl.getAttribute('src') || null;
      }

      // 브랜드 추출
      var brandEl = document.querySelector('#bylineInfo') || document.querySelector('.po-brand .po-break-word');
      var brand = brandEl ? brandEl.textContent?.replace('Visit the', '').replace('Store', '').trim() || null : null;

      // 카테고리 추출 (개선된 버전 - 여러 셀렉터 시도)
      var category = '';
      var categorySelectors = [
        '#wayfinding-breadcrumbs_feature_div a',  // 기본 셀렉터
        '.a-breadcrumb a',  // 대체 셀렉터
        '[data-testid="breadcrumb"] a',  // 테스트 ID 기반
        'nav[aria-label="Breadcrumb"] a',  // ARIA 레이블 기반
      ];
      
      for (var catIdx = 0; catIdx < categorySelectors.length; catIdx++) {
        var categoryEls = document.querySelectorAll(categorySelectors[catIdx]);
        // 브레드크럼에서 마지막에서 두 번째 항목이 일반적으로 카테고리 (마지막은 상품명)
        if (categoryEls.length >= 2) {
          var categoryEl = categoryEls[categoryEls.length - 2];
          category = categoryEl ? categoryEl.textContent?.trim() || '' : '';
          if (category && category.length > 0) {
            break;
          }
        }
      }
      
      // 카테고리를 찾지 못한 경우, 모든 브레드크럼 링크를 확인
      if (!category || category.length === 0) {
        var allBreadcrumbs = document.querySelectorAll('#wayfinding-breadcrumbs_feature_div a, .a-breadcrumb a');
        if (allBreadcrumbs.length >= 2) {
          // "Home"이나 "All" 같은 항목을 제외하고 실제 카테고리 찾기
          for (var bcIdx = 1; bcIdx < allBreadcrumbs.length - 1; bcIdx++) {
            var bcText = allBreadcrumbs[bcIdx].textContent?.trim() || '';
            if (bcText && 
                !bcText.toLowerCase().includes('home') && 
                !bcText.toLowerCase().includes('all') &&
                !bcText.toLowerCase().includes('departments')) {
              category = bcText;
              break;
            }
          }
        }
      }

      // Prime 여부
      var isPrime = !!document.querySelector('.a-icon-prime, #primeExclusiveBadge');

      // 재고 상태
      var availabilityEl = document.querySelector('#availability span');
      var availability = availabilityEl ? availabilityEl.textContent?.trim() || 'Unknown' : 'Unknown';

      // 상품 설명
      var descriptionEl = document.querySelector('#productDescription p') ||
                          document.querySelector('#feature-bullets');
      var description = descriptionEl ? descriptionEl.textContent?.trim().substring(0, 500) || '' : '';

      // 디버깅 정보 수집
      var debugInfo: any = {};
      if (detailImages.length === 0) {
        // 모든 img 태그 확인
        var allImgs = document.querySelectorAll('img');
        var amazonImgs: string[] = [];
        allImgs.forEach(function(img) {
          var src = img.getAttribute('src') || img.getAttribute('data-a-hires') || '';
          if (src && (src.includes('media-amazon.com') || src.includes('images')) && src.startsWith('http')) {
            amazonImgs.push(src.substring(0, 150));
          }
        });
        debugInfo.amazonImageCount = amazonImgs.length;
        debugInfo.amazonImageExamples = amazonImgs.slice(0, 5);
      }

      return {
        asin: asin,
        title: title,
        price: price,
        originalPrice: originalPrice,
        rating: rating,
        reviewCount: reviewCount,
        thumbnailUrl: thumbnailUrl,
        imageUrls: imageUrls.slice(0, 5),
        detailImages: detailImages,
        videoUrl: videoUrl,
        brand: brand,
        category: category,
        isPrime: isPrime,
        availability: availability,
        description: description,
        debugInfo: debugInfo,
      };
    });

    // 디버깅 정보 출력
    console.log(`   📊 추출된 데이터:`);
    console.log(`      - 제목: ${productData.title || '없음'}`);
    console.log(`      - ASIN: ${productData.asin || '없음'}`);
    console.log(`      - 가격: ${productData.price || '없음'}`);
    console.log(`      - 평점: ${productData.rating || '없음'}`);
    console.log(`      - 리뷰 수: ${productData.reviewCount || '없음'}`);
    console.log(`      - 썸네일 URL: ${productData.thumbnailUrl ? '있음' : '없음'}`);
    console.log(`      - 추가 이미지: ${productData.imageUrls.length}개`);
    console.log(`      - 상세 이미지: ${productData.detailImages.length}개`);

    if (productData.debugInfo && productData.debugInfo.amazonImageCount > 0) {
      console.log(`   🔍 Amazon 이미지 발견: ${productData.debugInfo.amazonImageCount}개`);
      if (productData.detailImages.length === 0 && productData.debugInfo.amazonImageExamples.length > 0) {
        console.log(`   💡 이미지 예시: ${productData.debugInfo.amazonImageExamples[0]}`);
      }
    }

    if (!productData.title || !productData.asin) {
      console.log(`   ⚠️  상품 데이터 추출 실패:`);
      console.log(`      - 제목: ${productData.title || '없음'}`);
      console.log(`      - ASIN: ${productData.asin || '없음'}`);
      console.log(`   💡 해결 방법:`);
      console.log(`      1. HEADLESS=false로 설정하여 브라우저를 직접 확인`);
      console.log(`      2. Amazon이 봇을 차단했을 수 있음 - 잠시 후 재시도`);
      console.log(`      3. 페이지가 완전히 로드되지 않았을 수 있음 - 대기 시간 증가 필요`);
      return null;
    }

    // 리뷰 크롤링 (환경변수로 제어)
    const shouldCrawlReviews = process.env.CRAWL_REVIEWS !== 'false';
    const maxReviews = parseInt(process.env.MAX_REVIEWS || '20');
    
    let reviews: Review[] = [];
    if (shouldCrawlReviews && productData.asin) {
      console.log(`   🔍 리뷰 크롤링 시작 (최대 ${maxReviews}개)...`);
      reviews = await extractAmazonReviews(page, productData.asin, maxReviews);
    }

    return {
      asin: productData.asin,
      title: productData.title,
      slug: createSlug(productData.title) + `-${Date.now()}`,
      description: productData.description,
      thumbnailUrl: productData.thumbnailUrl,
      imageUrls: productData.imageUrls,
      detailImages: productData.detailImages,
      videoUrl: productData.videoUrl,
      price: productData.price,
      originalPrice: productData.originalPrice,
      priceKrw: productData.price ? Math.round(productData.price * USD_TO_KRW) : null,
      currency: 'USD',
      rating: productData.rating,
      reviewCount: productData.reviewCount,
      category: productData.category,
      brand: productData.brand,
      seller: null,
      isPrime: productData.isPrime,
      deliveryInfo: null,
      availability: productData.availability,
      sourceUrl: url,
      crawledAt: new Date(),
      reviews: reviews,
    };

  } catch (error) {
    console.error(`   ❌ 상품 추출 실패: ${url}`);
    return null;
  }
}

/**
 * Amazon 카테고리를 데이터베이스 카테고리 ID로 매칭
 */
async function findCategoryId(
  supabase: SupabaseClient,
  amazonCategory: string,
  productTitle: string
): Promise<string | null> {
  if (!amazonCategory && !productTitle) return null;

  // Amazon 카테고리 텍스트를 정규화
  const normalizedCategory = amazonCategory.toLowerCase().trim();
  const normalizedTitle = productTitle.toLowerCase();

  // 카테고리 매핑 (Amazon 카테고리 -> DB 카테고리 slug)
  const categoryMapping: Record<string, string> = {
    // Beauty 관련
    'beauty': 'beauty',
    'beauty & personal care': 'beauty',
    'personal care': 'beauty',
    'skincare': 'beauty',
    'makeup': 'beauty',
    'cosmetics': 'beauty',
    'serum': 'beauty',
    'skincare serum': 'beauty',
    
    // Electronics 관련
    'electronics': 'electronics',
    'computers': 'electronics',
    'cell phones': 'electronics',
    'audio': 'electronics',
    'headphones': 'electronics',
    'graphics cards': 'electronics',
    'video cards': 'electronics',
    'gpu': 'electronics',
    
    // Home & Kitchen 관련
    'home & kitchen': 'kitchen',
    'kitchen': 'kitchen',
    'home improvement': 'home',
    'bedding': 'home',
    'mattress': 'home',
    'mattress pad': 'home',
    'home': 'home',
    
    // Sports 관련
    'sports & outdoors': 'sports',
    'sports': 'sports',
    'outdoors': 'sports',
    'fitness': 'sports',
    'exercise': 'sports',
    
    // Fashion 관련
    'clothing': 'fashion',
    'shoes': 'fashion',
    'fashion': 'fashion',
    'apparel': 'fashion',
    'pants': 'fashion',
    'tactical': 'fashion',
    'cargo': 'fashion',
    
    // Health 관련
    'health & household': 'health',
    'health': 'health',
    'supplements': 'health',
    'vitamins': 'health',
    'probiotics': 'health',
    'digestive supplements': 'health',
    
    // Baby 관련
    'baby': 'baby',
    'baby products': 'baby',
    'toys': 'baby',
  };

  // 1. Amazon 카테고리로 직접 매칭
  let matchedSlug: string | null = null;
  for (const [amazonCat, dbSlug] of Object.entries(categoryMapping)) {
    if (normalizedCategory.includes(amazonCat) || amazonCat.includes(normalizedCategory)) {
      matchedSlug = dbSlug;
      break;
    }
  }

  // 2. 제목에서 키워드로 추론
  if (!matchedSlug) {
    const titleKeywords: Array<{ keywords: string[]; slug: string }> = [
      // Beauty
      { keywords: ['serum', '세럼', 'skincare', '스킨케어', 'cosmetic', '화장품', 'makeup', '메이크업'], slug: 'beauty' },
      { keywords: ['cream', '크림', 'moisturizer', '보습', 'cleanser', '클렌저'], slug: 'beauty' },
      { keywords: ['toner', '토너', 'essence', '에센스', 'ampoule', '앰플'], slug: 'beauty' },
      { keywords: ['mask', '마스크', 'patch', '패치'], slug: 'beauty' },
      
      // Electronics
      { keywords: ['phone', '폰', 'headphone', '헤드폰', 'earbud', '이어폰'], slug: 'electronics' },
      { keywords: ['tablet', '태블릿', 'laptop', '랩톱', 'watch', '워치'], slug: 'electronics' },
      { keywords: ['camera', '카메라', 'computer', '컴퓨터'], slug: 'electronics' },
      { keywords: ['graphics card', '그래픽 카드', 'gpu', 'geforce', 'rtx', 'radeon'], slug: 'electronics' },
      
      // Kitchen/Home
      { keywords: ['coffee maker', 'coffee', '커피', '커피메이커', 'keurig'], slug: 'kitchen' },
      { keywords: ['kitchen', '주방', 'cookware', '조리도구'], slug: 'kitchen' },
      
      // Home/Interior
      { keywords: ['mattress', '매트리스', 'bedding', '침구', 'pillow', '베개'], slug: 'home' },
      
      // Sports
      { keywords: ['water bottle', '물병', 'bottle', '보틀', 'sports bottle'], slug: 'sports' },
      { keywords: ['fitness', '피트니스', 'exercise', '운동', 'workout'], slug: 'sports' },
      { keywords: ['gym', '헬스', 'running', '러닝', 'yoga', '요가'], slug: 'sports' },
      
      // Health
      { keywords: ['vitamin', '비타민', 'supplement', '영양제', 'protein', '프로틴'], slug: 'health' },
      { keywords: ['probiotic', '프로바이오틱스', 'prebiotic', '프리바이오틱스'], slug: 'health' },
      { keywords: ['nutrition', '영양', 'diet', '다이어트'], slug: 'health' },
      
      // Fashion
      { keywords: ['pants', '바지', '팬츠', 'tactical', '전술', 'cargo', '카고'], slug: 'fashion' },
      { keywords: ['clothing', '의류', 'shoes', '신발', 'bag', '가방'], slug: 'fashion' },
      { keywords: ['slipper', '슬리퍼', 'moccasin', '모카신', 'house shoes', '하우스 슈즈'], slug: 'fashion' },
    ];

    // 각 카테고리 그룹의 키워드 중 하나라도 매칭되면 해당 카테고리 할당
    for (var kwIdx = 0; kwIdx < titleKeywords.length; kwIdx++) {
      var keywordGroup = titleKeywords[kwIdx];
      for (var kIdx = 0; kIdx < keywordGroup.keywords.length; kIdx++) {
        if (normalizedTitle.includes(keywordGroup.keywords[kIdx])) {
          matchedSlug = keywordGroup.slug;
          break;
        }
      }
      if (matchedSlug) break;
    }
  }

  // 3. 매칭된 slug로 카테고리 ID 조회
  if (matchedSlug) {
    const { data: category } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', matchedSlug)
      .eq('is_active', true)
      .single();

    if (category) {
      return category.id;
    }
  }

  return null;
}

/**
 * Supabase에 상품 저장
 */
async function saveToSupabase(
  supabase: SupabaseClient,
  product: AmazonProduct
): Promise<boolean> {
  try {
    // 카테고리 ID 찾기
    const categoryId = await findCategoryId(supabase, product.category || '', product.title);

    const productInsert: ProductInsert = {
      title: product.title,
      slug: product.slug,
      description: product.description || null,
      thumbnail_url: product.thumbnailUrl || null,
      video_url: product.videoUrl,
      original_price: product.originalPrice || product.price,
      currency: 'USD',
      price_krw: product.priceKrw,
      source_platform: 'amazon',
      source_url: product.sourceUrl,
      external_rating: product.rating || null,
      external_review_count: product.reviewCount || 0,
      tags: product.category ? [product.category, product.brand || ''].filter(Boolean) : [],
      is_featured: product.rating >= 4.5 && product.reviewCount >= 1000,
      is_active: true,
      category_id: categoryId,
      detail_images: product.detailImages.length > 0 ? product.detailImages : undefined,
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

    console.log(`   ✅ 상품 저장 완료: ${product.title.substring(0, 50)}...`);
    
    // 리뷰 저장
    if (product.reviews && product.reviews.length > 0) {
      const reviewInserts = product.reviews.map(review => ({
        product_id: data.id,
        content: review.content,
        reviewer_name: review.reviewerName,
        reviewer_country: review.reviewerCountry,
        rating: review.rating,
        source_language: 'en',
        source_platform: 'amazon',
        source_review_id: review.sourceReviewId,
        review_date: review.reviewDate?.toISOString().split('T')[0] || null,
        helpful_count: review.helpfulCount,
        is_verified_purchase: review.isVerifiedPurchase,
      }));
      
      const { error: reviewsError } = await supabase
        .from('external_reviews')
        .insert(reviewInserts);
      
      if (reviewsError) {
        console.error(`   ⚠️ 리뷰 저장 실패:`, reviewsError.message);
      } else {
        console.log(`   ✅ ${product.reviews.length}개의 리뷰 저장 완료`);
        
        // 리뷰가 저장된 후 AI 요약 생성 (동적 import 사용)
        if (product.reviews.length > 0 && process.env.AUTO_GENERATE_AI_SUMMARY !== 'false') {
          try {
            console.log(`   🤖 AI 리뷰 요약 생성 중...`);
            
            // 동적 import로 AI 서비스 로드 (크롤러 디렉토리에서 프로젝트 루트로 접근)
            // tsx로 실행 시 .ts 파일 직접 import 가능
            const { createAIService } = await import('../../../lib/ai/index.js');
            const aiService = createAIService();
            const allReviews = product.reviews.map(r => ({
              content: r.content,
              rating: r.rating ?? undefined,
              language: 'en',
            }));
            
            const result = await aiService.summarizeReviews({
              productName: product.title,
              reviews: allReviews,
            });
            
            // AI 요약을 Supabase에 저장
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + 24); // 24시간 후 만료
            
            const { error: summaryError } = await supabase
              .from('ai_summaries')
              .upsert({
                product_id: data.id,
                summary: result.summary,
                positive_points: result.positivePoints,
                negative_points: result.negativePoints,
                recommendation: result.recommendation,
                overall_rating: result.overallRating,
                sentiment_score: result.sentimentScore,
                ai_provider: aiService.provider,
                ai_model: process.env.AI_MODEL || 'mock',
                review_count: allReviews.length,
                is_outdated: false,
                expires_at: expiresAt.toISOString(),
                generated_at: new Date().toISOString(),
              }, {
                onConflict: 'product_id',
              });
            
            if (summaryError) {
              console.error(`   ⚠️ AI 요약 저장 실패:`, summaryError.message);
            } else {
              console.log(`   ✅ AI 리뷰 요약 생성 및 저장 완료`);
            }
          } catch (aiError) {
            console.error(`   ⚠️ AI 요약 생성 실패:`, aiError instanceof Error ? aiError.message : aiError);
            console.log(`   💡 AI 요약은 나중에 수동으로 생성할 수 있습니다.`);
            // AI 요약 실패해도 상품 저장은 성공으로 처리
          }
        }
      }
    }
    
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
  console.log('🚀 Amazon 크롤러 시작\n');
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
      console.log('⚠️ 수집된 상품이 없습니다. Amazon의 봇 탐지로 인해 차단되었을 수 있습니다.');
      await browser.close();
      return;
    }

    // 각 상품 상세 정보 추출 및 저장
    let successCount = 0;

    for (let i = 0; i < productUrls.length; i++) {
      const url = productUrls[i];
      console.log(`\n[${i + 1}/${productUrls.length}] 크롤링 중: ${url}`);

      const product = await extractProductDetails(page, url);

      if (!product) {
        console.log(`   ❌ 상품 추출 실패 - 다음 상품으로 넘어갑니다`);
        continue;
      }

      if (product) {
        console.log(`   📝 "${product.title.substring(0, 40)}..."`);
        console.log(`   💰 $${product.price || '가격 없음'} (₩${product.priceKrw?.toLocaleString() || '-'})`);
        console.log(`   ⭐ ${product.rating}/5 (${product.reviewCount.toLocaleString()}개 리뷰)`);
        if (product.videoUrl) {
          console.log(`   🎬 영상 URL 있음`);
        }
        if (product.detailImages.length > 0) {
          console.log(`   🖼️  상세 이미지 ${product.detailImages.length}개 추출됨`);
          // 처음 3개 이미지 URL 출력 (디버깅용)
          product.detailImages.slice(0, 3).forEach((img, idx) => {
            console.log(`      [${idx + 1}] ${img.substring(0, 80)}...`);
          });
        } else {
          console.log(`   ⚠️  상세 이미지를 찾지 못했습니다`);
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
