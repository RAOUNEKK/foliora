-- ============================================================
-- 015_fix_notification_types.sql
--
-- The notifications table was originally created with a CHECK
-- constraint that did not include the notification types used by
-- public-group join requests. The join-request triggers in
-- migration 013 insert these two types:
--   - join_request
--   - join_request_response
--
-- Extend the constraint so the request/response notification flow
-- can insert its rows successfully.
-- ============================================================

ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_type_check
  CHECK (
    type IN (
      'follow',
      'unfollow',
      'follower_removed',
      'group_invite',
      'invite_accepted',
      'group_message',
      'goal_completed',
      'join_request',
      'join_request_response'
    )
  );
