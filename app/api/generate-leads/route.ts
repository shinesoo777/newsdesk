import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    // 인증 확인
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { topic, articleType } = body;

    if (!topic || !topic.trim()) {
      return NextResponse.json(
        { error: "주제를 입력해주세요." },
        { status: 400 }
      );
    }

    // n8n Webhook URL (환경 변수에서 가져오기)
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;

    if (!n8nWebhookUrl) {
      return NextResponse.json(
        { error: "n8n Webhook URL이 설정되지 않았습니다." },
        { status: 500 }
      );
    }

    // n8n으로 요청 보내기
    const requestBody = {
      topic,
      articleType: articleType || "정책기사",
      userId: user.id,
      userEmail: user.email,
    };

    console.log("[Generate Leads] n8n 호출:", {
      url: n8nWebhookUrl,
      body: requestBody,
    });

    const response = await fetch(n8nWebhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    console.log("[Generate Leads] n8n 응답:", {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Generate Leads] n8n 에러 상세:", errorText);
      throw new Error(
        `n8n webhook error (${response.status}): ${response.statusText}. ${errorText}`
      );
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      leads: data.leads || [],
      facts: data.facts || [],
      analysis: data.analysis || "",
      verifyList: data.verifyList || [],
    });
  } catch (error: any) {
    console.error("Error calling n8n webhook:", error);
    return NextResponse.json(
      { error: error.message || "리드 생성에 실패했습니다." },
      { status: 500 }
    );
  }
}
