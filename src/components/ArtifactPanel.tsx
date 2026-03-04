import { FileText, ListChecks, Map, BarChart3, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const ARTIFACTS = [
  {
    id: "prd",
    label: "PRD",
    description: "Product Requirements Document",
    icon: FileText,
  },
  {
    id: "stories",
    label: "User Stories",
    description: "Epics, stories & acceptance criteria",
    icon: ListChecks,
  },
  {
    id: "roadmap",
    label: "Roadmap",
    description: "Now, Next, Later priorities",
    icon: Map,
  },
  {
    id: "metrics",
    label: "Metrics Plan",
    description: "KPIs & experiment design",
    icon: BarChart3,
  },
  {
    id: "update",
    label: "Stakeholder Update",
    description: "Weekly status summary",
    icon: Mail,
  },
];

interface ArtifactPanelProps {
  onGenerate: (artifactId: string, prompt: string) => void;
}

export default function ArtifactPanel({ onGenerate }: ArtifactPanelProps) {
  return (
    <div className="p-4 border-b border-border">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
        Generate Artifacts
      </h3>
      <div className="space-y-1.5">
        {ARTIFACTS.map((artifact, i) => (
          <motion.div
            key={artifact.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <button
              onClick={() =>
                onGenerate(artifact.id, `Generate a ${artifact.label} based on uploaded documents`)
              }
              className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-secondary/50 transition-colors text-left group"
            >
              <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
                <artifact.icon className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{artifact.label}</p>
                <p className="text-xs text-muted-foreground truncate">{artifact.description}</p>
              </div>
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
