# n8n 조합소식 자동 수집 가이드

## 개요

n8n을 사용하여 최근 2주간의 재개발·재건축 조합소식을 자동으로 수집하고 Supabase에 저장하는 워크플로우를 구성합니다.

## 사전 준비

### 1. Vercel 배포 완료
- 프로젝트를 Vercel에 배포
- 배포된 도메인 확인 (예: `your-project.vercel.app`)
- 환경 변수 설정 (Vercel 대시보드 → Settings → Environment Variables)

### 2. 환경 변수 설정 (Vercel)

Vercel 대시보드에서 다음 환경 변수 추가:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `N8N_WEBHOOK_API_KEY` (선택사항 - 보안용)

**⚠️ 중요**: 환경 변수 추가 후 **Redeploy** 필요!

## 워크플로우 구조

```
[Schedule Trigger] 
  → [HTTP Request] (뉴스/공고 사이트 크롤링)
  → [Code] (데이터 파싱 및 정제)
  → [Code] (Webhook 형식으로 변환) ⚠️ 중요!
  → [HTTP Request] (Next.js Webhook 호출)
  → [Notification] (선택사항)
```

**⚠️ 중요**: Webhook으로 전송하기 전에 Code 노드에서 형식을 변환해야 합니다!

## 1단계: n8n 워크플로우 생성

### 1.1 Schedule Trigger 설정

1. n8n에서 새 워크플로우 생성
2. **Schedule Trigger** 노드 추가
3. 설정:
   - **Trigger Times**: 매일 오전 9시, 오후 6시 (또는 원하는 시간)
   - **Timezone**: Asia/Seoul

### 1.2 수집할 소스 결정

조합소식은 다음 소스에서 수집 가능:
- 뉴스 사이트 (네이버 뉴스, 다음 뉴스)
- 정부 공고 사이트 (각 지자체 공고)
- 부동산 전문 사이트
- RSS 피드

## 2단계: 데이터 수집 방법

### 방법 1: RSS 피드 사용 (가장 쉬움)

#### 2.1 RSS Read 노드

1. **RSS Read** 노드 추가
2. 설정:
   - **URL**: RSS 피드 URL
   - **Options**:
     - **Limit**: 50 (최근 50개)
     - **Include Metadata**: true

**예시 RSS 피드:**
- 네이버 뉴스: `https://news.naver.com/main/rss/section.naver?sid=101` (부동산)
- 다음 뉴스: RSS 피드 URL

#### 2.2 HTTP Request로 웹 크롤링 (고급)

**HTTP Request** 노드 사용:

```json
{
  "method": "GET",
  "url": "https://news.naver.com/main/list.naver?mode=LS2D&mid=shm&sid1=101&sid2=260",
  "options": {
    "headers": {
      "User-Agent": "Mozilla/5.0..."
    }
  }
}
```

### 방법 2: Google News API 사용

**HTTP Request** 노드:

```json
{
  "method": "GET",
  "url": "https://news.google.com/rss/search",
  "qs": {
    "q": "재개발 재건축 조합",
    "hl": "ko",
    "gl": "KR",
    "ceid": "KR:ko"
  }
}
```

### 방법 3: Perplexity API로 최신 뉴스 수집

**HTTP Request** 노드:

```json
{
  "method": "POST",
  "url": "https://api.perplexity.ai/chat/completions",
  "headers": {
    "Authorization": "Bearer YOUR_PERPLEXITY_API_KEY",
    "Content-Type": "application/json"
  },
  "body": {
    "model": "llama-3.1-sonar-large-128k-online",
    "messages": [
      {
        "role": "user",
        "content": "최근 2주간 한국의 재개발·재건축 조합소식, 총회, 입찰, 시공사 선정 관련 뉴스를 JSON 형식으로 제공해주세요. 각 뉴스마다 제목, 날짜, 출처, 요약을 포함해주세요."
      }
    ],
    "temperature": 0.7,
    "max_tokens": 4000
  }
}
```

## 3단계: 데이터 파싱 및 정제

### 3.1 Code 노드로 데이터 변환

**Code** 노드 추가하여 데이터를 Supabase 형식으로 변환:

