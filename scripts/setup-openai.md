# OpenAI API 설정 가이드

## 1️⃣ .env.local 파일 열기

프로젝트 루트의 `.env.local` 파일을 VS Code나 메모장으로 엽니다.

## 2️⃣ 맨 아래에 다음 내용 추가 (이미 추가되어 있으면 수정만)

```env
# AI 서비스 설정
AI_PROVIDER=openai
OPENAI_API_KEY=sk-proj-여기에-실제-API-키-입력
AI_MODEL=gpt-4o-mini
```

## 3️⃣ API 키 교체

- `sk-proj-여기에-실제-API-키-입력` 부분을 
- **실제 OpenAI API 키**로 교체

### API 키 예시:
```
OPENAI_API_KEY=sk-proj-abc123def456ghi789...
```

## 4️⃣ 파일 저장

- **Ctrl+S** (Windows)
- **Cmd+S** (Mac)

## 5️⃣ 설정 확인

터미널에서 실행:
```bash
pnpm tsx scripts/check-env.ts
```

✅가 보이면 성공!

## 6️⃣ OpenAI로 리뷰 처리

```bash
pnpm tsx scripts/reset-and-process.ts
```

---

## ❓ OpenAI API 키가 없다면?

1. https://platform.openai.com/api-keys 접속
2. 로그인
3. "Create new secret key" 클릭
4. 생성된 키 복사 (sk-proj-로 시작)
5. .env.local에 붙여넣기

**주의**: API 키는 한 번만 표시되므로 꼭 저장하세요!

---

## 💰 비용

- GPT-4o-mini 사용 (저렴한 모델)
- 리뷰 11개 처리: 약 $0.01-0.02 예상
- 첫 사용자는 무료 크레딧($5) 제공
