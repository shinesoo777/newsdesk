"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function ArticleHeader() {
  const router = useRouter();
  const supabase = createClient();
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.email) {
        const emailParts = user.email.split("@");
        setUserEmail(emailParts[0] || "기자");
      }
    };
    getUser();
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="border-b border-gray-200 bg-gray-50">
      <div className="mx-auto flex h-14 max-w-full items-center justify-between px-6">
        <h1 className="text-lg font-semibold text-gray-900">
          AI 기자 초안 도구
        </h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700">기자 {userEmail} 기자</span>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              로그아웃
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
