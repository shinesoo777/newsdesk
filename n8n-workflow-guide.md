# n8n 워크플로우 가이드

## 개요

News Desk의 AI 기자 초안 도구는 n8n을 통해 여러 AI 모델을 활용하여 기사 리드를 자동 생성합니다.

## 워크플로우 구조

```
Webhook (입력) 
  → 시장 데이터 수집 (Perplexity/Google Search)
  → AI 분석 (ChatGPT/Claude/Gemini)
  → 리드 생성 (AI 모델)
  → 검증 및 포맷팅
  → Webhook (출력)
```

## 1. n8n Webhook 설정

### 1.1 Webhook 노드 생성

1. n8n에서 새 워크플로우 생성
2. **Webhook** 노드 추가
3. 설정:
   - **HTTP Method**: POST
   - **Path**: `/newsdesk-generate-leads` (원하는 경로)
   - **Response Mode**: "Respond to Webhook"
   - **Response Code**: 200

### 1.2 입력 데이터 구조

Webhook은 다음 JSON 형식으로 데이터를 받습니다:

```json
{
  "topic": "강남구 재개발 시장 동향 분석",
  "articleType": "스트린이드",
  "userId": "user-uuid",
  "userEmail": "user@example.com"
}
```

## 2. 시장 데이터 수집 단계

### 2.1 Perplexity API 노드 (추천)

**목적**: 최신 시장 뉴스 및 데이터 수집

1. **HTTP Request** 노드 추가
2. 설정:
   - **Method**: POST
   - **URL**: `https://api.perplexity.ai/chat/completions`
   - **Headers**:
     ```
     Authorization: Bearer YOUR_PERPLEXITY_API_KEY
     Content-Type: application/json
     ```
   - **Body**:
     ```json
     {
       "model": "llama-3.1-sonar-large-128k-online",
       "messages": [
         {
           "role": "system",
           "content": "당신은 부동산 재개발·재건축 전문 분석가입니다. 최신 시장 동향과 정책 변화를 정확하게 파악합니다."
         },
         {
           "role": "user",
           "content": "{{ $json.topic }}에 대한 최신 뉴스, 정책 변화, 시장 데이터를 수집해주세요. 한국의 재개발·재건축 시장에 초점을 맞춰주세요."
         }
       ],
       "temperature": 0.7,
       "max_tokens": 2000
     }
     ```

### 2.2 Google Search API (대안)

**HTTP Request** 노드로 Google Custom Search API 호출:

```json
{
  "key": "YOUR_GOOGLE_API_KEY",
  "cx": "YOUR_SEARCH_ENGINE_ID",
  "q": "{{ $json.topic }} 재개발 재건축",
  "num": 10,
  "dateRestrict": "d14"  // 최근 14일
}
```

## 3. AI 분석 단계

### 3.1 ChatGPT 분석

1. **OpenAI** 노드 추가 (또는 HTTP Request)
2. 설정:
   - **Model**: `gpt-4-turbo-preview` 또는 `gpt-4o`
   - **Messages**:
     ```json
     [
       {
         "role": "system",
         "content": "당신은 부동산 재개발·재건축 전문 기자입니다. 수집된 데이터를 분석하여 기사 작성에 필요한 핵심 정보를 추출합니다."
       },
       {
         "role": "user",
         "content": "주제: {{ $json.topic }}\n\n수집된 데이터:\n{{ $json('Perplexity').choices[0].message.content }}\n\n위 데이터를 분석하여:\n1. 주요 팩트 5개 (출처 포함)\n2. 시장 분석 요약 (200자 이내)\n3. 검증 필요한 항목 3개\n\nJSON 형식으로 응답해주세요."
       }
     ]
     ```
   - **Temperature**: 0.7
   - **Max Tokens**: 2000

### 3.2 Claude 분석 (대안)

**Anthropic** 노드 또는 HTTP Request:

```json
{
  "model": "claude-3-5-sonnet-20241022",
  "max_tokens": 2000,
  "messages": [
    {
      "role": "user",
      "content": "{{ $json.topic }}에 대한 분석을 요청합니다..."
    }
  ]
}
```

## 4. 리드 생성 단계

### 4.1 리드 10개 생성

**OpenAI** 또는 **Claude** 노드 추가:

**프롬프트 예시**:
```
주제: {{ $json.topic }}

위 주제로 기사를 작성하려고 합니다. 독자의 관심을 끌고 핵심 내용을 전달하는 리드(기사 첫 문단)를 10개 작성해주세요.

각 리드는:
- 2-3문장으로 구성
- 독자의 관심을 즉시 끌 수 있어야 함
- 기사의 핵심 내용을 암시해야 함
- 다양한 각도에서 접근 (통계, 사례, 전망, 문제점 등)

JSON 배열 형식으로 응답:
{
  "leads": [
    "리드 1 내용",
    "리드 2 내용",
    ...
  ]
}
```

### 4.2 Code 노드로 데이터 파싱

**Code** 노드 추가하여 AI 응답을 파싱:

