-- ============================================================
-- 013_group_join_requests_and_public_reads.sql
--
-- Adds three things needed for group discovery / join requests:
--
-- 1. group_join_requests — a user asks to join a PUBLIC group;
--    the group's creator accepts or declines. This is the
--    opposite direction of group_invitations (creator invites a
--    user); kept as a separate table so the two flows (and their
--    very different insert permissions) don't get tangled in one
--    table's RLS.
--
-- 2. get_public_groups_for_user(uuid) — reading_groups' own SELECT
--    policy only allows a group's creator or active members to see
--    it. That's correct for the main /groups list, but it means a
--    profile's Groups tab could never show another user's PUBLIC
--    groups to a visitor who isn't already a member — exactly the
--    case where someone would want to see a group in order to
--    request joining it. Rather than widen reading_groups' own
--    policy (and risk reintroducing the recursion class of bug),
--    this is a narrow SECURITY DEFINER function that only ever
--    returns groups with is_private = false.
--
-- 3. get_group_details(uuid) — same reasoning, for loading a single
--    group's page: returns the row if it's public OR the caller is
--    the creator/an active member, otherwise returns nothing (so a
--    private group a viewer has no access to just looks like it
--    doesn't exist, rather than erroring).
-- ============================================================

CREATE TABLE IF NOT EXISTS group_join_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES reading_groups(id) ON DELETE CASCADE,
  requester_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (group_id, requester_id)
);

ALTER TABLE group_join_requests ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_public_group(p_group_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.reading_groups
    WHERE id = p_group_id AND is_private = false
  );
END;
$$;

REVOKE ALL ON FUNCTION public.is_public_group(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_public_group(uuid) TO authenticated;

DROP POLICY IF EXISTS "join_requests_select_involved" ON group_join_requests;
CREATE POLICY "join_requests_select_involved" ON group_join_requests FOR SELECT
  TO authenticated USING (
    requester_id = auth.uid()
    OR public.is_group_creator(group_id, auth.uid())
  );

DROP POLICY IF EXISTS "join_requests_insert_self" ON group_join_requests;
CREATE POLICY "join_requests_insert_self" ON group_join_requests FOR INSERT
  TO authenticated WITH CHECK (
    requester_id = auth.uid()
    AND public.is_public_group(group_id)
    AND NOT public.is_active_group_member(group_id, auth.uid())
  );

DROP POLICY IF EXISTS "join_requests_update_creator" ON group_join_requests;
CREATE POLICY "join_requests_update_creator" ON group_join_requests FOR UPDATE
  TO authenticated USING (public.is_group_creator(group_id, auth.uid()))
  WITH CHECK (public.is_group_creator(group_id, auth.uid()));

DROP POLICY IF EXISTS "join_requests_delete_own_or_creator" ON group_join_requests;
CREATE POLICY "join_requests_delete_own_or_creator" ON group_join_requests FOR DELETE
  TO authenticated USING (
    requester_id = auth.uid()
    OR public.is_group_creator(group_id, auth.uid())
  );

-- Notify the creator when someone requests to join.
CREATE OR REPLACE FUNCTION notify_join_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_group_name text;
  v_creator_id uuid;
  v_requester_name text;
BEGIN
  SELECT name, creator_id INTO v_group_name, v_creator_id
    FROM reading_groups WHERE id = NEW.group_id;
  SELECT COALESCE(display_name, username) INTO v_requester_name
    FROM profiles WHERE id = NEW.requester_id;

  INSERT INTO notifications (user_id, type, title, message, data)
  VALUES (
    v_creator_id,
    'join_request',
    'Join Request',
    v_requester_name || ' wants to join "' || v_group_name || '"',
    jsonb_build_object(
      'request_id', NEW.id,
      'group_id', NEW.group_id,
      'group_name', v_group_name,
      'requester_id', NEW.requester_id,
      'requester_name', v_requester_name
    )
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_join_request ON group_join_requests;
CREATE TRIGGER on_join_request
  AFTER INSERT ON group_join_requests
  FOR EACH ROW EXECUTE FUNCTION notify_join_request();

-- Notify the requester once the creator responds.
CREATE OR REPLACE FUNCTION notify_join_request_response()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_group_name text;
BEGIN
  IF NEW.status = OLD.status OR NEW.status = 'pending' THEN
    RETURN NEW;
  END IF;

  SELECT name INTO v_group_name FROM reading_groups WHERE id = NEW.group_id;

  INSERT INTO notifications (user_id, type, title, message, data)
  VALUES (
    NEW.requester_id,
    'join_request_response',
    CASE WHEN NEW.status = 'accepted' THEN 'Request Accepted' ELSE 'Request Declined' END,
    CASE WHEN NEW.status = 'accepted'
      THEN 'Your request to join "' || v_group_name || '" was accepted'
      ELSE 'Your request to join "' || v_group_name || '" was declined'
    END,
    jsonb_build_object('group_id', NEW.group_id, 'group_name', v_group_name, 'status', NEW.status)
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_join_request_response ON group_join_requests;
CREATE TRIGGER on_join_request_response
  AFTER UPDATE ON group_join_requests
  FOR EACH ROW EXECUTE FUNCTION notify_join_request_response();

-- Public-groups-of-a-user reader, for another person's profile page.
CREATE OR REPLACE FUNCTION public.get_public_groups_for_user(p_user_id uuid)
RETURNS TABLE (
  id uuid,
  creator_id uuid,
  name text,
  description text,
  cover_url text,
  reading_goal text,
  is_private boolean,
  created_at timestamptz,
  user_role text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT rg.id, rg.creator_id, rg.name, rg.description, rg.cover_url,
         rg.reading_goal, rg.is_private, rg.created_at, gm.role
  FROM group_members gm
  JOIN reading_groups rg ON rg.id = gm.group_id
  WHERE gm.user_id = p_user_id
    AND gm.status = 'active'
    AND rg.is_private = false;
END;
$$;

REVOKE ALL ON FUNCTION public.get_public_groups_for_user(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_groups_for_user(uuid) TO authenticated;

-- Single-group reader for the group detail page: returns the row if
-- it's public OR the caller already belongs to it, nothing otherwise.
CREATE OR REPLACE FUNCTION public.get_group_details(p_group_id uuid)
RETURNS TABLE (
  id uuid,
  creator_id uuid,
  name text,
  description text,
  cover_url text,
  reading_goal text,
  is_private boolean,
  created_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT rg.id, rg.creator_id, rg.name, rg.description, rg.cover_url,
         rg.reading_goal, rg.is_private, rg.created_at
  FROM reading_groups rg
  WHERE rg.id = p_group_id
    AND (
      rg.is_private = false
      OR rg.creator_id = auth.uid()
      OR public.is_active_group_member(rg.id, auth.uid())
    );
END;
$$;

REVOKE ALL ON FUNCTION public.get_group_details(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_group_details(uuid) TO authenticated;
