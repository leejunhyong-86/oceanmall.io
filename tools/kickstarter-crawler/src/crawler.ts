/**
 * @file src/crawler.ts
 * @description Kickstarter 프로젝트 크롤러
 *
 * Kickstarter에서 다양한 모드로 프로젝트를 크롤링하여 Supabase에 저장합니다.
 *
 * 주요 기능:
 * 1. 인기 프로젝트 크롤링
 * 2. 최신 프로젝트 크롤링
 * 3. 마감 임박 프로젝트 크롤링
 * 4. 최다 모금 프로젝트 크롤링
 * 5. 키워드 검색 크롤링
 * 6. 특정 카테고리 크롤링
 * 
 * 크롤링 모드 (CRAWL_MODE 환경변수):
 * - popularity: 인기순 (기본값)
 * - newest: 최신순
 * - end_date: 마감 임박순
 * - most_funded: 최다 모금순
 * - search: 키워드 검색 (SEARCH_KEYWORD 필요)
 *
 * 사용법:
 * - pnpm crawl (기본 인기순 크롤링)
 * - CRAWL_MODE=newest pnpm crawl
 * - CRAWL_MODE=search SEARCH_KEYWORD="smart watch" pnpm crawl
 */

import 'dotenv/config';
import puppeteer, { Browser, Page } from 'puppeteer';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { KickstarterProject, CrawlConfig, ProductInsert } from './types.js';

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

type CrawlMode = 'popularity' | 'newest' | 'end_date' | 'most_funded' | 'magic' | 'search';
type KickstarterCategory = 'technology' | 'design' | 'games' | 'art' | 'music' | 'film' | 'all';

// 크롤링 모드 및 옵션
const CRAWL_MODE: CrawlMode = (process.env.CRAWL_MODE as CrawlMode) || 'popularity';
const SEARCH_KEYWORD = process.env.SEARCH_KEYWORD || '';
const CATEGORY: KickstarterCategory = (process.env.CATEGORY as KickstarterCategory) || 'all';

// ============================================
// 크롤링 설정
// ============================================

const CONFIG: CrawlConfig = {
  headless: process.env.HEADLESS !== 'false',
  timeout: 60000,       // 60초 타임아웃
  delay: 3000,          // 요청 간 3초 대기 (차단 방지)
  retryCount: 3,        // 실패 시 재시도 횟수
  maxProjects: parseInt(process.env.MAX_PRODUCTS || '10'),
};

// 리뷰 크롤링 설정
const CRAWL_REVIEWS = process.env.CRAWL_REVIEWS !== 'false';
const MAX_REVIEWS = parseInt(process.env.MAX_REVIEWS || '10');

// 카테고리 ID 매핑
const CATEGORY_IDS: Record<KickstarterCategory, string> = {
  technology: '16',
  design: '7',
  games: '12',
  art: '1',
  music: '14',
  film: '11',
  all: '',
};

// ============================================
// 유틸리티 함수
// ============================================

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Cloudflare 체크 통과 대기
 * "잠시만 기다리십시오" 페이지가 사라질 때까지 대기
 */
async function waitForCloudflare(page: Page, maxWait: number = 30000): Promise<boolean> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWait) {
    const title = await page.title();
    
    // Cloudflare 대기 페이지 감지
    const isCloudflare = 
      title.includes('잠시만') || 
      title.includes('Just a moment') ||
      title.includes('Checking') ||
      title.includes('Please wait') ||
      title === '';
    
    if (!isCloudflare && title.length > 0) {
      console.log(`   ✅ Cloudflare 통과 (${Math.round((Date.now() - startTime) / 1000)}초)`);
      return true;
    }
    
    await delay(1000);
  }
  
  console.log(`   ⚠️ Cloudflare 대기 시간 초과`);
  return false;
}

function createSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 80);
}

function parseAmount(text: string): number {
  const cleaned = text.replace(/[^0-9.]/g, '');
  return parseFloat(cleaned) || 0;
}

