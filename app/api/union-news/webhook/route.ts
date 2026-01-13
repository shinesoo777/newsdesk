import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * n8n에서 조합소식을 수집하여 이 엔드포인트로 전송하면
 * Supabase에 자동으로 저장합니다.
 * 
 * POST /api/union-news/webhook
 * 
 * Body:
 * {
 *   "items": [
 *     {
 *       "title": "제목",
 *       "event_type": "총회",
 *       "association_name": "조합명",
 *       "district_name": "구역명",
 *       "region_si": "서울",
 *       "region_gu": "강남구",
 *       "event_date": "2024-01-15",
 *       "published_at": "2024-01-10",
 *       "summary": "요약",
 *       "source_name": "출처",
 *       "source_url": "https://..."
 *     }
 *   ]
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // 인증 확인 (선택사항 - API 키로 보호 가능)
    const authHeader = request.headers.get("authorization");
    const apiKey = process.env.N8N_WEBHOOK_API_KEY;

    if (apiKey && authHeader !== `Bearer ${apiKey}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { items } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "items 배열이 필요합니다." },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // 서비스 키를 사용하여 모든 사용자 데이터에 접근 (n8n에서 호출 시)
    // 또는 특정 user_id 사용
    const serviceSupabase = supabase;

    const results = {
      success: [],
      failed: [],
    };

    // 각 아이템을 Supabase에 저장
    for (const item of items) {
      try {
        // 필수 필드 확인
        if (!item.title || !item.event_date) {
          results.failed.push({
            item,
            error: "title과 event_date는 필수입니다.",
          });
          continue;
        }

        // 중복 체크 (title + event_date로)
        const { data: existing } = await serviceSupabase
          .from("union_news")
          .select("id")
          .eq("title", item.title)
          .eq("event_date", item.event_date)
          .limit(1)
          .single();

        if (existing) {
          results.failed.push({
            item,
            error: "이미 존재하는 데이터입니다.",
          });
          continue;
        }

        // 데이터 저장
        const { error: insertError } = await serviceSupabase
          .from("union_news")
          .insert({
            user_id: item.user_id || user?.id || "00000000-0000-0000-0000-000000000000", // 기본값 또는 n8n에서 전달
            title: item.title,
            event_type: item.event_type || "기타",
            association_name: item.association_name || null,
            district_name: item.district_name || null,
            region_si: item.region_si || null,
            region_gu: item.region_gu || null,
            event_date: item.event_date,
            published_at: item.published_at || item.event_date,
            summary: item.summary || null,
            source_name: item.source_name || "n8n",
            source_url: item.source_url || null,
          });

        if (insertError) {
          throw insertError;
        }

        results.success.push(item.title);
      } catch (error: any) {
        results.failed.push({
          item,
          error: error.message || "알 수 없는 오류",
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `${results.success.length}개 저장 성공, ${results.failed.length}개 실패`,
      results,
    });
  } catch (error: any) {
    console.error("Error processing union news webhook:", error);
    return NextResponse.json(
      { error: error.message || "처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
