"use client";

import { Children, isValidElement, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import rehypeSlug from "rehype-slug";
import { useTheme } from "next-themes";
import { Copy, FileText, ScrollText } from "lucide-react";
import dynamic from "next/dynamic";
import { toast } from "sonner";

import { Button } from "@/app/components/ui/button";
import { FontZoomToolbar } from "./zoom-controls";
import { useFontZoom } from "./use-font-zoom";
import { MermaidBlock } from "./mermaid-preview";

const MonacoPreview = dynamic(() => import("./code-preview").then((m) => m.MonacoPreview), {
  ssr: false,
  loading: () => <p className="p-6 text-caption text-muted-foreground">Loading editor…</p>,
});

/**
 * @param {string} className
 */
function languageFromClassName(className) {
  return /language-(\w+)/.exec(className || "")?.[1];
}

/**
 * Fenced / block code — replace <pre> so we can use a div toolbar (valid HTML).
 *
 * @param {{ children?: React.ReactNode }} props
 */
function MarkdownPre({ children }) {
  const child = Children.toArray(children).find((node) => isValidElement(node));
  if (!child || !isValidElement(child)) {
    return <pre>{children}</pre>;
  }

  const className = String(child.props.className ?? "");
  const language = languageFromClassName(className);
  const code = String(child.props.children ?? "").replace(/\n$/, "");

  if (language === "mermaid") {
    return <MermaidBlock code={code} />;
  }

  return (
    <div className="group relative my-4 overflow-hidden rounded-xl border bg-muted/40">
      <div className="flex items-center justify-between border-b bg-muted/60 px-3 py-1.5 text-caption text-muted-foreground">
        <span>{language || "code"}</span>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => {
            navigator.clipboard.writeText(code);
            toast.success("Copied");
          }}
          aria-label="Copy code block"
        >
          <Copy className="size-3.5" />
        </Button>
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-sm leading-relaxed">
        {child}
      </pre>
    </div>
  );
}

/**
 * Inline code only — block code is handled by MarkdownPre.
 *
 * @param {{ inline?: boolean; className?: string; children?: React.ReactNode }} props
 */
function MarkdownCode({ inline, className, children, ...props }) {
  if (inline) {
    return (
      <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em]" {...props}>
        {children}
      </code>
    );
  }

  return (
    <code className={className} {...props}>
      {children}
    </code>
  );
}

/**
 * Avoid <p> wrapping block-level code (invalid HTML / hydration errors).
 *
 * @param {{ node?: { children?: object[] }; children?: React.ReactNode }} props
 */
function MarkdownParagraph({ node, children, ...props }) {
  const child = node?.children?.[0];
  const isLoneCodeBlock =
    node?.children?.length === 1 &&
    child?.type === "element" &&
    child?.tagName === "code" &&
    (child?.properties?.className ?? []).some((value) => String(value).startsWith("language-"));

  if (isLoneCodeBlock) {
    return <div className="my-4">{children}</div>;
  }

  return <p {...props}>{children}</p>;
}

/**
 * @param {{ content: string; filename?: string }} props
 */
export function MarkdownPreview({ content, filename = "document.md" }) {
  const [mode, setMode] = useState("rendered");
  const { resolvedTheme } = useTheme();
  const { fontSize, zoomIn, zoomOut, reset } = useFontZoom({ initial: 16, min: 12, max: 24 });

  const markdownComponents = useMemo(
    () => ({
      pre: MarkdownPre,
      code: MarkdownCode,
      p: MarkdownParagraph,
      a: ({ href, children }) => (
        <a href={href} target="_blank" rel="noopener noreferrer" className="text-accent underline-offset-2 hover:underline">
          {children}
        </a>
      ),
      table: ({ children }) => (
        <div className="my-4 overflow-x-auto">
          <table className="w-full border-collapse text-sm">{children}</table>
        </div>
      ),
      th: ({ children }) => <th className="border bg-muted/50 px-3 py-2 text-left font-medium">{children}</th>,
      td: ({ children }) => <td className="border px-3 py-2 align-top">{children}</td>,
    }),
    [],
  );

  const headings = useMemo(() => {
    return content
      .split("\n")
      .filter((line) => /^#{1,3}\s/.test(line))
      .map((line) => {
        const level = line.match(/^#+/)?.[0].length || 1;
        const text = line.replace(/^#+\s*/, "").trim();
        const id = text.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
        return { level, text, id };
      });
  }, [content]);

  return (
    <div className="flex h-full min-h-[420px] flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b bg-muted/20 px-3 py-2">
        <Button type="button" size="sm" variant={mode === "rendered" ? "secondary" : "ghost"} onClick={() => setMode("rendered")}>
          <ScrollText aria-hidden="true" />
          Rendered
        </Button>
        <Button type="button" size="sm" variant={mode === "source" ? "secondary" : "ghost"} onClick={() => setMode("source")}>
          <FileText aria-hidden="true" />
          Source
        </Button>
        {mode === "rendered" ? (
          <FontZoomToolbar className="ml-auto" value={fontSize} onZoomIn={zoomIn} onZoomOut={zoomOut} onReset={reset} />
        ) : null}
      </div>
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {mode === "rendered" ? (
          <>
            {headings.length > 0 ? (
              <aside className="hidden w-52 shrink-0 overflow-y-auto border-r bg-muted/10 p-4 lg:block">
                <p className="mb-2 text-caption font-medium uppercase tracking-wide text-muted-foreground">Contents</p>
                <ul className="space-y-1 text-sm">
                  {headings.map((heading) => (
                    <li key={heading.id} style={{ paddingLeft: `${(heading.level - 1) * 8}px` }}>
                      <a href={`#${heading.id}`} className="text-muted-foreground hover:text-foreground">
                        {heading.text}
                      </a>
                    </li>
                  ))}
                </ul>
              </aside>
            ) : null}
            <article
              style={{ fontSize: `${fontSize}px` }}
              className={`document-prose min-w-0 flex-1 overflow-y-auto px-6 py-6 ${resolvedTheme === "dark" ? "document-prose-dark" : ""}`}
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSlug, rehypeSanitize]} components={markdownComponents}>
                {content}
              </ReactMarkdown>
            </article>
          </>
        ) : (
          <div className="min-h-0 flex-1">
            <MonacoPreview value={content} filename={filename} />
          </div>
        )}
      </div>
    </div>
  );
}
