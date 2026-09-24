/*
# Foliora Social Platform — Core Schema Part 4a: Reading Groups

1. New Table
- `reading_groups` — private reading groups created by users

2. Security
- Groups visible to active members + creator
*/

CREATE TABLE IF NOT EXISTS reading_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  cover_url text,
  reading_goal text,
  is_private boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE reading_groups ENABLE ROW LEVEL SECURITY;

-- Groups: visible to members + creator
DROP POLICY IF EXISTS "groups_select_member" ON reading_groups;
CREATE POLICY "groups_select_member" ON reading_groups FOR SELECT
  TO authenticated USING (creator_id = auth.uid());

DROP POLICY IF EXISTS "groups_insert_own" ON reading_groups;
CREATE POLICY "groups_insert_own" ON reading_groups FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = creator_id);

DROP POLICY IF EXISTS "groups_update_creator" ON reading_groups;
CREATE POLICY "groups_update_creator" ON reading_groups FOR UPDATE
  TO authenticated USING (auth.uid() = creator_id) WITH CHECK (auth.uid() = creator_id);

DROP POLICY IF EXISTS "groups_delete_creator" ON reading_groups;
CREATE POLICY "groups_delete_creator" ON reading_groups FOR DELETE
  TO authenticated USING (auth.uid() = creator_id);

CREATE INDEX IF NOT EXISTS idx_reading_groups_creator ON reading_groups(creator_id);

-- UPDATED_AT TRIGGER
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'reading_groups_updated_at') THEN
    CREATE TRIGGER reading_groups_updated_at BEFORE UPDATE ON reading_groups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;
