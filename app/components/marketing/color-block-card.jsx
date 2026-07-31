import { cn } from "@/app/lib/utils";

import { GridTexture } from "./grid-texture";

const BLOCK_BG = {
  lime: "bg-mkt-block-lime",
  coral: "bg-mkt-block-coral",
  sky: "bg-mkt-block-sky",
  sun: "bg-mkt-block-sun",
  pink: "bg-mkt-block-pink",
  navy: "bg-mkt-navy text-white",
};

export function ColorBlockCard({ tone = "lime", className, children, texture = true }) {
  return (
    <article
      className={cn(
        "relative overflow-hidden rounded-2xl p-6 md:p-8",
        BLOCK_BG[tone],
        tone === "navy" ? "text-white" : "text-mkt-navy",
        className,
      )}
    >
      {texture && tone !== "navy" ? <GridTexture tone={tone} /> : null}
      <div className="relative z-10">{children}</div>
    </article>
  );
}
