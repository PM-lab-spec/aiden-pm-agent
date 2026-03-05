import { useState, useRef, useCallback, useEffect } from "react";
import { FileText, ListChecks, TrendingUp, BarChart3, Map, MessageCircle, X, Sparkles, Send, Loader2, Square, Plus, MessagesSquare, Pencil, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import ArtifactMarkdown from "@/components/ArtifactMarkdown";
import MessageFeedback from "@/components/MessageFeedback";
import { streamChat } from "@/lib/streamChat";
import { useDocuments } from "@/context/DocumentContext";
import { useChatHistory } from "@/hooks/useChatHistory";
import { toast } from "sonner";

const AGENTS = [
  {
    id: "general",
    label: "General Chat",
    description: "Ask anything about your document",
    icon: MessagesSquare,
    color: "hsl(260 70% 60%)",
    bgGradient: "linear-gradient(135deg, hsl(260 40% 18%), hsl(260 30% 12%))",
    borderColor: "hsl(260 40% 25%)",
  },
  {
    id: "prd",
    label: "PRD",
    description: "Product Requirements Document",
    icon: FileText,
    color: "hsl(340 70% 50%)",
    bgGradient: "linear-gradient(135deg, hsl(340 50% 18%), hsl(340 40% 12%))",
    borderColor: "hsl(340 50% 25%)",
  },
  {
    id: "stories",
    label: "User Stories",
    description: "Epics, stories & acceptance criteria",
    icon: ListChecks,
    color: "hsl(270 70% 60%)",
    bgGradient: "linear-gradient(135deg, hsl(270 40% 18%), hsl(270 30% 12%))",
    borderColor: "hsl(270 40% 25%)",
  },
  {
    id: "research",
    label: "Market Research",
    description: "Competitive analysis & insights",
    icon: TrendingUp,
    color: "hsl(160 70% 45%)",
    bgGradient: "linear-gradient(135deg, hsl(160 40% 15%), hsl(160 30% 10%))",
    borderColor: "hsl(160 40% 22%)",
  },
  {
    id: "metrics",
    label: "Metrics & KPIs",
    description: "Success metrics & measurement",
    icon: BarChart3,
    color: "hsl(40 80% 50%)",
    bgGradient: "linear-gradient(135deg, hsl(40 40% 16%), hsl(40 30% 10%))",
    borderColor: "hsl(40 40% 22%)",
  },
  {
    id: "roadmap",
    label: "Roadmap",
    description: "Now, Next, Later priorities",
    icon: Map,
    color: "hsl(200 70% 50%)",
    bgGradient: "linear-gradient(135deg, hsl(200 40% 16%), hsl(200 30% 10%))",
    borderColor: "hsl(200 40% 22%)",
  },
];

type Message = { id: string; role: "user" | "assistant"; content: string };

interface AgentCardsViewProps {
  documentName: string | null;
  firstQuestion: string | null;
  chatSessionId: string | null;
  onChatSessionCreated: (id: string) => void;
  initialMessages?: { role: "user" | "assistant"; content: string }[] | null;
}

export default function AgentCardsView({ documentName, firstQuestion, chatSessionId, onChatSessionCreated, initialMessages }: AgentCardsViewProps) {
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);
  const [agentMessages, setAgentMessages] = useState<Record<string, Message[]>>({});
  const [agentInputs, setAgentInputs] = useState<Record<string, string>>({});
  const [loadingAgent, setLoadingAgent] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const sendingRef = useRef(false);
  const sessionIdRef = useRef<string | null>(chatSessionId);
  const creatingSessionRef = useRef<Promise<string> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { sessionId, activeDocumentName, addDocuments } = useDocuments();
  const chatHistory = useChatHistory(sessionId);

  const [customTitle, setCustomTitle] = useState<string | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitleValue, setEditTitleValue] = useState("");
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Derive header: session document (chat-specific) > reactive active document > custom title > first question
  const displayDocName = documentName || activeDocumentName;
  const headerText = displayDocName || customTitle || firstQuestion || "New Chat";

  // Keep refs in sync with prop (including reset on new chat)
  useEffect(() => {
    sessionIdRef.current = chatSessionId ?? null;
    if (!chatSessionId) creatingSessionRef.current = null;
  }, [chatSessionId]);

  const prevChatSessionIdRef = useRef<string | null | undefined>(undefined);

  // Reset all internal state when switching to a different session
  useEffect(() => {
    // Skip the very first render
    if (prevChatSessionIdRef.current === undefined) {
      prevChatSessionIdRef.current = chatSessionId;
    } else if (prevChatSessionIdRef.current !== chatSessionId) {
      prevChatSessionIdRef.current = chatSessionId;
      // Full reset
      setAgentMessages({});
      setAgentInputs({});
      setExpandedAgent(null);
      setLoadingAgent(null);
      setCustomTitle(null);
      setIsEditingTitle(false);
      abortRef.current?.abort();
      abortRef.current = null;
      initializedRef.current = false;
    }
  }, [chatSessionId]);

  const initializedRef = useRef(false);

  // Seed initial messages into General Chat and auto-expand it
  useEffect(() => {
    if (initializedRef.current) return;
    if (initialMessages && initialMessages.length > 0) {
      initializedRef.current = true;
      const seeded: Message[] = initialMessages.map(m => ({
        id: crypto.randomUUID(),
        role: m.role,
        content: m.content,
      }));
      setAgentMessages({ general: seeded });
      setExpandedAgent("general");
    }
  }, [initialMessages]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [agentMessages, expandedAgent, scrollToBottom]);

  const handleStop = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setLoadingAgent(null);
  };

  const ensureSession = async (firstMsg: string): Promise<string> => {
    if (sessionIdRef.current) return sessionIdRef.current;
    if (creatingSessionRef.current) return creatingSessionRef.current;
    const promise = chatHistory.createSession(
      firstMsg.slice(0, 60) + (firstMsg.length > 60 ? "..." : ""),
      displayDocName || null
    ).then(id => {
      sessionIdRef.current = id;
      creatingSessionRef.current = null;
      onChatSessionCreated(id);
      return id;
    });
    creatingSessionRef.current = promise;
    return promise;
  };

  const getAllSessionMessages = (): { role: "user" | "assistant"; content: string }[] => {
    const all: { role: "user" | "assistant"; content: string; ts: number }[] = [];
    for (const agentId of Object.keys(agentMessages)) {
      const agent = AGENTS.find(a => a.id === agentId);
      agentMessages[agentId].forEach((m, i) => {
        all.push({
          role: m.role,
          content: m.role === "user" ? `[${agent?.label || agentId}] ${m.content}` : m.content,
          ts: i,
        });
      });
    }
    return all.map(({ role, content }) => ({ role, content }));
  };

  const doSend = async (agentId: string, text: string) => {
    if (loadingAgent || sendingRef.current) return;
    sendingRef.current = true;
    const agent = AGENTS.find(a => a.id === agentId)!;

    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: text };
    const currentMsgs = agentMessages[agentId] || [];
    const updatedMsgs = [...currentMsgs, userMsg];

    setAgentMessages(prev => ({ ...prev, [agentId]: updatedMsgs }));
    setAgentInputs(prev => ({ ...prev, [agentId]: "" }));
    setLoadingAgent(agentId);

    let sessId: string;
    try {
      sessId = await ensureSession(text);
      await chatHistory.saveMessage(sessId, "user", text);
    } catch (e) {
      console.error("Failed to persist:", e);
      toast.error("Failed to save message.");
      setLoadingAgent(null);
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;

    // Build shared memory: all messages from all agents
    const sharedMessages = getAllSessionMessages();
    // Add current user message with agent context
    const messagesForAI = [
      ...sharedMessages,
      { role: "user" as const, content: `[${agent.label}] ${text}` },
    ];

    let assistantSoFar = "";
    let assistantSaved = false;

    const upsertAssistant = (chunk: string) => {
      assistantSoFar += chunk;
      const content = assistantSoFar;
      setAgentMessages(prev => {
        const msgs = prev[agentId] || [];
        const last = msgs[msgs.length - 1];
        if (last?.role === "assistant") {
          return { ...prev, [agentId]: msgs.map((m, i) => i === msgs.length - 1 ? { ...m, content } : m) };
        }
        return { ...prev, [agentId]: [...msgs, { id: crypto.randomUUID(), role: "assistant", content }] };
      });
    };

    try {
      await streamChat({
        messages: messagesForAI,
        sessionId,
        activeDocumentName: displayDocName,
        agentType: agentId,
        onDelta: upsertAssistant,
        onDone: async () => {
          setLoadingAgent(null);
          sendingRef.current = false;
          if (assistantSoFar && !assistantSaved) {
            assistantSaved = true;
            try {
              await chatHistory.saveMessage(sessId, "assistant", assistantSoFar);
            } catch (e) {
              console.error("Failed to save assistant message:", e);
            }
          }
        },
        onError: (error) => { toast.error(error); setLoadingAgent(null); sendingRef.current = false; },
        signal: controller.signal,
      });
    } catch (e: any) {
      sendingRef.current = false;
      if (e.name !== "AbortError") {
        toast.error("Failed to connect to AI.");
        setLoadingAgent(null);
      }
    }
  };

  const handleQuickAction = (agentId: string, action: string) => {
    const agent = AGENTS.find(a => a.id === agentId)!;
    const label = agent.label.toLowerCase();
    let prompt = "";
    if (action === "generate") prompt = `Generate a detailed ${label} based on the uploaded document`;
    else if (action === "insights") prompt = `What are the key insights for ${label} from the uploaded document?`;
    else if (action === "summarize") prompt = `Summarize the ${label} aspects of the uploaded document`;
    doSend(agentId, prompt);
  };

  const expanded = expandedAgent ? AGENTS.find(a => a.id === expandedAgent) : null;

  return (
    <div className="h-full overflow-y-auto scrollbar-thin p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/20 flex items-center justify-center">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            {isEditingTitle ? (
              <div className="flex items-center gap-2">
                <input
                  ref={titleInputRef}
                  type="text"
                  value={editTitleValue}
                  onChange={(e) => setEditTitleValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const newTitle = editTitleValue.trim() || null;
                      setCustomTitle(newTitle);
                      setIsEditingTitle(false);
                      if (newTitle && chatSessionId) {
                        chatHistory.updateSessionTitle(chatSessionId, newTitle);
                      }
                    } else if (e.key === "Escape") {
                      setIsEditingTitle(false);
                    }
                  }}
                  className="bg-transparent border border-dark-border rounded-md px-2 py-1 text-dark-text-heading font-semibold text-lg focus:outline-none focus:border-primary"
                  autoFocus
                />
                <button
                  onClick={() => {
                    const newTitle = editTitleValue.trim() || null;
                    setCustomTitle(newTitle);
                    setIsEditingTitle(false);
                    if (newTitle && chatSessionId) {
                      chatHistory.updateSessionTitle(chatSessionId, newTitle);
                    }
                  }}
                  className="p-1 rounded hover:bg-dark-surface-hover text-dark-text-muted hover:text-dark-text-heading transition-colors"
                >
                  <Check className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h2 className="text-dark-text-heading font-semibold text-lg">{headerText}</h2>
                {!displayDocName && (
                  <button
                    onClick={() => {
                      setEditTitleValue(customTitle || firstQuestion || "");
                      setIsEditingTitle(true);
                    }}
                    className="p-1 rounded hover:bg-dark-surface-hover text-dark-text-subtle hover:text-dark-text-heading transition-colors"
                    title="Edit title"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )}
            {displayDocName && (
              <p className="text-sm text-dark-text-muted">Uploaded {new Date().toLocaleDateString()}</p>
            )}
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="border-dark-border bg-transparent text-dark-text hover:bg-dark-surface-hover"
          onClick={() => fileInputRef.current?.click()}
        >
          <Plus className="h-4 w-4 mr-1.5" />
          New Document
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.txt,.md,.csv"
          className="hidden"
          onChange={(e) => {
            if (e.target.files) addDocuments(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {/* Agent Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {AGENTS.map((agent) => {
          const isExpanded = expandedAgent === agent.id;
          const msgs = agentMessages[agent.id] || [];
          const isThisLoading = loadingAgent === agent.id;
          const inputVal = agentInputs[agent.id] || "";

          if (isExpanded) {
            // Expanded card with chat
            return (
              <motion.div
                key={agent.id}
                layout
                className="col-span-1 md:col-span-2 rounded-xl overflow-hidden"
                style={{ background: agent.bgGradient, border: `1px solid ${agent.borderColor}` }}
                initial={{ opacity: 0.8 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {/* Card Header */}
                <div className="flex items-center justify-between p-5">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${agent.color}20` }}>
                      <agent.icon className="h-5 w-5" style={{ color: agent.color }} />
                    </div>
                    <div>
                     <h3 className="text-dark-text-heading font-semibold">{agent.label}</h3>
                      <p className="text-sm text-dark-text-hint">{agent.description}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setExpandedAgent(null)}
                    className="flex items-center gap-1.5 text-sm text-dark-text-muted hover:text-dark-text-heading transition-colors"
                  >
                    <X className="h-4 w-4" />
                    Close
                  </button>
                </div>

                {/* Chat Area */}
                <div className="px-5 min-h-[300px] max-h-[450px] overflow-y-auto scrollbar-thin">
                  {msgs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-4">
                      <div className="h-12 w-12 rounded-full flex items-center justify-center" style={{ backgroundColor: `${agent.color}25` }}>
                        <Sparkles className="h-6 w-6" style={{ color: agent.color }} />
                      </div>
                      <div className="text-center">
                         <p className="text-dark-text-heading font-medium">Ask about {agent.label.toLowerCase()}</p>
                        <p className="text-sm text-dark-text-muted mt-1">
                          Based on: {displayDocName || firstQuestion || "your input"}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {["generate", "insights", "summarize"].map((action) => (
                          <button
                            key={action}
                            onClick={() => handleQuickAction(agent.id, action)}
                            className="text-sm text-dark-text-hint hover:text-dark-text-heading transition-colors px-3 py-1.5 rounded-lg border border-dark-border hover:border-dark-border"
                          >
                            {action === "generate" ? `Generate ${agent.label.toLowerCase()}` :
                             action === "insights" ? `Key insights for ${agent.label.toLowerCase()}` :
                             `Summarize ${agent.label.toLowerCase()}`}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 pb-4">
                      <AnimatePresence>
                        {msgs.map((msg) => (
                          <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                          >
                            <div className="max-w-[85%]">
                              <div className={`rounded-xl px-4 py-3 text-sm leading-relaxed ${
                                msg.role === "user"
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-white text-gray-900"
                              }`}>
                                {msg.role === "assistant" ? <ArtifactMarkdown content={msg.content} /> : msg.content}
                              </div>
                              {msg.role === "assistant" && !isThisLoading && (
                                <MessageFeedback
                                  sessionId={sessionId}
                                  messageContent={msg.content}
                                  userQuery={msgs[msgs.indexOf(msg) - 1]?.content}
                                />
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                      {isThisLoading && (
                        <div className="flex justify-start">
                          <div className="bg-dark-surface px-4 py-3 rounded-xl flex items-center gap-2 text-sm text-dark-text-hint">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Thinking...
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>

                {/* Input */}
                <div className="p-4">
                  <div className="flex items-center gap-2 rounded-xl border border-dark-border bg-dark-input-bg-deep px-4 py-2">
                    <input
                      type="text"
                      value={inputVal}
                      onChange={(e) => setAgentInputs(prev => ({ ...prev, [agent.id]: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey && inputVal.trim() && !loadingAgent) {
                          e.preventDefault();
                          doSend(agent.id, inputVal.trim());
                        }
                      }}
                      placeholder={`Ask about ${agent.label.toLowerCase()}...`}
                      className="flex-1 bg-transparent text-sm text-dark-text-heading placeholder:text-dark-text-subtle focus:outline-none"
                    />
                    {isThisLoading ? (
                      <Button onClick={handleStop} size="icon" variant="outline" className="rounded-lg h-8 w-8 shrink-0">
                        <Square className="h-3 w-3" />
                      </Button>
                    ) : (
                      <Button
                        onClick={() => { if (inputVal.trim()) doSend(agent.id, inputVal.trim()); }}
                        disabled={!inputVal.trim()}
                        size="icon"
                        className="rounded-lg h-8 w-8 shrink-0"
                      >
                        <Send className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          }

          // Collapsed card
          return (
            <motion.div
              key={agent.id}
              layout
              className="rounded-xl p-5 cursor-pointer group transition-all"
              style={{ background: agent.bgGradient, border: `1px solid ${agent.borderColor}` }}
              onClick={() => setExpandedAgent(agent.id)}
              whileHover={{ scale: 1.01 }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${agent.color}20` }}>
                    <agent.icon className="h-5 w-5" style={{ color: agent.color }} />
                  </div>
                  <div>
                     <h3 className="text-dark-text-heading font-semibold">{agent.label}</h3>
                    <p className="text-sm text-dark-text-hint">{agent.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-dark-text-muted group-hover:text-dark-text-heading transition-colors">
                  <MessageCircle className="h-4 w-4" />
                  Chat
                </div>
              </div>
              <div className="mt-4 flex items-center gap-1.5 text-xs text-[hsl(0,0%,45%)]">
                <Sparkles className="h-3.5 w-3.5" />
                Click Chat to get AI insights
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