```javascript
// RSS 피드나 API 응답을 파싱
const items = $input.all();

const newsItems = [];

for (const item of items) {
  const data = item.json;
  
  // 제목에서 정보 추출
  const title = data.title || data.link || '';
  
  // 날짜 파싱
  const pubDate = data.pubDate || data.published || new Date().toISOString();
  const eventDate = new Date(pubDate);
  
  // 지역 추출 (제목에서)
  const regionMatch = title.match(/(서울|경기|인천|부산|대구|광주|대전|울산|세종|강원|충북|충남|전북|전남|경북|경남|제주)/);
  const regionSi = regionMatch ? regionMatch[1] : '';
  
  // 구 추출
  const guMatch = title.match(/(\w+구|\w+시|\w+군|\w+동)/);
  const regionGu = guMatch ? guMatch[1] : '';
  
  // 이벤트 타입 추출
  let eventType = '기타';
  if (title.includes('총회') || title.includes('정기총회')) {
    eventType = '총회';
  } else if (title.includes('입찰') || title.includes('공고')) {
    eventType = '입찰';
  } else if (title.includes('시공사') || title.includes('선정')) {
    eventType = '시공사선정';
  }
  
  // 조합명 추출
  const associationMatch = title.match(/(\w+구역\s*재개발조합|\w+구역\s*재건축조합|\w+재개발조합|\w+재건축조합)/);
  const associationName = associationMatch ? associationMatch[1] : '';
  
  // 구역명 추출
  const districtMatch = title.match(/(\w+구역|\w+지구)/);
  const districtName = districtMatch ? districtMatch[1] : '';
  
  newsItems.push({
    title: title,
    event_type: eventType,
    association_name: associationName,
    district_name: districtName,
    region_si: regionSi,
    region_gu: regionGu,
    event_date: eventDate.toISOString().split('T')[0],
    summary: data.description || data.contentSnippet || title.substring(0, 200),
    source_name: data.source || '뉴스',
    source_url: data.link || data.url || '',
    created_at: new Date().toISOString()
  });
}

return newsItems.map(item => ({ json: item }));
```

## 4단계: Webhook 형식으로 변환

### 4.1 Code 노드 (Webhook 형식 변환) - ⚠️ 중요!

**데이터 파싱 후 Webhook 전송 전에 Code 노드 추가:**

```javascript
// 이전 노드에서 수집한 데이터
const items = $input.all().map(item => item.json);

// Webhook 형식으로 변환 (user_id 불필요)
return {
  json: {
    items: items  // 수집한 뉴스 항목 배열
  }
};
```

**⚠️ 중요**: 
- `user_id`는 더 이상 필요하지 않습니다
- 조합소식은 모든 사용자가 공유하는 데이터입니다
- `items`는 배열 형태로 전달되어야 함

### 4.2 HTTP Request 노드 (Next.js Webhook 호출)

**HTTP Request** 노드 설정:

- **Method**: POST
- **URL**: `https://your-project.vercel.app/api/union-news/webhook`
- **Send Body**: ✅ 활성화
- **Specify Body**: **"Expression"** 모드 선택
- **Body**: `{{ $json }}`
- **Headers**:
  - `Content-Type: application/json`
  - `Authorization: Bearer YOUR_API_KEY` (선택사항)

**전송되는 형식:**
```json
{
  "items": [
    {
      "title": "제목",
      "event_type": "총회",
      "event_date": "2024-01-15",
      "association_name": "조합명",
      "district_name": "구역명",
      "region_si": "서울",
      "region_gu": "강남구",
      "summary": "요약",
      "source_name": "출처",
      "source_url": "https://..."
    }
  ]
}
```

## 5단계: 중복 체크

### 5.1 IF 노드로 중복 확인

**IF** 노드 추가:

```
{{ $json.title }}가 이미 Supabase에 존재하는가?
```

**Code** 노드로 중복 체크:

```javascript
// Supabase에서 기존 데이터 확인
const title = $json.title;
const existingNews = $('Check Existing').all();

const isDuplicate = existingNews.some(item => 
  item.json.title === title
);

return { json: { ...$json, isDuplicate } };
```

