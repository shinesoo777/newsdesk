-- News Desk Database Schema
-- Supabase에서 실행할 SQL 스크립트

-- Articles 테이블
CREATE TABLE IF NOT EXISTS articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Union News 테이블
CREATE TABLE IF NOT EXISTS union_news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  event_type TEXT,
  association_name TEXT,
  district_name TEXT,
  region_si TEXT,
  region_gu TEXT,
  event_date DATE,
  summary TEXT,
  source_name TEXT,
  source_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Policy News 테이블 (부동산정책, 재개발·재건축 정책)
CREATE TABLE IF NOT EXISTS policy_news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  policy_type TEXT, -- 정책 유형 (예: "재개발", "재건축", "정비사업", "주택정책", "토지정책" 등)
  agency_name TEXT, -- 발표 기관 (예: "국토교통부", "서울시", "경기도" 등)
  region_si TEXT, -- 적용 지역 (시/도)
  region_gu TEXT, -- 적용 지역 (구/군)
  published_date DATE, -- 정책 발표일
  effective_date DATE, -- 정책 시행일
  summary TEXT, -- 정책 요약
  content TEXT, -- 정책 상세 내용
  source_name TEXT, -- 출처명
  source_url TEXT, -- 출처 URL
  tags TEXT[], -- 태그 배열
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS article_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  topic text,
  article_type text,
  success boolean,
  leads jsonb,
  facts jsonb,
  analysis text,
  verify_list jsonb,
  suggestions jsonb,
  article_lead text,
  article_body text,
  created_at timestamptz DEFAULT now()
);

-- RLS 활성화
ALTER TABLE article_drafts ENABLE ROW LEVEL SECURITY;

-- Article Drafts 테이블 RLS 정책
-- 1. 기존 정책 제거
DROP POLICY IF EXISTS "Users can view own article_drafts" ON article_drafts;
DROP POLICY IF EXISTS "Users can insert own article_drafts" ON article_drafts;
DROP POLICY IF EXISTS "Users can update own article_drafts" ON article_drafts;
DROP POLICY IF EXISTS "Users can delete own article_drafts" ON article_drafts;

-- 2. 정책 재생성 (모든 사용자가 모든 초안 조회 가능)
CREATE POLICY "Anyone can view article_drafts"
  ON article_drafts FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own article_drafts"
  ON article_drafts FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update own article_drafts"
  ON article_drafts FOR UPDATE
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can delete own article_drafts"
  ON article_drafts FOR DELETE
  USING (auth.uid() = user_id OR user_id IS NULL);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_article_drafts_user_id ON article_drafts(user_id);
CREATE INDEX IF NOT EXISTS idx_article_drafts_created_at ON article_drafts(created_at DESC);

-- Documents 테이블
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Settings 테이블
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  default_period INTEGER DEFAULT 14,
  favorite_regions TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS (Row Level Security) 활성화
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE union_news ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_news ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Articles 테이블 RLS 정책
-- 1. 기존 정책 제거
DROP POLICY IF EXISTS "Users can view own articles" ON articles;
DROP POLICY IF EXISTS "Users can insert own articles" ON articles;
DROP POLICY IF EXISTS "Users can update own articles" ON articles;
DROP POLICY IF EXISTS "Users can delete own articles" ON articles;

-- 2. 정책 재생성
CREATE POLICY "Users can view own articles"
  ON articles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own articles"
  ON articles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own articles"
  ON articles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own articles"
  ON articles FOR DELETE
  USING (auth.uid() = user_id);

-- Union News 테이블 RLS 정책 (모든 사용자가 공유)
-- 1. 기존 정책 제거
DROP POLICY IF EXISTS "Anyone can view union_news" ON union_news;
DROP POLICY IF EXISTS "Anyone can insert union_news" ON union_news;
DROP POLICY IF EXISTS "Anyone can update union_news" ON union_news;
DROP POLICY IF EXISTS "Anyone can delete union_news" ON union_news;
DROP POLICY IF EXISTS "Users can view own union_news" ON union_news;
DROP POLICY IF EXISTS "Users can insert own union_news" ON union_news;
DROP POLICY IF EXISTS "Users can update own union_news" ON union_news;
DROP POLICY IF EXISTS "Users can delete own union_news" ON union_news;

-- 2. 정책 재생성
CREATE POLICY "Anyone can view union_news"
  ON union_news FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert union_news"
  ON union_news FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update union_news"
  ON union_news FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete union_news"
  ON union_news FOR DELETE
  USING (true);

-- Policy News 테이블 RLS 정책 (모든 사용자가 공유)
-- 1. 기존 정책 제거
DROP POLICY IF EXISTS "Anyone can view policy_news" ON policy_news;
DROP POLICY IF EXISTS "Anyone can insert policy_news" ON policy_news;
DROP POLICY IF EXISTS "Anyone can update policy_news" ON policy_news;
DROP POLICY IF EXISTS "Anyone can delete policy_news" ON policy_news;

-- 2. 정책 재생성
CREATE POLICY "Anyone can view policy_news"
  ON policy_news FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert policy_news"
  ON policy_news FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update policy_news"
  ON policy_news FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete policy_news"
  ON policy_news FOR DELETE
  USING (true);

-- Documents 테이블 RLS 정책
-- 1. 기존 정책 제거
DROP POLICY IF EXISTS "Users can view own documents" ON documents;
DROP POLICY IF EXISTS "Users can insert own documents" ON documents;
DROP POLICY IF EXISTS "Users can update own documents" ON documents;
DROP POLICY IF EXISTS "Users can delete own documents" ON documents;

-- 2. 정책 재생성
CREATE POLICY "Users can view own documents"
  ON documents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own documents"
  ON documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own documents"
  ON documents FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own documents"
  ON documents FOR DELETE
  USING (auth.uid() = user_id);

-- Settings 테이블 RLS 정책
-- 1. 기존 정책 제거
DROP POLICY IF EXISTS "Users can view own settings" ON settings;
DROP POLICY IF EXISTS "Users can insert own settings" ON settings;
DROP POLICY IF EXISTS "Users can update own settings" ON settings;
DROP POLICY IF EXISTS "Users can delete own settings" ON settings;

-- 2. 정책 재생성
CREATE POLICY "Users can view own settings"
  ON settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
  ON settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON settings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own settings"
  ON settings FOR DELETE
  USING (auth.uid() = user_id);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_articles_user_id ON articles(user_id);
CREATE INDEX IF NOT EXISTS idx_articles_created_at ON articles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_union_news_event_date ON union_news(event_date DESC);
CREATE INDEX IF NOT EXISTS idx_union_news_region ON union_news(region_si, region_gu);
CREATE INDEX IF NOT EXISTS idx_policy_news_published_date ON policy_news(published_date DESC);
CREATE INDEX IF NOT EXISTS idx_policy_news_created_at ON policy_news(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_policy_news_region ON policy_news(region_si, region_gu);
CREATE INDEX IF NOT EXISTS idx_policy_news_policy_type ON policy_news(policy_type);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at DESC);
