# Vercel 배포 가이드

## 1. Vercel에 배포하기

### 1.1 GitHub에 푸시

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

### 1.2 Vercel에 프로젝트 연결

1. [Vercel](https://vercel.com) 접속
2. **Add New Project** 클릭
3. GitHub 저장소 선택
4. 프로젝트 설정:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (기본값)
   - **Build Command**: `npm run build` (자동 감지)
   - **Output Directory**: `.next` (자동 감지)

### 1.3 환경 변수 설정

**Environment Variables** 섹션에서 다음 추가:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
N8N_WEBHOOK_API_KEY=your-secret-key (선택사항)
```

**⚠️ 중요**: 
- `NEXT_PUBLIC_` 접두사가 있는 변수는 클라이언트에서도 접근 가능
- 환경 변수 추가 후 **Redeploy** 필요

### 1.4 배포

1. **Deploy** 클릭
2. 배포 완료 대기 (약 1-2분)
3. 배포된 URL 확인: `https://your-project.vercel.app`

## 2. 도메인 확인

### 2.1 기본 도메인

Vercel은 자동으로 다음 형식의 도메인을 생성:
- `your-project-name.vercel.app`

### 2.2 커스텀 도메인 (선택사항)

1. Vercel 대시보드 → 프로젝트 → **Settings** → **Domains**
2. 원하는 도메인 추가
3. DNS 설정 (Vercel 가이드 따르기)

## 3. Supabase Redirect URLs 설정 (매직 링크 필수!)

### 3.1 배포 도메인을 Supabase에 등록

매직 링크가 올바르게 작동하려면 배포된 도메인을 Supabase에 등록해야 합니다:

1. **Supabase 대시보드** 접속
2. **Authentication** → **URL Configuration** 클릭
3. **Redirect URLs** 섹션에서 **Add URL** 클릭
4. 다음 URL들을 추가:
   ```
   https://your-project.vercel.app/auth/callback
   https://your-project.vercel.app/dashboard
   ```
   또는 커스텀 도메인 사용 시:
   ```
   https://your-custom-domain.com/auth/callback
   https://your-custom-domain.com/dashboard
   ```
5. **Save** 클릭

⚠️ **중요**: 이 설정을 하지 않으면 매직 링크가 localhost로 리다이렉트됩니다!

### 3.2 테스트

1. 배포된 사이트에서 매직 링크 로그인 시도
2. 이메일에서 링크 클릭
3. 배포된 도메인으로 리다이렉트되는지 확인

---

## 4. n8n에서 사용할 URL

### 3.1 Webhook URL

배포 후 다음 URL을 n8n에서 사용:

```
https://your-project.vercel.app/api/union-news/webhook
```

또는 커스텀 도메인 사용 시:

```
https://your-custom-domain.com/api/union-news/webhook
```

### 3.2 리드 생성 API URL

```
https://your-project.vercel.app/api/generate-leads
```

## 5. 환경 변수 확인

### 4.1 Vercel 대시보드에서 확인

1. 프로젝트 → **Settings** → **Environment Variables**
2. 모든 변수가 올바르게 설정되었는지 확인
3. **Production**, **Preview**, **Development** 환경별로 설정 가능

### 4.2 배포 후 테스트

브라우저에서 접속:
- `https://your-project.vercel.app` → 로그인 페이지 표시 확인
- `https://your-project.vercel.app/api/union-news/webhook` → POST 요청 테스트

## 6. 트러블슈팅

### 문제: 환경 변수가 적용되지 않음
- **해결**: 환경 변수 추가 후 **Redeploy** 실행
- **해결**: 변수 이름 확인 (`NEXT_PUBLIC_` 접두사)

### 문제: API 엔드포인트가 404
- **해결**: 파일 경로 확인 (`app/api/.../route.ts`)
- **해결**: 빌드 로그 확인

### 문제: Supabase 연결 오류
- **해결**: 환경 변수 값 확인
- **해결**: Supabase 프로젝트가 활성화되어 있는지 확인

### 문제: 매직 링크가 localhost로 리다이렉트됨
- **해결**: Supabase → Authentication → URL Configuration에서 배포 도메인 추가
- **해결**: `https://your-project.vercel.app/auth/callback` URL이 Redirect URLs 목록에 있는지 확인
- **해결**: 환경 변수 추가 후 Vercel에서 **Redeploy** 실행

## 7. 자동 배포 설정

### 6.1 GitHub 연동

기본적으로 GitHub에 푸시하면 자동 배포됩니다:
- `main` 브랜치 → Production 배포
- 다른 브랜치 → Preview 배포

### 6.2 배포 알림

Vercel에서 배포 상태를 확인:
- **Deployments** 탭에서 배포 이력 확인
- 배포 성공/실패 알림

## 8. n8n에서 사용하기

### 7.1 Webhook URL 설정

n8n 워크플로우에서:
1. **HTTP Request** 노드 추가
2. **URL**에 Vercel 도메인 입력:
   ```
   https://your-project.vercel.app/api/union-news/webhook
   ```
3. **Method**: POST
4. **Headers**: 
   - `Content-Type: application/json`
   - `Authorization: Bearer YOUR_API_KEY` (선택사항)

### 7.2 테스트

1. n8n에서 워크플로우 수동 실행
2. Vercel 함수 로그 확인 (Vercel 대시보드 → **Functions**)
3. Supabase에서 데이터 확인

## 참고

- [Vercel 공식 문서](https://vercel.com/docs)
- [Next.js 배포 가이드](https://nextjs.org/docs/deployment)
