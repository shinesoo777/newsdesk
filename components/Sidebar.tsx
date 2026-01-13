"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  { name: "대시보드", href: "/dashboard" },
  { name: "기사 작성", href: "/dashboard/articles" },
  { name: "조합소식", href: "/dashboard/union-news" },
  { name: "자료 업로드", href: "/dashboard/documents" },
  { name: "설정", href: "/dashboard/settings" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-gray-200 bg-white">
      <nav className="p-4">
        <ul className="space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`block rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
