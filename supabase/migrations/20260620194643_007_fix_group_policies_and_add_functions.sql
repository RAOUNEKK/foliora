/*
# Foliora Social Platform — Core Schema Part 7: Fix Group Policies + Helper Functions

1. Fix reading_groups SELECT policy to include members
2. Add helper functions for stats, notifications, follow counts
*/

-- Fix groups select policy to include members
DROP POLICY IF EXISTS "groups_select_member" ON reading_groups;
CREATE POLICY "groups_select_member" ON reading_groups FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = reading_groups.id
      AND group_members.user_id = auth.uid()
      AND group_members.status = 'active'
    )
    OR creator_id = auth.uid()
  );

-- Fix group_members insert policy to include accepted invites
DROP POLICY IF EXISTS "group_members_insert_invited" ON group_members;
CREATE POLICY "group_members_insert_invited" ON group_members FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_invitations
      WHERE group_invitations.group_id = group_members.group_id
      AND group_invitations.invitee_id = auth.uid()
      AND group_invitations.status = 'accepted'
    )
    OR auth.uid() = (SELECT creator_id FROM reading_groups WHERE id = group_members.group_id)
  );

-- Function to get follower count
CREATE OR REPLACE FUNCTION get_follower_count(user_uuid uuid)
RETURNS integer AS $$
DECLARE
  count integer;
BEGIN
  SELECT COUNT(*) INTO count FROM followers WHERE following_id = user_uuid;
  RETURN count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get following count
CREATE OR REPLACE FUNCTION get_following_count(user_uuid uuid)
RETURNS integer AS $$
DECLARE
  count integer;
BEGIN
  SELECT COUNT(*) INTO count FROM followers WHERE follower_id = user_uuid;
  RETURN count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user A follows user B
CREATE OR REPLACE FUNCTION is_following(follower uuid, following uuid)
RETURNS boolean AS $$
DECLARE
  exists_check boolean;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM followers WHERE follower_id = follower AND following_id = following
  ) INTO exists_check;
  RETURN exists_check;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id uuid,
  p_type text,
  p_title text,
  p_message text,
  p_data jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid AS $$
DECLARE
  notif_id uuid;
BEGIN
  INSERT INTO notifications (user_id, type, title, message, data)
  VALUES (p_user_id, p_type, p_title, p_message, p_data)
  RETURNING id INTO notif_id;
  RETURN notif_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
