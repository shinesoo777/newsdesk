import { requireAuth } from "@/lib/auth";

export default async function ArticlesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth();
  
  // articles 페이지는 전체 화면 레이아웃 사용 (Header/Sidebar 없음)
  return <>{children}</>;
}
