-- ============================================================
-- 014_all_public_groups.sql
--
-- Powers a "browse all groups" list (separate from "my groups"):
-- every public group on the platform, regardless of whether the
-- caller belongs to it. Same reasoning as get_public_groups_for_user
-- in 013 — reading_groups' own SELECT policy is deliberately kept to
-- creator/member only, so this is a narrow, read-only SECURITY
-- DEFINER function rather than a widened table policy.
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_all_public_groups()
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
  WHERE rg.is_private = false
  ORDER BY rg.created_at DESC;
END;
$$;

REVOKE ALL ON FUNCTION public.get_all_public_groups() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_all_public_groups() TO authenticated;
