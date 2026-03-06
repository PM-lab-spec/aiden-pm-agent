
-- Drop the overly restrictive "Deny anonymous access" policies that block anonymous auth users
DROP POLICY IF EXISTS "Deny anonymous access" ON public.chat_sessions;
DROP POLICY IF EXISTS "Deny anonymous access" ON public.chat_messages;
DROP POLICY IF EXISTS "Deny anonymous access" ON public.chat_feedback;
DROP POLICY IF EXISTS "Deny anonymous access" ON public.document_chunks;

-- Also drop the existing restrictive "Users manage own" policies so we can recreate as permissive
DROP POLICY IF EXISTS "Users manage own chat_sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Users manage own chat_messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users manage own chat_feedback" ON public.chat_feedback;
DROP POLICY IF EXISTS "Users manage own document_chunks" ON public.document_chunks;

-- Recreate as PERMISSIVE policies for authenticated users (includes anonymous auth users)
CREATE POLICY "Users manage own chat_sessions"
  ON public.chat_sessions FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users manage own chat_messages"
  ON public.chat_messages FOR ALL TO authenticated
  USING (chat_session_id IN (SELECT id FROM chat_sessions WHERE user_id = auth.uid()))
  WITH CHECK (chat_session_id IN (SELECT id FROM chat_sessions WHERE user_id = auth.uid()));

CREATE POLICY "Users manage own chat_feedback"
  ON public.chat_feedback FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users manage own document_chunks"
  ON public.document_chunks FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
