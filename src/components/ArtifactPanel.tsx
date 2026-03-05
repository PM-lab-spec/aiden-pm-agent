import { FileText, ListChecks, Map, BarChart3, Mail } from "lucide-react";
import { motion } from "framer-motion";

const ARTIFACTS = [
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
    id: "roadmap",
    label: "Roadmap",
    description: "Now, Next, Later priorities",
    icon: Map,
    color: "hsl(200 70% 50%)",
    bgGradient: "linear-gradient(135deg, hsl(200 40% 16%), hsl(200 30% 10%))",
    borderColor: "hsl(200 40% 22%)",
  },
  {
    id: "metrics",
    label: "Metrics Plan",
    description: "KPIs & experiment design",
    icon: BarChart3,
    color: "hsl(40 80% 50%)",
    bgGradient: "linear-gradient(135deg, hsl(40 40% 16%), hsl(40 30% 10%))",
    borderColor: "hsl(40 40% 22%)",
  },
  {
    id: "update",
    label: "Stakeholder Update",
    description: "Weekly status summary",
    icon: Mail,
    color: "hsl(160 70% 45%)",
    bgGradient: "linear-gradient(135deg, hsl(160 40% 15%), hsl(160 30% 10%))",
    borderColor: "hsl(160 40% 22%)",
  },
];

interface ArtifactPanelProps {
  onGenerate: (artifactId: string, prompt: string) => void;
}

export default function ArtifactPanel({ onGenerate }: ArtifactPanelProps) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: "hsl(260 70% 60%)" }}>
        Generate Artifacts
      </h3>
      <div className="space-y-2">
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
              className="w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left group hover:scale-[1.01]"
              style={{
                background: artifact.bgGradient,
                border: `1px solid ${artifact.borderColor}`,
              }}
            >
              <div
                className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${artifact.color}20` }}
              >
                <artifact.icon className="h-4.5 w-4.5" style={{ color: artifact.color }} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-white">{artifact.label}</p>
                <p className="text-xs text-[hsl(0,0%,55%)] truncate">{artifact.description}</p>
              </div>
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
