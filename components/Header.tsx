"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function Header() {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <h1 className="text-xl font-bold text-gray-900">News Desk</h1>
        <button
          onClick={handleLogout}
          className="rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
        >
          로그아웃
        </button>
      </div>
    </header>
  );
}
