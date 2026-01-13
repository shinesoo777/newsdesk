import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // 성공적으로 로그인됨
      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  // 에러가 있거나 code가 없으면 로그인 페이지로
  return NextResponse.redirect(new URL("/login", request.url));
}
