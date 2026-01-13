"use client";

import Link from "next/link";

interface ArticleTopicCardProps {
  topic: {
    id: string;
    title: string;
    description: string;
    keywords: string[];
    relatedNewsCount: number;
  };
}

export default function ArticleTopicCard({ topic }: ArticleTopicCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-3 flex items-start justify-between">
        <h3 className="flex-1 text-base font-semibold text-gray-900">
          {topic.title}
        </h3>
        <span className="ml-2 rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
          {topic.relatedNewsCount}건
        </span>
      </div>
      
      <p className="mb-3 text-sm text-gray-600 leading-relaxed">
        {topic.description}
      </p>
      
      <div className="mb-4 flex flex-wrap gap-2">
        {topic.keywords.map((keyword, index) => (
          <span
            key={index}
            className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700"
          >
            #{keyword}
          </span>
        ))}
      </div>
      
      <div className="flex gap-2">
        <Link
          href={`/dashboard/articles?topic=${encodeURIComponent(topic.title)}`}
          className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-blue-700"
        >
          기사 작성하기
        </Link>
        <button
          onClick={() => {
            navigator.clipboard.writeText(topic.title);
            alert("주제가 클립보드에 복사되었습니다.");
          }}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          복사
        </button>
      </div>
    </div>
  );
}
