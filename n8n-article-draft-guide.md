# n8n 기사 초안 생성 워크플로우 가이드

## 📋 개요

이 가이드는 News Desk의 "기사 작성" 페이지에서 사용하는 AI 기사 초안 생성 n8n 워크플로우를 만드는 방법을 설명합니다.

## 🎯 워크플로우 목표

사용자가 입력한 주제를 바탕으로:
1. **리드 10개** 생성
2. **FACT BOX** (주요 팩트 5개)
3. **ANALYSIS** (시장 분석)
4. **VERIFY LIST** (검증 항목)
5. **기사 초안** 생성

## 📥 입력 데이터 형식

Next.js에서 n8n으로 전송되는 데이터:

```json
{
  "topic": "강남구 재개발 시장 동향 분석",
  "articleType": "스트린이드",
  "userId": "user-uuid",
  "userEmail": "user@example.com"
}
```

## 📤 출력 데이터 형식

n8n에서 Next.js로 반환해야 하는 데이터:

```json
{
  "success": true,
  "leads": [
    "리드 1 내용",
    "리드 2 내용",
    ...
  ],
  "facts": [
    {"id": 1, "text": "팩트 내용", "source": "출처"},
    ...
  ],
  "analysis": "시장 분석 내용...",
  "verifyList": [
    {"id": 1, "text": "검증 항목 1", "checked": false},
    ...
  ],
  "suggestions": [
    {"id": 1, "text": "수정 제안 1", "checked": false},
    ...
  ],
  "articleContent": {
    "lead": "기사 리드",
    "body": "기사 본문"
  }
}
```

## 🔧 단계별 워크플로우 구성

### 1단계: Webhook 노드 설정

1. **Webhook** 노드 추가
2. 설정:
   - **HTTP Method**: `POST`
   - **Path**: `/generate-article-draft` (원하는 경로)
   - **Response Mode**: "Respond to Webhook"
   - **Response Code**: `200`

### 2단계: 최신 정보 수집 (Perplexity API)

**목적**: 주제에 대한 최신 뉴스, 정책, 시장 데이터 수집

1. **HTTP Request** 노드 추가
2. 설정:
   - **Method**: `POST`
   - **URL**: `https://api.perplexity.ai/chat/completions`
   - **Authentication**: Generic Credential Type
     - **Name**: `Perplexity API`
     - **Header Name**: `Authorization`
     - **Header Value**: `Bearer YOUR_PERPLEXITY_API_KEY`
   - **Headers**:
     ```
     Content-Type: application/json
     ```
   - **Body** (JSON):
     ```json
     {
       "model": "llama-3.1-sonar-large-128k-online",
       "messages": [
         {
           "role": "system",
           "content": "당신은 부동산 재개발·재건축 전문 분석가입니다. 최신 시장 동향, 정책 변화, 통계 데이터를 정확하게 수집합니다."
         },
         {
           "role": "user",
           "content": "주제: {{ $json.topic }}\n\n위 주제에 대한 최신 정보를 수집해주세요:\n1. 최근 2주간의 관련 뉴스\n2. 정책 변화\n3. 시장 통계 및 데이터\n4. 주요 사례\n\n한국의 재개발·재건축 시장에 초점을 맞춰주세요."
         }
       ],
       "temperature": 0.7,
       "max_tokens": 3000
     }
     ```

### 3단계: 데이터 분석 (ChatGPT/Claude)

**목적**: 수집된 데이터를 분석하여 기사 작성에 필요한 핵심 정보 추출

1. **OpenAI** 노드 추가 (또는 HTTP Request)
2. 설정:
   - **Resource**: `Chat`
   - **Operation**: `Create Chat Completion`
   - **Model**: `gpt-4o` 또는 `gpt-4-turbo`
   - **Messages**:
     ```json
     [
       {
         "role": "system",
         "content": "당신은 부동산 재개발·재건축 전문 기자입니다. 수집된 데이터를 분석하여 기사 작성에 필요한 핵심 정보를 추출합니다."
       },
       {
         "role": "user",
         "content": "주제: {{ $json.topic }}\n\n수집된 데이터:\n{{ $json('HTTP Request').body.choices[0].message.content }}\n\n위 데이터를 분석하여 다음을 JSON 형식으로 제공해주세요:\n{\n  \"analysis\": \"시장 분석 요약 (300자 이내)\",\n  \"keyFacts\": [\n    {\"text\": \"팩트 1\", \"source\": \"출처\"},\n    {\"text\": \"팩트 2\", \"source\": \"출처\"},\n    ...\n  ],\n  \"verifyItems\": [\n    \"검증 항목 1\",\n    \"검증 항목 2\",\n    ...\n  ]\n}"
       }
     ]
     ```
   - **Temperature**: `0.7`
   - **Max Tokens**: `2000`

