import { useState, useRef, useEffect, useCallback } from "react";
import { Home, BookOpen, FolderOpen, LogOut, BarChart3, ChevronDown } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import ChatPanel, { type ChatPanelHandle } from "@/components/ChatPanel";
import DocumentSidebar from "@/components/DocumentSidebar";
import ArtifactPanel from "@/components/ArtifactPanel";
import SampleTemplates from "@/components/SampleTemplates";
import AgentCardsView from "@/components/AgentCardsView";
import ChatHistoryDropdown from "@/components/ChatHistoryDropdown";
import { DocumentProvider } from "@/context/DocumentContext";
import { useChatHistory, type ChatSession } from "@/hooks/useChatHistory";
import { supabase } from "@/integrations/supabase/client";

export default function Dashboard() {
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"home" | "agents" | "resources">("home");
  const [agentDocName, setAgentDocName] = useState<string | null>(null);
  const [agentFirstQuestion, setAgentFirstQuestion] = useState<string | null>(null);
  const [initialMessages, setInitialMessages] = useState<{ role: "user" | "assistant"; content: string; agent_type?: string }[] | null>(null);
  const chatRef = useRef<ChatPanelHandle>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const promptHandledRef = useRef(false);
  const promptTimeoutRef = useRef<number | null>(null);
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const sessionParam = params.get("session");
    if (sessionParam && !promptHandledRef.current) {
      promptHandledRef.current = true;
      params.delete("session");
      const cleaned = params.toString();
      window.history.replaceState(null, "", cleaned ? `/app?${cleaned}` : "/app");
      handleSelectSession(sessionParam);
      return;
    }

    if (promptHandledRef.current) return;
    const prompt = params.get("prompt")?.trim();
    if (!prompt) return;
    promptHandledRef.current = true;
    params.delete("prompt");
    const cleaned = params.toString();
    window.history.replaceState(null, "", cleaned ? `/app?${cleaned}` : "/app");
    chatRef.current?.sendMessage(prompt);
  }, [location.search]);

  const handleGenerate = (_artifactId: string, prompt: string) => {
    setViewMode("home");
    setTimeout(() => {
      chatRef.current?.sendMessage(prompt);
    }, 100);
  };

  const handleNewChat = () => {
    chatRef.current?.clearMessages();
    setActiveChatId(null);
    setAgentDocName(null);
    setAgentFirstQuestion(null);
    setInitialMessages(null);
    setViewMode("home");
  };

  const handleSelectSession = useCallback(async (chatSessionId: string) => {
    const { data: session } = await supabase
      .from("chat_sessions")
      .select("*")
      .eq("id", chatSessionId)
      .single();

    const { data: messages } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("chat_session_id", chatSessionId)
      .order("created_at", { ascending: true });

    const restoredMessages = (messages || []).map((m: any) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
      agent_type: m.agent_type || "general",
    }));

    setActiveChatId(chatSessionId);
    setAgentDocName((session as any)?.document_name || null);
    setAgentFirstQuestion(restoredMessages[0]?.content || null);
    setInitialMessages(restoredMessages.length > 0 ? restoredMessages : null);
    setViewMode("agents");
  }, []);

  const handleTransitionToAgents = (firstMessage: string, docName: string | null, msgs?: { role: "user" | "assistant"; content: string; agent_type?: string }[], chatSessionId?: string | null) => {
    setAgentFirstQuestion(firstMessage);
    setAgentDocName(docName);
    setInitialMessages(msgs || null);
    if (chatSessionId) setActiveChatId(chatSessionId);
    setViewMode("agents");
  };

  const handleChatSessionCreated = (id: string) => {
    setActiveChatId(id);
  };

  const userName = user?.email?.split("@")[0] || "User";

  return (
    <DocumentProvider>
      <div className="flex h-screen bg-background">
        {/* Dark sidebar */}
        <aside className="w-[220px] bg-dark-surface flex flex-col shrink-0 text-dark-text">
          {/* User button */}
          <div className="p-3">
            <button className="flex items-center gap-2 w-full px-2.5 py-2 rounded-lg hover:bg-dark-surface-hover transition-colors">
              <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground uppercase">
                {userName.charAt(0)}
              </div>
              <span className="text-sm font-medium truncate flex-1 text-left">{userName}'s Aiden</span>
              <ChevronDown className="h-3.5 w-3.5 opacity-50" />
            </button>
          </div>

          {/* Nav items */}
          <nav className="px-3 space-y-0.5">
            <button
              onClick={() => { handleNewChat(); }}
              className={`flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-sm transition-colors ${
                viewMode === "home" ? "bg-dark-surface-active text-dark-text-heading" : "hover:bg-dark-surface-hover"
              }`}
            >
              <Home className="h-4 w-4" />
              Home
            </button>
            <button
              onClick={() => setViewMode("resources")}
              className={`flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-sm transition-colors ${
                viewMode === "resources" ? "bg-dark-surface-active text-dark-text-heading" : "hover:bg-dark-surface-hover"
              }`}
            >
              <BookOpen className="h-4 w-4" />
              Resources
            </button>
          </nav>

          {/* Projects section */}
          <div className="mt-6 px-3">
            <p className="px-2.5 text-[10px] font-semibold uppercase tracking-wider text-dark-text-muted mb-1.5">
              Projects
            </p>
            <nav className="space-y-0.5">
              <button
                onClick={() => navigate("/all-projects")}
                className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-sm hover:bg-dark-surface-hover transition-colors"
              >
                <FolderOpen className="h-4 w-4" />
                All projects
              </button>
            </nav>
          </div>

          {/* Recents section */}
          <div className="mt-6 px-3 flex-1 min-h-0 overflow-y-auto scrollbar-thin">
            <p className="px-2.5 text-[10px] font-semibold uppercase tracking-wider text-dark-text-muted mb-1.5">
              Recents
            </p>
            <ChatHistoryDropdown
              onNewChat={handleNewChat}
              onSelectSession={handleSelectSession}
              activeChatId={activeChatId}
              variant="sidebar"
            />
          </div>

          {/* Bottom actions */}
          <div className="p-3 border-t border-dark-border-subtle space-y-0.5">
            <button
              onClick={() => navigate("/analytics")}
              className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-sm hover:bg-dark-surface-hover transition-colors"
            >
              <BarChart3 className="h-4 w-4" />
              Analytics
            </button>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-sm hover:bg-dark-surface-hover transition-colors"
              title={user?.email || "Sign out"}
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </aside>

        {/* Main area */}
        <div className="flex-1 flex flex-col min-w-0">
          {viewMode === "resources" ? (
            <div className="flex-1 flex flex-col overflow-y-auto scrollbar-thin" style={{ background: "var(--gradient-chat-bg)" }}>
              <div className="p-6 max-w-3xl mx-auto w-full">
                <h2 className="text-xl font-semibold text-dark-text-heading mb-6">Resources</h2>
                <SampleTemplates />
              </div>
            </div>
          ) : viewMode === "agents" ? (
            <div className="flex-1 min-h-0" style={{ background: "var(--gradient-chat-bg)" }}>
              <AgentCardsView
                documentName={agentDocName}
                firstQuestion={agentFirstQuestion}
                chatSessionId={activeChatId}
                onChatSessionCreated={handleChatSessionCreated}
                initialMessages={initialMessages}
              />
            </div>
          ) : (
            /* Home / Chat view */
            <div className="flex-1 min-h-0" style={{ background: "var(--gradient-chat-bg)" }}>
              <ChatPanel ref={chatRef} onTransitionToAgents={handleTransitionToAgents} />
            </div>
          )}
        </div>
        <div className="absolute bottom-1 right-2 text-[9px] text-dark-text-subtle/40 select-none pointer-events-none tracking-wide">
          Shriansh
        </div>
      </div>
    </DocumentProvider>
  );
}
