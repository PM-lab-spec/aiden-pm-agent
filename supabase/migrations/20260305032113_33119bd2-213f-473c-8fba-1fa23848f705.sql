
-- Add user_id to chat_sessions
ALTER TABLE public.chat_sessions ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to chat_feedback
ALTER TABLE public.chat_feedback ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to document_chunks
ALTER TABLE public.document_chunks ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Drop old permissive policies
DROP POLICY IF EXISTS "Allow all on chat_sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Allow all on chat_messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Allow all operations on chat_feedback" ON public.chat_feedback;
DROP POLICY IF EXISTS "Allow all operations on document_chunks" ON public.document_chunks;

-- chat_sessions: users see only their own
CREATE POLICY "Users manage own chat_sessions" ON public.chat_sessions
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- chat_messages: users see messages in their own sessions
CREATE POLICY "Users manage own chat_messages" ON public.chat_messages
  FOR ALL TO authenticated
  USING (chat_session_id IN (SELECT id FROM public.chat_sessions WHERE user_id = auth.uid()))
  WITH CHECK (chat_session_id IN (SELECT id FROM public.chat_sessions WHERE user_id = auth.uid()));

-- chat_feedback: users manage own feedback
CREATE POLICY "Users manage own chat_feedback" ON public.chat_feedback
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- document_chunks: users manage own documents
CREATE POLICY "Users manage own document_chunks" ON public.document_chunks
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Also allow anon/service role for edge functions to insert document_chunks
CREATE POLICY "Service can manage document_chunks" ON public.document_chunks
  FOR ALL TO anon
  USING (true)
  WITH CHECK (true);