### 4단계: 리드 10개 생성

1. **OpenAI** 노드 추가
2. 설정:
   - **Model**: `gpt-4o`
   - **Messages**:
     ```json
     [
       {
         "role": "system",
         "content": "당신은 전문 기자입니다. 독자의 관심을 끌고 핵심 내용을 전달하는 리드를 작성합니다."
       },
       {
         "role": "user",
         "content": "주제: {{ $json.topic }}\n\n기사 유형: {{ $json.articleType }}\n\n수집된 정보:\n{{ $json('HTTP Request').body.choices[0].message.content }}\n\n위 주제로 기사를 작성하려고 합니다. 독자의 관심을 끌고 핵심 내용을 전달하는 리드(기사 첫 문단)를 10개 작성해주세요.\n\n각 리드는:\n- 2-3문장으로 구성\n- 독자의 관심을 즉시 끌 수 있어야 함\n- 기사의 핵심 내용을 암시해야 함\n- 다양한 각도에서 접근 (통계, 사례, 전망, 문제점 등)\n\nJSON 배열 형식으로 응답:\n{\n  \"leads\": [\n    \"리드 1 내용\",\n    \"리드 2 내용\",\n    ...\n  ]\n}"
       }
     ]
     ```
   - **Temperature**: `0.8`
   - **Max Tokens**: `2000`

### 5단계: Code 노드로 데이터 파싱 및 통합

1. **Code** 노드 추가
2. **Language**: `JavaScript`
3. **Code**:
   ```javascript
   // 이전 노드들의 데이터 가져오기
   const webhookData = $input.item.json;
   const perplexityData = $('HTTP Request').item.json;
   const analysisData = $('OpenAI').item.json;
   const leadsData = $('OpenAI').item.json; // 리드 생성 노드

   // 리드 파싱
   let leads = [];
   try {
     const leadsResponse = typeof leadsData.choices?.[0]?.message?.content === 'string' 
       ? JSON.parse(leadsData.choices[0].message.content)
       : leadsData;
     leads = leadsResponse.leads || [];
   } catch (e) {
     // 텍스트 응답인 경우
     const content = leadsData.choices?.[0]?.message?.content || '';
     leads = content.split('\n')
       .filter(line => line.trim().length > 0 && !line.match(/^[0-9]+\./))
       .slice(0, 10);
   }

   // 분석 데이터 파싱
   let analysis = '';
   let facts = [];
   let verifyList = [];
   
   try {
     const analysisResponse = typeof analysisData.choices?.[0]?.message?.content === 'string'
       ? JSON.parse(analysisData.choices[0].message.content)
       : analysisData;
     
     analysis = analysisResponse.analysis || '';
     facts = (analysisResponse.keyFacts || []).map((fact, index) => ({
       id: index + 1,
       text: fact.text || fact,
       source: fact.source || '분석 데이터'
     }));
     verifyList = (analysisResponse.verifyItems || []).map((item, index) => ({
       id: index + 1,
       text: typeof item === 'string' ? item : item.text,
       checked: false
     }));
   } catch (e) {
     analysis = analysisData.choices?.[0]?.message?.content || '';
   }

   // 리드 최대 10개로 제한
   leads = leads.slice(0, 10).map((lead, index) => ({
     id: index + 1,
     text: typeof lead === 'string' ? lead.trim() : lead.text || lead
   }));

   // Reviewer 제안 생성 (선택사항)
   const suggestions = [
     { id: 1, text: "통계 데이터 출처 확인 필요", checked: false },
     { id: 2, text: "최신 정책 내용 재검토 필요", checked: false },
     { id: 3, text: "관련 전문가 의견 추가 권장", checked: false }
   ];

   // 기사 초안 생성
   const articleContent = {
     lead: leads[0]?.text || '',
     body: `${analysis}\n\n${facts.map(f => `- ${f.text} (출처: ${f.source})`).join('\n')}`
   };

   return {
     success: true,
     leads: leads,
     facts: facts.slice(0, 5), // 최대 5개
     analysis: analysis,
     verifyList: verifyList.slice(0, 5), // 최대 5개
     suggestions: suggestions,
     articleContent: articleContent
   };
   ```

