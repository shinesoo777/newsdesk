"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/contexts/SidebarContext";

// SVG 아이콘 컴포넌트
const DashboardIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const ArticleIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const NewsIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
  </svg>
);

const PolicyIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const DocumentIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
  </svg>
);

const SettingsIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const navigation = [
  { name: "대시보드", href: "/dashboard", icon: DashboardIcon },
  { name: "기사 작성", href: "/dashboard/articles", icon: ArticleIcon },
  { name: "조합소식", href: "/dashboard/union-news", icon: NewsIcon },
  { name: "부동산 정책", href: "/dashboard/policy-news", icon: PolicyIcon },
  { name: "자료 업로드", href: "/dashboard/documents", icon: DocumentIcon },
  { name: "설정", href: "/dashboard/settings", icon: SettingsIcon },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { isCollapsed } = useSidebar();

  return (
    <aside
      className={`relative border-r border-gray-200 bg-white shadow-sm transition-all duration-300 ease-in-out ${
        isCollapsed ? "w-16" : "w-64"
      }`}
    >
      <nav className="p-3">
        <ul className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? isCollapsed
                        ? "bg-blue-100 text-blue-700"
                        : "bg-blue-50 text-blue-700 shadow-sm"
                      : "text-gray-700 hover:bg-gray-50"
                  } ${isCollapsed ? "justify-center" : ""}`}
                  title={isCollapsed ? item.name : undefined}
                >
                  {isActive && !isCollapsed && (
                    <span className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-blue-600" />
                  )}
                  {isActive && isCollapsed && (
                    <span className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-blue-600" />
                  )}
                  <span
                    className={`flex-shrink-0 transition-colors ${
                      isActive ? "text-blue-600" : "text-gray-500 group-hover:text-gray-700"
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                  </span>
                  <span
                    className={`overflow-hidden whitespace-nowrap transition-all duration-200 ${
                      isCollapsed
                        ? "w-0 opacity-0"
                        : "w-full opacity-100"
                    }`}
                  >
                    {item.name}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
