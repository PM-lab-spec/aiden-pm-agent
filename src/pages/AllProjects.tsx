import { useState, useEffect } from "react";
import { ArrowLeft, FileText, Trash2, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type ChatSession = {
  id: string;
  session_id: string;
  title: string;
  document_name: string | null;
  created_at: string;
  updated_at: string;
};

export default function AllProjects() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data } = await supabase
        .from("chat_sessions")
        .select("*")
        .eq("user_id", user.id)
        .gte("created_at", thirtyDaysAgo.toISOString())
        .order("updated_at", { ascending: false });
      if (data) setSessions(data as ChatSession[]);
      setLoading(false);
    })();
  }, [user]);

  const handleDelete = async (id: string) => {
    try {
      await supabase.from("chat_messages").delete().eq("chat_session_id", id);
      await supabase.from("chat_sessions").delete().eq("id", id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
      toast.success("Chat deleted");
    } catch {
      toast.error("Failed to delete chat");
    }
  };

  const handleOpen = (id: string) => {
    navigate(`/app?session=${id}`);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  };

  // Group sessions by date
  const grouped = sessions.reduce<Record<string, ChatSession[]>>((acc, s) => {
    const day = new Date(s.updated_at).toLocaleDateString();
    (acc[day] = acc[day] || []).push(s);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/app")}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">All Projects</h1>
            <p className="text-sm text-muted-foreground">Chat history from the last 30 days</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p>No chat history yet</p>
          </div>
        ) : (
          Object.entries(grouped).map(([day, items]) => (
            <div key={day} className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-1">
                {formatDate(items[0].updated_at)}
              </p>
              <div className="space-y-1">
                {items.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent/50 transition-colors group cursor-pointer"
                    onClick={() => handleOpen(s.id)}
                  >
                    <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{s.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {s.document_name && <span>{s.document_name} · </span>}
                        {formatTime(s.updated_at)}
                      </p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(s.id); }}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-destructive/20 hover:text-destructive transition-all shrink-0"
                      title="Delete chat"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
