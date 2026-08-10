"use client";

import Editor from "@monaco-editor/react";
import { useTheme } from "next-themes";
import { Copy, WrapText } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/app/components/ui/button";
import { useClientPreference } from "@/app/lib/hooks/use-client-preference";
import { extensionOf } from "@/app/lib/documents/category";
import { languageLabelForFile, monacoLanguageForFile } from "@/app/lib/documents/language-map";
import { FontZoomToolbar } from "./zoom-controls";
import { useFontZoom } from "./use-font-zoom";

const WORD_WRAP_KEY = "document-viewer-word-wrap";

/**
 * @param {{ value: string; filename?: string; readOnly?: boolean }} props
 */
export function MonacoPreview({ value, filename = "file.txt", readOnly = true }) {
  const { resolvedTheme } = useTheme();
  const [wordWrap, setWordWrap] = useClientPreference(() => {
    const stored = localStorage.getItem(WORD_WRAP_KEY);
    return stored == null ? true : stored === "true";
  }, true);
  const { fontSize, zoomIn, zoomOut, reset } = useFontZoom({ initial: 13, min: 10, max: 24 });

  function toggleWrap() {
    setWordWrap((current) => {
      const next = !current;
      localStorage.setItem(WORD_WRAP_KEY, String(next));
      return next;
    });
  }

  const ext = extensionOf(filename);
  const isEnv = ext === ".env" || filename.startsWith(".env");

  return (
    <div className="flex h-full min-h-[360px] flex-col">
      {isEnv ? (
        <div className="border-b border-caution/30 bg-caution/10 px-4 py-2 text-sm text-caution">
          This file may contain secrets. Do not share preview links publicly.
        </div>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/20 px-3 py-2">
        <span className="text-caption text-muted-foreground">{languageLabelForFile(filename)} · Read-only</span>
        <div className="flex flex-wrap items-center gap-1">
          <FontZoomToolbar value={fontSize} onZoomIn={zoomIn} onZoomOut={zoomOut} onReset={reset} />
          <Button type="button" variant="ghost" size="sm" onClick={toggleWrap}>
            <WrapText aria-hidden="true" />
            {wordWrap ? "Wrap on" : "Wrap off"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              navigator.clipboard.writeText(value);
              toast.success("Copied to clipboard");
            }}
          >
            <Copy aria-hidden="true" />
            Copy
          </Button>
        </div>
      </div>
      <div className="min-h-0 flex-1">
        <Editor
          height="100%"
          language={monacoLanguageForFile(filename)}
          value={value}
          theme={resolvedTheme === "dark" ? "vs-dark" : "vs"}
          loading={<div className="flex h-full min-h-[240px] items-center justify-center text-caption text-muted-foreground">Loading editor…</div>}
          options={{
            readOnly,
            minimap: { enabled: value.length < 120_000 },
            scrollBeyondLastLine: false,
            fontSize,
            lineNumbers: "on",
            wordWrap: wordWrap ? "on" : "off",
            automaticLayout: true,
            folding: true,
            padding: { top: 12 },
            renderLineHighlight: "line",
            bracketPairColorization: { enabled: true },
            largeFileOptimizations: value.length > 50_000,
            mouseWheelZoom: false,
          }}
        />
      </div>
      <div className="border-t px-4 py-2 text-caption text-muted-foreground">
        UTF-8 · {value.split("\n").length} lines
      </div>
    </div>
  );
}
