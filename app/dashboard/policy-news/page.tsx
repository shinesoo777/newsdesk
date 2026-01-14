"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { PolicyNews } from "@/types/database";

export default function PolicyNewsPage() {
  const [news, setNews] = useState<PolicyNews[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(14);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [filters, setFilters] = useState({
    regionSi: "",
    regionGu: "",
    policyType: "",
    agencyName: "",
  });
  const [regionSiOptions, setRegionSiOptions] = useState<string[]>([]);
  const [regionGuOptions, setRegionGuOptions] = useState<string[]>([]);
  const [policyTypeOptions, setPolicyTypeOptions] = useState<string[]>([]);
  const [agencyOptions, setAgencyOptions] = useState<string[]>([]);

  const supabase = createClient();

  useEffect(() => {
    loadFilterOptions();
    loadNews();
    setCurrentPage(1); // 필터 변경 시 첫 페이지로
  }, [days, filters, searchQuery]);

  // region_si 변경 시 구 옵션 업데이트
  useEffect(() => {
    if (filters.regionSi) {
      loadRegionGuOptions(filters.regionSi);
    } else {
      setRegionGuOptions([]);
    }
  }, [filters.regionSi]);

  // 필터 옵션 로드 (실제 데이터에서 고유값 추출)
  const loadFilterOptions = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      // 최근 1개월 데이터에서 필터 옵션 추출
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);
      const startDateISO = startDate.toISOString();

      const { data: allNews, error } = await supabase
        .from("policy_news")
        .select("region_si, region_gu, policy_type, agency_name")
        .gte("created_at", startDateISO);

      if (error) throw error;

      // region_si 고유값 추출 (NULL 제외)
      const uniqueRegionSi = Array.from(
        new Set(
          (allNews || [])
            .map((item) => item.region_si)
            .filter((region): region is string => region != null && region !== "")
        )
      );

      // 지역 정렬 (서울특별시 → 경기도 → 인천광역시 → 나머지)
      const regionOrder = [
        "서울특별시",
        "경기도",
        "인천광역시",
        "부산광역시",
        "대구광역시",
        "광주광역시",
        "대전광역시",
        "울산광역시",
        "세종특별자치시",
      ];

      const sortedRegionSi = uniqueRegionSi.sort((a, b) => {
        const indexA = regionOrder.indexOf(a);
        const indexB = regionOrder.indexOf(b);
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        return a.localeCompare(b, "ko");
      });

      setRegionSiOptions(sortedRegionSi);

      // policy_type 고유값 추출
      const uniquePolicyTypes = Array.from(
        new Set(
          (allNews || [])
            .map((item) => item.policy_type)
            .filter((type): type is string => type != null && type !== "")
        )
      ).sort();
      setPolicyTypeOptions(uniquePolicyTypes);

      // agency_name 고유값 추출
      const uniqueAgencies = Array.from(
        new Set(
          (allNews || [])
            .map((item) => item.agency_name)
            .filter((agency): agency is string => agency != null && agency !== "")
        )
      ).sort();
      setAgencyOptions(uniqueAgencies);
    } catch (error) {
      console.error("Error loading filter options:", error);
    }
  };

  // 선택된 시/도에 따른 구 옵션 로드
  const loadRegionGuOptions = async (regionSi: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);
      const startDateISO = startDate.toISOString();

      const { data: allNews, error } = await supabase
        .from("policy_news")
        .select("region_gu")
        .eq("region_si", regionSi)
        .gte("created_at", startDateISO);

      if (error) throw error;

      const uniqueRegionGu = Array.from(
        new Set(
          (allNews || [])
            .map((item) => item.region_gu)
            .filter((gu): gu is string => gu != null && gu !== "")
        )
      ).sort();

      setRegionGuOptions(uniqueRegionGu);
    } catch (error) {
      console.error("Error loading region gu options:", error);
    }
  };

  const loadNews = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      // created_at 기준으로 최근 수집된 데이터 조회
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const startDateISO = startDate.toISOString();

      let query = supabase
        .from("policy_news")
        .select("*")
        .gte("created_at", startDateISO)
        .order("created_at", { ascending: false });

      if (filters.regionSi) {
        query = query.eq("region_si", filters.regionSi);
      }
      if (filters.regionGu) {
        query = query.eq("region_gu", filters.regionGu);
      }
      if (filters.policyType) {
        query = query.eq("policy_type", filters.policyType);
      }
      if (filters.agencyName) {
        query = query.eq("agency_name", filters.agencyName);
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
            item.summary?.toLowerCase().includes(queryLower) ||
            item.agency_name?.toLowerCase().includes(queryLower) ||
            item.content?.toLowerCase().includes(queryLower)
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">부동산 정책 뉴스</h1>
      </div>

      {/* 필터 및 검색 바 */}
      <div className="mb-6 rounded-lg bg-white p-4 shadow">
        <div className="flex flex-wrap items-center gap-3">
          {/* 지역 필터 (시/도) */}
          <select
            value={filters.regionSi || "전체 지역"}
            onChange={(e) => {
              const newRegionSi = e.target.value === "전체 지역" ? "" : e.target.value;
              setFilters({ ...filters, regionSi: newRegionSi, regionGu: "" });
            }}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option>전체 지역</option>
            {regionSiOptions.map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </select>

          {/* 지역 필터 (구) - 시/도 선택 시에만 표시 */}
          {filters.regionSi && regionGuOptions.length > 0 && (
            <select
              value={filters.regionGu || "전체 구"}
              onChange={(e) =>
                setFilters({ ...filters, regionGu: e.target.value === "전체 구" ? "" : e.target.value })
              }
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option>전체 구</option>
              {regionGuOptions.map((gu) => (
                <option key={gu} value={gu}>
                  {gu}
                </option>
              ))}
            </select>
          )}

          {/* 정책 유형 필터 */}
          <select
            value={filters.policyType || "전체 유형"}
            onChange={(e) =>
              setFilters({ ...filters, policyType: e.target.value === "전체 유형" ? "" : e.target.value })
            }
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option>전체 유형</option>
            {policyTypeOptions.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>

          {/* 발표 기관 필터 */}
          <select
            value={filters.agencyName || "전체 기관"}
            onChange={(e) =>
              setFilters({ ...filters, agencyName: e.target.value === "전체 기관" ? "" : e.target.value })
            }
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option>전체 기관</option>
            {agencyOptions.map((agency) => (
              <option key={agency} value={agency}>
                {agency}
              </option>
            ))}
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
        </div>
      </div>

      {/* 뉴스 리스트 */}
      {loading ? (
        <div className="rounded-lg bg-white p-8 text-center text-gray-500 shadow">
          로딩 중...
        </div>
      ) : paginatedNews.length === 0 ? (
        <div className="rounded-lg bg-white p-8 text-center text-gray-500 shadow">
          정책 뉴스가 없습니다.
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {paginatedNews.map((item) => (
              <div
                key={item.id}
                className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      {item.policy_type && (
                        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
                          {item.policy_type}
                        </span>
                      )}
                      {item.agency_name && (
                        <span className="text-sm text-gray-500">
                          {item.agency_name}
                        </span>
                      )}
                    </div>
                    <h3 className="mb-2 text-lg font-semibold text-gray-900">
                      {item.title || "제목 없음"}
                    </h3>
                    {item.summary && (
                      <p className="mb-3 text-sm text-gray-600 line-clamp-2">
                        {item.summary}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                      {item.region_si && item.region_gu && (
                        <span>
                          📍 {item.region_si} {item.region_gu}
                        </span>
                      )}
                      {item.published_date && (
                        <span>📅 발표: {item.published_date}</span>
                      )}
                      {item.effective_date && (
                        <span>⚡ 시행: {item.effective_date}</span>
                      )}
                      {item.source_name && (
                        <span>📰 출처: {item.source_name}</span>
                      )}
                    </div>
                    {item.tags && item.tags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {item.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-600"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  {item.source_url && (
                    <a
                      href={item.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-4 text-blue-600 hover:text-blue-800"
                    >
                      링크 →
                    </a>
                  )}
                </div>
              </div>
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
