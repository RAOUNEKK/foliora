-- ============================================================
-- 016_group_message_notifications.sql
--
-- Create a notification for every other active member whenever
-- a new group chat message is sent.
--
-- The notification is created server-side so the chat sender does
-- not need to make a second client-side request and cannot
-- accidentally notify themselves.
-- ============================================================

CREATE OR REPLACE FUNCTION public.notify_group_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_group_name text;
  v_sender_name text;
BEGIN
  SELECT name
    INTO v_group_name
  FROM public.reading_groups
  WHERE id = NEW.group_id;

  SELECT COALESCE(NULLIF(display_name, ''), username, 'Someone')
    INTO v_sender_name
  FROM public.profiles
  WHERE id = NEW.user_id;

  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    data,
    read
  )
  SELECT
    gm.user_id,
    'group_message',
    'New message in ' || COALESCE(v_group_name, 'your group'),
    COALESCE(v_sender_name, 'Someone') || ': ' || LEFT(NEW.content, 120),
    jsonb_build_object(
      'group_id', NEW.group_id,
      'message_id', NEW.id,
      'sender_id', NEW.user_id
    ),
    false
  FROM public.group_members gm
  WHERE gm.group_id = NEW.group_id
    AND gm.status = 'active'
    AND gm.user_id <> NEW.user_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_group_message_created ON public.group_messages;

CREATE TRIGGER on_group_message_created
AFTER INSERT ON public.group_messages
FOR EACH ROW
EXECUTE FUNCTION public.notify_group_message();

-- Make notifications available to Supabase Realtime so the bell
-- can update immediately without a page refresh.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END $$;
