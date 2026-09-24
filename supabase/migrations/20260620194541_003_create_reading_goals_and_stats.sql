/*
# Foliora Social Platform — Core Schema Part 3: Reading Goals + User Statistics

1. New Tables
- `reading_goals` — personal reading goals with progress tracking
- `user_statistics` — aggregated user reading statistics

2. Security
- Both tables: owner-only access

3. Triggers
- Auto-update updated_at on reading_goals
*/

-- READING GOALS TABLE
CREATE TABLE IF NOT EXISTS reading_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  target_value integer NOT NULL,
  current_value integer NOT NULL DEFAULT 0,
  goal_type text NOT NULL DEFAULT 'books' CHECK (goal_type IN ('books', 'pages', 'custom')),
  deadline timestamptz,
  completed boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE reading_goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reading_goals_select_own" ON reading_goals;
CREATE POLICY "reading_goals_select_own" ON reading_goals FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "reading_goals_insert_own" ON reading_goals;
CREATE POLICY "reading_goals_insert_own" ON reading_goals FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "reading_goals_update_own" ON reading_goals;
CREATE POLICY "reading_goals_update_own" ON reading_goals FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "reading_goals_delete_own" ON reading_goals;
CREATE POLICY "reading_goals_delete_own" ON reading_goals FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_reading_goals_user ON reading_goals(user_id);

-- USER STATISTICS TABLE
CREATE TABLE IF NOT EXISTS user_statistics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  books_completed integer NOT NULL DEFAULT 0,
  books_reading integer NOT NULL DEFAULT 0,
  total_pages_read integer NOT NULL DEFAULT 0,
  reading_streak integer NOT NULL DEFAULT 0,
  last_read_date date,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_statistics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_stats_select_own" ON user_statistics;
CREATE POLICY "user_stats_select_own" ON user_statistics FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_stats_insert_own" ON user_statistics;
CREATE POLICY "user_stats_insert_own" ON user_statistics FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_stats_update_own" ON user_statistics;
CREATE POLICY "user_stats_update_own" ON user_statistics FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_stats_user ON user_statistics(user_id);

-- UPDATED_AT TRIGGER FOR READING GOALS
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'reading_goals_updated_at') THEN
    CREATE TRIGGER reading_goals_updated_at BEFORE UPDATE ON reading_goals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;
