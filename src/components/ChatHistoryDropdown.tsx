import { useState, useEffect } from "react";
import { History, Plus, MessageSquare, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useDocuments } from "@/context/DocumentContext";

type ChatSession = {
  id: string;
  session_id: string;
  title: string;
  document_name: string | null;
  created_at: string;
  updated_at: string;
};

interface ChatHistoryDropdownProps {
  onNewChat: () => void;
  onSelectSession: (sessionId: string) => void;
  activeChatId: string | null;
}

export default function ChatHistoryDropdown({
  onNewChat,
  onSelectSession,
  activeChatId,
}: ChatHistoryDropdownProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [open, setOpen] = useState(false);
  const { sessionId } = useDocuments();

  useEffect(() => {
    if (!open) return;
    (async () => {
      const { data } = await supabase
        .from("chat_sessions")
        .select("*")
        .eq("session_id", sessionId)
        .order("updated_at", { ascending: false })
        .limit(20);
      if (data) setSessions(data as ChatSession[]);
    })();
  }, [open, sessionId]);

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    return `${diffDay}d ago`;
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-muted-foreground">
          <History className="h-3.5 w-3.5" />
          <span className="text-xs">History</span>
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuItem
          onClick={() => { onNewChat(); setOpen(false); }}
          className="gap-2 text-primary font-medium"
        >
          <Plus className="h-4 w-4" />
          New Chat
        </DropdownMenuItem>
        {sessions.length > 0 && <DropdownMenuSeparator />}
        {sessions.length === 0 ? (
          <div className="px-2 py-3 text-center text-xs text-muted-foreground">
            No chat history yet
          </div>
        ) : (
          sessions.map((s) => (
            <DropdownMenuItem
              key={s.id}
              onClick={() => { onSelectSession(s.id); setOpen(false); }}
              className={`gap-2 ${activeChatId === s.id ? "bg-accent" : ""}`}
            >
              <MessageSquare className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="text-sm truncate">{s.title}</p>
                <p className="text-xs text-muted-foreground">
                  {s.document_name && <span>{s.document_name} · </span>}
                  {formatTime(s.updated_at)}
                </p>
              </div>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
