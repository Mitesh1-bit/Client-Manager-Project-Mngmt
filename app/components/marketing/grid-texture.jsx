import { cn } from "@/app/lib/utils";

const TEXTURES = {
  lime: "rgba(10, 21, 80, 0.08)",
  coral: "rgba(10, 21, 80, 0.1)",
  sky: "rgba(10, 21, 80, 0.08)",
  sun: "rgba(10, 21, 80, 0.1)",
  pink: "rgba(255, 77, 141, 0.15)",
  navy: "rgba(255, 255, 255, 0.12)",
};

export function GridTexture({ tone = "lime", className }) {
  const line = TEXTURES[tone] || TEXTURES.lime;
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0", className)}
      style={{
        backgroundImage: `
          linear-gradient(${line} 1px, transparent 1px),
          linear-gradient(90deg, ${line} 1px, transparent 1px)
        `,
        backgroundSize: "24px 24px",
      }}
    />
  );
}
