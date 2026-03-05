CREATE TABLE public.chat_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  message_content text NOT NULL,
  user_query text,
  rating text NOT NULL CHECK (rating IN ('up', 'down')),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on chat_feedback" ON public.chat_feedback
  FOR ALL USING (true) WITH CHECK (true);