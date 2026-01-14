import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * n8n에서 부동산 정책 뉴스를 수집하여 이 엔드포인트로 전송하면
 * Supabase에 자동으로 저장합니다.
 * 
 * POST /api/policy-news/webhook
 * 
 * Body:
 * {
 *   "items": [
 *     {
 *       "title": "정책 제목",
 *       "policy_type": "재개발",
 *       "agency_name": "국토교통부",
 *       "region_si": "서울특별시",
 *       "region_gu": "강남구",
 *       "published_date": "2024-01-15",
 *       "effective_date": "2024-02-01",
 *       "summary": "정책 요약",
 *       "content": "정책 상세 내용",
 *       "source_name": "출처명",
 *       "source_url": "https://...",
 *       "tags": ["태그1", "태그2"]
 *     }
 *   ]
 * }
 */
export async function POST(request: NextRequest) {
  try {
    console.log("[Policy News Webhook] 요청 받음");

    // 인증 확인 (선택사항 - API 키로 보호 가능)
    const authHeader = request.headers.get("authorization");
    const apiKey = process.env.N8N_WEBHOOK_API_KEY;

    if (apiKey && authHeader !== `Bearer ${apiKey}`) {
      console.log("[Policy News Webhook] 인증 실패");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    console.log("[Policy News Webhook] 요청 본문:", JSON.stringify(body, null, 2));

    const { items } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      console.log("[Policy News Webhook] items 배열이 없거나 비어있음");
      return NextResponse.json(
        { error: "items 배열이 필요합니다." },
        { status: 400 }
      );
    }

    console.log("[Policy News Webhook] items 개수:", items.length);

    const supabase = await createClient();

    const results: {
      success: string[];
      failed: Array<{ item: any; error: string }>;
    } = {
      success: [],
      failed: [],
    };

    // 각 아이템을 Supabase에 저장
    for (const item of items) {
      try {
        // 필수 필드 확인
        if (!item.title) {
          results.failed.push({
            item,
            error: "title은 필수입니다.",
          });
          continue;
        }

        // 중복 체크 (title + published_date 또는 source_url로)
        let existing = null;
        if (item.published_date) {
          const { data } = await supabase
            .from("policy_news")
            .select("id")
            .eq("title", item.title)
            .eq("published_date", item.published_date)
            .limit(1)
            .maybeSingle();
          existing = data;
        } else if (item.source_url) {
          const { data } = await supabase
            .from("policy_news")
            .select("id")
            .eq("source_url", item.source_url)
            .limit(1)
            .maybeSingle();
          existing = data;
        }

        if (existing) {
          results.failed.push({
            item,
            error: "이미 존재하는 데이터입니다.",
          });
          continue;
        }

        console.log("[Policy News Webhook] 저장 시도:", item.title);

        // 데이터 저장
        const { error: insertError } = await supabase
          .from("policy_news")
          .insert({
            title: item.title || null,
            policy_type: item.policy_type || null,
            agency_name: item.agency_name || null,
            region_si: item.region_si || null,
            region_gu: item.region_gu || null,
            published_date: item.published_date || null,
            effective_date: item.effective_date || null,
            summary: item.summary || null,
            content: item.content || null,
            source_name: item.source_name || "n8n",
            source_url: item.source_url || null,
            tags: item.tags || null,
          });

        if (insertError) {
          console.error("[Policy News Webhook] 저장 오류:", insertError);
          throw insertError;
        }

        console.log("[Policy News Webhook] 저장 성공:", item.title);
        results.success.push(item.title);
      } catch (error: any) {
        results.failed.push({
          item,
          error: error.message || "알 수 없는 오류",
        });
      }
    }

    console.log("[Policy News Webhook] 최종 결과:", {
      success: results.success.length,
      failed: results.failed.length,
      failedDetails: results.failed,
    });

    return NextResponse.json({
      success: true,
      message: `${results.success.length}개 저장 성공, ${results.failed.length}개 실패`,
      results,
    });
  } catch (error: any) {
    console.error("Error processing policy news webhook:", error);
    return NextResponse.json(
      { error: error.message || "처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
