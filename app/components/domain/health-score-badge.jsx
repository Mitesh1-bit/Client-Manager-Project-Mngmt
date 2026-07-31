import { ArrowDownRight, ArrowRight, ArrowUpRight, Minus } from "lucide-react";

import { getHealthBand, getHealthTrend } from "@/app/lib/status";
import { cn } from "@/app/lib/utils";

const TONE_CLASSES = {
  positive: "bg-tone-positive-bg text-tone-positive-fg border-tone-positive-border",
  caution: "bg-tone-caution-bg text-tone-caution-fg border-tone-caution-border",
  critical: "bg-tone-critical-bg text-tone-critical-fg border-tone-critical-border",
  neutral: "bg-tone-neutral-bg text-tone-neutral-fg border-tone-neutral-border",
};

const STROKE = {
  positive: "var(--tone-positive)",
  caution: "var(--tone-caution)",
  critical: "var(--tone-critical)",
  neutral: "var(--tone-neutral)",
};

const TREND_ICON = { up: ArrowUpRight, down: ArrowDownRight, flat: ArrowRight };
const TREND_LABEL = { up: "trending up", down: "trending down", flat: "steady" };

/**
 * Health score read at a glance: the number, the band it falls in, which way
 * it's moving, and the shape of the last few readings.
 *
 * The band label and the trend arrow both carry the meaning, so the colour is
 * reinforcement rather than the only signal.
 *
 * @param {{ score: number | null, history?: number[], size?: 'sm' | 'md' | 'lg', showSparkline?: boolean, className?: string }} props
 */
export function HealthScoreBadge({
  score,
  history = [],
  size = "md",
  showSparkline = true,
  className,
}) {
  const band = getHealthBand(score);
  const trend = getHealthTrend(history);
  const hasScore = score !== null && score !== undefined;
  // With fewer than two readings there is no direction to report — showing a
  // flat arrow would assert something we don't know.
  const hasTrend = hasScore && history.length > 1;
  const TrendIcon = hasScore ? TREND_ICON[trend.direction] : Minus;

  if (size === "sm") {
    return (
      <span
        className={cn(
          "tabular inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-caption font-medium",
          TONE_CLASSES[band.tone],
          className,
        )}
      >
        {score ?? "—"}
        {hasTrend ? <TrendIcon aria-hidden="true" className="size-3.5" /> : null}
        <span className="sr-only">
          {band.label}
          {hasTrend ? `, ${TREND_LABEL[trend.direction]}` : ""}
        </span>
      </span>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border px-3 py-2.5",
        TONE_CLASSES[band.tone],
        className,
      )}
    >
      <div className="flex flex-col leading-none">
        <span className={cn("tabular font-semibold", size === "lg" ? "text-title" : "text-heading")}>
          {score ?? "—"}
        </span>
        <span className="mt-1 text-[0.6875rem] font-medium opacity-80">{band.label}</span>
      </div>

      {showSparkline && history.length > 1 ? (
        <Sparkline values={history} stroke={STROKE[band.tone]} />
      ) : null}

      {hasTrend ? (
        <span className="flex items-center gap-0.5 text-caption font-medium">
          <TrendIcon aria-hidden="true" className="size-4" />
          {trend.delta !== 0 ? (
            <span className="tabular">
              {trend.delta > 0 ? "+" : ""}
              {trend.delta}
            </span>
          ) : null}
          <span className="sr-only">{TREND_LABEL[trend.direction]} since the last reading</span>
        </span>
      ) : null}
    </div>
  );
}

function Sparkline({ values, stroke, width = 64, height = 24 }) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const step = width / (values.length - 1);

  const points = values.map((value, index) => {
    const x = index * step;
    const y = height - ((value - min) / range) * (height - 4) - 2;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
      focusable="false"
      className="shrink-0 overflow-visible"
    >
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={points.at(-1).split(",")[0]}
        cy={points.at(-1).split(",")[1]}
        r="2.25"
        fill={stroke}
      />
    </svg>
  );
}
