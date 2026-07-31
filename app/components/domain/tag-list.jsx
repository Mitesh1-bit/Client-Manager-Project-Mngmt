import { cn } from "@/app/lib/utils";

const TONE_CLASSES = {
  positive: "bg-tone-positive-bg text-tone-positive-fg border-tone-positive-border",
  caution: "bg-tone-caution-bg text-tone-caution-fg border-tone-caution-border",
  critical: "bg-tone-critical-bg text-tone-critical-fg border-tone-critical-border",
  info: "bg-tone-info-bg text-tone-info-fg border-tone-info-border",
  accent: "bg-tone-accent-bg text-tone-accent-fg border-tone-accent-border",
  neutral: "bg-tone-neutral-bg text-tone-neutral-fg border-tone-neutral-border",
};

/**
 * Tags reuse the status tones rather than introducing a second colour system.
 * `Tag.color` holds a tone name; anything unrecognised falls back to neutral.
 *
 * @param {{ tags: Array<{ id: string, name: string, color?: string | null }>, max?: number, className?: string }} props
 */
export function TagList({ tags, max, className }) {
  if (!tags?.length) return null;
  const visible = max ? tags.slice(0, max) : tags;
  const overflow = tags.length - visible.length;

  return (
    <ul className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {visible.map((tag) => (
        <li key={tag.id}>
          <span
            className={cn(
              "inline-flex items-center rounded-md border px-1.5 py-0.5 text-[0.75rem] font-medium",
              TONE_CLASSES[tag.color] ?? TONE_CLASSES.neutral,
            )}
          >
            {tag.name}
          </span>
        </li>
      ))}
      {overflow > 0 ? (
        <li className="text-[0.75rem] text-muted-foreground">+{overflow} more</li>
      ) : null}
    </ul>
  );
}
