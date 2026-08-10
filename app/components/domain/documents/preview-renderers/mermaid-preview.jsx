"use client";

import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import { useTheme } from "next-themes";

import { ZoomableView } from "./zoom-controls";

/**
 * @param {{ source: string; standalone?: boolean }} props
 */
export function MermaidPreview({ source, standalone = false }) {
  const containerRef = useRef(null);
  const [error, setError] = useState(null);
  const [svg, setSvg] = useState("");
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    let cancelled = false;
    mermaid.initialize({
      startOnLoad: false,
      theme: resolvedTheme === "dark" ? "dark" : "default",
      securityLevel: "strict",
    });

    async function render() {
      try {
        const id = `mmd-${Math.random().toString(36).slice(2)}`;
        const { svg: rendered } = await mermaid.render(id, source);
        if (!cancelled) {
          setSvg(rendered);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not render diagram");
          setSvg("");
        }
      }
    }

    render();
    return () => {
      cancelled = true;
    };
  }, [source, resolvedTheme]);

  if (error) {
    return (
      <div className="rounded-xl border border-critical/30 bg-critical/5 p-4 text-sm text-critical">
        <p className="font-medium">Mermaid render error</p>
        <p className="mt-1 text-caption">{error}</p>
      </div>
    );
  }

  if (standalone) {
    return (
      <div ref={containerRef} className="h-full min-h-[360px]">
        <ZoomableView contentClassName="mermaid-diagram [&_svg]:max-w-none">
          <div dangerouslySetInnerHTML={{ __html: svg }} />
        </ZoomableView>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="my-4 overflow-x-auto rounded-xl border bg-muted/10 p-4">
      <div className="mermaid-diagram [&_svg]:max-w-none" dangerouslySetInnerHTML={{ __html: svg }} />
    </div>
  );
}

/**
 * @param {{ code: string }} props
 */
export function MermaidBlock({ code }) {
  return <MermaidPreview source={code} standalone={false} />;
}
