"use client";

import Link from "next/link";

import { cn } from "@/app/lib/utils";

import { MktScaleViewport } from "./mkt-scale-viewport";
import { useMktMotion } from "./motion";

const ORBIT_MODULES = [
  { id: "companies", label: "Companies", fill: "#c5f042", dot: "bg-mkt-lime" },
  { id: "projects", label: "Projects", fill: "#4ec0e8", dot: "bg-mkt-sky" },
  { id: "change-requests", label: "Change requests", fill: "#ff6b5b", dot: "bg-mkt-coral" },
  { id: "portal", label: "Portal", fill: "#ffe24a", dot: "bg-mkt-sun" },
  { id: "retention", label: "Retention", fill: "#ff4d8d", dot: "bg-mkt-pink" },
];

const RADIUS = 178;
const PILL_HALF_W = 110;
const PILL_HALF_H = 28;
/** Room for pills + shadow while the carousel rotates */
const CANVAS_PAD = 32;
const ORBIT_EXTENT = RADIUS + Math.hypot(PILL_HALF_W, PILL_HALF_H) + CANVAS_PAD;
const CANVAS = Math.ceil(ORBIT_EXTENT * 2);
const CENTER = CANVAS / 2;

export const ORBIT_DURATION = 22;

function polar(index, total = ORBIT_MODULES.length) {
  const angle = ((360 / total) * index - 90) * (Math.PI / 180);
  return {
    x: CENTER + RADIUS * Math.cos(angle),
    y: CENTER + RADIUS * Math.sin(angle),
  };
}

const ORBIT_CIRCLE_PATH = `M ${CENTER} ${CENTER - RADIUS} A ${RADIUS} ${RADIUS} 0 1 1 ${CENTER - 0.01} ${CENTER - RADIUS}`;

function OrbitPill({ mod, index, active }) {
  const { x, y } = polar(index);

  return (
    <div className="absolute" style={{ left: x, top: y, width: 0, height: 0 }}>
      <div className={cn("mkt-orbit-pill-upright", active && "mkt-orbit-pill-upright--on")}>
        <Link
          href={`#${mod.id}`}
          className="absolute left-0 top-0 flex w-[min(220px,42vw)] max-w-[220px] -translate-x-1/2 -translate-y-1/2 items-center gap-2.5 rounded-2xl border border-mkt-navy/10 bg-white/95 px-3.5 py-2.5 shadow-lg shadow-mkt-navy/10 backdrop-blur-sm transition hover:border-mkt-navy/20 hover:shadow-xl sm:gap-3 sm:px-4 sm:py-3"
        >
          <span className={cn("size-3 shrink-0 rounded-full", mod.dot)} />
          <span className="min-w-0 truncate text-xs font-bold text-mkt-navy sm:text-sm">{mod.label}</span>
          <span className="ml-auto shrink-0 font-mono text-[0.6rem] text-mkt-navy/35">
            {String(index + 1).padStart(2, "0")}
          </span>
        </Link>
      </div>
    </div>
  );
}