### 6단계: Webhook 응답 설정

1. Webhook 노드의 **Response** 탭으로 이동
2. **Response Body** 설정:
   ```json
   {{ $json }}
   ```

또는 **Respond to Webhook** 옵션이 활성화되어 있으면 Code 노드의 출력이 자동으로 응답됩니다.

## 🔄 전체 워크플로우 구조

```
[Webhook] (입력)
  ↓
[HTTP Request] (Perplexity - 최신 정보 수집)
  ↓
[OpenAI] (데이터 분석 - 팩트, 검증 항목 추출)
  ↓
[OpenAI] (리드 10개 생성)
  ↓
[Code] (데이터 파싱 및 통합)
  ↓
[Webhook Response] (출력)
```

## ⚙️ 환경 변수 설정

n8n 환경 변수에 다음을 추가:

```
PERPLEXITY_API_KEY=pplx-xxxxxxxxxxxxx
OPENAI_API_KEY=sk-xxxxxxxxxxxxx
```

또는 n8n Credentials에서:
- **Perplexity API**: Generic Credential Type
- **OpenAI**: OpenAI API

## 🔗 Next.js 환경 변수 설정

`.env.local` 파일에 추가:

```env
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/generate-article-draft
```

Vercel 배포 시에도 동일한 환경 변수를 추가하세요.

## ✅ 테스트 방법

### 1. n8n에서 직접 테스트

1. 워크플로우 활성화
2. **Execute Workflow** 클릭
3. 테스트 데이터 입력:
   ```json
   {
     "topic": "강남구 재개발 시장 동향 분석",
     "articleType": "스트린이드",
     "userId": "test-user",
     "userEmail": "test@example.com"
   }
   ```
4. 각 노드의 출력 확인
5. 최종 응답 형식 확인

### 2. Next.js에서 테스트

1. 개발 서버 실행: `npm run dev`
2. `/dashboard/articles` 페이지 접속
3. 주제 입력 (예: "강남구 재개발 시장 동향")
4. "초안 생성" 버튼 클릭
5. 결과 확인

## 🐛 트러블슈팅

### 문제: Webhook 응답이 없음
- **해결**: Webhook 노드의 "Respond to Webhook" 옵션 확인
- **해결**: 워크플로우가 활성화되어 있는지 확인
- **해결**: n8n 로그에서 에러 확인

### 문제: AI 응답이 JSON 형식이 아님
- **해결**: 프롬프트에 "JSON 형식으로 응답" 명시
- **해결**: Code 노드에서 파싱 로직 강화 (try-catch 추가)

### 문제: 리드가 10개보다 적게 생성됨
- **해결**: 프롬프트에 "정확히 10개" 명시
- **해결**: Code 노드에서 기본값 추가

### 문제: API 호출 실패
- **해결**: API 키 확인
- **해결**: Rate Limit 확인 (Perplexity, OpenAI)
- **해결**: 재시도 로직 추가 (n8n의 **Retry** 옵션 사용)

## 💡 최적화 팁

1. **병렬 처리**: 분석과 리드 생성을 동시에 실행하여 속도 향상
2. **캐싱**: 동일한 주제에 대해 결과 캐싱 (n8n의 **Cache** 노드)
3. **에러 핸들링**: 각 단계에 **IF** 노드로 에러 체크 및 기본값 반환
4. **비용 관리**: 토큰 사용량 모니터링 및 제한 설정

## 📝 참고사항

- Perplexity API는 최신 정보를 제공하므로 시장 동향 분석에 유용합니다
- OpenAI GPT-4o는 분석과 리드 생성에 모두 적합합니다
- 프롬프트를 한국어로 작성하면 더 정확한 결과를 얻을 수 있습니다
- 각 단계의 출력을 확인하여 데이터 흐름을 추적하세요

## 🎨 고급 기능 (선택사항)

### 여러 AI 모델 비교
- ChatGPT와 Claude를 동시에 사용하여 결과 비교
- 더 나은 결과를 선택하거나 병합

### RAG (Retrieval-Augmented Generation)
- Supabase에서 관련 조합소식/정책 뉴스 검색
- 검색 결과를 컨텍스트로 제공하여 더 정확한 초안 생성

### 스트리밍 응답
- 긴 응답의 경우 스트리밍으로 실시간 업데이트
- n8n의 **SSE (Server-Sent Events)** 활용
