"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import ArticleHeader from "@/components/ArticleHeader";

interface Lead {
  id: number;
  text: string;
}

interface FactItem {
  id: number;
  text: string;
  source: string;
}

interface VerifyItem {
  id: number;
  text: string;
  checked: boolean;
}

interface ReviewerSuggestion {
  id: number;
  text: string;
  checked: boolean;
  showDetails?: boolean;
}

export default function ArticlesPage() {
  const searchParams = useSearchParams();
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [articleType, setArticleType] = useState("스트린이드");

  // URL 쿼리 파라미터에서 주제 가져오기
  useEffect(() => {
    const topicParam = searchParams.get("topic");
    if (topicParam) {
      setTopic(decodeURIComponent(topicParam));
    }
  }, [searchParams]);
  
  // 리드 10개
  const [leads, setLeads] = useState<Lead[]>([]);
  
  // FACT BOX
  const [facts, setFacts] = useState<FactItem[]>([]);
  
  // ANALYSIS
  const [analysis, setAnalysis] = useState("");
  
  // VERIFY LIST
  const [verifyList, setVerifyList] = useState<VerifyItem[]>([]);
  
  // Reviewer 제안
  const [suggestions, setSuggestions] = useState<ReviewerSuggestion[]>([]);
  
  // 기사 내용
  const [articleContent, setArticleContent] = useState({
    lead: "",
    body: "",
  });

  const handleGenerateDraft = async () => {
    if (!topic.trim()) {
      alert("기사 주제를 입력해주세요.");
      return;
    }

    setLoading(true);

    try {
      // n8n Webhook을 통해 AI로 리드 생성
      const response = await fetch("/api/generate-leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic,
          articleType,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "리드 생성에 실패했습니다.");
      }

      const data = await response.json();

      // 리드 10개 설정
      if (data.leads && Array.isArray(data.leads)) {
        setLeads(
          data.leads.map((lead: string, index: number) => ({
            id: index + 1,
            text: lead,
          }))
        );
      }

      // FACT BOX 설정
      if (data.facts && Array.isArray(data.facts)) {
        setFacts(
          data.facts.map((fact: any, index: number) => ({
            id: index + 1,
            text: fact.text || fact,
            source: fact.source || "출처",
          }))
        );
      }

      // ANALYSIS 설정
      if (data.analysis) {
        setAnalysis(data.analysis);
      }

      // VERIFY LIST 설정
      if (data.verifyList && Array.isArray(data.verifyList)) {
        setVerifyList(
          data.verifyList.map((item: any, index: number) => ({
            id: index + 1,
            text: typeof item === "string" ? item : item.text,
            checked: typeof item === "object" ? item.checked || false : false,
          }))
        );
      }

      // 기사 초안 기본값 설정
      if (data.leads && data.leads.length > 0) {
        setArticleContent({
          lead: data.leads[0] || `${topic}에 대한 기사 리드입니다.`,
          body: data.analysis || `${topic}의 본문 내용이 여기에 들어갑니다.`,
        });
      }
    } catch (error: any) {
      console.error("Error generating draft:", error);
      alert(error.message || "리드 생성에 실패했습니다. 다시 시도해주세요.");
      
      // 에러 발생 시 기본값 설정
      setLeads([
        { id: 1, text: `${topic}에 대한 첫 번째 리드 제안입니다.` },
        { id: 2, text: `${topic}의 핵심 내용을 다루는 두 번째 리드입니다.` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const toggleVerifyItem = (id: number) => {
    setVerifyList((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const toggleSuggestion = (id: number) => {
    setSuggestions((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const toggleSuggestionDetails = (id: number) => {
    setSuggestions((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, showDetails: !item.showDetails }
          : item
      )
    );
  };

  return (
    <div className="flex h-screen flex-col bg-gray-50">

     

      {/* 메인 컨텐츠 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 왼쪽 패널: 리드 10개 */}
        <div className="w-80 border-r border-gray-200 bg-white p-4 overflow-y-auto">
          <h2 className="mb-4 text-sm font-semibold text-gray-900">
            리드 10개 자동 생성
          </h2>
          <div className="space-y-2">
            {leads.length === 0 ? (
              <p className="text-sm text-gray-500">
                초안을 생성하면 리드가 표시됩니다.
              </p>
            ) : (
              leads.map((lead) => (
                <div
                  key={lead.id}
                  className="cursor-pointer rounded border border-gray-200 p-3 text-sm hover:bg-gray-50"
                  onClick={() => setArticleContent({ ...articleContent, lead: lead.text })}
                >
                  <span className="font-medium text-gray-700">{lead.id}.</span>{" "}
                  {lead.text}
                </div>
              ))
            )}
          </div>
        </div>

        {/* 중앙 컨텐츠 영역 */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* 기사 주제 입력 */}
          <div className="border-b border-gray-200 bg-white p-4">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">
                기사 주제 입력
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="기사 주제를 입력하세요"
                className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                onKeyPress={(e) => {
                  if (e.key === "Enter") handleGenerateDraft();
                }}
              />
              <button
                onClick={handleGenerateDraft}
                disabled={loading}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "생성 중..." : "초안 생성 >"}
              </button>
            </div>
          </div>

          {/* 기사 내용 영역 */}
          <div className="flex flex-1 overflow-hidden">
            {/* FACT BOX & ANALYSIS */}
            <div className="flex w-1/2 flex-col border-r border-gray-200">
              {/* FACT BOX */}
              <div className="flex-1 overflow-y-auto border-b border-gray-200 bg-white p-4">
                <h3 className="mb-3 text-sm font-semibold text-gray-900">
                  FACT BOX
                </h3>
                {facts.length === 0 ? (
                  <p className="text-sm text-gray-500">팩트가 없습니다.</p>
                ) : (
                  <ul className="space-y-2">
                    {facts.map((fact) => (
                      <li
                        key={fact.id}
                        className="flex items-start gap-2 text-sm text-gray-700"
                      >
                        <span className="text-blue-600">•</span>
                        <span className="flex-1">{fact.text}</span>
                        <span className="text-xs text-gray-500">
                          (출처: {fact.source})
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* ANALYSIS */}
              <div className="flex-1 overflow-y-auto bg-white p-4">
                <h3 className="mb-3 text-sm font-semibold text-gray-900">
                  ANALYSIS
                </h3>
                {analysis ? (
                  <p className="text-sm leading-relaxed text-gray-700">
                    {analysis}
                  </p>
                ) : (
                  <p className="text-sm text-gray-500">분석 내용이 없습니다.</p>
                )}
              </div>
            </div>

            {/* VERIFY LIST & 기사 본문 */}
            <div className="flex w-1/2 flex-col">
              {/* VERIFY LIST */}
              <div className="flex-1 overflow-y-auto border-b border-gray-200 bg-white p-4">
                <h3 className="mb-3 text-sm font-semibold text-gray-900">
                  VERIFY LIST
                </h3>
                {verifyList.length === 0 ? (
                  <p className="text-sm text-gray-500">검증 항목이 없습니다.</p>
                ) : (
                  <div className="space-y-2">
                    {verifyList.map((item) => (
                      <label
                        key={item.id}
                        className="flex cursor-pointer items-start gap-2 text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={item.checked}
                          onChange={() => toggleVerifyItem(item.id)}
                          className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span
                          className={item.checked ? "text-gray-700" : "text-gray-400"}
                        >
                          {item.text}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* 기사 본문 */}
              <div className="flex-1 overflow-y-auto bg-white p-4">
                <h3 className="mb-3 text-sm font-semibold text-gray-900">
                  기사 초안
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">
                      리드
                    </label>
                    <textarea
                      value={articleContent.lead}
                      onChange={(e) =>
                        setArticleContent({ ...articleContent, lead: e.target.value })
                      }
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      rows={3}
                      placeholder="리드를 입력하세요"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">
                      본문
                    </label>
                    <textarea
                      value={articleContent.body}
                      onChange={(e) =>
                        setArticleContent({ ...articleContent, body: e.target.value })
                      }
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:outline-none focus:ring-1 focus:ring-blue-500"
                      rows={10}
                      placeholder="본문을 입력하세요"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reviewer 모드: 수정 제안 */}
      {suggestions.length > 0 && (
        <div className="border-t border-gray-200 bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold text-gray-900">
            판겁자 묘드: 수정 제안
          </h3>
          <div className="space-y-2">
            {suggestions.map((suggestion) => (
              <div key={suggestion.id} className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={suggestion.checked}
                  onChange={() => toggleSuggestion(suggestion.id)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm ${
                        suggestion.checked ? "text-gray-700" : "text-gray-400"
                      }`}
                    >
                      {suggestion.text}
                    </span>
                    {suggestion.id === 1 && (
                      <button
                        onClick={() => toggleSuggestionDetails(suggestion.id)}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        {suggestion.showDetails ? "[수정 제안 숨기기]" : "[수정 제안 보기]"}
                      </button>
                    )}
                  </div>
                  {suggestion.showDetails && suggestion.id === 1 && (
                    <div className="mt-2 rounded-md bg-gray-50 p-2 text-xs text-gray-600">
                      수정된 전문적인 문장 예시가 여기에 표시됩니다.
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 하단 버튼 */}
      <div className="border-t border-gray-200 bg-white p-4">
        <div className="flex justify-end gap-3">
          <button className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            초안 저장
          </button>
          <button className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            다운로드
          </button>
          <button className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
            출고
          </button>
        </div>
      </div>
    </div>
  );
}
