import { UnionNews } from "@/types/database";
import Link from "next/link";

const eventTypeColors: Record<string, string> = {
  총회: "bg-blue-100 text-blue-800",
  입찰: "bg-green-100 text-green-800",
  시공사선정: "bg-purple-100 text-purple-800",
  기타: "bg-gray-100 text-gray-800",
};

export default function UnionNewsCard({ news }: { news: UnionNews }) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).replace(/\./g, ".").replace(/\s/g, "");
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-3 flex items-start justify-between">
        <span
          className={`inline-block rounded px-2 py-1 text-xs font-semibold ${
            eventTypeColors[news.event_type] || eventTypeColors.기타
          }`}
        >
          [{news.event_type}]
        </span>
        <span className="text-sm text-gray-500">
          {formatDate(news.event_date)}
        </span>
      </div>

      <h3 className="mb-3 text-base font-semibold text-gray-900 leading-snug">
        {news.title}
      </h3>

      <div className="mb-3 space-y-1 text-sm text-gray-600">
        <p>
          <span className="font-medium">{news.association_name}</span>{" "}
          {news.district_name}
        </p>
        <p className="text-gray-500">
          {news.region_si} {news.region_gu}
        </p>
      </div>

      {news.summary && (
        <p className="mb-4 line-clamp-2 text-sm text-gray-700 leading-relaxed">
          {news.summary}
        </p>
      )}

      <div className="flex items-center justify-between border-t border-gray-100 pt-3">
        <span className="text-xs text-gray-500">
          {news.source_name || "출처 없음"}
        </span>
        {news.source_url && (
          <Link
            href={news.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-blue-600 hover:text-blue-800"
          >
            원문 보기 →
          </Link>
        )}
      </div>
    </div>
  );
}
