import { useState, useRef } from "react";
import { Bot, PanelLeftClose, PanelLeft, BarChart3, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import ChatPanel, { type ChatPanelHandle } from "@/components/ChatPanel";
import DocumentSidebar from "@/components/DocumentSidebar";
import ArtifactPanel from "@/components/ArtifactPanel";
import ChatHistoryDropdown from "@/components/ChatHistoryDropdown";
import { DocumentProvider } from "@/context/DocumentContext";
import { motion, AnimatePresence } from "framer-motion";

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const chatRef = useRef<ChatPanelHandle>(null);
  const navigate = useNavigate();

  const handleGenerate = (_artifactId: string, prompt: string) => {
    chatRef.current?.sendMessage(prompt);
  };

  const handleNewChat = () => {
    chatRef.current?.clearMessages();
    setActiveChatId(null);
  };

  const handleSelectSession = (chatSessionId: string) => {
    chatRef.current?.switchToSession(chatSessionId);
    setActiveChatId(chatSessionId);
  };

  return (
    <DocumentProvider>
      <div className="flex h-screen bg-background">
        {/* Left sidebar */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-r border-border bg-sidebar flex flex-col overflow-hidden shrink-0"
            >
              {/* Logo + New Chat */}
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                    <Bot className="h-4.5 w-4.5 text-primary-foreground" />
                  </div>
                  <div>
                    <h1 className="text-sm font-bold text-foreground tracking-tight">Aiden</h1>
                    <p className="text-xs text-muted-foreground">PM Assistant</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleNewChat}
                  title="New Chat"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Artifact generators */}
              <ArtifactPanel onGenerate={handleGenerate} />

              {/* Document sidebar */}
              <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                <DocumentSidebar />
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top bar */}
          <header className="h-12 border-b border-border flex items-center px-4 gap-3 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? (
                <PanelLeftClose className="h-4 w-4" />
              ) : (
                <PanelLeft className="h-4 w-4" />
              )}
            </Button>
            <span className="text-sm font-medium text-foreground">Chat</span>
            <div className="ml-auto flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 text-muted-foreground"
                onClick={handleNewChat}
              >
                <Plus className="h-3.5 w-3.5" />
                <span className="text-xs">New Chat</span>
              </Button>
              <ChatHistoryDropdown
                onNewChat={handleNewChat}
                onSelectSession={handleSelectSession}
                activeChatId={activeChatId}
              />
              <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-muted-foreground" onClick={() => navigate("/analytics")}>
                <BarChart3 className="h-3.5 w-3.5" />
                <span className="text-xs">Analytics</span>
              </Button>
            </div>
          </header>

          {/* Chat */}
          <div className="flex-1 min-h-0">
            <ChatPanel ref={chatRef} />
          </div>
        </div>
      </div>
    </DocumentProvider>
  );
}
