-- Create a function to clean up chat sessions older than 30 days
CREATE OR REPLACE FUNCTION public.cleanup_old_chat_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.chat_messages
  WHERE chat_session_id IN (
    SELECT id FROM public.chat_sessions
    WHERE created_at < now() - interval '30 days'
  );
  
  DELETE FROM public.chat_sessions
  WHERE created_at < now() - interval '30 days';
END;
$$;