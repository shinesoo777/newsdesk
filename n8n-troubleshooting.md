# n8n 조합소식 수집 문제 해결 가이드

## 문제 진단 체크리스트

### 1. n8n 워크플로우 확인

#### 1.1 워크플로우가 활성화되어 있는가?
- n8n 대시보드에서 워크플로우 상태 확인
- **Active** 상태인지 확인

#### 1.2 워크플로우가 실행되었는가?
- **Executions** 탭에서 최근 실행 이력 확인
- 실행 시간과 상태 확인
- 에러가 있는지 확인

#### 1.3 각 노드의 출력 확인
- **HTTP Request** 노드 (데이터 수집)
- **Code** 노드 (데이터 파싱)
- **HTTP Request** 노드 (Webhook 전송)

### 2. Webhook URL 확인

#### 2.1 올바른 URL인가?
```
https://your-project.vercel.app/api/union-news/webhook
```

**확인 사항:**
- Vercel 도메인이 올바른가?
- `/api/union-news/webhook` 경로가 정확한가?

#### 2.2 Webhook 요청 형식 확인

**올바른 요청 형식:**
```json
{
  "items": [
    {
      "title": "제목",
      "event_type": "총회",
      "association_name": "조합명",
      "district_name": "구역명",
      "region_si": "서울",
      "region_gu": "강남구",
      "event_date": "2024-01-15",
      "published_at": "2024-01-10",
      "summary": "요약",
      "source_name": "출처",
      "source_url": "https://..."
    }
  ]
}
```

**필수 필드:**
- `title` (필수)
- `event_date` (필수)
- `items` 배열 (필수)

### 3. API 인증 확인

#### 3.1 API 키 설정 확인

`.env.local` 또는 Vercel 환경 변수에:
```
N8N_WEBHOOK_API_KEY=your-secret-key
```

#### 3.2 n8n에서 헤더 설정

**HTTP Request** 노드의 **Headers**:
```
Authorization: Bearer your-secret-key
Content-Type: application/json
```

**⚠️ 주의**: API 키를 설정했다면 반드시 헤더에 포함해야 합니다.

### 4. Supabase 연결 확인

#### 4.1 환경 변수 확인

Vercel 환경 변수:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

#### 4.2 RLS 정책 확인

Supabase에서 `union_news` 테이블의 RLS 정책 확인:
- `user_id`가 올바르게 설정되는가?
- RLS 정책이 데이터 삽입을 허용하는가?

### 5. 데이터 형식 문제

#### 5.1 날짜 형식

`event_date`는 `YYYY-MM-DD` 형식이어야 합니다:
```
✅ "2024-01-15"
❌ "2024/01/15"
❌ "15-01-2024"
```

#### 5.2 이벤트 타입

허용되는 값:
- `"총회"`
- `"입찰"`
- `"시공사선정"`
- `"기타"`

### 6. 로그 확인

#### 6.1 Vercel 함수 로그

1. Vercel 대시보드 → 프로젝트 → **Functions**
2. `/api/union-news/webhook` 함수 선택
3. 실행 로그 확인
4. 에러 메시지 확인

#### 6.2 n8n 실행 로그

1. n8n 대시보드 → 워크플로우 → **Executions**
2. 최근 실행 선택
3. 각 노드의 입력/출력 확인
4. 에러가 있는 노드 확인

## 일반적인 문제와 해결 방법

### 문제 1: "Unauthorized" 에러

**원인**: API 키가 설정되었지만 헤더에 포함되지 않음

**해결**:
1. n8n **HTTP Request** 노드에서 **Headers** 추가
2. `Authorization: Bearer YOUR_API_KEY` 설정

또는

1. Vercel 환경 변수에서 `N8N_WEBHOOK_API_KEY` 제거
2. 재배포

### 문제 2: "items 배열이 필요합니다" 에러

**원인**: 요청 본문 형식이 잘못됨

**해결**:
1. n8n **HTTP Request** 노드의 **Body** 확인
2. 다음 형식으로 설정:
```json
{
  "items": {{ $json }}
}
```

또는 Code 노드에서 배열로 변환:
```javascript
return {
  json: {
    items: $input.all().map(item => item.json)
  }
};
```

### 문제 3: "title과 event_date는 필수입니다" 에러

**원인**: 필수 필드가 누락됨

**해결**:
1. n8n **Code** 노드에서 데이터 파싱 확인
2. `title`과 `event_date`가 포함되는지 확인
3. 날짜 형식이 `YYYY-MM-DD`인지 확인

### 문제 4: 데이터가 저장되지 않음

**원인**: 
- Supabase 연결 문제
- RLS 정책 문제
- user_id 문제

**해결**:
1. Supabase 환경 변수 확인
2. RLS 정책 확인
3. `user_id`가 올바르게 전달되는지 확인

### 문제 5: 중복 데이터 에러

**원인**: 이미 같은 제목과 날짜의 데이터가 존재

**해결**:
- 정상 동작입니다. 중복 체크가 작동하고 있습니다.
- 새로운 데이터만 저장됩니다.

## 테스트 방법

### 1. n8n에서 수동 테스트

1. 워크플로우 → **Execute Workflow**
2. 각 노드의 출력 확인
3. Webhook 노드에서 전송되는 데이터 확인

### 2. Postman/curl로 직접 테스트

```bash
curl -X POST https://your-project.vercel.app/api/union-news/webhook \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "items": [
      {
        "title": "테스트 조합소식",
        "event_type": "총회",
        "event_date": "2024-01-15",
        "association_name": "테스트 조합",
        "region_si": "서울",
        "region_gu": "강남구"
      }
    ]
  }'
```

### 3. Vercel 로그 확인

1. Vercel 대시보드 → 프로젝트
2. **Functions** → `/api/union-news/webhook`
3. 최근 실행 로그 확인
4. 에러 메시지 확인

## 디버깅을 위한 코드 수정

Webhook 엔드포인트에 더 자세한 로깅 추가:

```typescript
console.log("Webhook received:", JSON.stringify(body, null, 2));
console.log("Items count:", items?.length);
console.log("First item:", items?.[0]);
```

Vercel 함수 로그에서 확인 가능합니다.

## 체크리스트

- [ ] n8n 워크플로우가 활성화되어 있음
- [ ] 워크플로우가 최근에 실행됨
- [ ] Webhook URL이 올바름
- [ ] 요청 본문 형식이 올바름 (`items` 배열)
- [ ] 필수 필드 (`title`, `event_date`) 포함
- [ ] 날짜 형식이 `YYYY-MM-DD`
- [ ] API 키가 설정되었다면 헤더에 포함
- [ ] Supabase 환경 변수 설정됨
- [ ] Vercel 함수 로그에서 에러 확인
- [ ] Supabase에서 데이터 확인
