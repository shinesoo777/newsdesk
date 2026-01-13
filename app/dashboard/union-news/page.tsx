"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { UnionNews } from "@/types/database";
import UnionNewsCard from "@/components/UnionNewsCard";

export default function UnionNewsPage() {
  const [news, setNews] = useState<UnionNews[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(14);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [filters, setFilters] = useState({
    regionSi: "",
    regionGu: "",
    eventType: "",
    projectType: "",
  });

  const supabase = createClient();

  useEffect(() => {
    loadNews();
    setCurrentPage(1); // 필터 변경 시 첫 페이지로
  }, [days, filters, searchQuery]);

  const loadNews = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const startDateStr = startDate.toISOString().split("T")[0];

      let query = supabase
        .from("union_news")
        .select("*")
        .eq("user_id", user.id)
        .gte("event_date", startDateStr)
        .order("event_date", { ascending: false });

      if (filters.regionSi) {
        query = query.eq("region_si", filters.regionSi);
      }
      if (filters.regionGu) {
        query = query.eq("region_gu", filters.regionGu);
      }
      if (filters.eventType) {
        query = query.eq("event_type", filters.eventType);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // 클라이언트 사이드 검색 필터링
      let filteredData = data || [];
      if (searchQuery) {
        const queryLower = searchQuery.toLowerCase();
        filteredData = filteredData.filter(
          (item) =>
            item.title?.toLowerCase().includes(queryLower) ||
            item.association_name?.toLowerCase().includes(queryLower) ||
            item.district_name?.toLowerCase().includes(queryLower) ||
            item.summary?.toLowerCase().includes(queryLower)
        );
      }
      
      setNews(filteredData);
    } catch (error) {
      console.error("Error loading news:", error);
    } finally {
      setLoading(false);
    }
  };

  // 페이지네이션 계산
  const totalPages = Math.ceil(news.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedNews = news.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div>
      {/* 헤더 */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">조합소식</h1>
        <button className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          새 소식 등록
        </button>
      </div>

      {/* 필터 및 검색 바 */}
      <div className="mb-6 rounded-lg bg-white p-4 shadow">
        <div className="flex flex-wrap items-center gap-3">
          {/* 지역 필터 */}
          <select
            value={filters.regionSi || "전체 지역"}
            onChange={(e) =>
              setFilters({ ...filters, regionSi: e.target.value === "전체 지역" ? "" : e.target.value })
            }
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option>전체 지역</option>
            <option value="서울">서울</option>
            <option value="경기">경기</option>
            <option value="인천">인천</option>
            <option value="부산">부산</option>
          </select>

          {/* 유형 필터 */}
          <select
            value={filters.eventType || "전체 유형"}
            onChange={(e) =>
              setFilters({ ...filters, eventType: e.target.value === "전체 유형" ? "" : e.target.value })
            }
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option>전체 유형</option>
            <option value="총회">총회</option>
            <option value="입찰">입찰</option>
            <option value="시공사선정">시공사선정</option>
            <option value="기타">기타</option>
          </select>

          {/* 검색 */}
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="검색어를 입력해주세요"
            className="flex-1 min-w-[200px] rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />

          {/* 기간 필터 */}
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value={7}>최근 1주</option>
            <option value={14}>최근 2주</option>
            <option value={30}>최근 1개월</option>
            <option value={60}>최근 2개월</option>
          </select>

          {/* 정렬 */}
          <select
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option>정렬: 최신순</option>
            <option>정렬: 오래된순</option>
          </select>
        </div>
      </div>

      {/* 뉴스 리스트 */}
      {loading ? (
        <div className="rounded-lg bg-white p-8 text-center text-gray-500 shadow">
          로딩 중...
        </div>
      ) : paginatedNews.length === 0 ? (
        <div className="rounded-lg bg-white p-8 text-center text-gray-500 shadow">
          조합소식이 없습니다.
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {paginatedNews.map((item) => (
              <UnionNewsCard key={item.id} news={item} />
            ))}
          </div>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                &lt;
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`rounded-md px-3 py-2 text-sm ${
                    currentPage === page
                      ? "bg-blue-600 text-white"
                      : "border border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {page}
                </button>
              ))}
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                &gt;
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
