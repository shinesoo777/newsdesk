# n8n → Supabase 데이터 저장 문제 디버깅 가이드

## 데이터 흐름

```
n8n 워크플로우
  ↓ (데이터 수집)
  ↓ (데이터 파싱)
  ↓ (HTTP Request로 Webhook 호출)
Next.js Webhook (/api/union-news/webhook)
  ↓ (데이터 검증)
  ↓ (Supabase에 저장)
Supabase Database
  ↓
웹에서 조회 (조합소식 페이지)
```

## 문제 진단 체크리스트

### 1. n8n 워크플로우 확인

#### 1.1 워크플로우가 실행되었는가?
- n8n 대시보드 → **Executions** 탭
- 최근 실행 확인
- **성공/실패** 상태 확인

#### 1.2 Webhook 노드 확인
- **HTTP Request** 노드 (Next.js Webhook 호출)
- **URL**이 올바른가?
  ```
  https://your-project.vercel.app/api/union-news/webhook
  ```
- **Method**: POST
- **Headers**:
  ```
  Content-Type: application/json
  Authorization: Bearer YOUR_API_KEY (선택사항)
  ```

#### 1.3 Body 형식 확인

**⚠️ 중요: n8n에서 Body 전송 방법**

**올바른 방법 (Expression 모드 사용):**

1. **Code 노드**에서 형식 변환:
   ```javascript
   return {
     json: {
       default_user_id: "your-user-uuid-here",
       items: $input.all().map(item => item.json)
     }
   };
   ```

2. **HTTP Request 노드** 설정:
   - **Send Body**: ✅ 활성화
   - **Specify Body**: **"Expression"** 모드
   - **Body**: `{{ $json }}`

**❌ 잘못된 방법 (Body Parameters 사용):**
- Body Parameters를 사용하면 형식이 깨져서 "items 배열이 필요합니다" 오류 발생

**올바른 전송 형식:**
```json
{
  "default_user_id": "your-user-uuid-here",
  "items": [
    {
      "title": "제목",
      "event_date": "2024-01-15",
      "event_type": "총회",
      "region_si": "서울",
      "region_gu": "강남구"
    }
  ]
}
```

**⚠️ 필수:**
- `default_user_id` 또는 각 item에 `user_id` 포함
- `items` 배열
- 각 item에 `title`과 `event_date` 포함

### 2. Webhook 응답 확인

n8n의 **HTTP Request** 노드 출력 확인:

**성공 응답:**
```json
{
  "success": true,
  "message": "2개 저장 성공, 0개 실패",
  "results": {
    "success": ["제목1", "제목2"],
    "failed": []
  }
}
```

**실패 응답:**
```json
{
  "error": "user_id가 필요합니다..."
}
```

또는
```json
{
  "error": "items 배열이 필요합니다."
}
```

### 3. Vercel 함수 로그 확인

1. Vercel 대시보드 → 프로젝트
2. **Functions** → `/api/union-news/webhook`
3. 최근 실행 로그 확인

**로그에서 확인할 내용:**
- `[Webhook] 요청 받음` - 요청이 도착했는가?
- `[Webhook] items 개수: X` - 몇 개의 아이템이 전달되었는가?
- `[Webhook] 사용자: uuid 또는 없음` - user_id가 있는가?
- `[Webhook] 저장 시도: ...` - 저장을 시도했는가?
- `[Webhook] 저장 성공: ...` 또는 에러 메시지

### 4. Supabase 확인

#### 4.1 테이블 존재 확인
- Supabase 대시보드 → **Table Editor**
- `union_news` 테이블이 있는가?

#### 4.2 RLS 정책 확인
- Supabase 대시보드 → **Authentication** → **Policies**
- `union_news` 테이블의 정책 확인
- INSERT 정책이 활성화되어 있는가?

#### 4.3 데이터 확인
- **Table Editor** → `union_news` 테이블
- 데이터가 있는가?
- `user_id`가 올바른가?

## 일반적인 문제와 해결

### 문제 1: "user_id가 필요합니다" 에러

