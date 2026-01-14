"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { UnionNews } from "@/types/database";
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

      // 최근 2주간 조합소식 가져오기
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 14);
      const startDateStr = startDate.toISOString().split("T")[0];

      const { data: news, error } = await supabase
        .from("union_news")
        .select("*")
        .gte("event_date", startDateStr)
        .order("event_date", { ascending: false });

      if (error) throw error;

      // 조합소식 데이터를 분석해서 기사 주제 생성
      const generatedTopics = generateArticleTopics(news || []);
      setTopics(generatedTopics);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateArticleTopics = (news: UnionNews[]): ArticleTopic[] => {
    if (news.length === 0) {
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

    // 지역별 그룹화
    const regionGroups: Record<string, UnionNews[]> = {};
    news.forEach((item) => {
      const region = `${item.region_si} ${item.region_gu}`;
      if (!regionGroups[region]) {
        regionGroups[region] = [];
      }
      regionGroups[region].push(item);
    });

    // 이벤트 타입별 그룹화
    const eventTypeGroups: Record<string, UnionNews[]> = {};
    news.forEach((item) => {
      if (!eventTypeGroups[item.event_type]) {
        eventTypeGroups[item.event_type] = [];
      }
      eventTypeGroups[item.event_type].push(item);
    });

    const topics: ArticleTopic[] = [];

    // 1. 지역별 집중 분석 주제
    Object.entries(regionGroups)
      .filter(([_, items]) => items.length >= 2)
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

    // 2. 이벤트 타입별 트렌드 분석
    Object.entries(eventTypeGroups)
      .filter(([_, items]) => items.length >= 2)
      .forEach(([eventType, items], index) => {
        topics.push({
          id: `event-${index}`,
          title: `재개발·재건축 ${eventType} 트렌드 분석`,
          description: `최근 2주간 ${eventType} 관련 소식들을 분석하여 시장 동향과 특징을 파악하는 기사`,
          keywords: [eventType, "트렌드", "분석", "재개발"],
          relatedNewsCount: items.length,
        });
      });

    // 3. 정책 및 제도 관련 주제
    const policyKeywords = ["정책", "제도", "법안", "규제", "지원"];
    const policyRelatedNews = news.filter((item) =>
      policyKeywords.some(
        (keyword) =>
          item.title.includes(keyword) || item.summary?.includes(keyword)
      )
    );

    if (policyRelatedNews.length > 0) {
      topics.push({
        id: "policy-1",
        title: "재개발·재건축 정책 변화와 시장 영향",
        description: "최근 정책 변화가 재개발·재건축 시장에 미치는 영향을 분석하고, 조합과 입주민에게 미치는 영향을 다루는 기사",
        keywords: ["정책", "제도", "시장영향", "재개발"],
        relatedNewsCount: policyRelatedNews.length,
      });
    }

    // 4. 대규모 프로젝트 집중 분석
    const largeProjects = news.filter((item) => {
      const title = item.title.toLowerCase();
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

    // 5. 시공사 선정 트렌드
    const contractorNews = news.filter(
      (item) => item.event_type === "시공사선정"
    );
    if (contractorNews.length >= 2) {
      topics.push({
        id: "contractor-1",
        title: "재개발·재건축 시공사 선정 동향",
        description: "최근 시공사 선정 결과를 분석하여 건설사별 수주 동향과 시장 점유율 변화를 다루는 기사",
        keywords: ["시공사", "선정", "건설사", "수주"],
        relatedNewsCount: contractorNews.length,
      });
    }

    // 6. 입찰 동향 분석
    const biddingNews = news.filter((item) => item.event_type === "입찰");
    if (biddingNews.length >= 2) {
      topics.push({
        id: "bidding-1",
        title: "재개발·재건축 입찰 시장 동향",
        description: "최근 입찰 공고와 결과를 분석하여 시장 경쟁 상황과 입찰 동향을 파악하는 기사",
        keywords: ["입찰", "경쟁", "시장동향"],
        relatedNewsCount: biddingNews.length,
      });
    }

    // 7. 종합 분석 주제
    if (news.length >= 5) {
      topics.push({
        id: "comprehensive-1",
        title: "최근 2주간 재개발·재건축 시장 종합 분석",
        description: "최근 2주간의 재개발·재건축 관련 소식들을 종합하여 시장 전반의 동향과 특징을 분석하는 기사",
        keywords: ["종합분석", "시장동향", "재개발", "재건축"],
        relatedNewsCount: news.length,
      });
    }

    // 중복 제거 및 정렬 (관련 뉴스 수가 많은 순)
    const uniqueTopics = Array.from(
      new Map(topics.map((topic) => [topic.title, topic])).values()
    ).sort((a, b) => b.relatedNewsCount - a.relatedNewsCount);

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
              최근 2주간의 재개발·재건축 정책 관련 뉴스와 보도자료를 분석하여 추천하는 기사 주제입니다.
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
              최근 2주간의 조합소식이 없어 주제를 생성할 수 없습니다.
            </p>
            <Link
              href="/dashboard/union-news"
              className="mt-4 inline-block text-sm text-blue-600 hover:text-blue-800"
            >
              조합소식 페이지로 이동 →
            </Link>
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