function parseCurrency(text: string): string {
  if (text.includes('$') || text.includes('USD')) return 'USD';
  if (text.includes('€') || text.includes('EUR')) return 'EUR';
  if (text.includes('£') || text.includes('GBP')) return 'GBP';
  if (text.includes('¥') || text.includes('JPY')) return 'JPY';
  if (text.includes('₩') || text.includes('KRW')) return 'KRW';
  return 'USD';
}

function parseDaysToGo(text: string): number | null {
  if (!text) return null;
  const daysMatch = text.match(/(\d+)\s*days?/i);
  if (daysMatch) return parseInt(daysMatch[1]);
  const hoursMatch = text.match(/(\d+)\s*hours?/i);
  if (hoursMatch) return 0;
  return null;
}

// ============================================
// Kickstarter 크롤러 클래스
// ============================================

class KickstarterCrawler {
  private browser: Browser | null = null;
  private page: Page | null = null;

  async init(): Promise<void> {
    console.log('🚀 Kickstarter 크롤러 시작...\n');

    this.browser = await puppeteer.launch({
      headless: CONFIG.headless,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920,1080',
        '--lang=en-US,en',
        // Cloudflare 우회를 위한 추가 옵션
        '--disable-blink-features=AutomationControlled',
      ],
    });

    this.page = await this.browser.newPage();

