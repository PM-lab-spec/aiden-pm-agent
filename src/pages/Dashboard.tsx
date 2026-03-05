import { useState, useRef } from "react";
import { Bot, PanelLeftClose, PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import ChatPanel, { type ChatPanelHandle } from "@/components/ChatPanel";
import DocumentSidebar from "@/components/DocumentSidebar";
import ArtifactPanel from "@/components/ArtifactPanel";
import { DocumentProvider } from "@/context/DocumentContext";
import { motion, AnimatePresence } from "framer-motion";

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const chatRef = useRef<ChatPanelHandle>(null);

  const handleGenerate = (_artifactId: string, prompt: string) => {
    chatRef.current?.sendMessage(prompt);
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
              {/* Logo */}
              <div className="p-4 border-b border-border flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                  <Bot className="h-4.5 w-4.5 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-sm font-bold text-foreground tracking-tight">Aiden</h1>
                  <p className="text-xs text-muted-foreground">PM Assistant</p>
                </div>
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
