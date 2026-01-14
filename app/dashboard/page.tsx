"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { UnionNews, PolicyNews } from "@/types/database";
import ArticleTopicCard from "@/components/ArticleTopicCard";
import Link from "next/link";

interface ArticleTopic {
  id: string;
  title: string;
  description: string;
  keywords: string[];
  relatedNewsCount: number;
}

export default function DashboardPage() {
  const [userEmail, setUserEmail] = useState("");
  const [topics, setTopics] = useState<ArticleTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadUserAndTopics();
  }, []);

  const loadUserAndTopics = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      
      if (user?.email) {
        setUserEmail(user.email);
      }

      // 최근 2주간 조합소식 가져오기 (created_at 기준 - 새로 수집된 데이터)
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 14);
      const startDateISO = startDate.toISOString();

      // 조합소식과 정책 뉴스를 동시에 가져오기
      const [unionNewsResult, policyNewsResult] = await Promise.all([
        supabase
          .from("union_news")
          .select("*")
          .gte("created_at", startDateISO)
          .order("created_at", { ascending: false }),
        supabase
          .from("policy_news")
          .select("*")
          .gte("created_at", startDateISO)
          .order("created_at", { ascending: false }),
      ]);

      if (unionNewsResult.error) throw unionNewsResult.error;
      if (policyNewsResult.error) throw policyNewsResult.error;

      // 조합소식과 정책 뉴스 데이터를 분석해서 기사 주제 생성
      const generatedTopics = generateArticleTopics(
        unionNewsResult.data || [],
        policyNewsResult.data || []
      );
      setTopics(generatedTopics);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateArticleTopics = (
    unionNews: UnionNews[],
    policyNews: PolicyNews[]
  ): ArticleTopic[] => {
    const allNewsCount = unionNews.length + policyNews.length;

    if (allNewsCount === 0) {
      return [
        {
          id: "1",
          title: "재개발·재건축 시장 동향 분석",
          description: "최근 재개발·재건축 시장의 주요 동향과 변화를 종합적으로 분석하는 기사",
          keywords: ["재개발", "재건축", "시장동향", "분석"],
          relatedNewsCount: 0,
        },
      ];
    }

    const topics: ArticleTopic[] = [];

    // 정책 뉴스 기반 주제 생성
    if (policyNews.length > 0) {
      // 1. 정책 유형별 그룹화
      const policyTypeGroups: Record<string, PolicyNews[]> = {};
      policyNews.forEach((item) => {
        if (item.policy_type) {
          if (!policyTypeGroups[item.policy_type]) {
            policyTypeGroups[item.policy_type] = [];
          }
          policyTypeGroups[item.policy_type].push(item);
        }
      });

      Object.entries(policyTypeGroups)
        .filter(([_, items]) => items.length >= 1)
        .forEach(([policyType, items], index) => {
          topics.push({
            id: `policy-type-${index}`,
            title: `${policyType} 정책 동향 분석`,
            description: `최근 발표된 ${policyType} 관련 정책들을 분석하여 시장에 미치는 영향을 다루는 기사`,
            keywords: [policyType, "정책", "분석", "재개발"],
            relatedNewsCount: items.length,
          });
        });

      // 2. 발표 기관별 그룹화
      const agencyGroups: Record<string, PolicyNews[]> = {};
      policyNews.forEach((item) => {
        if (item.agency_name) {
          if (!agencyGroups[item.agency_name]) {
            agencyGroups[item.agency_name] = [];
          }
          agencyGroups[item.agency_name].push(item);
        }
      });

      Object.entries(agencyGroups)
        .filter(([_, items]) => items.length >= 1)
        .slice(0, 3)
        .forEach(([agency, items], index) => {
          topics.push({
            id: `agency-${index}`,
            title: `${agency} 정책 발표 동향`,
            description: `${agency}에서 최근 발표한 부동산·재개발 관련 정책들을 종합 분석하는 기사`,
            keywords: [agency, "정책", "발표", "재개발"],
            relatedNewsCount: items.length,
          });
        });

      // 3. 지역별 정책 분석
      const regionPolicyGroups: Record<string, PolicyNews[]> = {};
      policyNews.forEach((item) => {
        if (item.region_si) {
          const region = item.region_gu ? `${item.region_si} ${item.region_gu}` : item.region_si;
          if (!regionPolicyGroups[region]) {
            regionPolicyGroups[region] = [];
          }
          regionPolicyGroups[region].push(item);
        }
      });

      Object.entries(regionPolicyGroups)
        .filter(([_, items]) => items.length >= 1)
        .slice(0, 3)
        .forEach(([region, items], index) => {
          topics.push({
            id: `region-policy-${index}`,
            title: `${region} 지역 정책 변화 분석`,
            description: `${region} 지역의 최근 부동산·재개발 정책 변화를 분석하고 시장에 미치는 영향을 다루는 기사`,
            keywords: [region, "정책", "지역분석", "재개발"],
            relatedNewsCount: items.length,
          });
        });

      // 4. 최근 시행 예정 정책 분석 (1개 이상이면 생성)
      const upcomingPolicies = policyNews.filter(
        (item) => item.effective_date && new Date(item.effective_date) > new Date()
      );
      if (upcomingPolicies.length >= 1) {
        topics.push({
          id: "upcoming-policies",
          title: "곧 시행되는 재개발·재건축 정책 분석",
          description: "최근 발표되어 곧 시행될 예정인 재개발·재건축 관련 정책들을 분석하고 시장 전망을 다루는 기사",
          keywords: ["정책", "시행예정", "재개발", "재건축"],
          relatedNewsCount: upcomingPolicies.length,
        });
      }
    }

    // 기존 조합소식 기반 주제 생성 (기존 로직 유지)
    if (unionNews.length > 0) {
      // 지역별 그룹화
      const regionGroups: Record<string, UnionNews[]> = {};
      unionNews.forEach((item) => {
        const region = `${item.region_si || ""} ${item.region_gu || ""}`.trim();
        if (region) {
          if (!regionGroups[region]) {
            regionGroups[region] = [];
          }
          regionGroups[region].push(item);
        }
      });

      // 이벤트 타입별 그룹화
      const eventTypeGroups: Record<string, UnionNews[]> = {};
      unionNews.forEach((item) => {
        if (item.event_type) {
          if (!eventTypeGroups[item.event_type]) {
            eventTypeGroups[item.event_type] = [];
          }
          eventTypeGroups[item.event_type].push(item);
        }
      });

      // 1. 지역별 집중 분석 주제 (1개 이상이면 생성)
      Object.entries(regionGroups)
        .filter(([_, items]) => items.length >= 1)
        .slice(0, 3)
        .forEach(([region, items], index) => {
          topics.push({
            id: `region-${index}`,
            title: `${region} 재개발·재건축 현황과 전망`,
            description: `${region} 지역의 최근 재개발·재건축 동향을 종합 분석하고, 주요 조합의 활동과 향후 전망을 다루는 기사`,
            keywords: [region, "재개발", "재건축", "지역분석"],
            relatedNewsCount: items.length,
          });
        });

      // 2. 이벤트 타입별 트렌드 분석 (1개 이상이면 생성)
      Object.entries(eventTypeGroups)
        .filter(([_, items]) => items.length >= 1)
        .forEach(([eventType, items], index) => {
          topics.push({
            id: `event-${index}`,
            title: `재개발·재건축 ${eventType} 트렌드 분석`,
            description: `최근 2주간 ${eventType} 관련 소식들을 분석하여 시장 동향과 특징을 파악하는 기사`,
            keywords: [eventType, "트렌드", "분석", "재개발"],
            relatedNewsCount: items.length,
          });
        });

      // 3. 대규모 프로젝트 집중 분석
      const largeProjects = unionNews.filter((item) => {
        const title = item.title?.toLowerCase() || "";
        return (
          title.includes("대규모") ||
          title.includes("초대형") ||
          title.includes("메가")
        );
      });

      if (largeProjects.length > 0) {
        topics.push({
          id: "large-1",
          title: "대규모 재개발·재건축 프로젝트 현황",
          description: "최근 진행 중인 대규모 재개발·재건축 프로젝트들의 현황과 특징을 분석하는 기사",
          keywords: ["대규모", "프로젝트", "재개발", "재건축"],
          relatedNewsCount: largeProjects.length,
        });
      }

      // 4. 시공사 선정 트렌드 (1개 이상이면 생성)
      const contractorNews = unionNews.filter(
        (item) => item.event_type === "시공사선정"
      );
      if (contractorNews.length >= 1) {
        topics.push({
          id: "contractor-1",
          title: "재개발·재건축 시공사 선정 동향",
          description: "최근 시공사 선정 결과를 분석하여 건설사별 수주 동향과 시장 점유율 변화를 다루는 기사",
          keywords: ["시공사", "선정", "건설사", "수주"],
          relatedNewsCount: contractorNews.length,
        });
      }

      // 5. 입찰 동향 분석 (1개 이상이면 생성)
      const biddingNews = unionNews.filter((item) => item.event_type === "입찰");
      if (biddingNews.length >= 1) {
        topics.push({
          id: "bidding-1",
          title: "재개발·재건축 입찰 시장 동향",
          description: "최근 입찰 공고와 결과를 분석하여 시장 경쟁 상황과 입찰 동향을 파악하는 기사",
          keywords: ["입찰", "경쟁", "시장동향"],
          relatedNewsCount: biddingNews.length,
        });
      }

      // 6. 종합 분석 주제 (3개 이상이면 생성)
      if (unionNews.length >= 3) {
        topics.push({
          id: "comprehensive-1",
          title: "최근 2주간 재개발·재건축 시장 종합 분석",
          description: "최근 2주간의 재개발·재건축 관련 소식들을 종합하여 시장 전반의 동향과 특징을 분석하는 기사",
          keywords: ["종합분석", "시장동향", "재개발", "재건축"],
          relatedNewsCount: unionNews.length,
        });
      }
    }

    // 중복 제거 및 정렬 (관련 뉴스 수가 많은 순)
    const uniqueTopics = Array.from(
      new Map(topics.map((topic) => [topic.title, topic])).values()
    ).sort((a, b) => b.relatedNewsCount - a.relatedNewsCount);

    // 주제가 하나도 생성되지 않았지만 데이터가 있는 경우 기본 주제 제공
    if (uniqueTopics.length === 0 && allNewsCount > 0) {
      const newsType = unionNews.length > 0 && policyNews.length > 0
        ? "조합소식과 부동산 정책"
        : unionNews.length > 0
        ? "조합소식"
        : "부동산 정책";
      
      return [
        {
          id: "default-1",
          title: `최근 ${newsType} 동향 분석`,
          description: `최근 2주간의 ${newsType} 데이터를 분석하여 시장 동향과 특징을 파악하는 기사`,
          keywords: ["재개발", "재건축", "시장동향", "분석"],
          relatedNewsCount: allNewsCount,
        },
      ];
    }

    return uniqueTopics.slice(0, 8); // 최대 8개 주제
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>
          <p className="mt-1 text-sm text-gray-600">
            안녕하세요, <span className="font-medium">{userEmail}</span>님
          </p>
        </div>
        <Link
          href="/dashboard/articles"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          새 기사 작성
        </Link>
      </div>

      {/* 기사 주제 추천 섹션 */}
      <div className="mb-6 rounded-lg bg-white p-6 shadow">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              📝 기사 작성 주제 추천
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              최근 2주간의 조합소식과 부동산 정책 뉴스를 분석하여 추천하는 기사 주제입니다. 새로고침할 때마다 최신 데이터를 반영합니다.
            </p>
          </div>
          <button
            onClick={loadUserAndTopics}
            disabled={loading}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {loading ? "새로고침 중..." : "새로고침"}
          </button>
        </div>

        {loading ? (
          <div className="py-8 text-center text-gray-500">
            주제를 분석하고 있습니다...
          </div>
        ) : topics.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
            <p className="text-gray-600">
              최근 2주간의 데이터가 분석에 충분하지 않아 주제를 생성하기 어렵습니다.
            </p>
            <p className="mt-2 text-sm text-gray-500">
              더 많은 조합소식이나 부동산 정책 뉴스가 필요합니다.
            </p>
            <div className="mt-4 flex justify-center gap-4">
              <Link
                href="/dashboard/union-news"
                className="inline-block text-sm text-blue-600 hover:text-blue-800"
              >
                조합소식 페이지로 이동 →
              </Link>
              <Link
                href="/dashboard/policy-news"
                className="inline-block text-sm text-blue-600 hover:text-blue-800"
              >
                부동산 정책 페이지로 이동 →
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {topics.map((topic) => (
              <ArticleTopicCard key={topic.id} topic={topic} />
            ))}
          </div>
        )}
      </div>

      {/* 빠른 링크 */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Link
          href="/dashboard/articles"
          className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
        >
          <h3 className="mb-2 font-semibold text-gray-900">기사 작성</h3>
          <p className="text-sm text-gray-600">
            AI 기자 초안 도구를 사용하여 새로운 기사를 작성하세요.
          </p>
        </Link>
        <Link
          href="/dashboard/union-news"
          className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
        >
          <h3 className="mb-2 font-semibold text-gray-900">조합소식</h3>
          <p className="text-sm text-gray-600">
            최근 조합소식을 확인하고 필터링하세요.
          </p>
        </Link>
        <Link
          href="/dashboard/documents"
          className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
        >
          <h3 className="mb-2 font-semibold text-gray-900">자료 업로드</h3>
          <p className="text-sm text-gray-600">
            문서와 자료를 업로드하고 관리하세요.
          </p>
        </Link>
      </div>
    </div>
  );
}
