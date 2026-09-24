/*
# Foliora Social Platform — Core Schema Part 5: Group Invitations + Messages

1. New Tables
- `group_invitations` — invitation system for group membership
- `group_messages` — real-time chat messages within groups

2. Security
- Invitations visible to inviter, invitee, and group creator
- Messages visible to group members only
*/

-- GROUP INVITATIONS TABLE
CREATE TABLE IF NOT EXISTS group_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES reading_groups(id) ON DELETE CASCADE,
  inviter_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  invitee_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(group_id, invitee_id)
);

ALTER TABLE group_invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "group_invitations_select_involved" ON group_invitations;
CREATE POLICY "group_invitations_select_involved" ON group_invitations FOR SELECT
  TO authenticated USING (
    auth.uid() = inviter_id
    OR auth.uid() = invitee_id
    OR auth.uid() = (SELECT creator_id FROM reading_groups WHERE id = group_invitations.group_id)
  );

DROP POLICY IF EXISTS "group_invitations_insert_creator" ON group_invitations;
CREATE POLICY "group_invitations_insert_creator" ON group_invitations FOR INSERT
  TO authenticated WITH CHECK (
    auth.uid() = inviter_id
    AND auth.uid() = (SELECT creator_id FROM reading_groups WHERE id = group_invitations.group_id)
  );

DROP POLICY IF EXISTS "group_invitations_update_invitee" ON group_invitations;
CREATE POLICY "group_invitations_update_invitee" ON group_invitations FOR UPDATE
  TO authenticated USING (auth.uid() = invitee_id) WITH CHECK (auth.uid() = invitee_id);

DROP POLICY IF EXISTS "group_invitations_delete_involved" ON group_invitations;
CREATE POLICY "group_invitations_delete_involved" ON group_invitations FOR DELETE
  TO authenticated USING (
    auth.uid() = inviter_id
    OR auth.uid() = invitee_id
  );

CREATE INDEX IF NOT EXISTS idx_group_invitations_group ON group_invitations(group_id);
CREATE INDEX IF NOT EXISTS idx_group_invitations_invitee ON group_invitations(invitee_id);

-- GROUP MESSAGES TABLE
CREATE TABLE IF NOT EXISTS group_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES reading_groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  message_type text NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'recommendation', 'goal_update')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE group_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "group_messages_select_member" ON group_messages;
CREATE POLICY "group_messages_select_member" ON group_messages FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = group_messages.group_id
      AND group_members.user_id = auth.uid()
      AND group_members.status = 'active'
    )
  );

DROP POLICY IF EXISTS "group_messages_insert_member" ON group_messages;
CREATE POLICY "group_messages_insert_member" ON group_messages FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = group_messages.group_id
      AND group_members.user_id = auth.uid()
      AND group_members.status = 'active'
    )
  );

DROP POLICY IF EXISTS "group_messages_delete_own" ON group_messages;
CREATE POLICY "group_messages_delete_own" ON group_messages FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_group_messages_group ON group_messages(group_id);
CREATE INDEX IF NOT EXISTS idx_group_messages_created ON group_messages(group_id, created_at);

-- UPDATED_AT TRIGGER FOR GROUP INVITATIONS
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'group_invitations_updated_at') THEN
    CREATE TRIGGER group_invitations_updated_at BEFORE UPDATE ON group_invitations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;
