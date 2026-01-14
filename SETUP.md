# 🚀 News Desk 설정 가이드

Supabase 프로젝트 설정부터 실행까지 단계별 가이드입니다.

---

## 1단계: Supabase 프로젝트 생성

### 1.1 Supabase 가입 및 프로젝트 생성

1. [Supabase](https://supabase.com) 접속
2. **Sign Up** 또는 **Sign In**
3. **New Project** 클릭
4. 프로젝트 정보 입력:
   - **Name**: `newsdesk` (원하는 이름)
   - **Database Password**: 강력한 비밀번호 설정 (기억해두세요!)
   - **Region**: `Northeast Asia (Seoul)` 또는 가장 가까운 지역
   - **Pricing Plan**: Free tier 선택
5. **Create new project** 클릭
6. 프로젝트 생성 완료까지 1-2분 대기

---

## 2단계: Supabase API 키 확인

### 2.1 프로젝트 설정에서 키 복사

1. Supabase 대시보드에서 프로젝트 선택
2. 왼쪽 메뉴에서 **Settings** (⚙️) 클릭
3. **API** 메뉴 클릭
4. 다음 두 값을 복사:
   - **Project URL** (예: `https://xxxxx.supabase.co`)
   - **anon public** 키 (``anon`` `public` 키)

---

## 3단계: 환경 변수 파일 생성

### 3.1 `.env.local` 파일 생성

프로젝트 루트 디렉토리에 `.env.local` 파일을 생성하고 아래 내용을 입력:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# n8n Webhook (선택사항 - AI 리드 생성 기능 사용 시)
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/newsdesk-generate-leads
```

**예시:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYzODk2NzI4MCwiZXhwIjoxOTU0NTQzMjgwfQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

⚠️ **주의**: `.env.local` 파일은 Git에 커밋하지 마세요! (이미 `.gitignore`에 포함되어 있습니다)

---

## 4단계: 데이터베이스 스키마 생성

### 4.1 SQL Editor에서 스키마 실행

1. Supabase 대시보드에서 왼쪽 메뉴 **SQL Editor** 클릭
2. **New query** 클릭
3. `supabase/schema.sql` 파일의 전체 내용을 복사
4. SQL Editor에 붙여넣기
5. **Run** 버튼 클릭 (또는 `Cmd/Ctrl + Enter`)
6. 성공 메시지 확인:
   - "Success. No rows returned"
   - 또는 각 테이블 생성 성공 메시지

### 4.2 테이블 생성 확인

1. 왼쪽 메뉴에서 **Table Editor** 클릭
2. 다음 테이블들이 생성되었는지 확인:
   - ✅ `articles`
   - ✅ `union_news`
   - ✅ `documents`
   - ✅ `settings`

---

## 5단계: Authentication 설정

### 5.1 Email Provider 활성화

1. Supabase 대시보드에서 왼쪽 메뉴 **Authentication** 클릭
2. 상단 탭에서 **Providers** 클릭
3. 페이지에서 **Email** 카드/섹션 찾기
4. **Email** 카드를 클릭하거나 **Enable Email provider** 토글을 **ON**으로 설정

### 5.2 Magic Link 설정

**Email Provider 설정 화면에서:**

1. **Email** 섹션이 열리면 아래 설정들을 확인:
   - **Enable Email provider**: ✅ **ON** (토글 활성화)
   - **Confirm email**: 개발 중에는 **OFF** (빠른 테스트용, 체크 해제)
   - **Secure email change**: **OFF** (개발용, 체크 해제)

2. **Magic Link 설정 찾기:**
   - Email 설정 화면을 아래로 스크롤
   - **"Enable Magic Link"** 또는 **"Magic Link"** 옵션 찾기
   - ✅ **ON** 또는 체크박스 활성화

   💡 **참고**: 최신 Supabase UI에서는 Magic Link가 기본적으로 활성화되어 있을 수 있습니다. 
   Email provider가 활성화되어 있으면 Magic Link도 자동으로 사용 가능합니다.

3. **Save** 버튼 클릭 (화면 하단 또는 상단)

**⚠️ 만약 Magic Link 옵션이 보이지 않는다면:**
- Email provider만 활성화해도 Magic Link가 작동합니다
- 로그인 페이지에서 "매직링크로 로그인" 체크박스를 선택하면 자동으로 Magic Link 방식으로 로그인됩니다

### 5.3 리다이렉트 URL 설정 (중요!)

매직링크 로그인이 제대로 작동하려면 리다이렉트 URL을 허용 목록에 추가해야 합니다:

1. Supabase 대시보드 → **Authentication** → **URL Configuration** 클릭
2. **Redirect URLs** 섹션에서 **Add URL** 클릭
3. 다음 URL들을 추가:
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000/dashboard`
   - (프로덕션 배포 시) `https://yourdomain.com/auth/callback`
   - (프로덕션 배포 시) `https://yourdomain.com/dashboard`
4. **Save** 클릭

💡 **참고**: 개발 환경에서는 `http://localhost:3000/*` 패턴으로 와일드카드 사용도 가능합니다.

### 5.4 OTP 만료 시간 설정 (매직 링크 만료 방지)

매직 링크가 너무 빨리 만료되는 문제를 방지하려면:

1. Supabase 대시보드 → **Authentication** → **URL Configuration** 클릭
2. **JWT expiry** 또는 **Token expiry** 설정 찾기
3. 기본값은 보통 **3600초 (1시간)**입니다
4. 필요시 더 긴 시간으로 설정 (예: **7200초 = 2시간** 또는 **86400초 = 24시간**)
5. **Save** 클릭

⚠️ **중요**: 
- 보안을 위해 너무 긴 만료 시간은 권장하지 않습니다
- 개발 환경에서는 2-24시간 정도가 적절합니다
- 프로덕션 환경에서는 1-2시간을 권장합니다

**또는 Email Template에서 만료 시간 안내:**

1. **Authentication** → **Email Templates** 클릭
2. **Magic Link** 템플릿 선택
3. 이메일 본문에 "이 링크는 1시간 동안 유효합니다" 같은 안내 추가 가능

### 5.4 (선택) 이메일 템플릿 커스터마이징

1. **Authentication** → **Email Templates** 메뉴
2. 원하는 대로 이메일 템플릿 수정 가능
3. 개발 중에는 기본 템플릿으로도 충분합니다

---

## 6단계: 개발 서버 실행

### 6.1 의존성 확인

```bash
npm install
```

### 6.2 개발 서버 시작

```bash
npm run dev
```

### 6.3 브라우저에서 확인

1. 브라우저에서 [http://localhost:3000](http://localhost:3000) 열기
2. 자동으로 `/login` 페이지로 리다이렉트됨
3. 로그인 페이지가 정상적으로 표시되는지 확인

---

## 7단계: 첫 사용자 계정 생성

### 7.1 이메일로 회원가입

1. 로그인 페이지에서:
   - 이메일 주소 입력 (예: `test@example.com`)
   - **매직링크로 로그인** 체크박스 선택
   - **로그인 링크 보내기** 클릭
2. 이메일 확인:
   - 입력한 이메일 주소의 받은편지함 확인
   - Supabase에서 보낸 이메일 확인
   - **Confirm your email** 또는 **로그인 링크** 클릭
3. 자동으로 `/dashboard`로 리다이렉트됨

### 7.2 비밀번호로 회원가입 (대안)

1. 로그인 페이지에서:
   - **매직링크로 로그인** 체크박스 해제
   - 이메일과 비밀번호 입력
   - **로그인** 클릭
2. 첫 로그인 시 자동으로 계정 생성됨

---

## 8단계: 테스트 데이터 추가 (선택)

### 8.1 조합소식 테스트 데이터 추가

Supabase 대시보드 → **Table Editor** → `union_news` 테이블 선택 → **Insert row** 클릭:

```json
{
  "user_id": "your-user-id-here",  // Authentication → Users에서 복사
  "title": "강남구 A구역 재개발 조합 총회 개최",
  "event_type": "총회",
  "association_name": "강남구 A구역 재개발조합",
  "district_name": "A구역",
  "region_si": "서울",
  "region_gu": "강남구",
  "event_date": "2024-01-15",
  "published_at": "2024-01-10",
  "summary": "강남구 A구역 재개발조합이 오는 15일 총회를 개최한다고 발표했습니다.",
  "source_name": "조합 공지",
  "source_url": "https://example.com/news/1"
}
```

⚠️ **주의**: `user_id`는 반드시 현재 로그인한 사용자의 ID여야 합니다!

---

## 문제 해결

### 환경 변수가 적용되지 않을 때

1. 개발 서버 재시작:
   ```bash
   # 서버 중지 (Ctrl + C)
   npm run dev
   ```
2. `.env.local` 파일 경로 확인 (프로젝트 루트에 있어야 함)
3. 파일 이름 확인 (`.env.local` 정확히)

### 로그인 후 리다이렉트가 안 될 때

1. 브라우저 콘솔 확인 (F12)
2. Supabase 연결 확인:
   - `.env.local`의 URL과 키가 정확한지 확인
   - Supabase 대시보드에서 프로젝트가 활성화되어 있는지 확인

### RLS 정책 오류

1. Supabase 대시보드 → **Authentication** → **Policies** 확인
2. `supabase/schema.sql`이 정상적으로 실행되었는지 확인
3. SQL Editor에서 다시 실행해보기

### 테이블이 보이지 않을 때

1. **Table Editor**에서 새로고침
2. SQL Editor에서 테이블 목록 확인:
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public';
   ```

---

## 다음 단계

설정이 완료되면:

1. ✅ 로그인/로그아웃 테스트
2. ✅ 조합소식 페이지 확인
3. ✅ 테스트 데이터 추가 및 조회 테스트
4. 📝 기사 작성 기능 구현
5. 📝 자료 업로드 기능 구현
6. 📝 n8n 연동

---

## 참고 자료

- [Supabase 공식 문서](https://supabase.com/docs)
- [Next.js + Supabase 가이드](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Supabase Auth 문서](https://supabase.com/docs/guides/auth)
