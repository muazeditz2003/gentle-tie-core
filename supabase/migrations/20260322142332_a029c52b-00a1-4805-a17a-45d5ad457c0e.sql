
CREATE TABLE public.chatbot_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL DEFAULT 'New conversation',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.chatbot_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.chatbot_conversations(id) ON DELETE CASCADE,
  role text NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.chatbot_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chatbot_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conversations" ON public.chatbot_conversations FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own conversations" ON public.chatbot_conversations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own conversations" ON public.chatbot_conversations FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own conversations" ON public.chatbot_conversations FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can view own messages" ON public.chatbot_messages FOR SELECT TO authenticated USING (conversation_id IN (SELECT id FROM public.chatbot_conversations WHERE user_id = auth.uid()));
CREATE POLICY "Users can create own messages" ON public.chatbot_messages FOR INSERT TO authenticated WITH CHECK (conversation_id IN (SELECT id FROM public.chatbot_conversations WHERE user_id = auth.uid()));

-- Also allow anonymous access for non-logged-in users (stored in localStorage)
CREATE POLICY "Anon can access conversations" ON public.chatbot_conversations FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon can access messages" ON public.chatbot_messages FOR ALL TO anon USING (true) WITH CHECK (true);
