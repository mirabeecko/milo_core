import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

interface MarkdownProps {
  content: string;
  className?: string;
}

export function Markdown({ content, className }: MarkdownProps): JSX.Element {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      className={cn("prose prose-invert max-w-none", className)}
      components={{
        blockquote: ({ children, ...props }) => <ObsidianCallout {...props}>{children}</ObsidianCallout>,
        a: ({ children, href }) => (
          <a href={href} className="text-primary underline hover:text-primary/80">
            {children}
          </a>
        ),
        code: ({ children, className }) => (
          <code
            className={cn(
              "rounded bg-muted px-1.5 py-0.5 text-sm",
              className,
            )}
          >
            {children}
          </code>
        ),
        pre: ({ children }) => (
          <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-sm">{children}</pre>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

function ObsidianCallout({
  children,
}: {
  children?: React.ReactNode;
}): JSX.Element {
  const text = extractText(children);
  const callout = parseCallout(text);

  if (!callout) {
    return (
      <blockquote className="border-l-4 border-muted pl-4 italic text-muted-foreground">
        {children}
      </blockquote>
    );
  }

  const { type, title, body, collapsed } = callout;
  const styles = calloutStyles[type.toLowerCase()] ?? calloutStyles.info;

  return (
    <div
      className={cn(
        "my-4 rounded-lg border-l-4 p-4",
        styles.border,
        styles.bg,
      )}
    >
      <div className={cn("flex items-center gap-2 font-semibold", styles.text)}>
        <span>{styles.icon}</span>
        <span>{title || capitalize(type)}</span>
        {collapsed !== undefined && <span className="text-xs opacity-60">{collapsed ? "▸" : "▾"}</span>}
      </div>
      {body && (
        <div className={cn("mt-2 text-sm", styles.text)}>
          <Markdown content={body} />
        </div>
      )}
    </div>
  );
}

function extractText(node: React.ReactNode): string {
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (React.isValidElement(node) && node.props.children) {
    return extractText(node.props.children);
  }
  return "";
}

interface Callout {
  type: string;
  title: string;
  body: string;
  collapsed?: boolean;
}

function parseCallout(text: string): Callout | null {
  const match = text.trim().match(/^\[!?(\w+)\]([+-]?)\s*(.*?)\n?([\s\S]*)$/);
  if (!match) return null;

  const [, type, collapseIndicator, title, body] = match;
  return {
    type,
    title: title.trim(),
    body: body.trim(),
    collapsed: collapseIndicator === "+" ? true : collapseIndicator === "-" ? false : undefined,
  };
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

const calloutStyles: Record<
  string,
  { border: string; bg: string; text: string; icon: string }
> = {
  info: { border: "border-blue-500", bg: "bg-blue-500/10", text: "text-blue-200", icon: "ℹ️" },
  note: { border: "border-blue-500", bg: "bg-blue-500/10", text: "text-blue-200", icon: "📝" },
  tip: { border: "border-emerald-500", bg: "bg-emerald-500/10", text: "text-emerald-200", icon: "💡" },
  important: { border: "border-purple-500", bg: "bg-purple-500/10", text: "text-purple-200", icon: "🔑" },
  warning: { border: "border-amber-500", bg: "bg-amber-500/10", text: "text-amber-200", icon: "⚠️" },
  caution: { border: "border-rose-500", bg: "bg-rose-500/10", text: "text-rose-200", icon: "🛑" },
  danger: { border: "border-rose-500", bg: "bg-rose-500/10", text: "text-rose-200", icon: "⚡" },
  success: { border: "border-emerald-500", bg: "bg-emerald-500/10", text: "text-emerald-200", icon: "✅" },
  question: { border: "border-amber-500", bg: "bg-amber-500/10", text: "text-amber-200", icon: "❓" },
  quote: { border: "border-slate-500", bg: "bg-slate-500/10", text: "text-slate-200", icon: "💬" },
  example: { border: "border-purple-500", bg: "bg-purple-500/10", text: "text-purple-200", icon: "📋" },
};
