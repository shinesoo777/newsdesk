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
    const response = await fetch(n8nWebhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        topic,
        articleType: articleType || "스트린이드",
        userId: user.id,
        userEmail: user.email,
      }),
    });

    if (!response.ok) {
      throw new Error(`n8n webhook error: ${response.statusText}`);
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
