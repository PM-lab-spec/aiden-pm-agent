import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Target, FlaskConical, MessageSquare, TrendingUp, Download } from "lucide-react";
import { SAMPLE_TEMPLATES, TEMPLATE_CATEGORIES, type TemplateCategory } from "@/data/sampleTemplates";
import { toast } from "sonner";

const CATEGORY_ICONS: Record<TemplateCategory, typeof FileText> = {
  planning: Target,
  execution: FlaskConical,
  analysis: FileText,
  communication: MessageSquare,
  metrics: TrendingUp,
};

const CATEGORY_COLORS: Record<TemplateCategory, { accent: string; bg: string; border: string }> = {
  planning: {
    accent: "hsl(340 70% 50%)",
    bg: "linear-gradient(135deg, hsl(340 50% 18%), hsl(340 40% 12%))",
    border: "hsl(340 50% 25%)",
  },
  execution: {
    accent: "hsl(270 70% 60%)",
    bg: "linear-gradient(135deg, hsl(270 40% 18%), hsl(270 30% 12%))",
    border: "hsl(270 40% 25%)",
  },
  analysis: {
    accent: "hsl(200 70% 50%)",
    bg: "linear-gradient(135deg, hsl(200 40% 16%), hsl(200 30% 10%))",
    border: "hsl(200 40% 22%)",
  },
  communication: {
    accent: "hsl(160 70% 45%)",
    bg: "linear-gradient(135deg, hsl(160 40% 15%), hsl(160 30% 10%))",
    border: "hsl(160 40% 22%)",
  },
  metrics: {
    accent: "hsl(40 80% 50%)",
    bg: "linear-gradient(135deg, hsl(40 40% 16%), hsl(40 30% 10%))",
    border: "hsl(40 40% 22%)",
  },
};

function downloadTemplate(title: string, prompt: string) {
  const filename = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "") + ".md";
  const content = `# ${title}\n\n${prompt}\n`;
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function SampleTemplates() {
  const [activeCategory, setActiveCategory] = useState<TemplateCategory>("planning");

  const filtered = SAMPLE_TEMPLATES.filter((t) => t.category === activeCategory);
  const colors = CATEGORY_COLORS[activeCategory];

  return (
    <div>
      <h3
        className="text-xs font-semibold uppercase tracking-wider mb-4"
        style={{ color: "hsl(260 70% 60%)" }}
      >
        Sample Templates
      </h3>

      {/* Category pills */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {TEMPLATE_CATEGORIES.map((cat) => {
          const Icon = CATEGORY_ICONS[cat.id];
          const isActive = activeCategory === cat.id;
          const catColor = CATEGORY_COLORS[cat.id];
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
              style={{
                background: isActive ? catColor.accent : "hsl(0 0% 15%)",
                color: isActive ? "white" : "hsl(0 0% 60%)",
                border: `1px solid ${isActive ? catColor.accent : "hsl(0 0% 20%)"}`,
              }}
            >
              <Icon className="h-3 w-3" />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Template cards */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeCategory}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
          className="space-y-2"
        >
          {filtered.map((template, i) => (
            <motion.button
              key={template.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => onUseTemplate(template.prompt)}
              className="w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left group hover:scale-[1.01]"
              style={{
                background: colors.bg,
                border: `1px solid ${colors.border}`,
              }}
            >
              <div
                className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${colors.accent}20` }}
              >
                <FileText className="h-4 w-4" style={{ color: colors.accent }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-white">{template.title}</p>
                <p className="text-xs text-[hsl(0,0%,55%)] truncate">{template.description}</p>
              </div>
              <ArrowRight
                className="h-3.5 w-3.5 opacity-0 group-hover:opacity-60 transition-opacity shrink-0"
                style={{ color: colors.accent }}
              />
            </motion.button>
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
