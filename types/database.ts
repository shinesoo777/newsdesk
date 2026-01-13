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
  user_id: string;
  title: string;
  event_type: EventType;
  association_name: string;
  district_name: string;
  region_si: string;
  region_gu: string;
  event_date: string;
  published_at: string;
  summary: string;
  source_name: string;
  source_url: string;
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
