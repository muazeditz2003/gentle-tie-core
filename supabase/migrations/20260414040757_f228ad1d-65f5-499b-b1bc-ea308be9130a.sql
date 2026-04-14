DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'message_status' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.message_status AS ENUM ('sent', 'delivered', 'seen', 'failed');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  message_text TEXT NOT NULL,
  status public.message_status NOT NULL DEFAULT 'sent',
  delivered_at TIMESTAMPTZ,
  seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  conversation_key TEXT GENERATED ALWAYS AS (
    LEAST(sender_id::text, receiver_id::text) || ':' || GREATEST(sender_id::text, receiver_id::text)
  ) STORED
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own messages" ON public.messages;
CREATE POLICY "Users can view own messages"
ON public.messages
FOR SELECT
TO authenticated
USING (sender_id = auth.uid() OR receiver_id = auth.uid());

DROP POLICY IF EXISTS "Users can send own messages" ON public.messages;
CREATE POLICY "Users can send own messages"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (
  sender_id = auth.uid()
  AND sender_id <> receiver_id
  AND length(trim(message_text)) > 0
);

DROP POLICY IF EXISTS "Conversation participants can update status" ON public.messages;
CREATE POLICY "Conversation participants can update status"
ON public.messages
FOR UPDATE
TO authenticated
USING (sender_id = auth.uid() OR receiver_id = auth.uid())
WITH CHECK (sender_id = auth.uid() OR receiver_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage messages" ON public.messages;
CREATE POLICY "Admins can manage messages"
ON public.messages
FOR ALL
TO authenticated
USING (public.has_role('admin'::public.app_role, auth.uid()))
WITH CHECK (public.has_role('admin'::public.app_role, auth.uid()));

CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver_created_at
  ON public.messages (sender_id, receiver_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_receiver_sender_created_at
  ON public.messages (receiver_id, sender_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_created_at
  ON public.messages (conversation_key, created_at DESC);

DROP TRIGGER IF EXISTS update_messages_updated_at ON public.messages;
CREATE TRIGGER update_messages_updated_at
BEFORE UPDATE ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;