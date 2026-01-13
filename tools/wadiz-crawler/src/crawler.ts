/**
 * @file src/crawler.ts
 * @description 와디즈 크라우드펀딩 프로젝트 크롤러
 *
 * 와디즈에서 다양한 모드로 프로젝트를 크롤링하여 Supabase에 저장합니다.
 *
 * 주요 기능:
 * 1. 인기순 프로젝트 크롤링
 * 2. 모인금액순 프로젝트 크롤링
 * 3. 최신순 프로젝트 크롤링
 * 4. 마감임박순 프로젝트 크롤링
 * 5. 키워드 검색 크롤링
 * 6. 특정 카테고리 크롤링
 * 
 * 크롤링 모드 (CRAWL_MODE 환경변수):
 * - popular: 인기순 (기본값)
 * - amount: 모인금액순
 * - recent: 최신순
 * - closing: 마감임박순
 * - search: 키워드 검색 (SEARCH_KEYWORD 필요)
 *
 * 사용법:
 * - pnpm crawl (기본 인기순 크롤링)
 * - CRAWL_MODE=amount pnpm crawl
 * - CRAWL_MODE=search SEARCH_KEYWORD="전자기기" pnpm crawl
 */

import 'dotenv/config';
import puppeteer, { Browser, Page } from 'puppeteer';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { WadizProject, CrawlConfig, ProductInsert } from './types.js';

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
// 크롤링 모드 타입
// ============================================

type CrawlMode = 'popular' | 'amount' | 'recent' | 'closing' | 'search';
type WadizCategory = 'tech' | 'fashion' | 'beauty' | 'food' | 'home' | 'design' | 'all';

// 크롤링 모드 및 옵션
const CRAWL_MODE: CrawlMode = (process.env.CRAWL_MODE as CrawlMode) || 'popular';
const SEARCH_KEYWORD = process.env.SEARCH_KEYWORD || '';
const CATEGORY: WadizCategory = (process.env.CATEGORY as WadizCategory) || 'all';

// ============================================
// 크롤링 설정
// ============================================

const CONFIG: CrawlConfig = {
  headless: process.env.HEADLESS !== 'false',
  timeout: 60000,       // 60초 타임아웃
  delay: 2000,          // 요청 간 2초 대기 (차단 방지)
  retryCount: 3,        // 실패 시 재시도 횟수
  maxProjects: parseInt(process.env.MAX_PRODUCTS || '10'),
};

// 리뷰 크롤링 설정
const CRAWL_REVIEWS = process.env.CRAWL_REVIEWS !== 'false';
const MAX_REVIEWS = parseInt(process.env.MAX_REVIEWS || '10');

// 카테고리 ID 매핑
const CATEGORY_IDS: Record<WadizCategory, string> = {
  tech: '1',       // 테크·가전
  fashion: '2',    // 패션·잡화
  beauty: '3',     // 뷰티
  food: '4',       // 푸드
  home: '5',       // 홈리빙
  design: '6',     // 디자인소품
  all: '',
};

// 정렬 옵션 매핑
const SORT_OPTIONS: Record<CrawlMode, string> = {
  popular: 'support',   // 인기순
  amount: 'amount',     // 모인금액순
  recent: 'recent',     // 최신순
  closing: 'closing',   // 마감임박순
  search: 'support',    // 검색 시 기본 인기순
};

// ============================================
// 유틸리티 함수
// ============================================

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function createSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 80);
}

function parseAmount(text: string): number {
  // "1,234,567원" -> 1234567
  const cleaned = text.replace(/[^0-9]/g, '');
  return parseInt(cleaned) || 0;
}

// ============================================
// 와디즈 크롤러 클래스
// ============================================

class WadizCrawler {
  private browser: Browser | null = null;
  private page: Page | null = null;

  async init(): Promise<void> {
    console.log('🚀 와디즈 크롤러 시작...\n');

    this.browser = await puppeteer.launch({
      headless: CONFIG.headless,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920,1080',
        '--lang=ko-KR,ko',
        // 봇 탐지 우회
        '--disable-blink-features=AutomationControlled',
      ],
    });

