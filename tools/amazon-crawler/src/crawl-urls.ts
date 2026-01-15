/**
 * @file crawl-urls.ts
 * @description URL 목록 파일에서 읽어서 크롤링하는 스크립트
 * 
 * 사용법:
 * 1. urls.txt 파일에 크롤링할 URL 목록 작성 (한 줄에 하나씩)
 * 2. pnpm crawl:urls 실행
 */

import 'dotenv/config';
import { readFileSync, existsSync, writeFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const URLS_FILE = join(__dirname, '..', 'urls.txt');
const URLS_BACKUP_FILE = join(__dirname, '..', 'urls-backup.txt');

/**
 * urls.txt 파일에서 URL 목록 읽기
 */
function loadUrlsFromFile(): string[] {
  if (!existsSync(URLS_FILE)) {
    console.log('📝 urls.txt 파일이 없습니다. 새로 생성합니다.');
    writeFileSync(URLS_FILE, '# Amazon 상품 URL 목록\n# 한 줄에 하나씩 URL을 입력하세요\n# 예시: https://www.amazon.com/dp/B0BZYCJK89\n', 'utf-8');
    return [];
  }

  const content = readFileSync(URLS_FILE, 'utf-8');
  const urls = content
    .split('\n')
    .map(line => line.trim())
    .filter(line => {
      // 주석 제거 (#로 시작하는 줄)
      if (line.startsWith('#')) return false;
      // 빈 줄 제거
      if (line.length === 0) return false;
      // URL 형식 검증 (기본적인 검증)
      return line.includes('amazon.com') || line.includes('amzn.to');
    });

  return urls;
}

/**
 * URL 목록을 환경변수 형식으로 출력
 */
function formatUrlsForEnv(urls: string[]): string {
  return urls.join(',');
}

/**
 * URL 목록 백업
 */
function backupUrls(urls: string[]): void {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupContent = `# 백업 일시: ${timestamp}\n${urls.join('\n')}\n`;
  writeFileSync(URLS_BACKUP_FILE, backupContent, 'utf-8');
  console.log(`💾 URL 목록이 ${URLS_BACKUP_FILE}에 백업되었습니다.`);
}

/**
 * 메인 함수
 */
function main() {
  console.log('📋 URL 목록 파일에서 크롤링할 상품 읽기...\n');

  const urls = loadUrlsFromFile();

  if (urls.length === 0) {
    console.log('❌ 크롤링할 URL이 없습니다.');
    console.log(`\n📝 ${URLS_FILE} 파일에 URL을 입력하세요.`);
    console.log('   예시:');
    console.log('   https://www.amazon.com/dp/B0BZYCJK89');
    console.log('   https://www.amazon.com/dp/B08N5WRWNW');
    process.exit(1);
  }

  console.log(`✅ ${urls.length}개의 URL을 찾았습니다:\n`);
  urls.forEach((url, idx) => {
    console.log(`   [${idx + 1}] ${url}`);
  });

  // 백업
  backupUrls(urls);

  // 환경변수 형식으로 출력
  const envFormat = formatUrlsForEnv(urls);
  
  console.log('\n🚀 크롤링 실행 명령어:');
  console.log(`\n   CRAWL_MODE=direct-url PRODUCT_URLS="${envFormat}" pnpm crawl\n`);
  
  // 자동 실행 옵션
  const autoRun = process.argv.includes('--run');
  if (autoRun) {
    console.log('⚡ 자동 실행 모드: 크롤러를 실행합니다...\n');
    process.env.CRAWL_MODE = 'direct-url';
    process.env.PRODUCT_URLS = envFormat;
    
    // 크롤러 실행
    import('./crawler.js').catch(err => {
      console.error('❌ 크롤러 실행 실패:', err);
      process.exit(1);
    });
  } else {
    console.log('💡 자동 실행하려면 --run 플래그를 추가하세요:');
    console.log(`   pnpm crawl:urls --run\n`);
  }
}

main();