/** Merry-go-round — same design on all breakpoints, scaled to fit viewport */
export function ProductHeroOrbit({ className }) {
  const { mounted } = useMktMotion();
  const active = mounted;

  return (
    <MktScaleViewport
      designWidth={CANVAS}
      designHeight={CANVAS}
      scaleBelow={768}
      className={cn("mx-auto max-w-full", className)}
      innerClassName="relative mx-auto overflow-visible"
    >
      <div
        className="relative overflow-visible"
        style={{
          width: CANVAS,
          height: CANVAS,
          "--orbit-duration": `${ORBIT_DURATION}s`,
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute rounded-full bg-gradient-to-br from-mkt-lime/18 via-mkt-sky/12 to-mkt-coral/12 blur-2xl"
          style={{
            left: CENTER - RADIUS,
            top: CENTER - RADIUS,
            width: RADIUS * 2,
            height: RADIUS * 2,
          }}
        />

        <div className="relative z-[1] size-full overflow-visible">
          <svg
            viewBox={`0 0 ${CANVAS} ${CANVAS}`}
            className="pointer-events-none absolute inset-0 size-full overflow-visible"
            aria-hidden
          >
            <defs>
              <linearGradient id="product-orbit-ring" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#c5f042" />
                <stop offset="25%" stopColor="#4ec0e8" />
                <stop offset="50%" stopColor="#ff6b5b" />
                <stop offset="75%" stopColor="#ffe24a" />
                <stop offset="100%" stopColor="#ff4d8d" />
              </linearGradient>
              <radialGradient id="product-orbit-energy" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="50%" stopColor="#4ec0e8" />
                <stop offset="100%" stopColor="#c5f042" stopOpacity={0.35} />
              </radialGradient>
              <filter id="product-orbit-energy-glow" x="-80%" y="-80%" width="260%" height="260%">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <circle cx={CENTER} cy={CENTER} r={RADIUS + 8} fill="none" stroke="#0a1550" strokeWidth={2} opacity={0.05} />
            <circle cx={CENTER} cy={CENTER} r={RADIUS - 8} fill="none" stroke="#0a1550" strokeWidth={1} opacity={0.04} />

            <circle
              cx={CENTER}
              cy={CENTER}
              r={RADIUS}
              fill="none"
              stroke="url(#product-orbit-ring)"
              strokeWidth={2}
              opacity={0.12}
            />

            {active ? (
              <g filter="url(#product-orbit-energy-glow)">
                <circle cx={0} cy={0} r={9} fill="url(#product-orbit-energy)" opacity={0.55}>
                  <animateMotion
                    dur={`${ORBIT_DURATION}s`}
                    repeatCount="indefinite"
                    path={ORBIT_CIRCLE_PATH}
                    calcMode="linear"
                  />
                </circle>
                <circle cx={0} cy={0} r={4} fill="#fff">
                  <animateMotion
                    dur={`${ORBIT_DURATION}s`}
                    repeatCount="indefinite"
                    path={ORBIT_CIRCLE_PATH}
                    calcMode="linear"
                  />
                </circle>
              </g>
            ) : null}
          </svg>

          <div
            className={cn(
              "mkt-orbit-carousel absolute overflow-visible",
              active && "mkt-orbit-carousel--on",
            )}
            style={{ inset: 0 }}
          >
            <svg
              viewBox={`0 0 ${CANVAS} ${CANVAS}`}
              className="pointer-events-none absolute inset-0 size-full overflow-visible"
              aria-hidden
            >
              {ORBIT_MODULES.map((mod, i) => {
                const { x, y } = polar(i);
                return (
                  <line
                    key={`spoke-${mod.id}`}
                    x1={CENTER}
                    y1={CENTER}
                    x2={x}
                    y2={y}
                    stroke={mod.fill}
                    strokeWidth={1.5}
                    opacity={0.2}
                  />
                );
              })}

              <circle
                cx={CENTER}
                cy={CENTER}
                r={RADIUS}
                fill="none"
                stroke="url(#product-orbit-ring)"
                strokeWidth={8}
                opacity={0.14}
              />
              <circle
                cx={CENTER}
                cy={CENTER}
                r={RADIUS}
                fill="none"
                stroke="url(#product-orbit-ring)"
                strokeWidth={3}
                strokeLinecap="round"
                strokeDasharray="5 11"
                className={active ? "mkt-orbit-flow-dashes" : undefined}
              />

              {ORBIT_MODULES.map((mod, i) => {
                const { x, y } = polar(i);
                return (
                  <g key={`dot-${mod.id}`}>
                    <circle cx={x} cy={y} r={7} fill={mod.fill} opacity={0.3} />
                    <circle cx={x} cy={y} r={4.5} fill={mod.fill} stroke="#0a1550" strokeWidth={1.5} />
                  </g>
                );
              })}
            </svg>

            {ORBIT_MODULES.map((mod, i) => (
              <OrbitPill key={mod.id} mod={mod} index={i} active={active} />
            ))}
          </div>

          <div
            className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-1/2"
            style={{ left: CENTER, top: CENTER }}
          >
            <div
              className={cn(
                "absolute left-1/2 top-1/2 size-[6.75rem] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-dashed border-mkt-navy/12",
                active && "mkt-orbit-hub-ring--on",
              )}
              aria-hidden
            />
            <div className="relative flex size-[5.75rem] flex-col items-center justify-center rounded-full border border-mkt-navy/10 bg-white/95 text-center shadow-lg shadow-mkt-navy/10 backdrop-blur-sm">
              <span className="font-mono text-[0.55rem] uppercase tracking-[0.2em] text-mkt-navy/40">Stack</span>
              <span className="font-mkt-display text-2xl leading-none text-mkt-navy">5</span>
              <span className="mt-0.5 text-[0.6rem] font-semibold text-mkt-navy/50">modules</span>
            </div>
          </div>
        </div>
      </div>
    </MktScaleViewport>
  );
}
