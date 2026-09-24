-- ============================================================
-- 017_security_fixes.sql
--
-- Closes three access-control gaps found in a security review:
--
-- 1. book_reviews had no user_id column and granted full
--    anon+authenticated CRUD with USING/WITH CHECK (true) —
--    anyone, logged in or not, could read, edit, or delete
--    every review through the public API. Adds user_id and
--    rewrites the policies to be owner-scoped, matching every
--    other user-owned table in this schema.
--
-- 2. The avatars storage policies checked only bucket_id, never
--    ownership — any authenticated user could overwrite or
--    delete any other user's avatar. Scopes UPDATE/DELETE to
--    the uploader via storage.objects.owner (set automatically
--    by Supabase Storage at upload time).
--
-- 3. notifications_insert_system allowed any authenticated user
--    to insert a notification row for ANY user_id. Every real
--    notification is already created by a SECURITY DEFINER
--    trigger function (notify_group_invitation, notify_new_follower,
--    notify_join_request, notify_join_request_response,
--    notify_group_message) — those bypass RLS entirely and never
--    needed this policy, so it's dropped rather than narrowed.
-- ============================================================

-- ── 1. book_reviews: add ownership, scope every policy to it ──
ALTER TABLE book_reviews
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_book_reviews_user ON book_reviews(user_id);

DROP POLICY IF EXISTS "anon_select_book_reviews" ON book_reviews;
DROP POLICY IF EXISTS "anon_insert_book_reviews" ON book_reviews;
DROP POLICY IF EXISTS "anon_update_book_reviews" ON book_reviews;
DROP POLICY IF EXISTS "anon_delete_book_reviews" ON book_reviews;

CREATE POLICY "book_reviews_select_own" ON book_reviews FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "book_reviews_insert_own" ON book_reviews FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "book_reviews_update_own" ON book_reviews FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "book_reviews_delete_own" ON book_reviews FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- NOTE: any existing rows have user_id = NULL (there was nowhere to
-- backfill it from). Those rows are now unreadable/unownable under the
-- policies above and are effectively orphaned. If the live table has
-- real review data you want to keep, backfill user_id by hand before
-- this runs, or decide it's prototype data and truncate the table.

-- ── 2. avatars storage: scope UPDATE/DELETE to the uploader ───
DROP POLICY IF EXISTS "Avatar updates" ON storage.objects;
CREATE POLICY "Avatar updates"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars' AND owner = auth.uid())
WITH CHECK (bucket_id = 'avatars' AND owner = auth.uid());

DROP POLICY IF EXISTS "Avatar deletes" ON storage.objects;
CREATE POLICY "Avatar deletes"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars' AND owner = auth.uid());

-- Upload policy is left as-is (any authenticated user may create a new
-- object in the bucket); ownership is stamped automatically at upload
-- time, and it's the update/delete checks above that stop one user
-- from touching a file they didn't create.

-- ── 3. notifications: only SECURITY DEFINER triggers may insert ──
DROP POLICY IF EXISTS "notifications_insert_system" ON notifications;
