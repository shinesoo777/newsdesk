# News Desk

재개발·재건축·정비사업 전문 기자 작업용 웹 앱

## 프로젝트 개요

개인 기자 작업용 웹 애플리케이션으로, 재개발·재건축·정비사업 관련 기사 작성 보조 및 조합소식 모니터링을 위한 도구입니다.

### 주요 기능

- ✅ 로그인 / 인증 (Supabase Auth)
- ✅ 기사 작성 워크스페이스
- ✅ 조합소식 리스트 (최근 2주 기본, 필터링 지원)
- 📝 자료 업로드 (준비 중)
- 📝 AI 기사 생성 (n8n 연동, 준비 중)
- 📝 개인 설정 (준비 중)

## 기술 스택

- **Frontend**: Next.js 16 (App Router), TypeScript, Tailwind CSS v4
- **Backend**: Supabase (Auth, Database, Storage)
- **AI Orchestration**: n8n (예정)

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. Supabase 설정

1. [Supabase](https://supabase.com)에서 새 프로젝트 생성
2. 프로젝트 설정에서 URL과 Anon Key 복사
3. `.env.local` 파일 생성:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# n8n Webhook (선택사항 - AI 리드 생성 기능 사용 시)
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/newsdesk-generate-leads
```

### 3. 데이터베이스 스키마 설정

Supabase 대시보드의 SQL Editor에서 `supabase/schema.sql` 파일의 내용을 실행하세요.

이 스크립트는 다음을 생성합니다:
- `articles` 테이블
- `union_news` 테이블
- `documents` 테이블
- `settings` 테이블
- RLS (Row Level Security) 정책
- 인덱스

### 4. Supabase Auth 설정

Supabase 대시보드에서:
1. Authentication → Providers → Email 활성화
2. Email Auth 설정:
   - Enable email provider: ON
   - Confirm email: OFF (개발 환경)
   - Magic Link: ON

### 5. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열면 로그인 페이지로 리다이렉트됩니다.

### 6. Vercel 배포 (선택사항)

프로덕션 배포를 원하는 경우:

1. GitHub에 코드 푸시
2. [Vercel](https://vercel.com)에서 프로젝트 연결
3. 환경 변수 설정 (Supabase URL, API 키 등)
4. 배포 완료 후 도메인 확인

자세한 내용은 `VERCEL-DEPLOY.md` 파일을 참고하세요.

## 프로젝트 구조

```
newsdesk/
├── app/
│   ├── login/              # 로그인 페이지
│   ├── dashboard/          # 대시보드 (인증 필요)
│   │   ├── articles/       # 기사 작성
│   │   ├── union-news/     # 조합소식 리스트
│   │   ├── documents/      # 자료 업로드
│   │   └── settings/       # 설정
│   └── layout.tsx          # 루트 레이아웃
├── components/             # 재사용 가능한 컴포넌트
│   ├── Header.tsx
│   ├── Sidebar.tsx
│   ├── UnionNewsCard.tsx
│   └── DateFilter.tsx
├── lib/
│   ├── supabase/           # Supabase 클라이언트
│   │   ├── client.ts      # 브라우저 클라이언트
│   │   └── server.ts       # 서버 클라이언트
│   └── auth.ts            # 인증 유틸리티
├── types/
│   └── database.ts        # 타입 정의
├── supabase/
│   └── schema.sql         # 데이터베이스 스키마
└── middleware.ts          # 인증 미들웨어
```

## 주요 기능 설명

### 로그인

- 이메일 + 비밀번호 로그인
- 매직링크 로그인 (이메일로 로그인 링크 전송)
- 로그인 후 자동으로 `/dashboard`로 리다이렉트

### 조합소식 리스트

- 기본 기간: 최근 14일 (7일/30일/60일로 변경 가능)
- 필터링:
  - 지역 (시/도, 구/군)
  - 이벤트 타입 (총회/입찰/시공사선정/기타)
  - 사업유형 (재개발/재건축)
- 카드 형태로 표시:
  - 이벤트 타입 뱃지
  - 제목, 조합명, 구역명, 지역
  - 요약 2줄
  - 출처 링크

### Protected Routes

모든 `/dashboard/*` 경로는 인증이 필요합니다. 미로그인 상태에서 접근 시 자동으로 `/login`으로 리다이렉트됩니다.

## 다음 단계

- [x] 기사 작성 에디터 구현
- [ ] 자료 업로드 (Supabase Storage 연동)
- [x] n8n Webhook 연동 (리드 생성)
- [ ] 개인 설정 페이지 (기간/관심 지역 등)
- [x] 조합소식 자동 수집 기능 (n8n 연동)

## 라이선스

Private - 개인 프로젝트
