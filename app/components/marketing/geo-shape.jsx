import { cn } from "@/app/lib/utils";

const SHAPES = {
  triangle: "clip-triangle",
  circle: "rounded-full",
  sparkle: "",
};

export function GeoShape({ kind = "circle", tone = "pink", className, size = 48 }) {
  if (kind === "sparkle") {
    return (
      <svg
        aria-hidden
        width={size}
        height={size}
        viewBox="0 0 24 24"
        className={cn("text-mkt-pink", className)}
        fill="currentColor"
      >
        <path d="M12 0 14.5 9.5 24 12l-9.5 2.5L12 24l-2.5-9.5L0 12l9.5-2.5L12 0z" />
      </svg>
    );
  }

  return (
    <span
      aria-hidden
      className={cn(
        "inline-block",
        kind === "triangle" && "bg-mkt-coral",
        kind === "circle" && "bg-mkt-sky",
        SHAPES[kind],
        className,
      )}
      style={{
        width: size,
        height: size,
        clipPath: kind === "triangle" ? "polygon(50% 0%, 0% 100%, 100% 100%)" : undefined,
      }}
    />
  );
}
