-- ============================================================
-- 012_fix_group_members_rls_recursion.sql
--
-- Creating a group still raises:
--   infinite recursion detected in policy for relation "group_members"
--   (Postgres 42P17)
--
-- Why 011 was not enough on its own:
-- 1) The helper may never have been applied remotely.
-- 2) SQL-language SECURITY DEFINER helpers can still be inlined by
--    some planners; a plpgsql body is never inlined into the policy.
-- 3) INSERT/DELETE policies on group_members read reading_groups,
--    whose SELECT policy then reads group_members — a second cycle
--    that fires during "insert creator as member" even when SELECT
--    on group_members itself was already patched.
--
-- This migration rewrites every group-related policy so none of them
-- query group_members or reading_groups under RLS.
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_active_group_member(p_group_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.group_members
    WHERE group_id = p_group_id
      AND user_id = p_user_id
      AND status = 'active'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_group_creator(p_group_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.reading_groups
    WHERE id = p_group_id
      AND creator_id = p_user_id
  );
END;
$$;

REVOKE ALL ON FUNCTION public.is_active_group_member(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_group_creator(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_active_group_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_group_creator(uuid, uuid) TO authenticated;

-- group_members
DROP POLICY IF EXISTS "group_members_select_member" ON public.group_members;
CREATE POLICY "group_members_select_member" ON public.group_members
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_active_group_member(group_id, auth.uid())
  );

DROP POLICY IF EXISTS "group_members_insert_invited" ON public.group_members;
CREATE POLICY "group_members_insert_invited" ON public.group_members
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_group_creator(group_id, auth.uid())
    OR (
      user_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM public.group_invitations
        WHERE group_invitations.group_id = group_members.group_id
          AND group_invitations.invitee_id = auth.uid()
          AND group_invitations.status = 'accepted'
      )
    )
  );

DROP POLICY IF EXISTS "group_members_update_own" ON public.group_members;
CREATE POLICY "group_members_update_own" ON public.group_members
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "group_members_delete_own_or_creator" ON public.group_members;
CREATE POLICY "group_members_delete_own_or_creator" ON public.group_members
  FOR DELETE TO authenticated
  USING (
    auth.uid() = user_id
    OR public.is_group_creator(group_id, auth.uid())
  );

-- reading_groups
DROP POLICY IF EXISTS "groups_select_member" ON public.reading_groups;
CREATE POLICY "groups_select_member" ON public.reading_groups
  FOR SELECT TO authenticated
  USING (
    creator_id = auth.uid()
    OR public.is_active_group_member(id, auth.uid())
  );

-- group_messages (same EXISTS-on-group_members pattern)
DROP POLICY IF EXISTS "group_messages_select_member" ON public.group_messages;
CREATE POLICY "group_messages_select_member" ON public.group_messages
  FOR SELECT TO authenticated
  USING (public.is_active_group_member(group_id, auth.uid()));

DROP POLICY IF EXISTS "group_messages_insert_member" ON public.group_messages;
CREATE POLICY "group_messages_insert_member" ON public.group_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND public.is_active_group_member(group_id, auth.uid())
  );

-- Atomic create: group + creator membership, no RLS planning cycle
CREATE OR REPLACE FUNCTION public.create_reading_group(
  p_name text,
  p_description text DEFAULT '',
  p_reading_goal text DEFAULT NULL,
  p_cover_url text DEFAULT NULL,
  p_is_private boolean DEFAULT true
)
RETURNS public.reading_groups
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_group public.reading_groups;
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  INSERT INTO public.reading_groups (
    creator_id, name, description, reading_goal, cover_url, is_private
  )
  VALUES (
    v_uid,
    p_name,
    COALESCE(p_description, ''),
    p_reading_goal,
    p_cover_url,
    COALESCE(p_is_private, true)
  )
  RETURNING * INTO v_group;

  INSERT INTO public.group_members (group_id, user_id, role, status)
  VALUES (v_group.id, v_uid, 'creator', 'active');

  RETURN v_group;
END;
$$;

REVOKE ALL ON FUNCTION public.create_reading_group(text, text, text, text, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_reading_group(text, text, text, text, boolean) TO authenticated;
