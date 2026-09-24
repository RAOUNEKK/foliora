/*
# Foliora Social Platform — Core Schema Part 2: Followers + Reading Progress

1. New Tables
- `followers` — bidirectional follow relationships between users
- `reading_progress` — private reading progress tracker per book

2. Security
- Followers: users can see their own follow relationships
- Reading progress: STRICTLY owner-only (private)

3. Indexes
- follower_id, following_id for followers
- user_id, book_id for reading progress
*/

-- FOLLOWERS TABLE
CREATE TABLE IF NOT EXISTS followers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

ALTER TABLE followers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "followers_select_own" ON followers;
CREATE POLICY "followers_select_own" ON followers FOR SELECT
  TO authenticated USING (
    auth.uid() = follower_id OR auth.uid() = following_id
  );

DROP POLICY IF EXISTS "followers_insert_own" ON followers;
CREATE POLICY "followers_insert_own" ON followers FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = follower_id);

DROP POLICY IF EXISTS "followers_delete_own" ON followers;
CREATE POLICY "followers_delete_own" ON followers FOR DELETE
  TO authenticated USING (
    auth.uid() = follower_id OR auth.uid() = following_id
  );

CREATE INDEX IF NOT EXISTS idx_followers_follower ON followers(follower_id);
CREATE INDEX IF NOT EXISTS idx_followers_following ON followers(following_id);

-- READING PROGRESS TABLE (PRIVATE)
CREATE TABLE IF NOT EXISTS reading_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id text NOT NULL,
  book_title text NOT NULL,
  book_cover text,
  status text NOT NULL DEFAULT 'want-to-read' CHECK (status IN ('want-to-read', 'reading', 'completed', 'dropped')),
  pages_read integer NOT NULL DEFAULT 0,
  total_pages integer,
  completion_percentage integer NOT NULL DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  started_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, book_id)
);

ALTER TABLE reading_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reading_progress_select_own" ON reading_progress;
CREATE POLICY "reading_progress_select_own" ON reading_progress FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "reading_progress_insert_own" ON reading_progress;
CREATE POLICY "reading_progress_insert_own" ON reading_progress FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "reading_progress_update_own" ON reading_progress;
CREATE POLICY "reading_progress_update_own" ON reading_progress FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "reading_progress_delete_own" ON reading_progress;
CREATE POLICY "reading_progress_delete_own" ON reading_progress FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_reading_progress_user ON reading_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_progress_book ON reading_progress(book_id);
CREATE INDEX IF NOT EXISTS idx_reading_progress_status ON reading_progress(user_id, status);

-- UPDATED_AT TRIGGER FOR READING PROGRESS
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'reading_progress_updated_at') THEN
    CREATE TRIGGER reading_progress_updated_at BEFORE UPDATE ON reading_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;
