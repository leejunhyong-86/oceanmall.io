# Vercel 배포 문제 해결 가이드

## 결제 위젯이 표시되지 않는 문제

### 증상
- 개발 서버에서는 정상 작동
- Vercel 프로덕션에서는 결제 위젯이 표시되지 않음

### 원인
Vercel 환경 변수가 설정되지 않았거나, 빌드 시점에 환경 변수가 제대로 주입되지 않았을 수 있습니다.

### 해결 방법

#### 1. Vercel 환경 변수 확인

1. [Vercel 대시보드](https://vercel.com/dashboard) 접속
2. 프로젝트 선택
3. **Settings** > **Environment Variables** 클릭
4. 다음 변수들이 설정되어 있는지 확인:

**필수 환경 변수:**
```
NEXT_PUBLIC_TOSS_CLIENT_KEY=test_gck_xxxxx (또는 live_gck_xxxxx)
TOSS_SECRET_KEY=test_gsk_xxxxx (또는 live_gsk_xxxxx)
```

**Environment 설정:**
- Production: ✅ 체크
- Preview: ✅ 체크 (선택)
- Development: ✅ 체크 (선택)

#### 2. 환경 변수 추가 방법

1. **Environment Variables** 페이지에서 **Add New** 클릭
2. **Key** 입력: `NEXT_PUBLIC_TOSS_CLIENT_KEY`
3. **Value** 입력: 토스페이먼츠 개발자센터에서 복사한 키
4. **Environment** 선택: Production, Preview, Development 모두 선택
5. **Save** 클릭
6. `TOSS_SECRET_KEY`도 동일하게 추가

#### 3. 재배포

환경 변수를 추가한 후:

1. **Deployments** 탭으로 이동
2. 최신 배포의 **...** 메뉴 클릭
3. **Redeploy** 선택
4. 또는 새로운 커밋을 푸시하여 자동 재배포

#### 4. 빌드 로그 확인

1. **Deployments** 탭에서 배포 클릭
2. **Build Logs** 확인
3. 다음 메시지가 있는지 확인:
   - `NEXT_PUBLIC_TOSS_CLIENT_KEY` 관련 에러
   - 환경 변수 관련 경고

### 확인 방법

배포 후 브라우저 콘솔(F12)에서 확인:

1. **환경 변수 확인:**
   ```javascript
   // 브라우저 콘솔에서 실행
   console.log('TOSS_CLIENT_KEY:', process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY);
   ```
   - `undefined`가 나오면 환경 변수가 설정되지 않은 것

2. **에러 메시지 확인:**
   - "토스페이먼츠 클라이언트 키가 설정되지 않았습니다"
   - "결제위젯 연동 키의 클라이언트 키로 SDK를 연동해주세요"

### 추가 체크리스트

- [ ] Vercel 환경 변수에 `NEXT_PUBLIC_TOSS_CLIENT_KEY` 설정됨
- [ ] Vercel 환경 변수에 `TOSS_SECRET_KEY` 설정됨
- [ ] Environment가 Production으로 설정됨
- [ ] 환경 변수 추가 후 재배포 완료
- [ ] 빌드 로그에 에러 없음
- [ ] 브라우저 콘솔에 환경 변수 관련 에러 없음

### 참고

- `NEXT_PUBLIC_` 접두사가 있는 변수만 클라이언트에서 접근 가능
- 환경 변수 변경 후 반드시 재배포 필요
- 빌드 시점에 환경 변수가 번들에 포함됨