    this.page = await this.browser.newPage();

    // 한국어 User-Agent
    await this.page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
    );

    await this.page.setViewport({ width: 1920, height: 1080 });

    // webdriver 속성 숨기기
    await this.page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });
    });

    // 불필요한 리소스 차단 (속도 향상)
    await this.page.setRequestInterception(true);
    this.page.on('request', (request) => {
      const blockedTypes = ['font'];
      if (blockedTypes.includes(request.resourceType())) {
        request.abort();
      } else {
        request.continue();
      }
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
  // 펀딩 목록 페이지에서 프로젝트 URL 가져오기
  // ============================================

  async getProjectUrls(): Promise<string[]> {
    if (!this.page) throw new Error('브라우저가 초기화되지 않았습니다.');

    let url: string;
    
    if (CRAWL_MODE === 'search' && SEARCH_KEYWORD) {
      // 검색 모드
      const encodedKeyword = encodeURIComponent(SEARCH_KEYWORD);
      url = `https://www.wadiz.kr/web/wreward/main?keyword=${encodedKeyword}&order=support`;
      console.log(`📦 와디즈 검색: "${SEARCH_KEYWORD}" 크롤링 시작...`);
    } else {
      // 일반 모드
      url = 'https://www.wadiz.kr/web/wreward/main';
      const params = new URLSearchParams();
      
      params.append('order', SORT_OPTIONS[CRAWL_MODE]);
      
      if (CATEGORY !== 'all' && CATEGORY_IDS[CATEGORY]) {
        params.append('category', CATEGORY_IDS[CATEGORY]);
      }
      
      url += '?' + params.toString();
      
      const modeLabel = {
        popular: '인기순',
        amount: '모인금액순',
        recent: '최신순',
        closing: '마감임박순',
        search: '검색',
      }[CRAWL_MODE];
      
      console.log(`📦 와디즈 ${modeLabel} 크롤링 시작...`);
    }

    console.log(`   🔗 접속 중: ${url.substring(0, 60)}...\n`);

    try {
      await this.page.goto(url, {
        waitUntil: 'domcontentloaded',  // networkidle2 대신 더 빠른 옵션
        timeout: CONFIG.timeout,
      });
    } catch (navError) {
      console.log('   ⚠️ 페이지 로딩 타임아웃, 계속 진행...');
    }

    // 추가 로딩 대기
    await delay(5000);

    // 스크롤하여 더 많은 프로젝트 로드
    await this.autoScroll();

    // 프로젝트 링크 추출
    const projectUrls = await this.page.evaluate(`
      (function() {
        var links = [];
        
        // 프로젝트 카드 링크 찾기
        // 와디즈 URL 패턴: /web/campaign/detail/{projectId}
        document.querySelectorAll('a[href*="/web/campaign/detail/"]').forEach(function(el) {
          var href = el.getAttribute('href');
          if (href) {
            var fullUrl = href.startsWith('http') 
              ? href 
              : 'https://www.wadiz.kr' + href;
            links.push(fullUrl);
          }
        });

        // 중복 제거
        return links.filter(function(value, index, self) {
          return self.indexOf(value) === index;
        });
      })()
    `) as string[];

    console.log(`📦 ${projectUrls.length}개 프로젝트 URL 발견\n`);
    return projectUrls.slice(0, CONFIG.maxProjects);
  }

  // ============================================
  // Wadiz 리뷰 수집
  // ============================================

  private async extractWadizReviews(url: string, maxReviews: number = 10): Promise<Review[]> {
    if (!this.page) return [];

    const reviews: Review[] = [];
    
    try {
      console.log(`   🔍 리뷰 수집 시작 (최대 ${maxReviews}개)...`);
      
      // 현재 페이지에서 리뷰 섹션으로 스크롤
      await this.page.evaluate(`
        (function() {
          var reviewSection = document.querySelector('[class*="review"], [class*="Comment"], .후기, .리뷰');
          if (reviewSection) {
            reviewSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        })()
      `);

      await delay(2000);

      // 페이지에서 리뷰 추출
      const reviewData = await this.page.evaluate(`
        (function() {
          var reviews = [];
          
          // 와디즈 리뷰/후기 컨테이너 찾기
          var reviewElements = document.querySelectorAll('[class*="Comment"], [class*="Review"], .comment-item, .review-item');
          
          if (reviewElements.length === 0) {
            // 대체 선택자 시도
            reviewElements = document.querySelectorAll('.후기, .리뷰, [class*="후기"], [class*="리뷰"]');
          }
          
          for (var i = 0; i < reviewElements.length && i < ${maxReviews}; i++) {
            var element = reviewElements[i];
            
            // 리뷰 내용
            var contentEl = element.querySelector('[class*="content"], [class*="text"], p, .후기내용, .리뷰내용') || element;
            var content = contentEl.textContent ? contentEl.textContent.trim() : '';
            
            // 작성자 이름
            var authorEl = element.querySelector('[class*="name"], [class*="author"], .작성자, .이름, strong');
            var author = authorEl ? authorEl.textContent.trim() : null;
            
            // 평점
            var ratingEl = element.querySelector('[class*="rating"], [class*="star"], .평점');
            var rating = null;
            if (ratingEl) {
              var ratingText = ratingEl.textContent || ratingEl.getAttribute('data-rating') || '';
              var ratingMatch = ratingText.match(/([0-5])/);
              if (ratingMatch) {
                rating = parseInt(ratingMatch[1]);
              }
            }
            
            // 작성일
            var dateEl = element.querySelector('time, .date, [datetime], .작성일');
            var dateStr = dateEl ? (dateEl.getAttribute('datetime') || dateEl.textContent.trim()) : null;
            
            if (content && content.length > 5) {
              reviews.push({
                content: content,
                reviewerName: author,
                reviewerCountry: '대한민국',
                rating: rating,
                reviewDate: dateStr,
                helpfulCount: 0,
                isVerifiedPurchase: true, // 와디즈 후기는 서포터만 작성 가능
                sourceReviewId: null,
              });
            }
          }
          
          return reviews;
        })()
      `);

      for (const review of reviewData) {
        reviews.push({
          content: review.content,
          reviewerName: review.reviewerName,
          reviewerCountry: review.reviewerCountry,
          rating: review.rating,
          reviewDate: review.reviewDate ? new Date(review.reviewDate) : null,
          helpfulCount: review.helpfulCount,
          isVerifiedPurchase: review.isVerifiedPurchase,
          sourceReviewId: review.sourceReviewId,
        });
      }

      console.log(`   ✅ ${reviews.length}개의 리뷰 수집 완료`);

    } catch (error) {
      console.error(`   ⚠️ 리뷰 수집 실패:`, error);
    }

    return reviews;
  }

  // ============================================
  // 프로젝트 상세 페이지 크롤링
  // ============================================

  async crawlProject(url: string): Promise<WadizProject | null> {
    if (!this.page) throw new Error('브라우저가 초기화되지 않았습니다.');

    console.log(`🔍 크롤링: ${url}`);

    try {
      try {
        await this.page.goto(url, {
          waitUntil: 'domcontentloaded',
          timeout: CONFIG.timeout,
        });
      } catch (navError) {
        console.log('   ⚠️ 페이지 로딩 타임아웃, 계속 진행...');
      }

      // 페이지 로딩 대기
      await delay(3000);

      // 페이지 타이틀 확인
      const pageTitle = await this.page.title();
      console.log(`   📄 페이지 타이틀: ${pageTitle}`);

      // 데이터 추출
      const projectData = await this.page.evaluate(`
        (function() {
          function getText(selector) {
            var el = document.querySelector(selector);
            return el ? el.textContent.trim() : '';
          }

          function getAttr(selector, attr) {
            var el = document.querySelector(selector);
            return el ? el.getAttribute(attr) || '' : '';
          }

          // Open Graph 메타 태그
          function getMeta(property) {
            var el = document.querySelector('meta[property="' + property + '"]') ||
                     document.querySelector('meta[name="' + property + '"]');
            return el ? el.getAttribute('content') || '' : '';
          }

          // 기본 정보
          var title = getMeta('og:title') || getText('h2.RewardProjectTitle_title__LCB1E') || getText('.campaign-title') || document.title.split(' - ')[0];
          var description = getMeta('og:description') || '';
          var thumbnailUrl = getMeta('og:image') || '';

          // 펀딩 정보 추출 (페이지 텍스트에서)
          var bodyText = document.body.innerText || '';
          
          // 목표 금액
          var targetMatch = bodyText.match(/목표\\s*금액[:\\s]*([\\d,]+)\\s*원/i);
          var targetAmount = targetMatch ? targetMatch[1].replace(/,/g, '') : '0';

          // 현재 모인 금액
          var totalMatch = bodyText.match(/([\\d,]+)\\s*원\\s*달성/i) ||
                          bodyText.match(/펀딩\\s*금액[:\\s]*([\\d,]+)\\s*원/i);
          var totalAmount = totalMatch ? totalMatch[1].replace(/,/g, '') : '0';

          // 달성률
          var rateMatch = bodyText.match(/([\\d,]+)\\s*%\\s*달성/i) ||
                         bodyText.match(/달성률[:\\s]*([\\d,]+)\\s*%/i);
          var achievementRate = rateMatch ? rateMatch[1].replace(/,/g, '') : '0';

          // 서포터 수
          var supporterMatch = bodyText.match(/([\\d,]+)\\s*명.*서포터/i) ||
                              bodyText.match(/서포터[:\\s]*([\\d,]+)\\s*명/i);
          var supporterCount = supporterMatch ? supporterMatch[1].replace(/,/g, '') : '0';

          // 남은 기간
          var daysMatch = bodyText.match(/([\\d]+)\\s*일\\s*남음/i);
          var remainingDays = daysMatch ? daysMatch[1] : null;

          // 프로젝트 상태
          var status = 'ongoing';
          var lowerText = bodyText.toLowerCase();
          if (lowerText.includes('펀딩 성공') || lowerText.includes('목표 달성')) status = 'success';
          else if (lowerText.includes('펀딩 실패') || lowerText.includes('목표 미달성')) status = 'fail';
          else if (lowerText.includes('오픈 예정') || lowerText.includes('공개 예정')) status = 'scheduled';

          // 카테고리
          var categoryEl = document.querySelector('a[href*="category="]');
          var category = categoryEl ? categoryEl.textContent.trim() : '';

          // 메이커 정보
          var makerEl = document.querySelector('.MakerProfile_name__rSgUk') ||
                       document.querySelector('.maker-name') ||
                       document.querySelector('[class*="maker"]');
          var makerName = makerEl ? makerEl.textContent.trim() : '';

          // ============================================
          // 리워드 정보 추출
          // ============================================
          var rewards = [];
          var minRewardAmount = null;

          // 방법 1: 리워드 카드에서 추출
          document.querySelectorAll('[class*="RewardItem"], [class*="reward-item"], .reward-card').forEach(function(el) {
            var amountEl = el.querySelector('[class*="price"], [class*="amount"]');
            var amountText = amountEl ? amountEl.textContent : '';
            var amountMatch = amountText.match(/([\\d,]+)\\s*원/);
            
            if (amountMatch) {
              var amount = parseInt(amountMatch[1].replace(/,/g, ''));
              var titleEl = el.querySelector('[class*="title"], [class*="name"]');
              var title = titleEl ? titleEl.textContent.trim() : amountText;
              
              if (amount > 0) {
                rewards.push({
                  amount: amount,
                  title: title
                });
              }
            }
          });

          // 방법 2: 텍스트 패턴으로 추출
          var rewardMatches = bodyText.match(/([\\d,]+)\\s*원\\s*후원/gi) || [];
          rewardMatches.forEach(function(match) {
            var amountMatch = match.match(/([\\d,]+)/);
            if (amountMatch) {
              var amount = parseInt(amountMatch[1].replace(/,/g, ''));
              // 1,000원 이상, 1,000,000원 이하만 유효한 리워드로 간주
              if (amount >= 1000 && amount <= 1000000) {
                var exists = rewards.some(function(r) { return r.amount === amount; });
                if (!exists) {
                  rewards.push({
                    amount: amount,
                    title: amount.toLocaleString() + '원 리워드'
                  });
                }
              }
            }
          });

          // 최소 리워드 금액 찾기 (1,000원 이하 제외 - 순수 후원 제외)
          var MIN_REWARD_THRESHOLD = 1000;
          if (rewards.length > 0) {
            var amounts = rewards.map(function(r) { return r.amount; }).filter(function(a) { return a >= MIN_REWARD_THRESHOLD; });
            if (amounts.length > 0) {
              minRewardAmount = Math.min.apply(null, amounts);
            }
          }

          // ============================================
          // 영상 URL 추출
          // ============================================
          var videoUrl = null;

          // 방법 1: og:video 메타 태그에서 추출
          var ogVideo = document.querySelector('meta[property="og:video"], meta[property="og:video:url"], meta[property="og:video:secure_url"]');
          if (ogVideo) {
            videoUrl = ogVideo.getAttribute('content');
          }

          // 방법 2: video 태그에서 직접 추출
          if (!videoUrl) {
            var videoEl = document.querySelector('video source[src], video[src]');
            if (videoEl) {
              videoUrl = videoEl.getAttribute('src');
              if (!videoUrl) {
                var sourceEl = videoEl.querySelector('source');
                if (sourceEl) {
                  videoUrl = sourceEl.getAttribute('src');
                }
              }
            }
          }

          // 방법 3: 와디즈 비디오 컨테이너에서 추출
          if (!videoUrl) {
            var wadizVideo = document.querySelector('[class*="video"] video, .video-container video, .project-video video');
            if (wadizVideo) {
              videoUrl = wadizVideo.getAttribute('src');
            }
          }

          // 방법 4: iframe에서 YouTube/Vimeo URL 추출
          if (!videoUrl) {
            var iframe = document.querySelector('iframe[src*="youtube"], iframe[src*="vimeo"], iframe[src*="wadiz"]');
            if (iframe) {
              var iframeSrc = iframe.getAttribute('src');
              if (iframeSrc) {
                // YouTube embed URL을 일반 URL로 변환
                if (iframeSrc.includes('youtube.com/embed/')) {
                  var videoId = iframeSrc.split('embed/')[1]?.split('?')[0];
                  if (videoId) {
                    videoUrl = 'https://www.youtube.com/watch?v=' + videoId;
                  }
                } else if (iframeSrc.includes('player.vimeo.com/video/')) {
                  var vimeoId = iframeSrc.split('video/')[1]?.split('?')[0];
                  if (vimeoId) {
                    videoUrl = 'https://vimeo.com/' + vimeoId;
                  }
                } else {
                  videoUrl = iframeSrc;
                }
              }
            }
          }

          // 방법 5: data 속성에서 영상 URL 추출
          if (!videoUrl) {
            var videoContainer = document.querySelector('[data-video-url], [data-video], [data-src]');
            if (videoContainer) {
              videoUrl = videoContainer.getAttribute('data-video-url') || 
                        videoContainer.getAttribute('data-video') || 
                        videoContainer.getAttribute('data-src');
            }
          }

          return {
            title: title,
            description: description,
            summary: description.substring(0, 200),
            thumbnailUrl: thumbnailUrl,
            videoUrl: videoUrl,
            targetAmount: targetAmount,
            totalAmount: totalAmount,
            achievementRate: achievementRate,
            supporterCount: supporterCount,
            remainingDays: remainingDays,
            status: status,
            category: category,
            makerName: makerName,
            minRewardAmount: minRewardAmount,
            rewards: rewards
          };
        })()
      `) as {
        title: string;
        description: string;
        summary: string;
        thumbnailUrl: string;
        videoUrl: string | null;
        targetAmount: string;
        totalAmount: string;
        achievementRate: string;
        supporterCount: string;
        remainingDays: string | null;
        status: string;
        category: string;
        makerName: string;
        minRewardAmount: number | null;
        rewards: { amount: number; title: string }[];
      };

      if (!projectData.title) {
        console.log('   ⚠️ 제목을 찾을 수 없음, 건너뜀');
        return null;
      }

      const project: WadizProject = {
        title: projectData.title,
        slug: createSlug(projectData.title) + `-${Date.now()}`,
        description: projectData.description,
        summary: projectData.summary,
        thumbnailUrl: projectData.thumbnailUrl,
        videoUrl: projectData.videoUrl,

        targetAmount: parseInt(projectData.targetAmount) || 0,
        totalAmount: parseInt(projectData.totalAmount) || 0,
        achievementRate: parseInt(projectData.achievementRate) || 0,
        supporterCount: parseInt(projectData.supporterCount) || 0,

        minRewardAmount: projectData.minRewardAmount,
        rewards: projectData.rewards.map(r => ({
          title: r.title,
          amount: r.amount,
          description: '',
          supporterCount: 0,
          deliveryDate: null,
          isLimited: false,
          remaining: null,
          totalQuantity: null,
        })),

        remainingDays: projectData.remainingDays ? parseInt(projectData.remainingDays) : null,
        startDate: null,
        endDate: null,
        status: projectData.status as WadizProject['status'],

        category: projectData.category,
        subcategory: null,

        makerName: projectData.makerName,
        makerProfileUrl: null,

        sourceUrl: url,
        crawledAt: new Date().toISOString(),
      };

      // 리뷰 수집
      if (CRAWL_REVIEWS) {
        project.reviews = await this.extractWadizReviews(url, MAX_REVIEWS);
      }

      console.log(`   ✅ "${project.title}"`);
      console.log(`      💰 ${project.totalAmount.toLocaleString()}원 (${project.achievementRate}%)`);
      console.log(`      👥 ${project.supporterCount.toLocaleString()}명 서포터`);
      if (project.minRewardAmount) {
        console.log(`      🎁 최소 리워드: ${project.minRewardAmount.toLocaleString()}원`);
      }
      if (project.videoUrl) {
        console.log(`      🎬 영상 URL: ${project.videoUrl.substring(0, 50)}...`);
      }
      if (project.reviews && project.reviews.length > 0) {
        console.log(`      💬 리뷰: ${project.reviews.length}개 수집됨`);
      }
      console.log('');

      return project;

    } catch (error) {
      console.error(`   ❌ 크롤링 실패:`, error);
      return null;
    }
  }

  // ============================================
  // 자동 스크롤
  // ============================================

  private async autoScroll(): Promise<void> {
    if (!this.page) return;

    await this.page.evaluate(`
      new Promise(function(resolve) {
        var totalHeight = 0;
        var distance = 500;
        var maxScrolls = 5;
        var scrollCount = 0;

        var timer = setInterval(function() {
          window.scrollBy(0, distance);
          totalHeight += distance;
          scrollCount++;

          if (scrollCount >= maxScrolls || totalHeight >= document.body.scrollHeight) {
            clearInterval(timer);
            resolve();
          }
        }, 300);
      })
    `);
  }

  // ============================================
  // 스크린샷 저장 (디버깅용)
  // ============================================

  async screenshot(filename: string): Promise<void> {
    if (!this.page) return;
    await this.page.screenshot({ path: filename, fullPage: true });
    console.log(`📸 스크린샷: ${filename}`);
  }
}

// ============================================
// Supabase 저장 함수
// ============================================

async function saveToSupabase(project: WadizProject): Promise<string | null> {
  const productData: ProductInsert = {
    title: project.title,
    slug: project.slug,
    description: `${project.summary}\n\n${project.description}`.substring(0, 5000),
    thumbnail_url: project.thumbnailUrl,
    video_url: project.videoUrl,
    original_price: project.minRewardAmount || project.targetAmount,
    currency: 'KRW',
    price_krw: project.minRewardAmount, // 리워드 최소 금액
    source_platform: 'wadiz',
    source_url: project.sourceUrl,
    external_rating: Math.min(project.achievementRate / 20, 5), // 달성률을 5점 만점으로
    external_review_count: project.supporterCount,
    tags: [
      project.category,
      project.status === 'ongoing' ? '진행중' : project.status === 'success' ? '펀딩성공' : '',
      `${project.achievementRate}% 달성`,
      `${project.supporterCount}명 서포터`,
      project.minRewardAmount ? `${project.minRewardAmount.toLocaleString()}원부터` : '',
    ].filter(Boolean),
    is_featured: project.achievementRate >= 100,
    is_active: project.status === 'ongoing',
  };

  const { data, error } = await supabase
    .from('products')
    .insert([productData])
    .select('id')
    .single();

  if (error) {
    console.error('   ❌ DB 저장 실패:', error.message);
    return null;
  }

  console.log(`   💾 저장 완료: ${data.id}`);

  // 리뷰 저장
  if (project.reviews && project.reviews.length > 0) {
    const reviewInserts = project.reviews.map(review => ({
      product_id: data.id,
      content: review.content,
      reviewer_name: review.reviewerName,
      reviewer_country: review.reviewerCountry,
      rating: review.rating,
      source_language: 'ko',
      source_platform: 'wadiz',
      source_review_id: review.sourceReviewId,
      review_date: review.reviewDate?.toISOString().split('T')[0] || null,
      helpful_count: review.helpfulCount,
      is_verified_purchase: review.isVerifiedPurchase,
    }));

    const { error: reviewsError } = await supabase
      .from('external_reviews')
      .insert(reviewInserts);

    if (reviewsError) {
      console.error('   ⚠️ 리뷰 저장 실패:', reviewsError.message);
    } else {
      console.log(`   ✅ ${project.reviews.length}개의 리뷰 저장 완료`);
    }
  }

  console.log('');
  return data.id;
}

// ============================================
// 메인 실행 함수
// ============================================

async function main() {
  console.log('═'.repeat(60));
  console.log('🎯 와디즈 크라우드펀딩 크롤러');
  console.log('═'.repeat(60));
  console.log('');
  console.log(`📋 설정:`);
  console.log(`   - 크롤링 모드: ${CRAWL_MODE}`);
  if (CRAWL_MODE === 'search') {
    console.log(`   - 검색 키워드: ${SEARCH_KEYWORD}`);
  }
  if (CATEGORY !== 'all') {
    console.log(`   - 카테고리: ${CATEGORY}`);
  }
  console.log(`   - 최대 프로젝트 수: ${CONFIG.maxProjects}`);
  console.log(`   - Headless 모드: ${CONFIG.headless}`);
  console.log('');

  const crawler = new WadizCrawler();

  try {
    await crawler.init();

    // ============================================
    // 방법 1: 특정 URL 목록 크롤링
    // ============================================

    const targetUrls: string[] = [
      // 여기에 크롤링할 프로젝트 URL을 추가하세요
      // 'https://www.wadiz.kr/web/campaign/detail/12345',
    ];

    if (targetUrls.length > 0) {
      console.log(`\n📋 ${targetUrls.length}개 지정 프로젝트 크롤링\n`);

      for (const url of targetUrls) {
        const project = await crawler.crawlProject(url);
        if (project) {
          await saveToSupabase(project);
        }
        await delay(CONFIG.delay);
      }
    } else {
      // ============================================
      // 방법 2: 모드에 따른 프로젝트 자동 수집
      // ============================================

      const projectUrls = await crawler.getProjectUrls();

      let savedCount = 0;
      for (const url of projectUrls) {
        const project = await crawler.crawlProject(url);
        if (project) {
          const id = await saveToSupabase(project);
          if (id) savedCount++;
        }
        await delay(CONFIG.delay);
      }

      console.log(`\n📊 결과: ${savedCount}/${projectUrls.length}개 프로젝트 저장됨`);
    }

    console.log('\n' + '═'.repeat(60));
    console.log('✅ 크롤링 완료!');
    console.log('═'.repeat(60));

  } catch (error) {
    console.error('\n❌ 크롤링 중 오류:', error);
  } finally {
    await crawler.close();
  }
}

// 실행
main();