```javascript
// AI 응답에서 리드 추출
const aiResponse = $input.item.json;
let leads = [];

// JSON 응답인 경우
if (typeof aiResponse === 'string') {
  try {
    const parsed = JSON.parse(aiResponse);
    leads = parsed.leads || parsed.choices?.[0]?.message?.content?.split('\n') || [];
  } catch (e) {
    // 텍스트 응답인 경우 줄바꿈으로 분리
    leads = aiResponse.split('\n').filter(line => line.trim().length > 0);
  }
} else if (Array.isArray(aiResponse)) {
  leads = aiResponse;
} else if (aiResponse.leads) {
  leads = aiResponse.leads;
}

// 최대 10개로 제한
leads = leads.slice(0, 10);

return {
  leads: leads.map((lead, index) => ({
    id: index + 1,
    text: typeof lead === 'string' ? lead.trim() : lead.text || lead
  }))
};
```

## 5. FACT BOX 생성

**AI 노드**에서 팩트 추출:

```
위 분석에서 기사에 사용할 수 있는 주요 팩트 5개를 추출해주세요.
각 팩트는:
- 검증 가능한 데이터여야 함
- 출처가 명확해야 함
- 기사 주제와 직접 관련되어야 함

JSON 형식:
{
  "facts": [
    {"text": "팩트 내용", "source": "출처"},
    ...
  ]
}
```

## 6. 검증 리스트 생성

**AI 노드**에서 검증 항목 생성:

```
위 기사 주제와 관련하여 검증이 필요한 항목 3-5개를 나열해주세요.
각 항목은 구체적이고 검증 가능해야 합니다.

JSON 배열 형식:
{
  "verifyList": [
    "검증 항목 1",
    "검증 항목 2",
    ...
  ]
}
```

## 7. 최종 응답 구성

### 7.1 Function 노드로 데이터 통합

```javascript
const topic = $('Webhook').item.json.topic;
const leads = $('Lead Generation').item.json.leads || [];
const analysis = $('Analysis').item.json.analysis || '';
const facts = $('Facts').item.json.facts || [];
const verifyList = $('Verify List').item.json.verifyList || [];

return {
  leads: leads.map(l => typeof l === 'string' ? l : l.text),
  facts: facts,
  analysis: analysis,
  verifyList: verifyList.map(v => typeof v === 'string' ? v : v.text)
};
```

### 7.2 Webhook 응답

Webhook 노드의 **Response** 탭에서:

```json
{
  "success": true,
  "leads": {{ $json.leads }},
  "facts": {{ $json.facts }},
  "analysis": {{ $json.analysis }},
  "verifyList": {{ $json.verifyList }}
}
```

## 8. 에러 처리

### 8.1 Try-Catch 노드 추가

각 AI 호출 단계에 **IF** 노드로 에러 체크:

```
{{ $json.error }}가 존재하는가?
```

에러 발생 시 기본값 반환:

```javascript
return {
  leads: ["기본 리드 1", "기본 리드 2"],
  facts: [],
  analysis: "분석을 생성할 수 없습니다.",
  verifyList: []
};
```

## 9. 환경 변수 설정

n8n 환경 변수에 다음을 추가:

```
PERPLEXITY_API_KEY=your_key
OPENAI_API_KEY=your_key
ANTHROPIC_API_KEY=your_key
GOOGLE_API_KEY=your_key
GOOGLE_SEARCH_ENGINE_ID=your_id
```

## 10. 워크플로우 예시 구조

```
[Webhook] 
  → [Set] (입력 데이터 정리)
  → [Perplexity] (시장 데이터 수집)
  → [OpenAI] (데이터 분석)
  → [OpenAI] (리드 10개 생성)
  → [OpenAI] (팩트 추출)
  → [OpenAI] (검증 리스트 생성)
  → [Code] (데이터 통합)
  → [Webhook Response]
```

## 11. Next.js 환경 변수 설정

`.env.local` 파일에 추가:

```env
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/newsdesk-generate-leads
```

## 12. 테스트

### n8n에서 테스트

1. 워크플로우 활성화
2. **Execute Workflow** 클릭
3. 테스트 데이터 입력:
   ```json
   {
     "topic": "강남구 재개발 시장 동향",
     "articleType": "스트린이드",
     "userId": "test-user",
     "userEmail": "test@example.com"
   }
   ```

### Next.js에서 테스트

1. 개발 서버 실행
2. `/dashboard/articles` 페이지 접속
3. 주제 입력 후 "초안 생성" 클릭
4. n8n 워크플로우 실행 확인

## 13. 최적화 팁

1. **캐싱**: 동일한 주제에 대해 결과 캐싱 (n8n의 **Cache** 노드 사용)
2. **병렬 처리**: 여러 AI 모델을 동시에 호출하여 속도 향상
3. **재시도 로직**: API 실패 시 자동 재시도
4. **비용 관리**: 토큰 사용량 모니터링 및 제한 설정

## 14. 트러블슈팅

### 문제: Webhook 응답이 없음
- **해결**: Webhook 노드의 "Respond to Webhook" 옵션 확인
- **해결**: 워크플로우가 활성화되어 있는지 확인

### 문제: AI 응답 형식이 일관되지 않음
- **해결**: 프롬프트에 JSON 형식 명시
- **해결**: Code 노드에서 파싱 로직 강화

### 문제: API 호출 실패
- **해결**: API 키 확인
- **해결**: Rate Limit 확인
- **해결**: 재시도 로직 추가

## 참고 자료

- [n8n 공식 문서](https://docs.n8n.io/)
- [OpenAI API 문서](https://platform.openai.com/docs)
- [Anthropic API 문서](https://docs.anthropic.com/)
- [Perplexity API 문서](https://docs.perplexity.ai/)
