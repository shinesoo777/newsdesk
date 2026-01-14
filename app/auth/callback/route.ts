import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/dashboard";
  const error = requestUrl.searchParams.get("error");
  const errorDescription = requestUrl.searchParams.get("error_description");

  // 배포 환경과 로컬 환경 모두 지원
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || requestUrl.origin;

  // URL에 에러 파라미터가 있는 경우 (예: otp_expired)
  if (error) {
    const errorMessage = errorDescription 
      ? decodeURIComponent(errorDescription)
      : error === "otp_expired" 
        ? "로그인 링크가 만료되었습니다. 새로운 링크를 요청해주세요."
        : "로그인에 실패했습니다.";
    
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(errorMessage)}`, baseUrl)
    );
  }

  if (code) {
    const supabase = await createClient();
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!exchangeError) {
      // 성공적으로 로그인됨
      return NextResponse.redirect(new URL(next, baseUrl));
    } else {
      // 코드 교환 실패
      console.error("Code exchange error:", exchangeError);
      const errorMessage = exchangeError.message === "Email link is invalid or has expired"
        ? "로그인 링크가 만료되었습니다. 새로운 링크를 요청해주세요."
        : exchangeError.message || "로그인에 실패했습니다.";
      
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(errorMessage)}`, baseUrl)
      );
    }
  }

  // code가 없으면 로그인 페이지로
  return NextResponse.redirect(new URL("/login", baseUrl));
}
