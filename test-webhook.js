/**
 * Webhook 테스트 스크립트
 * 
 * 사용법:
 * node test-webhook.js
 * 
 * 또는 curl로:
 * curl -X POST http://localhost:3000/api/union-news/webhook \
 *   -H "Content-Type: application/json" \
 *   -d @test-data.json
 */

const testData = {
  // user_id는 더 이상 필요하지 않습니다 (모든 사용자가 공유하는 데이터)
  items: [
    {
      title: "강남구 A구역 재개발 조합 총회 개최",
      event_type: "총회",
      association_name: "강남구 A구역 재개발조합",
      district_name: "A구역",
      region_si: "서울",
      region_gu: "강남구",
      event_date: "2024-01-15",
      summary: "강남구 A구역 재개발조합이 오는 15일 총회를 개최한다고 발표했습니다.",
      source_name: "테스트",
      source_url: "https://example.com/news/1"
    },
    {
      title: "서초구 B구역 재건축 입찰 공고",
      event_type: "입찰",
      association_name: "서초구 B구역 재건축조합",
      district_name: "B구역",
      region_si: "서울",
      region_gu: "서초구",
      event_date: "2024-01-20",
      summary: "서초구 B구역 재건축 입찰 공고가 발표되었습니다.",
      source_name: "테스트",
      source_url: "https://example.com/news/2"
    }
  ]
};

console.log("테스트 데이터:");
console.log(JSON.stringify(testData, null, 2));
console.log("\n위 데이터를 사용하여 Webhook을 테스트하세요.");
