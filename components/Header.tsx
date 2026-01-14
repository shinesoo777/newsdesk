"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useSidebar } from "@/contexts/SidebarContext";

export default function Header() {
  const router = useRouter();
  const supabase = createClient();
  const { isCollapsed, toggleSidebar } = useSidebar();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-10 border-b border-gray-200 bg-white shadow-sm">
      <div className="flex h-16 w-full items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSidebar}
            className="group relative flex items-center justify-center rounded-lg p-2 text-gray-600 transition-all duration-200 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 active:scale-95"
            aria-label={isCollapsed ? "사이드바 펼치기" : "사이드바 접기"}
            title={isCollapsed ? "사이드바 펼치기" : "사이드바 접기"}
          >
            <svg
              className={`h-5 w-5 transition-transform duration-300 ${
                isCollapsed ? "rotate-180" : "rotate-0"
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-gray-900">최진's NewsDesk</h1>
        </div>
        <button
          onClick={handleLogout}
          className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 transition-all duration-200 hover:bg-gray-100 hover:text-gray-900 active:scale-95"
        >
          로그아웃
        </button>
      </div>
    </header>
  );
}
