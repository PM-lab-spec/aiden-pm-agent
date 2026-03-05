import { useState, useRef, useCallback, useEffect, forwardRef, useImperativeHandle } from "react";
import { Send, Loader2, Square, Plus, Upload, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import ArtifactMarkdown from "@/components/ArtifactMarkdown";
import MessageFeedback from "@/components/MessageFeedback";
import { streamChat } from "@/lib/streamChat";
import { toast } from "sonner";
import { useDocuments } from "@/context/DocumentContext";
import { useChatHistory } from "@/hooks/useChatHistory";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export type ChatPanelHandle = {
  sendMessage: (text: string) => void;
  clearMessages: () => void;
  switchToSession: (chatSessionId: string) => void;
};

interface ChatPanelProps {
  userName?: string;
  onTransitionToAgents?: (firstMessage: string, docName: string | null, initialMessages?: { role: "user" | "assistant"; content: string }[], chatSessionId?: string | null) => void;
}

const ChatPanel = forwardRef<ChatPanelHandle, ChatPanelProps>(({ userName = "there", onTransitionToAgents }, ref) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { sessionId, activeDocumentName, addDocuments } = useDocuments();
  const chatHistory = useChatHistory(sessionId);
  const activeChatIdRef = useRef<string | null>(null);

  useEffect(() => {
    chatHistory.loadSessions();
  }, [chatHistory.loadSessions]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleStop = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsLoading(false);
  };

  const ensureSession = async (firstMessage: string): Promise<string> => {
    if (activeChatIdRef.current) return activeChatIdRef.current;
    const id = await chatHistory.createSession(
      firstMessage.slice(0, 60) + (firstMessage.length > 60 ? "..." : ""),
      activeDocumentName
    );
    activeChatIdRef.current = id;
    return id;
  };

  const doSend = async (text: string, fromInput: boolean) => {
    if (isLoading) return;
    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    if (fromInput) setInput("");

    // If document is uploaded, transition immediately to agents view
    if (messages.length === 0 && onTransitionToAgents && activeDocumentName) {
      onTransitionToAgents(text, activeDocumentName, [{ role: "user", content: text }], activeChatIdRef.current);
      return;
    }

    setIsLoading(true);

    let chatId: string;
    try {
      chatId = await ensureSession(text);
      await chatHistory.saveMessage(chatId, "user", text);
      if (updatedMessages.filter(m => m.role === "user").length === 1) {
        await chatHistory.updateSessionTitle(chatId, text);
      }
    } catch (e) {
      console.error("Failed to persist message:", e);
      toast.error("Failed to save message. Please try again.");
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    const messagesForAI = updatedMessages.map(({ role, content }) => ({ role, content }));

    let assistantSoFar = "";
    let assistantSaved = false;
    const upsertAssistant = (chunk: string) => {
      assistantSoFar += chunk;
      const content = assistantSoFar;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content } : m));
        }
        return [...prev, { id: crypto.randomUUID(), role: "assistant", content }];
      });
    };

    try {
      await streamChat({
        messages: messagesForAI,
        sessionId,
        activeDocumentName,
        onDelta: upsertAssistant,
        onDone: async () => {
          setIsLoading(false);
          if (assistantSoFar && !assistantSaved) {
            assistantSaved = true;
            try {
              await chatHistory.saveMessage(chatId, "assistant", assistantSoFar);
            } catch (e) {
              console.error("Failed to save assistant message:", e);
            }
          }
          // After first AI response (no document), transition to agents view with conversation
          if (updatedMessages.length === 1 && onTransitionToAgents && !activeDocumentName) {
            const convMessages = [
              { role: "user" as const, content: text },
              { role: "assistant" as const, content: assistantSoFar },
            ];
            setTimeout(() => {
              onTransitionToAgents(text, null, convMessages, activeChatIdRef.current);
            }, 1500);
          }
        },
        onError: (error) => { toast.error(error); setIsLoading(false); },
        signal: controller.signal,
      });
    } catch (e: any) {
      if (e.name !== "AbortError") {
        toast.error("Failed to connect to AI. Please try again.");
        setIsLoading(false);
      }
    }
  };

  const switchToSession = useCallback(async (chatSessionId: string) => {
    activeChatIdRef.current = chatSessionId;
    chatHistory.setActiveChatId(chatSessionId);
    try {
      const msgs = await chatHistory.loadMessages(chatSessionId);
      setMessages(msgs);
    } catch (e) {
      console.error("Failed to load chat session:", e);
      toast.error("Failed to load that chat. Please try again.");
    }
  }, [chatHistory]);

  useImperativeHandle(ref, () => ({
    sendMessage: (text: string) => {
      void doSend(text, false).catch((e) => {
        console.error("Send message failed:", e);
        toast.error("Failed to send message.");
      });
    },
    clearMessages: () => {
      setMessages([]);
      setInput("");
      activeChatIdRef.current = null;
      chatHistory.setActiveChatId(null);
    },
    switchToSession,
  }));

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    void doSend(trimmed, true).catch((e) => {
      console.error("Handle send failed:", e);
      toast.error("Failed to send message.");
      setIsLoading(false);
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-6 animate-fade-in px-6">
            <div className="text-center max-w-2xl mx-auto w-full">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-sm text-white/90 text-xs font-medium mb-6 border border-white/10">
                <Sparkles className="h-3.5 w-3.5" />
                AI-Powered Product Management Agent
              </div>
              <h2 className="text-4xl sm:text-5xl font-bold text-white tracking-tight leading-tight mb-4">
                What can I help you build?
              </h2>
              <p className="text-lg text-[hsl(0,0%,55%)] mb-2 max-w-lg mx-auto">
                Generate PRDs, user stories, roadmaps, and more — all grounded in your real data.
              </p>
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-6">
            <AnimatePresence>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-[85%]`}>
                    <div
                      className={`rounded-xl px-4 py-3 text-sm leading-relaxed ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "surface-card"
                      }`}
                    >
                      {msg.role === "assistant" ? (
                        <ArtifactMarkdown content={msg.content} />
                      ) : (
                        msg.content
                      )}
                    </div>
                    {msg.role === "assistant" && !isLoading && (
                      <MessageFeedback
                        sessionId={sessionId}
                        messageContent={msg.content}
                        userQuery={messages[messages.indexOf(msg) - 1]?.content}
                      />
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="surface-card px-4 py-3 rounded-xl flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Thinking...
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="p-4 pb-6">
        <div className="max-w-2xl mx-auto">
          <div className="rounded-2xl border border-[hsl(0,0%,20%)] bg-[hsl(240,10%,14%)] shadow-lg overflow-hidden">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Aiden anything about your products..."
              rows={2}
              className="w-full resize-none bg-transparent px-4 pt-4 pb-2 text-sm text-white placeholder:text-[hsl(0,0%,45%)] focus:outline-none min-h-[60px] max-h-[120px]"
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "auto";
                target.style.height = Math.min(target.scrollHeight, 120) + "px";
              }}
            />
            {/* Bottom bar with + button and send */}
            <div className="flex items-center justify-between px-3 pb-3">
              <button
                onClick={handleFileUpload}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
                title="Upload document"
              >
                <Plus className="h-4 w-4" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.docx,.txt,.md,.csv"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) {
                    addDocuments(e.target.files);
                    if (onTransitionToAgents) {
                      const firstName = e.target.files[0]?.name || "Document";
                      setTimeout(() => onTransitionToAgents("", firstName), 500);
                    }
                  }
                  e.target.value = "";
                }}
              />
              <div className="flex items-center gap-1">
                {isLoading ? (
                  <Button
                    onClick={handleStop}
                    size="icon"
                    variant="outline"
                    className="rounded-lg h-8 w-8"
                  >
                    <Square className="h-3 w-3" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSend}
                    disabled={!input.trim()}
                    size="icon"
                    className="rounded-lg h-8 w-8"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          </div>
          {messages.length === 0 && (
            <div className="flex flex-wrap gap-2 justify-center mt-3">
              {[
                "Generate a PRD",
                "Create user stories",
                "Suggest roadmap priorities",
                "Summarize feedback",
              ].map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => setInput(prompt)}
                  className="px-3 py-1.5 rounded-full border border-[hsl(0,0%,20%)] bg-[hsl(240,10%,14%)] text-xs text-[hsl(0,0%,55%)] hover:text-white hover:border-primary/30 transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}
          <p className="text-xs text-[hsl(0,0%,55%)] text-center mt-3">
            Aiden — Open-source AI assistant for Product Managers
          </p>
          <p className="text-[10px] text-[hsl(0,0%,40%)] text-center mt-1">
            Aiden can make mistakes. Check the important info.
          </p>
        </div>
      </div>
    </div>
  );
});

ChatPanel.displayName = "ChatPanel";

export default ChatPanel;
