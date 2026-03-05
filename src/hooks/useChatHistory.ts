import { useCallback, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type ChatSession = {
  id: string;
  session_id: string;
  title: string;
  document_name: string | null;
  created_at: string;
  updated_at: string;
};

type Message = { id: string; role: "user" | "assistant"; content: string };

export function useChatHistory(sessionId: string) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const savingRef = useRef(false);

  /** Load all sessions for this document session */
  const loadSessions = useCallback(async () => {
    const { data } = await supabase
      .from("chat_sessions")
      .select("*")
      .eq("session_id", sessionId)
      .order("updated_at", { ascending: false })
      .limit(20);
    if (data) setSessions(data as ChatSession[]);
  }, [sessionId]);

  /** Load messages for a specific chat session */
  const loadMessages = useCallback(async (chatSessionId: string): Promise<Message[]> => {
    const { data } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("chat_session_id", chatSessionId)
      .order("created_at", { ascending: true });
    if (!data) return [];
    return data.map((m: any) => ({
      id: m.id,
      role: m.role as "user" | "assistant",
      content: m.content,
    }));
  }, []);

  /** Create a new chat session and return its ID */
  const createSession = useCallback(async (title: string, documentName?: string | null): Promise<string> => {
    const { data, error } = await supabase
      .from("chat_sessions")
      .insert({
        session_id: sessionId,
        title,
        document_name: documentName || null,
      })
      .select("id")
      .single();
    if (error || !data) throw new Error("Failed to create chat session");
    const newId = (data as any).id;
    setActiveChatId(newId);
    await loadSessions();
    return newId;
  }, [sessionId, loadSessions]);

  /** Save a message to the active chat session */
  const saveMessage = useCallback(async (chatSessionId: string, role: "user" | "assistant", content: string) => {
    if (savingRef.current && role === "assistant") return; // debounce assistant saves
    
    await supabase
      .from("chat_messages")
      .insert({
        chat_session_id: chatSessionId,
        role,
        content,
      });
  }, []);

  /** Update the assistant's last message (for streaming - upsert) */
  const updateLastAssistantMessage = useCallback(async (chatSessionId: string, content: string) => {
    // Delete the last assistant message and re-insert with full content
    const { data: existing } = await supabase
      .from("chat_messages")
      .select("id")
      .eq("chat_session_id", chatSessionId)
      .eq("role", "assistant")
      .order("created_at", { ascending: false })
      .limit(1);

    if (existing && existing.length > 0) {
      await supabase
        .from("chat_messages")
        .update({ content })
        .eq("id", (existing[0] as any).id);
    }
  }, []);

  /** Update session title based on first user message */
  const updateSessionTitle = useCallback(async (chatSessionId: string, firstMessage: string) => {
    const title = firstMessage.slice(0, 60) + (firstMessage.length > 60 ? "..." : "");
    await supabase
      .from("chat_sessions")
      .update({ title, updated_at: new Date().toISOString() })
      .eq("id", chatSessionId);
    await loadSessions();
  }, [loadSessions]);

  return {
    sessions,
    activeChatId,
    setActiveChatId,
    loadSessions,
    loadMessages,
    createSession,
    saveMessage,
    updateLastAssistantMessage,
    updateSessionTitle,
  };
}
