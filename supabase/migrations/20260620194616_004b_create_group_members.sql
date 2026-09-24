/*
# Foliora Social Platform — Core Schema Part 4b: Group Members

1. New Table
- `group_members` — membership records for reading groups

2. Security
- Members visible to group members + self
*/

CREATE TABLE IF NOT EXISTS group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES reading_groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('creator', 'admin', 'member')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'left')),
  joined_at timestamptz DEFAULT now(),
  UNIQUE(group_id, user_id)
);

ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "group_members_select_member" ON group_members;
CREATE POLICY "group_members_select_member" ON group_members FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM group_members AS gm
      WHERE gm.group_id = group_members.group_id
      AND gm.user_id = auth.uid()
      AND gm.status = 'active'
    )
    OR user_id = auth.uid()
  );

DROP POLICY IF EXISTS "group_members_insert_invited" ON group_members;
CREATE POLICY "group_members_insert_invited" ON group_members FOR INSERT
  TO authenticated WITH CHECK (
    auth.uid() = (SELECT creator_id FROM reading_groups WHERE id = group_members.group_id)
  );

DROP POLICY IF EXISTS "group_members_update_own" ON group_members;
CREATE POLICY "group_members_update_own" ON group_members FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "group_members_delete_own_or_creator" ON group_members;
CREATE POLICY "group_members_delete_own_or_creator" ON group_members FOR DELETE
  TO authenticated USING (
    auth.uid() = user_id
    OR auth.uid() = (SELECT creator_id FROM reading_groups WHERE id = group_members.group_id)
  );

CREATE INDEX IF NOT EXISTS idx_group_members_group ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user ON group_members(user_id);