    // 더 자연스러운 User-Agent
    await this.page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
    );

    await this.page.setViewport({ width: 1920, height: 1080 });

    // webdriver 속성 숨기기 (봇 탐지 우회)
    await this.page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });
    });

    // 불필요한 리소스 차단 제거 - Cloudflare 체크에 필요할 수 있음
    // 이미지와 폰트만 차단
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
  // Discover 페이지에서 프로젝트 URL 목록 가져오기
  // ============================================

  async getProjectUrls(): Promise<string[]> {
    if (!this.page) throw new Error('브라우저가 초기화되지 않았습니다.');

    let url: string;
    
    if (CRAWL_MODE === 'search' && SEARCH_KEYWORD) {
      // 검색 모드
      const encodedKeyword = encodeURIComponent(SEARCH_KEYWORD);
      url = `https://www.kickstarter.com/discover/advanced?term=${encodedKeyword}&state=live&sort=popularity`;
      console.log(`📦 Kickstarter 검색: "${SEARCH_KEYWORD}" 크롤링 시작...`);
    } else {
      // 일반 모드
      url = 'https://www.kickstarter.com/discover/advanced';
      const params = new URLSearchParams();
      
      if (CATEGORY !== 'all' && CATEGORY_IDS[CATEGORY]) {
        params.append('category_id', CATEGORY_IDS[CATEGORY]);
      }
      params.append('sort', CRAWL_MODE === 'search' ? 'popularity' : CRAWL_MODE);
      params.append('state', 'live');
      
      url += '?' + params.toString();
      
      const modeLabel = {
        popularity: '인기순',
        newest: '최신순',
        end_date: '마감 임박순',
        most_funded: '최다 모금순',
        magic: '추천순',
        search: '검색',
      }[CRAWL_MODE];
      
      console.log(`📦 Kickstarter ${modeLabel} 크롤링 시작...`);
    }

    console.log(`   🔗 접속 중: ${url.substring(0, 60)}...\n`);

    await this.page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: CONFIG.timeout,
    });

    // Cloudflare 체크 통과 대기
    const cloudflareOk = await waitForCloudflare(this.page);
    if (!cloudflareOk) {
      console.log(`   ⚠️ Cloudflare 우회 실패`);
      return [];
    }

    await delay(2000);

    // 스크롤하여 더 많은 프로젝트 로드
    await this.autoScroll();

    const projectUrls = await this.page.evaluate(`
      (function() {
        var links = [];

        document.querySelectorAll('a[href*="/projects/"]').forEach(function(el) {
          var href = el.getAttribute('href');
          if (href && href.includes('/projects/') && !href.includes('/comments') && !href.includes('/updates') && !href.includes('/rewards')) {
            var match = href.match(/\\/projects\\/[^\\/]+\\/[^\\/\\?#]+/);
            if (match) {
              var fullUrl = match[0].startsWith('http')
                ? match[0]
                : 'https://www.kickstarter.com' + match[0];
              links.push(fullUrl);
            }
          }
        });

        return links.filter(function(value, index, self) {
          return self.indexOf(value) === index;
        });
      })()
    `) as string[];

    console.log(`📦 ${projectUrls.length}개 프로젝트 URL 발견\n`);
    return projectUrls.slice(0, CONFIG.maxProjects);
  }

  // ============================================
  // Kickstarter 댓글/업데이트 수집
  // ============================================

  private async extractKickstarterComments(url: string, maxComments: number = 10): Promise<Review[]> {
    if (!this.page) return [];

    const reviews: Review[] = [];
    
    try {
      // 댓글 페이지 URL 생성
      const commentsUrl = url + '/comments';
      
      console.log(`   🔍 댓글 수집 시작 (최대 ${maxComments}개)...`);
      
      await this.page.goto(commentsUrl, {
        waitUntil: 'networkidle2',
        timeout: CONFIG.timeout,
      });

      await delay(2000);

      // 페이지에서 댓글 추출
      const commentData = await this.page.evaluate(`
        (function() {
          var comments = [];
          
          // 댓글 컨테이너 찾기 (Kickstarter의 댓글 구조)
          var commentElements = document.querySelectorAll('[data-test-id="comment"], .pl0 .mb3, .comment');
          
          for (var i = 0; i < commentElements.length && i < ${maxComments}; i++) {
            var element = commentElements[i];
            
            // 댓글 내용
            var contentEl = element.querySelector('.body, .comment-body, p') || element;
            var content = contentEl.textContent ? contentEl.textContent.trim() : '';
            
            // 작성자 이름
            var authorEl = element.querySelector('.author, .name, strong, [data-test-id="comment-author"]');
            var author = authorEl ? authorEl.textContent.trim() : null;
            
            // 작성일
            var dateEl = element.querySelector('time, .date, [datetime]');
            var dateStr = dateEl ? (dateEl.getAttribute('datetime') || dateEl.textContent.trim()) : null;
            
            if (content && content.length > 10) {
              comments.push({
                content: content,
                reviewerName: author,
                reviewerCountry: null,
                rating: null,
                reviewDate: dateStr,
                helpfulCount: 0,
                isVerifiedPurchase: true, // Kickstarter 댓글은 후원자만 가능
                sourceReviewId: null,
              });
            }
          }
          
          return comments;
        })()
      `);

      for (const comment of commentData) {
        reviews.push({
          content: comment.content,
          reviewerName: comment.reviewerName,
          reviewerCountry: comment.reviewerCountry,
          rating: comment.rating,
          reviewDate: comment.reviewDate ? new Date(comment.reviewDate) : null,
          helpfulCount: comment.helpfulCount,
          isVerifiedPurchase: comment.isVerifiedPurchase,
          sourceReviewId: comment.sourceReviewId,
        });
      }

      console.log(`   ✅ ${reviews.length}개의 댓글 수집 완료`);

    } catch (error) {
      console.error(`   ⚠️ 댓글 수집 실패:`, error);
    }

    return reviews;
  }

  // ============================================
  // 프로젝트 상세 페이지 크롤링
  // ============================================

  async crawlProject(url: string): Promise<KickstarterProject | null> {
    if (!this.page) throw new Error('브라우저가 초기화되지 않았습니다.');

    console.log(`🔍 크롤링: ${url}`);

    try {
      await this.page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: CONFIG.timeout,
      });

      // Cloudflare 체크 통과 대기
      const cloudflareOk = await waitForCloudflare(this.page);
      if (!cloudflareOk) {
        console.log(`   ⚠️ Cloudflare 우회 실패, 건너뜀`);
        return null;
      }

      // 페이지 완전 로딩 대기
      await delay(2000);

      // 페이지 타이틀과 URL에서 기본 정보 추출
      const pageTitle = await this.page.title();

      console.log(`   📄 페이지 타이틀: ${pageTitle}`);

      // 브라우저 컨텍스트에서 실행 - Open Graph와 페이지 타이틀 활용
      const projectData = await this.page.evaluate(`
        (function() {
          function getMetaContent(property) {
            var el = document.querySelector('meta[property="' + property + '"]') ||
                     document.querySelector('meta[name="' + property + '"]');
            return el ? el.getAttribute('content') || '' : '';
          }

          function getText(selector) {
            var el = document.querySelector(selector);
            return el ? el.textContent.trim() : '';
          }

          // Open Graph 메타 태그에서 기본 정보 추출
          var ogTitle = getMetaContent('og:title');
          var ogDescription = getMetaContent('og:description');
          var ogImage = getMetaContent('og:image');

          // 페이지 타이틀에서 프로젝트 이름 추출 (형식: "프로젝트명 by 크리에이터 — Kickstarter")
          var pageTitle = document.title || '';
          var titleMatch = pageTitle.match(/^(.+?)\\s+by\\s+(.+?)\\s+[—-]\\s+Kickstarter/i);
          var title = titleMatch ? titleMatch[1].trim() : ogTitle.split(' by ')[0] || ogTitle;
          var creatorFromTitle = titleMatch ? titleMatch[2].trim() : '';

          // 펀딩 정보 - 페이지 전체 텍스트에서 추출
          var bodyText = document.body.innerText || '';
          
          // 금액 패턴 매칭 ($123,456 pledged)
          var pledgedMatch = bodyText.match(/\\$([\\d,]+)\\s*pledged/i) ||
                            bodyText.match(/([\\d,]+)\\s*USD\\s*pledged/i);
          var pledgedText = pledgedMatch ? pledgedMatch[1].replace(/,/g, '') : '0';

          // 목표 금액 (goal of $50,000)
          var goalMatch = bodyText.match(/goal\\s+of\\s+\\$([\\d,]+)/i) ||
                         bodyText.match(/\\$([\\d,]+)\\s*goal/i);
          var goalText = goalMatch ? goalMatch[1].replace(/,/g, '') : '0';

          // 후원자 수
          var backersMatch = bodyText.match(/([\\d,]+)\\s*backers?/i);
          var backersText = backersMatch ? backersMatch[1].replace(/,/g, '') : '0';

          // 달성률
          var percentMatch = bodyText.match(/(\\d+)%\\s*funded/i);
          var percentText = percentMatch ? percentMatch[1] : '0';

          // 남은 기간
          var daysMatch = bodyText.match(/(\\d+)\\s*days?\\s*to\\s*go/i);
          var daysText = daysMatch ? daysMatch[1] : '';

          // 프로젝트 상태
          var state = 'live';
          var lowerText = bodyText.toLowerCase();
          if (lowerText.includes('successfully funded')) state = 'successful';
          else if (lowerText.includes('funding unsuccessful')) state = 'failed';
          else if (lowerText.includes('project canceled')) state = 'canceled';
          else if (lowerText.includes('suspended')) state = 'suspended';

          // 카테고리 - 링크에서 추출
          var categoryLinks = document.querySelectorAll('a[href*="/discover/categories/"]');
          var category = '';
          for (var i = 0; i < categoryLinks.length; i++) {
            var text = categoryLinks[i].textContent.trim();
            if (text && text.length > 0 && text.length < 50) {
              category = text;
              break;
            }
          }

          // 위치 정보
          var locationMatch = bodyText.match(/([A-Za-z\\s]+,\\s*[A-Za-z\\s]+)(?:\\s|$)/);
          var location = '';

          // ============================================
          // 리워드 티어 크롤링
          // ============================================
          var rewards = [];
          var minRewardAmount = null;

          // 방법 1: "Pledge $XX or more" 패턴 찾기
          var pledgeMatches = bodyText.match(/Pledge\\s*\\$([\\d,]+)\\s*or\\s*more/gi) || [];
          pledgeMatches.forEach(function(match) {
            var amountMatch = match.match(/\\$([\\d,]+)/);
            if (amountMatch) {
              var amount = parseInt(amountMatch[1].replace(/,/g, ''));
              if (amount > 0) {
                rewards.push({ amount: amount, title: match });
              }
            }
          });

          // 방법 2: 리워드 섹션에서 금액 추출 (US$ XX 패턴)
          var rewardAmountMatches = bodyText.match(/US\\$\\s*([\\d,]+)(?:\\s|\\n)/gi) || [];
          rewardAmountMatches.forEach(function(match) {
            var amountMatch = match.match(/([\\d,]+)/);
            if (amountMatch) {
              var amount = parseInt(amountMatch[1].replace(/,/g, ''));
              // $1 이상, $10000 이하만 유효한 리워드로 간주
              if (amount >= 1 && amount <= 10000) {
                var exists = rewards.some(function(r) { return r.amount === amount; });
                if (!exists) {
                  rewards.push({ amount: amount, title: 'US$ ' + amount });
                }
              }
            }
          });

          // 방법 3: 일반적인 $ 금액 패턴 (리워드 영역에서)
          var dollarMatches = bodyText.match(/\\$([\\d,]+)(?:\\s|\\n|<)/gi) || [];
          dollarMatches.forEach(function(match) {
            var amountMatch = match.match(/([\\d,]+)/);
            if (amountMatch) {
              var amount = parseInt(amountMatch[1].replace(/,/g, ''));
              // 리워드로 적절한 범위 (1 ~ 5000)
              if (amount >= 1 && amount <= 5000) {
                var exists = rewards.some(function(r) { return r.amount === amount; });
                if (!exists) {
                  rewards.push({ amount: amount, title: '$ ' + amount });
                }
              }
            }
          });

          // 최소 리워드 금액 찾기 ($5 이하 제외 - 순수 후원 티어 제외)
          var MIN_REWARD_THRESHOLD = 5;
          if (rewards.length > 0) {
            var amounts = rewards.map(function(r) { return r.amount; }).filter(function(a) { return a > MIN_REWARD_THRESHOLD; });
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

          // 방법 3: data-video-url 속성에서 추출
          if (!videoUrl) {
            var videoContainer = document.querySelector('[data-video-url], [data-src-high], [data-src]');
            if (videoContainer) {
              videoUrl = videoContainer.getAttribute('data-video-url') || 
                        videoContainer.getAttribute('data-src-high') || 
                        videoContainer.getAttribute('data-src');
            }
          }

          // 방법 4: iframe에서 YouTube/Vimeo URL 추출
          if (!videoUrl) {
            var iframe = document.querySelector('iframe[src*="youtube"], iframe[src*="vimeo"], iframe[src*="kickstarter"]');
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

          // 방법 5: JSON-LD 스크립트에서 영상 URL 추출
          if (!videoUrl) {
            var jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
            jsonLdScripts.forEach(function(script) {
              try {
                var data = JSON.parse(script.textContent || '');
                if (data.video || data.videoObject) {
                  var video = data.video || data.videoObject;
                  if (Array.isArray(video)) video = video[0];
                  videoUrl = video.contentUrl || video.embedUrl || video.url;
                }
              } catch (e) {}
            });
          }

          return {
            title: title,
            blurb: ogDescription || '',
            description: ogDescription || '',
            thumbnailUrl: ogImage || '',
            videoUrl: videoUrl,
            pledgedText: pledgedText,
            goalText: goalText,
            backersText: backersText,
            percentText: percentText,
            daysText: daysText,
            state: state,
            category: category,
            location: location,
            creatorName: creatorFromTitle,
            creatorAvatar: null,
            minRewardAmount: minRewardAmount,
            rewards: rewards
          };
        })()
      `) as {
        title: string;
        blurb: string;
        description: string;
        thumbnailUrl: string;
        videoUrl: string | null;
        pledgedText: string;
        goalText: string;
        backersText: string;
        percentText: string;
        daysText: string;
        state: string;
        category: string;
        location: string;
        creatorName: string;
        creatorAvatar: string | null;
        minRewardAmount: number | null;
        rewards: { amount: number; title: string }[];
      };

      if (!projectData.title) {
        console.log('   ⚠️ 제목을 찾을 수 없음, 건너뜀');
        return null;
      }

      const project: KickstarterProject = {
        title: projectData.title,
        slug: createSlug(projectData.title) + `-${Date.now()}`,
        description: projectData.description,
        blurb: projectData.blurb,
        thumbnailUrl: projectData.thumbnailUrl,
        videoUrl: projectData.videoUrl,

        goalAmount: parseAmount(projectData.goalText),
        pledgedAmount: parseAmount(projectData.pledgedText),
        currency: parseCurrency(projectData.pledgedText || projectData.goalText),
        percentFunded: parseFloat(projectData.percentText.replace(/[^0-9.]/g, '')) || 0,
        backersCount: parseInt(projectData.backersText.replace(/[^0-9]/g, '')) || 0,

        deadline: null,
        daysToGo: parseDaysToGo(projectData.daysText),
        state: projectData.state as KickstarterProject['state'],

        category: projectData.category,
        subcategory: null,
        location: projectData.location,

        creatorName: projectData.creatorName,
        creatorAvatar: projectData.creatorAvatar,
        creatorBio: null,
        projectsCreated: 1,

        // 리워드 정보
        minRewardAmount: projectData.minRewardAmount,
        rewards: projectData.rewards.map(r => ({
          title: r.title,
          amount: r.amount,
          currency: 'USD',
          description: '',
          backersCount: 0,
          estimatedDelivery: null,
          shippingInfo: null,
          isLimited: false,
          remaining: null,
        })),

        sourceUrl: url,
        crawledAt: new Date().toISOString(),
      };

      // 리뷰 수집
      if (CRAWL_REVIEWS) {
        project.reviews = await this.extractKickstarterComments(url, MAX_REVIEWS);
      }

      console.log(`   ✅ "${project.title}"`);
      console.log(`      💰 ${project.pledgedAmount.toLocaleString()} ${project.currency} (${project.percentFunded}%)`);
      console.log(`      👥 ${project.backersCount.toLocaleString()}명 후원`);
      if (project.minRewardAmount) {
        console.log(`      🎁 최소 리워드: $${project.minRewardAmount}`);
      }
      if (project.videoUrl) {
        console.log(`      🎬 영상 URL: ${project.videoUrl.substring(0, 50)}...`);
      }
      if (project.reviews && project.reviews.length > 0) {
        console.log(`      💬 댓글: ${project.reviews.length}개 수집됨`);
      }
      console.log('');

      return project;

    } catch (error) {
      console.error(`   ❌ 크롤링 실패:`, error);
      return null;
    }
  }

  // ============================================
  // 자동 스크롤 (더 많은 콘텐츠 로드)
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

