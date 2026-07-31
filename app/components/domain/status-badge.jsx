import {
  Archive,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  CalendarClock,
  ChevronsUp,
  Circle,
  CircleCheck,
  CircleDashed,
  CircleX,
  Clock,
  Eye,
  Inbox,
  Minus,
  Pause,
  Play,
  Sparkles,
  SkipForward,
  TriangleAlert,
} from "lucide-react";

import { cn } from "@/app/lib/utils";
import { getStatusMeta } from "@/app/lib/status";

const ICONS = {
  alert: TriangleAlert,
  archive: Archive,
  calendar: CalendarClock,
  check: CircleCheck,
  circle: Circle,
  clock: Clock,
  "clock-alert": CalendarClock,
  cross: CircleX,
  draft: CircleDashed,
  eye: Eye,
  inbox: Inbox,
  pause: Pause,
  play: Play,
  progress: CircleDashed,
  "priority-low": ArrowDown,
  "priority-medium": ArrowRight,
  "priority-high": ArrowUp,
  "priority-urgent": ChevronsUp,
  skip: SkipForward,
  sparkle: Sparkles,
};

const TONE_CLASSES = {
  positive: "bg-tone-positive-bg text-tone-positive-fg border-tone-positive-border",
  caution: "bg-tone-caution-bg text-tone-caution-fg border-tone-caution-border",
  critical: "bg-tone-critical-bg text-tone-critical-fg border-tone-critical-border",
  info: "bg-tone-info-bg text-tone-info-fg border-tone-info-border",
  neutral: "bg-tone-neutral-bg text-tone-neutral-fg border-tone-neutral-border",
  accent: "bg-tone-accent-bg text-tone-accent-fg border-tone-accent-border",
};

const SIZE_CLASSES = {
  sm: "h-5 gap-1 px-1.5 text-[0.6875rem]",
  md: "h-6 gap-1.5 px-2 text-caption",
};

/**
 * Status pill driven entirely by `app/lib/status.js`. Always renders an icon
 * alongside the colour so the state survives a colour-blind or greyscale read.
 *
 * @param {{ kind: string, value: string, size?: 'sm' | 'md', showIcon?: boolean, className?: string }} props
 */
export function StatusBadge({ kind, value, size = "md", showIcon = true, className }) {
  const meta = getStatusMeta(kind, value);
  const Icon = ICONS[meta.icon] ?? Minus;

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border font-medium whitespace-nowrap",
        TONE_CLASSES[meta.tone],
        SIZE_CLASSES[size],
        className,
      )}
    >
      {showIcon ? <Icon aria-hidden="true" className="size-3.5 shrink-0" /> : null}
      {meta.label}
    </span>
  );
}