**원인**: n8n에서 `user_id`를 전달하지 않음

**해결**:
1. Supabase에서 user_id 확인:
   - **Authentication** → **Users** → UUID 복사
2. n8n 워크플로우에서 Body에 추가:
   ```json
   {
     "default_user_id": "복사한-uuid",
     "items": [...]
   }
   ```

### 문제 2: "items 배열이 필요합니다" 에러

**원인**: Body 형식이 잘못됨

**해결**:
1. n8n **Code** 노드에서 배열로 변환:
   ```javascript
   return {
     json: {
       default_user_id: "your-user-id",
       items: $input.all().map(item => item.json)
     }
   };
   ```

### 문제 3: "title과 event_date는 필수입니다" 에러

**원인**: 필수 필드 누락

**해결**:
1. n8n **Code** 노드에서 데이터 파싱 확인
2. `title`과 `event_date`가 포함되는지 확인
3. `event_date` 형식이 `YYYY-MM-DD`인지 확인

### 문제 4: "이미 존재하는 데이터입니다" 에러

**원인**: 중복 데이터

**해결**:
- 정상 동작입니다. 중복 체크가 작동하고 있습니다.
- 새로운 데이터만 저장됩니다.

### 문제 5: 데이터가 저장되지 않음 (에러 없음)

**가능한 원인들:**

1. **RLS 정책 문제**
   - Supabase에서 INSERT 정책 확인
   - `user_id = auth.uid()` 정책이 있으면 n8n에서 호출 시 실패할 수 있음

2. **환경 변수 문제**
   - Vercel 환경 변수 확인
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`가 올바른가?

3. **Webhook이 호출되지 않음**
   - n8n 실행 로그 확인
   - Webhook 노드가 실행되었는가?

## 단계별 디버깅

### Step 1: n8n에서 수동 실행

1. 워크플로우 → **Execute Workflow**
2. 각 노드의 출력 확인
3. Webhook 노드의 입력 데이터 확인
4. Webhook 노드의 응답 확인

### Step 2: Webhook 직접 테스트

curl로 직접 테스트:

```bash
curl -X POST https://your-project.vercel.app/api/union-news/webhook \
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

**응답 확인:**
- 성공하면 Supabase에서 데이터 확인
- 실패하면 에러 메시지 확인

### Step 3: Vercel 로그 확인

1. Vercel → 프로젝트 → **Functions**
2. `/api/union-news/webhook` 선택
3. 최근 실행 로그 확인
4. 에러 메시지 확인

### Step 4: Supabase 로그 확인

1. Supabase 대시보드 → **Logs**
2. API 로그 확인
3. 에러가 있는지 확인

## n8n 워크플로우 예시

```
[Schedule Trigger]
  ↓
[HTTP Request] - Perplexity API (뉴스 수집)
  ↓
[Code] - 데이터 파싱
  ↓
[Code] - user_id 추가 및 형식 변환
  {
    default_user_id: "your-user-id",
    items: [...]
  }
  ↓
[HTTP Request] - Next.js Webhook
  URL: https://your-project.vercel.app/api/union-news/webhook
  Method: POST
  Body: {{ $json }}
  ↓
[IF] - 응답 확인
  success === true?
  ↓
[Slack/Email] - 알림 (선택사항)
```

## 빠른 체크리스트

- [ ] n8n 워크플로우가 실행됨
- [ ] Webhook URL이 올바름
- [ ] Body에 `default_user_id` 포함
- [ ] Body에 `items` 배열 포함
- [ ] 각 item에 `title`과 `event_date` 포함
- [ ] Vercel 함수 로그에서 요청 확인
- [ ] Vercel 함수 로그에서 에러 확인
- [ ] Supabase에서 데이터 확인
- [ ] 웹에서 조합소식 페이지에서 데이터 표시 확인

## 다음 단계

1. 위 체크리스트 확인
2. n8n 실행 로그 확인
3. Vercel 함수 로그 확인
4. 문제 발견 시 해당 섹션의 해결 방법 적용
