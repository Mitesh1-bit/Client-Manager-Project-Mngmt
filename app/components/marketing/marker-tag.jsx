import { cn } from "@/app/lib/utils";

const MARKER_BG = {
  lime: "bg-mkt-lime",
  coral: "bg-mkt-coral",
  sun: "bg-mkt-sun",
  pink: "bg-mkt-pink",
  sky: "bg-mkt-sky",
  cta: "bg-mkt-cta text-white",
};

export function MarkerTag({ children, tone = "sun", className }) {
  return (
    <span
      className={cn(
        "inline-block px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-mkt-navy",
        MARKER_BG[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
