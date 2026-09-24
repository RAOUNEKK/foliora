-- ============================================================
-- 010_social_features_additions.sql
-- User search + notification triggers + a required RLS fix for
-- viewing other users' followers.
--
-- This replaces a file that used to be named "001_social_features.sql".
-- That name sorted BEFORE the timestamped migrations it actually
-- depends on (reading_groups, group_members, profiles didn't exist
-- yet at that point in filename order), and it also redefined
-- get_follower_count / get_following_count / is_following with a
-- different return type (BIGINT, plain SQL) than the versions in
-- 007_fix_group_policies_and_add_functions.sql (INTEGER, SECURITY
-- DEFINER, plpgsql). Postgres refuses CREATE OR REPLACE FUNCTION when
-- the return type changes ("cannot change return type of existing
-- function"), which aborted the rest of that file — which is why
-- search_users_by_username was never actually created in the
-- database. That's why searching for a real, existing user always
-- returned "No users found": the RPC call failed and the UI silently
-- treated the error as zero results.
--
-- The count/is_following redefinitions are intentionally NOT
-- reintroduced here: 007's SECURITY DEFINER versions are the correct
-- ones. Without SECURITY DEFINER, those functions would only be able
-- to see follow rows the CALLER is part of (per followers_select_own
-- below), so viewing someone else's profile would show near-zero
-- follower/following counts instead of their real counts.
-- ============================================================

-- ── 1. reading_groups: ensure creator_id is present ─────────
ALTER TABLE reading_groups
  ADD COLUMN IF NOT EXISTS creator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- ── 2. group_members: role + status columns ──────────────────
ALTER TABLE group_members
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'member'
    CHECK (role IN ('creator', 'admin', 'member')),
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'left')),
  ADD COLUMN IF NOT EXISTS joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- ── 3. Ensure dependent tables exist (idempotent, in case this ever
--       runs on a database that skipped the earlier migrations) ────
CREATE TABLE IF NOT EXISTS group_invitations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id    UUID NOT NULL REFERENCES reading_groups(id) ON DELETE CASCADE,
  inviter_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invitee_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status      TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (group_id, invitee_id)
);

CREATE TABLE IF NOT EXISTS notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type       TEXT NOT NULL,
  title      TEXT NOT NULL,
  message    TEXT NOT NULL,
  data       JSONB,
  read       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON notifications (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS followers (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (follower_id, following_id)
);

-- ── 4. RPC: search_users_by_username ─────────────────────────
-- Now matches on username OR display name, so searching by
-- someone's shown "profile name" (not just their exact @username)
-- finds them too.
CREATE OR REPLACE FUNCTION search_users_by_username(query TEXT, current_user_id UUID)
RETURNS TABLE (
  id           UUID,
  username     TEXT,
  display_name TEXT,
  avatar_url   TEXT,
  bio          TEXT,
  is_following BOOLEAN
) LANGUAGE sql STABLE AS $$
  SELECT
    p.id,
    p.username,
    p.display_name,
    p.avatar_url,
    p.bio,
    EXISTS (
      SELECT 1 FROM followers f
      WHERE f.follower_id = current_user_id AND f.following_id = p.id
    ) AS is_following
  FROM profiles p
  WHERE
    (p.username ILIKE '%' || query || '%' OR p.display_name ILIKE '%' || query || '%')
    AND p.id != current_user_id
  ORDER BY p.username
  LIMIT 20;
$$;

-- ── 5. Trigger: notify on group invitation ───────────────────
CREATE OR REPLACE FUNCTION notify_group_invitation()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_group_name   TEXT;
  v_inviter_name TEXT;
BEGIN
  SELECT name INTO v_group_name FROM reading_groups WHERE id = NEW.group_id;
  SELECT COALESCE(display_name, username) INTO v_inviter_name
    FROM profiles WHERE id = NEW.inviter_id;

  INSERT INTO notifications (user_id, type, title, message, data)
  VALUES (
    NEW.invitee_id,
    'group_invite',
    'Group Invitation',
    v_inviter_name || ' invited you to join "' || v_group_name || '"',
    jsonb_build_object(
      'invitation_id', NEW.id,
      'group_id',      NEW.group_id,
      'group_name',    v_group_name,
      'inviter_id',    NEW.inviter_id,
      'inviter_name',  v_inviter_name
    )
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_group_invitation ON group_invitations;
CREATE TRIGGER on_group_invitation
  AFTER INSERT ON group_invitations
  FOR EACH ROW EXECUTE FUNCTION notify_group_invitation();

-- ── 6. Trigger: notify on follow ────────────────────────────
CREATE OR REPLACE FUNCTION notify_new_follower()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_follower_name TEXT;
BEGIN
  SELECT COALESCE(display_name, username) INTO v_follower_name
    FROM profiles WHERE id = NEW.follower_id;

  INSERT INTO notifications (user_id, type, title, message, data)
  VALUES (
    NEW.following_id,
    'follow',
    'New Follower',
    v_follower_name || ' started following you',
    jsonb_build_object(
      'follower_id',   NEW.follower_id,
      'follower_name', v_follower_name
    )
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_new_follower ON followers;
CREATE TRIGGER on_new_follower
  AFTER INSERT ON followers
  FOR EACH ROW EXECUTE FUNCTION notify_new_follower();

-- ── 7. RLS: allow reading anyone's followers list ────────────
-- followers_select_own (from the followers/reading_progress migration)
-- only lets you see follow rows YOU are personally part of. That's
-- fine for "do I follow this person", but it means opening someone
-- ELSE's Followers/Following tab returned nothing but your own
-- relationship to them, if any. This restores public read on
-- followers for authenticated users, same scope as profiles already
-- have.
ALTER TABLE followers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "followers_public_read" ON followers;
CREATE POLICY "followers_public_read" ON followers
  FOR SELECT TO authenticated USING (true);
