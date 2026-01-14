export type ArticleStatus = "draft" | "published";

export interface Article {
  id: string;
  user_id: string;
  title: string;
  content: string;
  status: ArticleStatus;
  created_at: string;
}

export type EventType = "총회" | "입찰" | "시공사선정" | "기타";

export interface UnionNews {
  id: string;
  title: string | null;
  event_type: EventType | null;
  association_name: string | null;
  district_name: string | null;
  region_si: string | null;
  region_gu: string | null;
  event_date: string | null;
  summary: string | null;
  source_name: string | null;
  source_url: string | null;
  created_at: string;
}

export interface Document {
  id: string;
  user_id: string;
  file_name: string;
  file_url: string;
  created_at: string;
}

export interface Settings {
  id: string;
  user_id: string;
  default_period: number;
  favorite_regions: string[];
  created_at: string;
}
