"use client";

import { useCallback, useEffect, useRef } from "react";

import { cn } from "@/app/lib/utils";

import { useMktMotion } from "./motion";

/**
 * Jasper-style interactive grid — cells near the cursor fade to blank,
 * then slowly fill back in like a sudoku board clearing under the pointer.
 */
export function InteractiveGrid({
  cols = 16,
  rows = 14,
  cellSize = 22,
  fill = "#c5f042",
  stroke = "rgba(10, 21, 80, 0.14)",
  radius = 72,
  fadeSpeed = 0.14,
  className,
  style,
  interactive = true,
}) {
  const { mounted } = useMktMotion();
  const containerRef = useRef(null);
  const cellRefs = useRef([]);
  const opacities = useRef(new Float32Array(cols * rows).fill(1));
  const mouse = useRef({ x: -9999, y: -9999, active: false });
  const raf = useRef(0);

  const width = cols * cellSize;
  const height = rows * cellSize;

  const handleMove = useCallback(
    (e) => {
      if (!interactive || !mounted) return;
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      mouse.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        active: true,
      };
    },
    [interactive, mounted],
  );

  const handleLeave = useCallback(() => {
    mouse.current = { x: -9999, y: -9999, active: false };
  }, []);

  useEffect(() => {
    if (!interactive || !mounted) return undefined;

    const tick = () => {
      const { x, y, active } = mouse.current;
      const r2 = radius * radius;

      for (let row = 0; row < rows; row += 1) {
        for (let col = 0; col < cols; col += 1) {
          const i = row * cols + col;
          const cx = col * cellSize + cellSize / 2;
          const cy = row * cellSize + cellSize / 2;
          const dx = x - cx;
          const dy = y - cy;
          const near = active && dx * dx + dy * dy < r2;
          const target = near ? 0 : 1;
          const prev = opacities.current[i];
          const next = prev + (target - prev) * fadeSpeed;
          opacities.current[i] = next;

          const cell = cellRefs.current[i];
          if (cell) {
            cell.style.opacity = String(next);
          }
        }
      }

      raf.current = requestAnimationFrame(tick);
    };

    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [mounted, interactive, cols, rows, cellSize, radius, fadeSpeed]);

  return (
    <div
      ref={containerRef}
      className={cn("relative select-none", className)}
      style={{ width, height, ...style }}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      aria-hidden
    >
      <div
        className="grid h-full w-full"
        style={{
          gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
          gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
        }}
      >
        {Array.from({ length: cols * rows }, (_, i) => (
          <div
            key={i}
            ref={(el) => {
              cellRefs.current[i] = el;
            }}
            className="transition-none"
            style={{
              width: cellSize,
              height: cellSize,
              backgroundColor: fill,
              boxShadow: `inset 0 0 0 1px ${stroke}`,
              opacity: 1,
            }}
          />
        ))}
      </div>
    </div>
  );
}

/** Stepped skyline silhouette — Jasper hero block shape */
export const STEPPED_GRID_CLIP =
  "polygon(0% 100%, 0% 35%, 18% 35%, 18% 18%, 38% 18%, 38% 0%, 62% 0%, 62% 22%, 82% 22%, 82% 42%, 100% 42%, 100% 100%)";

export function SteppedInteractiveGrid({
  className,
  cellSize = 20,
  cols = 18,
  rows = 16,
  ...props
}) {
  return (
    <div className={cn("overflow-hidden", className)} style={{ clipPath: STEPPED_GRID_CLIP }}>
      <InteractiveGrid
        cellSize={cellSize}
        fill="#c5f042"
        radius={64}
        cols={cols}
        rows={rows}
        {...props}
      />
    </div>
  );
}

/** Full-bleed subtle background grid for hero sections */
export function HeroBackgroundGrid({ className }) {
  const { mounted } = useMktMotion();

  if (!mounted) {
    return (
      <div
        aria-hidden
        className={cn("pointer-events-none absolute inset-0 opacity-[0.25]", className)}
        style={{
          backgroundImage: `
            linear-gradient(rgba(10,21,80,0.07) 1px, transparent 1px),
            linear-gradient(90deg, rgba(10,21,80,0.07) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />
    );
  }

  return (
    <div className={cn("absolute inset-0 overflow-hidden opacity-50", className)}>
      <InteractiveGrid
        cols={40}
        rows={22}
        cellSize={36}
        fill="rgba(197, 240, 66, 0.06)"
        stroke="rgba(10, 21, 80, 0.06)"
        radius={48}
        fadeSpeed={0.12}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        interactive
      />
    </div>
  );
}
