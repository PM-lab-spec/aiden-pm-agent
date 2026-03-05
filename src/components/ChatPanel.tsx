import { useState, useRef, useCallback, useEffect, forwardRef, useImperativeHandle } from "react";
import { Send, Loader2, Square } from "lucide-react";
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

const SUGGESTED_PROMPTS = [
  "Summarize the key pain points from uploaded feedback",
  "Generate a PRD for the new onboarding flow",
  "Create user stories for the checkout redesign",
  "Suggest roadmap priorities for next quarter",
];

export type ChatPanelHandle = {
  sendMessage: (text: string) => void;
  clearMessages: () => void;
  switchToSession: (chatSessionId: string) => void;
};

const ChatPanel = forwardRef<ChatPanelHandle, {}>((_props, ref) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const { sessionId, activeDocumentName } = useDocuments();
  const chatHistory = useChatHistory(sessionId);
  const activeChatIdRef = useRef<string | null>(null);

  // Load sessions on mount
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
    setIsLoading(true);

    let chatId: string;
    try {
      // Persist user message
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
          // Persist final assistant message
          if (assistantSoFar && !assistantSaved) {
            assistantSaved = true;
            try {
              await chatHistory.saveMessage(chatId, "assistant", assistantSoFar);
            } catch (e) {
              console.error("Failed to save assistant message:", e);
            }
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
    const msgs = await chatHistory.loadMessages(chatSessionId);
    setMessages(msgs);
    activeChatIdRef.current = chatSessionId;
    chatHistory.setActiveChatId(chatSessionId);
  }, [chatHistory]);

  useImperativeHandle(ref, () => ({
    sendMessage: (text: string) => doSend(text, false),
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
    doSend(trimmed, true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handlePromptClick = (prompt: string) => {
    setInput(prompt);
    textareaRef.current?.focus();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-8 animate-fade-in">
            <div className="text-center space-y-3">
              <h2 className="text-2xl font-semibold text-foreground">
                What can I help you build?
              </h2>
              <p className="text-muted-foreground max-w-md">
                Ask me to generate PRDs, user stories, roadmaps, or analyze your product documents.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg w-full">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handlePromptClick(prompt)}
                  className="text-left p-3 rounded-lg border border-border bg-card hover:bg-secondary/50 transition-colors text-sm text-foreground"
                >
                  {prompt}
                </button>
              ))}
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
                  <div className={`max-w-[85%] ${msg.role === "user" ? "" : ""}`}>
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
      <div className="border-t border-border p-4">
        <div className="max-w-3xl mx-auto flex gap-3 items-end">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Aiden anything about your products..."
            rows={1}
            className="flex-1 resize-none rounded-xl border border-input bg-card px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring min-h-[44px] max-h-[120px]"
            style={{ height: "auto", overflow: "hidden" }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = "auto";
              target.style.height = Math.min(target.scrollHeight, 120) + "px";
            }}
          />
          {isLoading ? (
            <Button
              onClick={handleStop}
              size="icon"
              variant="outline"
              className="rounded-xl h-[44px] w-[44px] shrink-0"
            >
              <Square className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <Button
              onClick={handleSend}
              disabled={!input.trim()}
              size="icon"
              className="rounded-xl h-[44px] w-[44px] shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
});

ChatPanel.displayName = "ChatPanel";

export default ChatPanel;