### 5.2 중복 시 스킵

**IF** 노드:
- **Condition**: `{{ $json.isDuplicate }}`가 `false`인 경우만 진행

## 6단계: 완성된 워크플로우 예시

```
[Schedule Trigger] (매일 9시, 18시)
  ↓
[RSS Read] 또는 [HTTP Request] (뉴스 수집)
  ↓
[Code] (데이터 파싱 및 정제)
  ↓
[HTTP Request] (Supabase에서 기존 데이터 확인)
  ↓
[Code] (중복 체크)
  ↓
[IF] (중복이 아닌 경우만)
  ↓
[HTTP Request] (Supabase에 저장)
  ↓
[Slack] 또는 [Email] (선택사항 - 알림)
```

## 7단계: 환경 변수 설정

n8n 환경 변수에 추가:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key (RLS 우회용, 선택사항)
PERPLEXITY_API_KEY=your-key (Perplexity 사용 시)
```

## 8단계: 테스트

### 8.1 수동 실행

1. 워크플로우 저장
2. **Execute Workflow** 클릭
3. 각 노드의 출력 확인
4. Supabase에서 데이터 확인

### 8.2 자동 실행

1. 워크플로우 활성화
2. Schedule Trigger에 설정한 시간에 자동 실행
3. 실행 로그 확인

## 9단계: 고급 기능

### 9.1 여러 소스 통합

여러 RSS 피드나 API를 병렬로 수집:

```
[Schedule Trigger]
  ↓
[Split In Batches] (여러 소스)
  ↓
[RSS Read 1] ─┐
[RSS Read 2] ─┤
[HTTP Request] ┘
  ↓
[Merge] (결과 통합)
  ↓
[Code] (파싱)
  ↓
[Supabase]
```

### 9.2 AI로 데이터 정제

**OpenAI** 또는 **Claude** 노드로 데이터 정제:

```
제목: {{ $json.title }}

위 뉴스를 분석하여:
1. 이벤트 타입 (총회/입찰/시공사선정/기타)
2. 지역 (시/도, 구/군)
3. 조합명
4. 구역명
5. 요약 (2줄)

JSON 형식으로 응답:
{
  "event_type": "...",
  "region_si": "...",
  "region_gu": "...",
  "association_name": "...",
  "district_name": "...",
  "summary": "..."
}
```

## 10단계: 트러블슈팅

### 문제: 데이터가 저장되지 않음
- **해결**: Supabase RLS 정책 확인 (이제 모든 사용자가 공유하므로 RLS가 활성화되어 있어야 함)
- **해결**: Webhook URL이 올바른지 확인
- **해결**: API 키 권한 확인

### 문제: 중복 데이터 저장
- **해결**: 중복 체크 로직 강화
- **해결**: title + event_date 조합으로 중복 확인

### 문제: 날짜 파싱 오류
- **해결**: 다양한 날짜 형식 처리
- **해결**: Code 노드에서 날짜 파싱 로직 개선

## 11단계: 모니터링

### 11.1 실행 로그 확인

n8n 대시보드에서:
- 워크플로우 실행 이력
- 각 노드의 성공/실패 여부
- 실행 시간

### 11.2 Supabase 모니터링

Supabase 대시보드에서:
- `union_news` 테이블 데이터 확인
- 최근 추가된 데이터 확인
- 중복 데이터 확인

## 빠른 시작 (가장 간단한 방법)

### 1. RSS 피드 사용

```
[Schedule Trigger] (매일 9시)
  ↓
[RSS Read] (네이버 뉴스 RSS)
  ↓
[Code] (간단한 파싱)
  ↓
[HTTP Request] (Supabase 저장)
```

### 2. Perplexity API 사용 (추천)

```
[Schedule Trigger] (매일 9시)
  ↓
[HTTP Request] (Perplexity API)
  ↓
[Code] (JSON 파싱)
  ↓
[HTTP Request] (Supabase 저장)
```

이 방법이 가장 정확하고 최신 데이터를 가져올 수 있습니다.

## 다음 단계

1. 위 워크플로우 구성
2. 테스트 실행
3. 자동화 활성화
4. 데이터 품질 모니터링
