-- ============================================================
-- 011_fix_group_members_select_recursion.sql
--
-- group_members_select_member (from 004b_create_group_members.sql)
-- queries group_members FROM WITHIN its own USING clause:
--
--   USING (
--     EXISTS (SELECT 1 FROM group_members AS gm WHERE ...)
--     OR user_id = auth.uid()
--   )
--
-- RLS applies per TABLE, not per alias, so that inner reference to
-- group_members re-triggers this exact same policy. Postgres detects
-- the cycle while planning the query and raises "infinite recursion
-- detected in policy for relation \"group_members\"" — a planning-time
-- error, so it fires even when the OTHER side of the OR would have
-- been enough on its own. PostgREST turns that into a bare 500, which
-- is why BOTH the reading_groups insert-then-select-back call AND the
-- plain reading_groups list fetch failed: creating a group needs
-- groups_select_member evaluated, which checks group_members
-- membership, which hits this same recursive policy.
--
-- Fix: do the "is this user an active member of this group" check
-- inside a SECURITY DEFINER function. Its internal query runs with
-- the function owner's privileges, bypassing RLS instead of
-- re-entering this policy, which breaks the cycle.
-- ============================================================

CREATE OR REPLACE FUNCTION is_active_group_member(p_group_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = p_group_id AND user_id = p_user_id AND status = 'active'
  );
$$;

DROP POLICY IF EXISTS "group_members_select_member" ON group_members;
CREATE POLICY "group_members_select_member" ON group_members FOR SELECT
  TO authenticated USING (
    is_active_group_member(group_members.group_id, auth.uid())
    OR user_id = auth.uid()
  );

-- groups_select_member (from 007_fix_group_policies_and_add_functions.sql)
-- isn't self-referential, so it wasn't the source of the recursion, but
-- it does its own separate EXISTS-on-group_members check. Pointing it at
-- the same helper avoids duplicating that logic and keeps both policies
-- consistent.
DROP POLICY IF EXISTS "groups_select_member" ON reading_groups;
CREATE POLICY "groups_select_member" ON reading_groups FOR SELECT
  TO authenticated USING (
    is_active_group_member(reading_groups.id, auth.uid())
    OR creator_id = auth.uid()
  );