async function saveToSupabase(project: KickstarterProject): Promise<string | null> {
  // 가격 계산: 리워드 최소 금액 사용 (USD → KRW 환율 약 1400원)
  const USD_TO_KRW = 1400;
  const priceKrw = project.minRewardAmount 
    ? Math.round(project.minRewardAmount * USD_TO_KRW)
    : null;

  const productData: ProductInsert = {
    title: project.title,
    slug: project.slug,
    description: `${project.blurb}\n\n${project.description}`.substring(0, 5000),
    thumbnail_url: project.thumbnailUrl,
    video_url: project.videoUrl,
    original_price: project.minRewardAmount || project.goalAmount, // 리워드 금액 또는 목표 금액
    currency: project.currency,
    price_krw: priceKrw, // 리워드 최소 금액 기반
    source_platform: 'kickstarter',
    source_url: project.sourceUrl,
    external_rating: Math.min(project.percentFunded / 20, 5), // 달성률을 5점 만점으로
    external_review_count: project.backersCount,
    tags: [
      project.category,
      project.location,
      project.state,
      `${project.percentFunded}% funded`,
      `${project.backersCount} backers`,
      project.minRewardAmount ? `From $${project.minRewardAmount}` : '',
    ].filter(Boolean),
    is_featured: project.percentFunded >= 100,
    is_active: project.state === 'live',
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
      source_language: 'en',
      source_platform: 'kickstarter',
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
  console.log('🎯 Kickstarter 크롤러');
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

  const crawler = new KickstarterCrawler();

  try {
    await crawler.init();

    // ============================================
    // 방법 1: 특정 URL 목록 크롤링
    // ============================================

    const targetUrls: string[] = [
      // 여기에 크롤링할 프로젝트 URL을 추가하세요
      // 'https://www.kickstarter.com/projects/creator/project-name',
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
