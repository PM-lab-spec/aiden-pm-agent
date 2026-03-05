import { useState, useRef, useCallback, useEffect, forwardRef, useImperativeHandle } from "react";
import { Send, Loader2, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { streamChat } from "@/lib/streamChat";
import { toast } from "sonner";
import { useDocuments } from "@/context/DocumentContext";

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

export type ChatPanelHandle = { sendMessage: (text: string) => void };

const ChatPanel = forwardRef<ChatPanelHandle, {}>((_props, ref) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const { getDocumentContext, documents } = useDocuments();

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

  const sendMessageDirect = async (text: string) => {
    if (isLoading) return;
    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsLoading(true);

    const controller = new AbortController();
    abortRef.current = controller;

    const docContext = getDocumentContext();
    const messagesForAI = updatedMessages.map(({ role, content }) => ({ role, content }));
    if (docContext) {
      messagesForAI.unshift({ role: "user", content: `[DOCUMENT CONTEXT]\n\n${docContext}\n\n[END DOCUMENT CONTEXT]` });
      messagesForAI.splice(1, 0, { role: "assistant", content: "I've received and reviewed the uploaded documents." });
    }

    let assistantSoFar = "";
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
        onDelta: upsertAssistant,
        onDone: () => setIsLoading(false),
        onError: (error) => { toast.error(error); setIsLoading(false); },
        signal: controller.signal,
      });
    } catch (e: any) {
      if (e.name !== "AbortError") { toast.error("Failed to connect to AI."); setIsLoading(false); }
    }
  };

  useImperativeHandle(ref, () => ({ sendMessage: sendMessageDirect }));

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: trimmed };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    const controller = new AbortController();
    abortRef.current = controller;

    let assistantSoFar = "";
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

    // Build messages with document context injected
    const docContext = getDocumentContext();
    const messagesForAI = updatedMessages.map(({ role, content }) => ({ role, content }));

    // Inject document context as a system-level user message at the start
    if (docContext) {
      messagesForAI.unshift({
        role: "user" as const,
        content: `[DOCUMENT CONTEXT - The user has uploaded the following documents. Use them to answer questions and generate artifacts.]\n\n${docContext}\n\n[END DOCUMENT CONTEXT]`,
      });
      // Add a fake assistant ack so the model knows it received the docs
      messagesForAI.splice(1, 0, {
        role: "assistant" as const,
        content: "I've received and reviewed the uploaded documents. I'll use them as context for our conversation.",
      });
    }

    try {
      await streamChat({
        messages: messagesForAI,
        onDelta: upsertAssistant,
        onDone: () => setIsLoading(false),
        onError: (error) => {
          toast.error(error);
          setIsLoading(false);
        },
        signal: controller.signal,
      });
    } catch (e: any) {
      if (e.name !== "AbortError") {
        toast.error("Failed to connect to AI. Please try again.");
        setIsLoading(false);
      }
    }
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
                  <div
                    className={`max-w-[85%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "surface-card"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <div className="prose prose-sm max-w-none prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-code:text-primary">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      msg.content
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
