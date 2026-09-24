/*
# User favorites and reading list

Persist each user's favorites and reading list in Supabase so data survives logout/login.
*/

CREATE TABLE IF NOT EXISTS user_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id text NOT NULL,
  book_data jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, book_id)
);

CREATE TABLE IF NOT EXISTS user_reading_list (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id text NOT NULL,
  book_data jsonb NOT NULL,
  status text NOT NULL DEFAULT 'to-read' CHECK (status IN ('to-read', 'reading', 'completed')),
  added_at timestamptz DEFAULT now(),
  UNIQUE(user_id, book_id)
);

ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_reading_list ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_favorites_select_own" ON user_favorites;
CREATE POLICY "user_favorites_select_own" ON user_favorites FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_favorites_insert_own" ON user_favorites;
CREATE POLICY "user_favorites_insert_own" ON user_favorites FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_favorites_delete_own" ON user_favorites;
CREATE POLICY "user_favorites_delete_own" ON user_favorites FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_reading_list_select_own" ON user_reading_list;
CREATE POLICY "user_reading_list_select_own" ON user_reading_list FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_reading_list_insert_own" ON user_reading_list;
CREATE POLICY "user_reading_list_insert_own" ON user_reading_list FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_reading_list_update_own" ON user_reading_list;
CREATE POLICY "user_reading_list_update_own" ON user_reading_list FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_reading_list_delete_own" ON user_reading_list;
CREATE POLICY "user_reading_list_delete_own" ON user_reading_list FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_favorites_user ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_reading_list_user ON user_reading_list(user_id);
