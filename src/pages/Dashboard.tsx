import { useState, useRef, useEffect } from "react";
import { Home, BookOpen, FolderOpen, User, LogOut, BarChart3, ChevronDown } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import ChatPanel, { type ChatPanelHandle } from "@/components/ChatPanel";
import DocumentSidebar from "@/components/DocumentSidebar";
import ArtifactPanel from "@/components/ArtifactPanel";
import AgentCardsView from "@/components/AgentCardsView";
import ChatHistoryDropdown from "@/components/ChatHistoryDropdown";
import { DocumentProvider } from "@/context/DocumentContext";
import { useChatHistory, type ChatSession } from "@/hooks/useChatHistory";

export default function Dashboard() {
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"home" | "agents" | "resources">("home");
  const [agentDocName, setAgentDocName] = useState<string | null>(null);
  const [agentFirstQuestion, setAgentFirstQuestion] = useState<string | null>(null);
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

  // Auto-send prompt from homepage (once only)
  useEffect(() => {
    if (promptHandledRef.current) return;
    const params = new URLSearchParams(location.search);
    const prompt = params.get("prompt")?.trim();
    if (!prompt) return;
    promptHandledRef.current = true;
    params.delete("prompt");
    const cleaned = params.toString();
    window.history.replaceState(null, "", cleaned ? `/app?${cleaned}` : "/app");
    // Send prompt through chat first, don't immediately go to agents
    // ChatPanel will handle the transition after AI responds
    chatRef.current?.sendMessage(prompt);
  }, [location.search]);

  const handleGenerate = (_artifactId: string, prompt: string) => {
    chatRef.current?.sendMessage(prompt);
  };

  const handleNewChat = () => {
    chatRef.current?.clearMessages();
    setActiveChatId(null);
    setAgentDocName(null);
    setAgentFirstQuestion(null);
    setViewMode("home");
  };

  const handleSelectSession = (chatSessionId: string) => {
    chatRef.current?.switchToSession(chatSessionId);
    setActiveChatId(chatSessionId);
    setViewMode("agents");
  };

  // Called from ChatPanel when user sends first message or uploads doc
  const handleTransitionToAgents = (firstMessage: string, docName: string | null) => {
    setAgentFirstQuestion(firstMessage);
    setAgentDocName(docName);
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
        <aside className="w-[220px] bg-[hsl(240,10%,12%)] flex flex-col shrink-0 text-[hsl(0,0%,85%)]">
          {/* User button */}
          <div className="p-3">
            <button className="flex items-center gap-2 w-full px-2.5 py-2 rounded-lg hover:bg-[hsl(240,10%,18%)] transition-colors">
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
                viewMode === "home" ? "bg-[hsl(240,10%,20%)] text-white" : "hover:bg-[hsl(240,10%,18%)]"
              }`}
            >
              <Home className="h-4 w-4" />
              Home
            </button>
            <button
              onClick={() => setViewMode("resources")}
              className={`flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-sm transition-colors ${
                viewMode === "resources" ? "bg-[hsl(240,10%,20%)] text-white" : "hover:bg-[hsl(240,10%,18%)]"
              }`}
            >
              <BookOpen className="h-4 w-4" />
              Resources
            </button>
          </nav>

          {/* Projects section */}
          <div className="mt-6 px-3">
            <p className="px-2.5 text-[10px] font-semibold uppercase tracking-wider text-[hsl(0,0%,50%)] mb-1.5">
              Projects
            </p>
            <nav className="space-y-0.5">
              <button className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-sm hover:bg-[hsl(240,10%,18%)] transition-colors">
                <FolderOpen className="h-4 w-4" />
                All projects
              </button>
              <button className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-sm hover:bg-[hsl(240,10%,18%)] transition-colors">
                <User className="h-4 w-4" />
                Created by me
              </button>
            </nav>
          </div>

          {/* Recents section */}
          <div className="mt-6 px-3 flex-1 min-h-0 overflow-y-auto scrollbar-thin">
            <p className="px-2.5 text-[10px] font-semibold uppercase tracking-wider text-[hsl(0,0%,50%)] mb-1.5">
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
          <div className="p-3 border-t border-[hsl(240,10%,18%)] space-y-0.5">
            <button
              onClick={() => navigate("/analytics")}
              className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-sm hover:bg-[hsl(240,10%,18%)] transition-colors"
            >
              <BarChart3 className="h-4 w-4" />
              Analytics
            </button>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-sm hover:bg-[hsl(240,10%,18%)] transition-colors"
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
            <div className="flex-1 flex flex-col">
              <div className="p-6 max-w-3xl mx-auto w-full">
                <h2 className="text-xl font-semibold text-foreground mb-4">Resources</h2>
                <ArtifactPanel onGenerate={handleGenerate} />
                <div className="mt-6">
                  <DocumentSidebar />
                </div>
              </div>
            </div>
          ) : viewMode === "agents" ? (
            <div className="flex-1 min-h-0" style={{ background: "var(--gradient-chat-bg)" }}>
              <AgentCardsView
                documentName={agentDocName}
                firstQuestion={agentFirstQuestion}
                chatSessionId={activeChatId}
                onChatSessionCreated={handleChatSessionCreated}
              />
            </div>
          ) : (
            /* Home / Chat view */
            <div className="flex-1 min-h-0" style={{ background: "var(--gradient-chat-bg)" }}>
              <ChatPanel ref={chatRef} onTransitionToAgents={handleTransitionToAgents} />
            </div>
          )}
        </div>
      </div>
    </DocumentProvider>
  );
}
