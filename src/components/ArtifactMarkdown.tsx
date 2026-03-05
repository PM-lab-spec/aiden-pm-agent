import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import { Mail, Calendar, User, ArrowRight } from "lucide-react";

/**
 * Detects artifact type from content and wraps with appropriate styling.
 * Pure CSS/component approach — no extra AI calls.
 */

type ArtifactType = "stakeholder-update" | "roadmap" | "default";

function detectArtifactType(content: string): ArtifactType {
  const lower = content.toLowerCase();
  if (
    lower.includes("stakeholder update") ||
    lower.includes("subject:") ||
    lower.includes("dear stakeholder") ||
    lower.includes("hi team") ||
    lower.includes("update for")
  ) {
    return "stakeholder-update";
  }
  if (
    (lower.includes("## now") && lower.includes("## next")) ||
    (lower.includes("### now") && lower.includes("### next")) ||
    lower.includes("## roadmap")
  ) {
    return "roadmap";
  }
  return "default";
}

// --- Rich table renderer ---
const richComponents: Components = {
  table: ({ children, ...props }) => (
    <div className="my-4 overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm" {...props}>
        {children}
      </table>
    </div>
  ),
  thead: ({ children, ...props }) => (
    <thead className="bg-primary/10 text-foreground" {...props}>
      {children}
    </thead>
  ),
  th: ({ children, ...props }) => (
    <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-primary" {...props}>
      {children}
    </th>
  ),
  tr: ({ children, ...props }) => (
    <tr className="border-b border-border last:border-0 even:bg-muted/30 hover:bg-muted/50 transition-colors" {...props}>
      {children}
    </tr>
  ),
  td: ({ children, ...props }) => (
    <td className="px-4 py-2.5 text-foreground" {...props}>
      {children}
    </td>
  ),
  h1: ({ children, ...props }) => (
    <h1 className="text-xl font-bold text-foreground mt-6 mb-3 first:mt-0" {...props}>{children}</h1>
  ),
  h2: ({ children, ...props }) => (
    <h2 className="text-lg font-semibold text-foreground mt-5 mb-2 flex items-center gap-2" {...props}>
      <span className="w-1 h-5 rounded-full bg-primary inline-block" />
      {children}
    </h2>
  ),
  h3: ({ children, ...props }) => (
    <h3 className="text-base font-semibold text-foreground mt-4 mb-1.5" {...props}>{children}</h3>
  ),
  ul: ({ children, ...props }) => (
    <ul className="my-2 ml-1 space-y-1.5 list-none" {...props}>
      {children}
    </ul>
  ),
  li: ({ children, ...props }) => (
    <li className="flex items-start gap-2 text-foreground" {...props}>
      <ArrowRight className="h-3.5 w-3.5 mt-1 text-primary shrink-0" />
      <span>{children}</span>
    </li>
  ),
  strong: ({ children, ...props }) => (
    <strong className="font-semibold text-foreground" {...props}>{children}</strong>
  ),
  code: ({ children, className, ...props }) => {
    const isBlock = className?.includes("language-");
    if (isBlock) {
      return (
        <code className={`block bg-muted rounded-lg p-3 my-2 text-xs overflow-x-auto font-mono text-foreground ${className}`} {...props}>
          {children}
        </code>
      );
    }
    return (
      <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono text-primary" {...props}>
        {children}
      </code>
    );
  },
  blockquote: ({ children, ...props }) => (
    <blockquote className="border-l-3 border-primary bg-primary/5 pl-4 py-2 my-3 rounded-r-lg text-foreground italic" {...props}>
      {children}
    </blockquote>
  ),
};

// --- Email wrapper for stakeholder updates ---
function EmailWrapper({ content }: { content: string }) {
  // Try to extract subject line
  const subjectMatch = content.match(/\*?\*?subject:?\*?\*?\s*(.+)/i);
  const subject = subjectMatch?.[1]?.replace(/\*/g, "").trim() || "Stakeholder Update";

  // Remove the subject line from content for cleaner rendering
  const cleanContent = content.replace(/\*?\*?subject:?\*?\*?\s*.+\n?/i, "");

  return (
    <div className="my-3 rounded-xl border border-border overflow-hidden bg-card shadow-sm">
      {/* Email header */}
      <div className="bg-muted/50 px-5 py-3 border-b border-border space-y-1.5">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-primary" />
          <span className="font-semibold text-foreground text-sm">{subject}</span>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <User className="h-3 w-3" /> From: Product Team
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" /> {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </span>
        </div>
      </div>
      {/* Email body */}
      <div className="px-5 py-4 prose prose-sm max-w-none">
        <ReactMarkdown components={richComponents}>{cleanContent}</ReactMarkdown>
      </div>
      {/* Email footer */}
      <div className="bg-muted/30 px-5 py-2.5 border-t border-border">
        <p className="text-xs text-muted-foreground italic">
          Generated by Aiden • Product Management Assistant
        </p>
      </div>
    </div>
  );
}

// --- Roadmap with colored timeline markers ---
function RoadmapWrapper({ content }: { content: string }) {
  return (
    <div className="my-3">
      <ReactMarkdown
        components={{
          ...richComponents,
          h2: ({ children, ...props }) => {
            const text = String(children).toLowerCase();
            let color = "bg-primary";
            let label = "";
            if (text.includes("now")) { color = "bg-accent"; label = "🟢"; }
            else if (text.includes("next")) { color = "bg-warning"; label = "🟡"; }
            else if (text.includes("later")) { color = "bg-muted-foreground"; label = "🔵"; }
            else if (text.includes("roadmap")) { color = "bg-primary"; }

            return (
              <h2 className="text-lg font-semibold text-foreground mt-5 mb-2 flex items-center gap-2" {...props}>
                {label ? (
                  <>
                    <span className="text-base">{label}</span>
                    <span className={`w-1 h-5 rounded-full ${color} inline-block`} />
                  </>
                ) : (
                  <span className={`w-1 h-5 rounded-full ${color} inline-block`} />
                )}
                {children}
              </h2>
            );
          },
          h3: ({ children, ...props }) => {
            const text = String(children).toLowerCase();
            let label = "";
            let color = "bg-primary";
            if (text.includes("now")) { color = "bg-accent"; label = "🟢"; }
            else if (text.includes("next")) { color = "bg-warning"; label = "🟡"; }
            else if (text.includes("later")) { color = "bg-muted-foreground"; label = "🔵"; }

            return (
              <h3 className="text-base font-semibold text-foreground mt-4 mb-1.5 flex items-center gap-2" {...props}>
                {label && <span className="text-sm">{label}</span>}
                <span className={`w-0.5 h-4 rounded-full ${color} inline-block`} />
                {children}
              </h3>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

// --- Main component ---
export default function ArtifactMarkdown({ content }: { content: string }) {
  const type = detectArtifactType(content);

  if (type === "stakeholder-update") {
    return <EmailWrapper content={content} />;
  }

  if (type === "roadmap") {
    return <RoadmapWrapper content={content} />;
  }

  return (
    <div className="prose prose-sm max-w-none">
      <ReactMarkdown components={richComponents}>{content}</ReactMarkdown>
    </div>
  );
}
