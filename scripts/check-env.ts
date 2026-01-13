import { config } from 'dotenv';
import { resolve } from 'path';

// .env 파일 먼저 읽기 (기본값)
config({ path: resolve(process.cwd(), '.env') });
// .env.local 읽기 (덮어쓰기)
config({ path: resolve(process.cwd(), '.env.local') });

console.log('\n환경변수 확인:\n');
console.log(`AI_PROVIDER: ${process.env.AI_PROVIDER || '❌ 설정 안됨'}`);
console.log(`OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? '✅ 설정됨 (sk-...' + process.env.OPENAI_API_KEY.slice(-4) + ')' : '❌ 설정 안됨'}`);
console.log('');

if (!process.env.AI_PROVIDER) {
  console.log('⚠️  .env.local 파일에 다음을 추가하세요:');
  console.log('   AI_PROVIDER=openai');
  console.log('   OPENAI_API_KEY=sk-proj-...\n');
} else if (process.env.AI_PROVIDER === 'openai' && !process.env.OPENAI_API_KEY) {
  console.log('⚠️  OPENAI_API_KEY가 없습니다!');
  console.log('   https://platform.openai.com/api-keys 에서 발급받으세요.\n');
} else if (process.env.AI_PROVIDER === 'openai' && process.env.OPENAI_API_KEY) {
  console.log('✅ OpenAI 설정 완료!');
  console.log('   이제 pnpm tsx scripts/reset-and-process.ts 를 실행하세요.\n');
}
