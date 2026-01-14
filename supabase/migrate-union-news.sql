-- union_news 테이블 마이그레이션 스크립트
-- 기존 테이블을 새로운 스키마로 변경

-- 1. 기존 RLS 정책 삭제
DROP POLICY IF EXISTS "Users can view own union_news" ON union_news;
DROP POLICY IF EXISTS "Users can insert own union_news" ON union_news;
DROP POLICY IF EXISTS "Users can update own union_news" ON union_news;
DROP POLICY IF EXISTS "Users can delete own union_news" ON union_news;

-- 2. 기존 인덱스 삭제
DROP INDEX IF EXISTS idx_union_news_user_id;

-- 3. 기존 데이터 백업 (선택사항)
-- CREATE TABLE union_news_backup AS SELECT * FROM union_news;

-- 4. user_id 및 published_at 컬럼 제거
ALTER TABLE union_news 
  DROP COLUMN IF EXISTS user_id,
  DROP COLUMN IF EXISTS published_at;

-- 5. 컬럼 제약 조건 변경 (NULL 허용)
ALTER TABLE union_news
  ALTER COLUMN title DROP NOT NULL,
  ALTER COLUMN event_type DROP NOT NULL,
  ALTER COLUMN event_date DROP NOT NULL;

-- event_type의 CHECK 제약 조건 제거 (더 유연하게)
ALTER TABLE union_news DROP CONSTRAINT IF EXISTS union_news_event_type_check;

-- 6. 새로운 RLS 정책 생성 (모든 사용자가 공유)
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

-- 완료 메시지
SELECT 'union_news 테이블 마이그레이션 완료' AS status;
