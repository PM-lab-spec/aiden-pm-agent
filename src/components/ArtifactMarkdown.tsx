import { forwardRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import type { Components } from "react-markdown";
import { Mail, Calendar, User, Copy, Send } from "lucide-react";

type ArtifactType = "stakeholder-update" | "default";

function detectArtifactType(content: string): ArtifactType {
  const lower = content.toLowerCase();
  const lines = lower.split("\n").slice(0, 8);
  const header = lines.join(" ");

  if (
    header.includes("stakeholder update") ||
    (header.includes("subject:") && header.includes("stakeholder"))
  ) {
    return "stakeholder-update";
  }

  return "default";
}

const remarkPlugins = [remarkGfm];
const rehypePlugins = [rehypeRaw];

const richComponents: Components = {
  table: ({ children, ...props }) => (
    <div className="my-5 overflow-x-auto rounded-lg bg-card">
      <table className="w-full text-sm border-collapse" {...props}>
        {children}
      </table>
    </div>
  ),
  thead: ({ children, ...props }) => (
    <thead className="bg-muted/80" {...props}>
      {children}
    </thead>
  ),
  th: ({ children, ...props }) => (
    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground" {...props}>
      {children}
    </th>
  ),
  tr: ({ children, ...props }) => (
    <tr className="border-b border-border/50 last:border-0" {...props}>
      {children}
    </tr>
  ),
  td: ({ children, ...props }) => (
    <td className="px-5 py-4 text-foreground align-top leading-relaxed" {...props}>
      {children}
    </td>
  ),
  h1: ({ children, ...props }) => (
    <h1 className="text-xl font-bold text-foreground mt-6 mb-3 first:mt-0" {...props}>{children}</h1>
  ),
  h2: ({ children, ...props }) => (
    <h2 className="text-lg font-semibold text-foreground mt-5 mb-2" {...props}>{children}</h2>
  ),
  h3: ({ children, ...props }) => (
    <h3 className="text-base font-semibold text-foreground mt-4 mb-1.5" {...props}>{children}</h3>
  ),
  ul: ({ children, ...props }) => (
    <ul className="my-2 ml-5 space-y-1 list-disc" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }) => (
    <ol className="my-2 ml-5 space-y-1 list-decimal" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }) => (
    <li className="text-foreground leading-relaxed" {...props}>
      {children}
    </li>
  ),
  strong: ({ children, ...props }) => (
    <strong className="font-semibold text-foreground" {...props}>{children}</strong>
  ),
  p: ({ children, ...props }) => (
    <p className="my-1.5 text-foreground leading-relaxed" {...props}>{children}</p>
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

function EmailWrapper({ content }: { content: string }) {
  const subjectMatch = content.match(/\*?\*?subject:?\*?\*?\s*(.+)/i);
  const subject = subjectMatch?.[1]?.replace(/\*/g, "").trim() || "Stakeholder Update";
  const cleanContent = content.replace(/\*?\*?subject:?\*?\*?\s*.+\n?/i, "");

  return (
    <div className="my-3 rounded-xl border border-border overflow-hidden bg-card shadow-sm">
      <div className="flex items-center justify-between bg-muted/50 px-5 py-2.5 border-b border-border">
        <span className="text-xs text-muted-foreground font-medium">Email</span>
        <div className="flex items-center gap-2">
          <button className="text-muted-foreground hover:text-foreground transition-colors">
            <Copy className="h-3.5 w-3.5" />
          </button>
          <button className="text-muted-foreground hover:text-foreground transition-colors">
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <div className="px-5 py-3 border-b border-border">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground font-medium">Subject</span>
          <span className="text-foreground">{subject}</span>
        </div>
      </div>
      <div className="px-5 py-4 border-b border-border">
        <ReactMarkdown components={richComponents} remarkPlugins={remarkPlugins} rehypePlugins={rehypePlugins}>{cleanContent}</ReactMarkdown>
      </div>
    </div>
  );
}

const ArtifactMarkdown = forwardRef<HTMLDivElement, { content: string }>(function ArtifactMarkdown(
  { content },
  ref,
) {
  const type = detectArtifactType(content);

  if (type === "stakeholder-update") {
    return (
      <div ref={ref}>
        <EmailWrapper content={content} />
      </div>
    );
  }

  return (
    <div ref={ref}>
      <ReactMarkdown components={richComponents} remarkPlugins={remarkPlugins} rehypePlugins={rehypePlugins}>{content}</ReactMarkdown>
    </div>
  );
});

export default ArtifactMarkdown;
