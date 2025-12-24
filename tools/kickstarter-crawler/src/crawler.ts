/**
 * @file src/crawler.ts
 * @description Kickstarter 프로젝트 크롤러
 *
 * 사용법: pnpm crawl
 *
 * 이 스크립트는 Kickstarter에서 프로젝트 데이터를 크롤링하여
 * Supabase 데이터베이스에 저장합니다.
 *
 * 주요 기능:
 * 1. 프로젝트 목록 페이지 크롤링
 * 2. 프로젝트 상세 정보 추출
 * 3. 리워드 티어 정보 추출
 * 4. Supabase products 테이블에 저장
 */

import 'dotenv/config';
import puppeteer, { Browser, Page } from 'puppeteer';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { KickstarterProject, RewardTier, CrawlConfig, ProductInsert } from './types.js';

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

const CONFIG: CrawlConfig = {
  headless: true,       // false: 브라우저 창 표시 (디버깅용)
  timeout: 60000,       // 60초 타임아웃
  delay: 3000,          // 요청 간 3초 대기 (차단 방지)
  retryCount: 3,        // 실패 시 재시도 횟수
  maxProjects: 10,      // 한 번에 크롤링할 최대 프로젝트 수
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

  async getProjectUrls(
    category?: string,
    sort: 'magic' | 'popularity' | 'newest' | 'end_date' | 'most_funded' = 'popularity'
  ): Promise<string[]> {
    if (!this.page) throw new Error('브라우저가 초기화되지 않았습니다.');

    let url = 'https://www.kickstarter.com/discover/advanced';
    const params = new URLSearchParams();

    if (category) params.append('category_id', category);
    params.append('sort', sort);
    params.append('state', 'live');

    url += '?' + params.toString();

    console.log(`📂 프로젝트 목록 페이지: ${url}\n`);

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
      const pageUrl = this.page.url();

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

          return {
            title: title,
            blurb: ogDescription || '',
            description: ogDescription || '',
            thumbnailUrl: ogImage || '',
            videoUrl: null,
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

      console.log(`   ✅ "${project.title}"`);
      console.log(`      💰 ${project.pledgedAmount.toLocaleString()} ${project.currency} (${project.percentFunded}%)`);
      console.log(`      👥 ${project.backersCount.toLocaleString()}명 후원`);
      if (project.minRewardAmount) {
        console.log(`      🎁 최소 리워드: $${project.minRewardAmount}`);
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

  console.log(`   💾 저장 완료: ${data.id}\n`);
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
      // 방법 2: 인기 프로젝트 자동 수집
      // ============================================

      console.log('\n📂 인기 프로젝트 자동 수집 모드\n');

      const projectUrls = await crawler.getProjectUrls(undefined, 'popularity');

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

