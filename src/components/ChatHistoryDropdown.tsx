import { useState, useEffect } from "react";
import { History, Plus, MessageSquare, ChevronDown, Trash2, FileText } from "lucide-react";
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
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

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
  variant?: "dropdown" | "sidebar";
}

export default function ChatHistoryDropdown({
  onNewChat,
  onSelectSession,
  activeChatId,
  variant = "dropdown",
}: ChatHistoryDropdownProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [open, setOpen] = useState(false);
  const { sessionId } = useDocuments();
  const { user } = useAuth();

  // For sidebar variant, load immediately; for dropdown, load on open
  useEffect(() => {
    if (variant === "sidebar") {
      if (!user) return;
      (async () => {
        const { data } = await supabase
          .from("chat_sessions")
          .select("*")
          .eq("session_id", sessionId)
          .eq("user_id", user.id)
          .order("updated_at", { ascending: false })
          .limit(10);
        if (data) setSessions(data as ChatSession[]);
      })();
    }
  }, [variant, sessionId, user]);

  useEffect(() => {
    if (variant !== "dropdown" || !open || !user) return;
    (async () => {
      const { data } = await supabase
        .from("chat_sessions")
        .select("*")
        .eq("session_id", sessionId)
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(20);
      if (data) setSessions(data as ChatSession[]);
    })();
  }, [open, sessionId, user, variant]);

  const handleDelete = async (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      await supabase.from("chat_messages").delete().eq("chat_session_id", chatId);
      await supabase.from("chat_sessions").delete().eq("id", chatId);
      setSessions((prev) => prev.filter((s) => s.id !== chatId));
      if (activeChatId === chatId) onNewChat();
      toast.success("Chat deleted");
    } catch {
      toast.error("Failed to delete chat");
    }
  };

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

  // Sidebar variant: render as flat list
  if (variant === "sidebar") {
    return (
      <nav className="space-y-0.5">
        {sessions.length === 0 ? (
          <p className="px-2.5 py-2 text-xs text-[hsl(0,0%,40%)]">No recent chats</p>
        ) : (
          sessions.map((s) => (
            <button
              key={s.id}
              onClick={() => onSelectSession(s.id)}
              className={`flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-sm transition-colors group ${
                activeChatId === s.id
                  ? "bg-[hsl(240,10%,20%)] text-white"
                  : "hover:bg-[hsl(240,10%,18%)] text-[hsl(0,0%,70%)]"
              }`}
            >
              <FileText className="h-4 w-4 shrink-0 opacity-60" />
              <span className="truncate flex-1 text-left">{s.title}</span>
            </button>
          ))
        )}
      </nav>
    );
  }

  // Dropdown variant (original)
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
              className={`gap-2 group ${activeChatId === s.id ? "bg-accent" : ""}`}
            >
              <MessageSquare className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="text-sm truncate">{s.title}</p>
                <p className="text-xs text-muted-foreground">
                  {s.document_name && <span>{s.document_name} · </span>}
                  {formatTime(s.updated_at)}
                </p>
              </div>
              <button
                onClick={(e) => handleDelete(e, s.id)}
                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 hover:text-destructive transition-all shrink-0"
                title="Delete chat"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
