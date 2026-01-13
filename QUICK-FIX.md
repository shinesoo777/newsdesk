# 🔧 Supabase 데이터 없음 문제 빠른 해결

## 문제: Supabase에 데이터가 하나도 없음

### 원인 1: 환경 변수 이름 오류

**현재 (잘못됨):**
```env
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=...
```

**올바른 이름:**
```env
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

### 해결 방법

#### 1. 로컬 환경 변수 수정

`.env.local` 파일 수정:

```env
NEXT_PUBLIC_SUPABASE_URL=https://ajnazrafmwqgrgwagded.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_W0jBuMajvaEa_Y34IHdP-A_yLbySnbz
```

**⚠️ 중요**: `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`로 변경

#### 2. Vercel 환경 변수 수정

1. Vercel 대시보드 → 프로젝트 → **Settings** → **Environment Variables**
2. 잘못된 변수 삭제:
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` 삭제
3. 올바른 변수 추가:
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `sb_publishable_W0jBuMajvaEa_Y34IHdP-A_yLbySnbz`
4. **Redeploy** 실행

#### 3. Supabase에서 올바른 키 확인

Supabase 대시보드에서:
1. **Settings** → **API**
2. **Project API keys** 섹션
3. **anon public** 키 복사 (이것이 `NEXT_PUBLIC_SUPABASE_ANON_KEY`)

### 원인 2: user_id 문제

n8n에서 데이터를 전송할 때 `user_id`가 없으면 저장되지 않습니다.

**해결:**

n8n 워크플로우에서 Webhook Body에 추가:

```json
{
  "default_user_id": "your-user-uuid-here",
  "items": [...]
}
```

**user_id 확인 방법:**
1. Supabase 대시보드 → **Authentication** → **Users**
2. 사용자 선택 → **UUID** 복사

### 원인 3: 데이터베이스 스키마 미생성

테이블이 생성되지 않았을 수 있습니다.

**해결:**

1. Supabase 대시보드 → **SQL Editor**
2. `supabase/schema.sql` 파일 내용 복사
3. 실행
4. 테이블 생성 확인 (Table Editor에서)

## 빠른 테스트

### 1. 로컬에서 테스트

```bash
# 개발 서버 실행
npm run dev

# 다른 터미널에서
curl -X POST http://localhost:3000/api/union-news/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "default_user_id": "YOUR_USER_ID",
    "items": [
      {
        "title": "테스트 조합소식",
        "event_date": "2024-01-15",
        "event_type": "총회",
        "region_si": "서울",
        "region_gu": "강남구"
      }
    ]
  }'
```

### 2. Vercel에서 테스트

```bash
curl -X POST https://your-project.vercel.app/api/union-news/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "default_user_id": "YOUR_USER_ID",
    "items": [
      {
        "title": "테스트 조합소식",
        "event_date": "2024-01-15",
        "event_type": "총회"
      }
    ]
  }'
```

### 3. Supabase에서 직접 확인

1. Supabase 대시보드 → **Table Editor**
2. `union_news` 테이블 선택
3. 데이터 확인

## 체크리스트

- [ ] 환경 변수 이름이 `NEXT_PUBLIC_SUPABASE_ANON_KEY`인가?
- [ ] Vercel 환경 변수도 올바르게 설정되었는가?
- [ ] Vercel 재배포를 실행했는가?
- [ ] Supabase에서 테이블이 생성되었는가?
- [ ] user_id를 n8n에서 전달하고 있는가?
- [ ] Vercel 함수 로그에서 에러가 없는가?

## 다음 단계

1. 환경 변수 수정
2. Vercel 재배포
3. n8n 워크플로우에서 `default_user_id` 추가
4. 테스트 실행
5. Supabase에서 데이터 확인
