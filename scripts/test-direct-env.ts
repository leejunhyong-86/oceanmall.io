// .env 파일을 직접 읽어서 확인
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const envPath = resolve(process.cwd(), '.env');
const envLocalPath = resolve(process.cwd(), '.env.local');

console.log('\n파일 존재 확인:\n');
console.log(`.env 파일: ${existsSync(envPath) ? '✅ 존재' : '❌ 없음'}`);
console.log(`.env.local 파일: ${existsSync(envLocalPath) ? '✅ 존재' : '❌ 없음'}`);

if (existsSync(envPath)) {
  console.log('\n.env 파일 내용 (AI 관련만):');
  const content = readFileSync(envPath, 'utf-8');
  const lines = content.split('\n');
  const aiLines = lines.filter(line => 
    line.includes('AI_PROVIDER') || 
    line.includes('OPENAI_API_KEY') ||
    line.includes('AI_MODEL')
  );
  
  if (aiLines.length > 0) {
    aiLines.forEach(line => {
      if (line.includes('OPENAI_API_KEY')) {
        // API 키는 마스킹
        const parts = line.split('=');
        if (parts[1] && parts[1].length > 10) {
          console.log(`   ${parts[0]}=sk-...${parts[1].slice(-4)}`);
        } else {
          console.log(`   ${line} (너무 짧음)`);
        }
      } else {
        console.log(`   ${line}`);
      }
    });
  } else {
    console.log('   ⚠️  AI 관련 설정이 없습니다!');
    console.log('\n다음 내용을 .env 파일에 추가하세요:');
    console.log('   AI_PROVIDER=openai');
    console.log('   OPENAI_API_KEY=sk-proj-your-key-here');
  }
}

console.log('');
