import { Bot, ArrowRight, FileText, ListChecks, Map, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const FEATURES = [
  {
    icon: FileText,
    title: "Document Intelligence",
    desc: "Upload PRDs, feedback, research — Aiden reads and reasons over everything.",
  },
  {
    icon: ListChecks,
    title: "Artifact Generation",
    desc: "Generate PRDs, user stories, roadmaps, and experiment plans in seconds.",
  },
  {
    icon: Map,
    title: "Roadmap Insights",
    desc: "Turn scattered notes into prioritized Now / Next / Later roadmaps.",
  },
  {
    icon: Sparkles,
    title: "RAG-Powered",
    desc: "Every answer is grounded in your actual documents — no hallucinations.",
  },
];

export default function Index() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Nav */}
      <nav className="h-14 border-b border-border flex items-center justify-between px-6">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <Bot className="h-4.5 w-4.5 text-primary-foreground" />
          </div>
          <span className="font-bold text-foreground tracking-tight">Aiden</span>
        </div>
        <Button variant="hero" size="sm" onClick={() => navigate("/app")}>
          Open App
          <ArrowRight className="h-3.5 w-3.5 ml-1" />
        </Button>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium mb-6">
            <Sparkles className="h-3.5 w-3.5" />
            AI-Powered Product Management
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground tracking-tight leading-tight mb-4">
            Turn messy product info into{" "}
            <span className="text-gradient">structured outputs</span>
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-lg mx-auto">
            Upload documents, ask questions, and generate PRDs, user stories, roadmaps, and more — all grounded in your real data.
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="hero" size="lg" onClick={() => navigate("/app")}>
              Get Started
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
            <Button variant="outline" size="lg">
              Learn More
            </Button>
          </div>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-20 max-w-5xl w-full"
        >
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="surface-card p-5 hover:shadow-md transition-shadow"
            >
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground text-sm mb-1">{f.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 text-center">
        <p className="text-xs text-muted-foreground">
          Aiden — Open-source AI assistant for Product Managers
        </p>
      </footer>
    </div>
  );
}
