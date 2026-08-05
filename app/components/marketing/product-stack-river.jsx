"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/app/lib/utils";

import { MKT_EASE, Reveal, useMktInView, useMktMotion } from "./motion";
import { MktScaleViewport } from "./mkt-scale-viewport";

const RIVER_PATH = "M 40 100 Q 200 40 400 100 T 760 100";
const DRAW_DURATION = 2.8;
const TRAVEL_DURATION = 5.2;
const TRAVEL_BEGIN = DRAW_DURATION + 0.35;

const NODES = [
  { id: "companies", label: "Companies", x: 80, fill: "#c5f042", tag: "root", chip: "ACCT" },
  { id: "projects", label: "Projects", x: 240, fill: "#4ec0e8", tag: "delivery", chip: "PRJ" },
  { id: "change-requests", label: "Change requests", x: 400, fill: "#ff6b5b", tag: "control", chip: "CR" },
  { id: "portal", label: "Portal", x: 560, fill: "#ffe24a", tag: "client", chip: "PRT" },
  { id: "retention", label: "Retention", x: 720, fill: "#ff4d8d", tag: "renewal", chip: "RTN" },
];

const FLOAT_PARTICLES = [
  { x: "8%", y: "18%", delay: 0, size: 4 },
  { x: "22%", y: "72%", delay: 0.8, size: 3 },
  { x: "45%", y: "12%", delay: 1.4, size: 5 },
  { x: "68%", y: "65%", delay: 0.4, size: 3 },
  { x: "88%", y: "28%", delay: 1.1, size: 4 },
  { x: "55%", y: "78%", delay: 1.8, size: 2 },
];

const DATA_TAGS = [
  { text: "sync.record", offset: 0 },
  { text: "handoff.ok", offset: 1.7 },
  { text: "audit.trail", offset: 3.4 },
];

const HANDOFF_TICKER = [
  "companies.record → projects.spawn",
  "projects.milestone → cr.open",
  "cr.approved → portal.notify",
  "portal.signed → retention.queue",
  "retention.renewal → companies.expand",
];

function nodeDelay(index) {
  return 0.2 + index * (DRAW_DURATION / NODES.length) * 0.78;
}

function nodePulseDelay(index) {
  return TRAVEL_BEGIN + index * 1.0;
}

function RiverAmbient({ play }) {
  if (!play) return null;

  return (
    <>
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[1.75rem]" aria-hidden>
        <div className="mkt-river-scan absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-mkt-sky/60 to-transparent" />
        {FLOAT_PARTICLES.map((p) => (
          <span
            key={`${p.x}-${p.y}`}
            className="mkt-river-particle absolute rounded-full bg-mkt-navy/20"
            style={{
              left: p.x,
              top: p.y,
              width: p.size,
              height: p.size,
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}
      </div>

      <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-2 rounded-full border border-mkt-navy/10 bg-white/80 px-3 py-1.5 font-mono text-[0.6rem] uppercase tracking-wider text-mkt-navy/55 shadow-sm backdrop-blur-sm md:left-6 md:top-6">
        <span className="mkt-river-live-dot size-1.5 rounded-full bg-mkt-lime" />
        Live graph
      </div>

      <div className="pointer-events-none absolute right-3 top-3 font-mono text-[0.5rem] text-mkt-navy/40 sm:right-6 sm:top-6 sm:text-[0.6rem]">
        <span className="mkt-river-typing">latency · 12ms</span>
      </div>

      <div className="pointer-events-none absolute bottom-14 left-2 right-2 flex items-end justify-between gap-2 sm:bottom-20 sm:left-6 sm:right-6">
        <div className="rounded-lg border border-mkt-navy/8 bg-white/70 px-2 py-1 font-mono text-[0.48rem] text-mkt-navy/45 backdrop-blur-sm sm:px-2.5 sm:py-1.5 sm:text-[0.58rem]">
          <span className="text-mkt-sky">→</span> 5 modules · 1 record graph
        </div>
        <div className="rounded-lg border border-mkt-navy/8 bg-white/70 px-2 py-1 font-mono text-[0.48rem] text-mkt-navy/45 backdrop-blur-sm sm:px-2.5 sm:py-1.5 sm:text-[0.58rem]">
          handoff.sync<span className="mkt-river-blink">_</span>
        </div>
      </div>
    </>
  );
}

function EnergyPacket({ begin, reduce, reverse }) {
  if (reduce) return null;

  const dur = reverse ? TRAVEL_DURATION * 1.35 : TRAVEL_DURATION;
  const trail = reverse ? [0, 0.15] : [0, 0.1, 0.22, 0.36];

  return (
    <g filter={reverse ? undefined : "url(#product-energy-glow)"} opacity={reverse ? 0.4 : 1}>
      {trail.map((offset, i) => (
        <circle
          key={`${reverse}-${offset}`}
          cx={0}
          cy={0}
          r={(reverse ? 7 : 14) - i * 3}
          fill={reverse ? "#4ec0e8" : "url(#product-energy-ball)"}
          opacity={0.45 - i * 0.1}
        >
          <animateMotion
            dur={`${dur}s`}
            repeatCount="indefinite"
            begin={`${begin + offset}s`}
            path={RIVER_PATH}
            keyPoints={reverse ? "1;0" : "0;1"}
            keyTimes="0;1"
            calcMode="linear"
          />
        </circle>
      ))}
      {!reverse ? (
        <>
          <circle cx={0} cy={0} r={5.5} fill="#fff">
            <animateMotion dur={`${dur}s`} repeatCount="indefinite" begin={`${begin}s`} path={RIVER_PATH} calcMode="linear" />
          </circle>
          <circle cx={0} cy={0} r={2.5} fill="#0a1550">
            <animateMotion dur={`${dur}s`} repeatCount="indefinite" begin={`${begin}s`} path={RIVER_PATH} calcMode="linear" />
          </circle>
        </>
      ) : null}
    </g>
  );
}

function RiverDataTags({ begin, reduce }) {
  if (reduce) return null;

  return (
    <g className="font-mono" style={{ fontSize: "8px" }}>
      {DATA_TAGS.map((tag) => (
        <text key={tag.text} fill="#0a1550" opacity={0.45} dy={-12}>
          <animateMotion
            dur={`${TRAVEL_DURATION}s`}
            repeatCount="indefinite"
            begin={`${begin + tag.offset}s`}
            path={RIVER_PATH}
            calcMode="linear"
          />
          <tspan>{tag.text}</tspan>
        </text>
      ))}
    </g>
  );
}

function ActiveNodeOrbit({ node, active, reduce }) {
  if (reduce || !active) return null;

  return (
    <g transform={`translate(${node.x}, 100)`}>
      <circle cx={0} cy={0} r={22} fill="none" stroke={node.fill} strokeWidth={1} opacity={0.35} strokeDasharray="3 5" className="mkt-river-orbit-ring" />
      <circle r={3} fill={node.fill} cx={22} cy={0} opacity={0.9}>
        <animateTransform attributeName="transform" type="rotate" from="0 0 0" to="360 0 0" dur="3s" repeatCount="indefinite" />
      </circle>
    </g>
  );
}

function HandoffBeam({ node, show, reduce }) {
  if (reduce || !show) return null;

  return (
    <line
      x1={node.x}
      y1={118}
      x2={node.x}
      y2={188}
      stroke={node.fill}
      strokeWidth={1.5}
      strokeDasharray="4 6"
      opacity={0.5}
      className="mkt-river-handoff-beam"
    />
  );
}

function StatusTicker({ activeIndex, play }) {
  const reduce = useReducedMotion();
  if (!play || reduce) return null;

  return (
    <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 sm:bottom-4">
      <div className="overflow-hidden rounded-full border border-mkt-navy/10 bg-white/85 px-4 py-1.5 shadow-sm backdrop-blur-sm">
        <motion.p
          key={activeIndex}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.35, ease: MKT_EASE }}
          className="whitespace-nowrap font-mono text-[0.58rem] text-mkt-navy/50"
        >
          <span className="text-mkt-lime">●</span> {HANDOFF_TICKER[activeIndex]}
        </motion.p>
      </div>
    </div>
  );
}

function RiverNode({ node, index, play: show, hovered, active, onHover }) {
  const delay = nodeDelay(index);
  const reduce = useReducedMotion();
  const pulseDelay = nodePulseDelay(index);
  const lit = hovered === node.id || active === index;

  return (
    <g onMouseEnter={() => onHover(node.id)} onMouseLeave={() => onHover(null)} style={{ cursor: "pointer" }}>
      <motion.circle
        cx={node.x}
        cy={100}
        r={30}
        fill={node.fill}
        initial={false}
        animate={{ r: lit ? 40 : 30, opacity: lit ? 0.32 : show ? 0.14 : 0 }}
        transition={{ duration: 0.35, ease: MKT_EASE }}
        filter={`url(#node-glow-${index})`}
      />

      {show && !reduce ? (
        <motion.circle
          cx={node.x}
          cy={100}
          r={15}
          fill="none"
          stroke={node.fill}
          strokeWidth={2}
          initial={{ r: 15, opacity: 0 }}
          animate={{ r: [15, 42, 15], opacity: [0, 0.7, 0] }}
          transition={{
            duration: 0.7,
            repeat: Infinity,
            repeatDelay: TRAVEL_DURATION - 0.7,
            delay: pulseDelay,
            ease: "easeOut",
          }}
        />
      ) : null}

      {show && !reduce ? (
        <motion.circle
          cx={node.x}
          cy={100}
          r={15}
          fill="none"
          stroke={node.fill}
          strokeWidth={1.5}
          initial={{ r: 15, opacity: 0.5 }}
          animate={{ r: 34, opacity: 0 }}
          transition={{ delay, duration: 0.8, ease: "easeOut" }}
        />
      ) : null}

      <motion.circle
        cx={node.x}
        cy={100}
        r={15}
        fill={node.fill}
        stroke="#0a1550"
        strokeWidth={2.5}
        initial={reduce ? false : { r: 0, opacity: 0 }}
        animate={show ? { r: lit ? 16 : 15, opacity: 1 } : { r: 0, opacity: 0 }}
        transition={
          reduce
            ? { duration: 0 }
            : { r: { delay, type: "spring", stiffness: 280, damping: 20 }, opacity: { delay, duration: 0.3 } }
        }
      />

      <motion.circle
        cx={node.x}
        cy={100}
        r={5}
        fill="#0a1550"
        initial={reduce ? false : { scale: 0, opacity: 0 }}
        animate={show ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
        transition={reduce ? { duration: 0 } : { delay: delay + 0.1, duration: 0.35, ease: MKT_EASE }}
        style={{ transformOrigin: `${node.x}px 100px`, transformBox: "fill-box" }}
      />

      {/* Module chip badge */}
      {show ? (
        <motion.g
          initial={reduce ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: lit ? 1 : 0.75, y: 0 }}
          transition={{ delay: delay + 0.25, duration: 0.45, ease: MKT_EASE }}
        >
          <rect x={node.x - 18} y={58} width={36} height={14} rx={7} fill="white" stroke={node.fill} strokeWidth={1} opacity={0.95} />
          <text x={node.x} y={68} textAnchor="middle" className="fill-[#0a1550] text-[7px] font-bold" style={{ fontFamily: "monospace" }}>
            {node.chip}
          </text>
        </motion.g>
      ) : null}

      <motion.text
        x={node.x}
        y={152}
        textAnchor="middle"
        className="fill-[#0a1550] text-[12px] font-bold tracking-tight"
        style={{ fontFamily: "inherit" }}
        initial={reduce ? false : { opacity: 0, y: 8 }}
        animate={show ? { opacity: lit ? 1 : 0.88, y: 0 } : { opacity: 0, y: 8 }}
        transition={reduce ? { duration: 0 } : { delay: delay + 0.18, duration: 0.5, ease: MKT_EASE }}
      >
        {node.label}
      </motion.text>

      <motion.text
        x={node.x}
        y={168}
        textAnchor="middle"
        className="fill-mkt-navy/40 text-[8px] uppercase tracking-widest"
        style={{ fontFamily: "monospace" }}
        initial={reduce ? false : { opacity: 0 }}
        animate={show ? { opacity: lit ? 0.8 : 0.45 } : { opacity: 0 }}
        transition={{ delay: delay + 0.3, duration: 0.4 }}
      >
        {node.tag}
      </motion.text>

      <a href={`#${node.id}`} aria-label={`Jump to ${node.label}`}>
        <circle cx={node.x} cy={100} r={36} fill="transparent" />
      </a>
    </g>
  );
}

function RiverDiagram({ play, activeIndex, onActiveChange }) {
  const reduce = useReducedMotion();
  const { mounted } = useMktMotion();
  const show = !mounted || play || Boolean(reduce);
  const animate = play && !reduce;
  const [hovered, setHovered] = useState(null);

  useEffect(() => {
    if (!show || reduce) return undefined;
    const step = (TRAVEL_DURATION / NODES.length) * 1000;
    let intervalId;
    const timeoutId = setTimeout(() => {
      onActiveChange(0);
      intervalId = setInterval(() => {
        onActiveChange((i) => (i + 1) % NODES.length);
      }, step);
    }, TRAVEL_BEGIN * 1000);
    return () => {
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [show, reduce, onActiveChange]);

  return (
    <svg viewBox="0 0 800 240" className="h-auto w-full max-w-none" aria-hidden preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="product-river" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#c5f042" />
          <stop offset="30%" stopColor="#4ec0e8" />
          <stop offset="55%" stopColor="#ff6b5b" />
          <stop offset="78%" stopColor="#ffe24a" />
          <stop offset="100%" stopColor="#ff4d8d" />
        </linearGradient>

        <radialGradient id="product-energy-ball" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="40%" stopColor="#4ec0e8" />
          <stop offset="100%" stopColor="#c5f042" stopOpacity={0.15} />
        </radialGradient>

        <filter id="product-river-glow-soft" x="-40%" y="-100%" width="180%" height="300%">
          <feGaussianBlur stdDeviation="10" result="b" />
          <feMerge><feMergeNode in="b" /></feMerge>
        </filter>

        <filter id="product-river-glow" x="-25%" y="-80%" width="150%" height="260%">
          <feGaussianBlur stdDeviation="5" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>

        <filter id="product-energy-glow" x="-120%" y="-120%" width="340%" height="340%">
          <feGaussianBlur stdDeviation="7" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>

        {NODES.map((node, i) => (
          <filter key={node.id} id={`node-glow-${i}`} x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="10" result="b" />
            <feMerge><feMergeNode in="b" /></feMerge>
          </filter>
        ))}
      </defs>

      {/* Corner frame accents */}
      <path d="M 12 20 L 12 8 L 24 8" fill="none" stroke="#0a1550" strokeWidth={1} opacity={0.12} />
      <path d="M 788 20 L 788 8 L 776 8" fill="none" stroke="#0a1550" strokeWidth={1} opacity={0.12} />
      <path d="M 12 200 L 12 212 L 24 212" fill="none" stroke="#0a1550" strokeWidth={1} opacity={0.12} />
      <path d="M 788 200 L 788 212 L 776 212" fill="none" stroke="#0a1550" strokeWidth={1} opacity={0.12} />

      <path d={RIVER_PATH} fill="none" stroke="#0a1550" strokeWidth={6} strokeLinecap="round" opacity={0.05} />

      <path
        d={RIVER_PATH}
        fill="none"
        stroke="url(#product-river)"
        strokeWidth={20}
        strokeLinecap="round"
        opacity={show ? 0.18 : 0}
        filter="url(#product-river-glow-soft)"
      />

      <path
        d={RIVER_PATH}
        fill="none"
        stroke="url(#product-river)"
        strokeWidth={10}
        strokeLinecap="round"
        opacity={show ? 0.35 : 0}
        filter="url(#product-river-glow)"
      />

      <motion.path
        d={RIVER_PATH}
        fill="none"
        stroke="url(#product-river)"
        strokeWidth={5.5}
        strokeLinecap="round"
        filter="url(#product-river-glow)"
        initial={false}
        animate={show ? { pathLength: animate ? 1 : 1, opacity: 1 } : { pathLength: 0, opacity: 0.4 }}
        transition={reduce ? { duration: 0 } : { pathLength: { duration: DRAW_DURATION, ease: MKT_EASE }, opacity: { duration: 0.45 } }}
      />

      <motion.path
        d={RIVER_PATH}
        fill="none"
        stroke="white"
        strokeWidth={1.2}
        strokeLinecap="round"
        opacity={show ? 0.35 : 0}
        initial={false}
        animate={show && animate ? { pathLength: 1 } : { pathLength: animate ? 0 : 1 }}
        transition={{ pathLength: { duration: DRAW_DURATION, ease: MKT_EASE, delay: 0.15 } }}
      />

      <path
        d={RIVER_PATH}
        fill="none"
        stroke="url(#product-river)"
        strokeWidth={2.5}
        strokeLinecap="round"
        opacity={show && animate ? 0.6 : 0}
        className="mkt-river-flow-dashes"
        style={{ animationDelay: `${TRAVEL_BEGIN}s` }}
      />

      {/* Subtle mesh nodes along path */}
      {[120, 320, 520, 640].map((mx, mi) => (
        <circle
          key={mx}
          cx={mx}
          cy={100}
          r={1.5}
          fill="#0a1550"
          opacity={show && animate ? 0.08 : 0}
          className="mkt-river-mesh-dot"
          style={{ animationDelay: `${mi * 0.6}s` }}
        />
      ))}

      <g opacity={show ? 1 : 0}>
        <EnergyPacket begin={TRAVEL_BEGIN} reduce={reduce} reverse={false} />
        <EnergyPacket begin={TRAVEL_BEGIN + 2.6} reduce={reduce} reverse />
        <RiverDataTags begin={TRAVEL_BEGIN} reduce={reduce} />
      </g>

      {NODES.map((node, i) => (
        <HandoffBeam key={`beam-${node.id}`} node={node} show={activeIndex === i} reduce={reduce} />
      ))}

      {NODES.map((node, i) => (
        <ActiveNodeOrbit key={`orbit-${node.id}`} node={node} active={activeIndex === i} reduce={reduce} />
      ))}

      {NODES.map((node, i) => (
        <RiverNode
          key={node.id}
          node={node}
          index={i}
          play={show}
          hovered={hovered}
          active={activeIndex}
          onHover={setHovered}
        />
      ))}
    </svg>
  );
}

function RiverPillLinks({ play, activeIndex }) {
  const reduce = useReducedMotion();
  const { mounted } = useMktMotion();
  const show = mounted && (play || Boolean(reduce));

  return (
    <div className="mt-10 flex flex-wrap justify-center gap-2 border-t border-mkt-navy/8 pt-8 md:gap-3">
      {NODES.map((node, i) => {
        const isActive = activeIndex === i;
        return (
          <motion.a
            key={node.id}
            href={`#${node.id}`}
            initial={false}
            animate={show ? { opacity: 1, y: 0, scale: isActive ? 1.04 : 1 } : { opacity: 0.35, y: 0, scale: 1 }}
            transition={
              reduce
                ? { duration: 0 }
                : { delay: nodeDelay(i) + 0.4, duration: 0.45, ease: MKT_EASE, scale: { duration: 0.25 } }
            }
            className={cn(
              "group inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[0.68rem] font-semibold backdrop-blur-sm transition sm:gap-2 sm:px-4 sm:py-2 sm:text-xs",
              isActive
                ? "border-mkt-navy/25 bg-white shadow-md shadow-mkt-navy/10 text-mkt-navy"
                : "border-mkt-navy/10 bg-white/90 text-mkt-navy shadow-sm hover:-translate-y-0.5 hover:border-mkt-navy/20 hover:shadow-md",
            )}
          >
            <span
              className={cn("size-2 rounded-full transition", isActive && "scale-125")}
              style={{ backgroundColor: node.fill, boxShadow: isActive ? `0 0 10px ${node.fill}` : `0 0 6px ${node.fill}55` }}
            />
            {String(i + 1).padStart(2, "0")} {node.label}
          </motion.a>
        );
      })}
    </div>
  );
}

export function ProductStackRiver({ title, subtitle }) {
  const ref = useRef(null);
  const inView = useMktInView(ref, { amount: 0.3 });
  const { mounted } = useMktMotion();
  const play = mounted && inView;
  const [activeIndex, setActiveIndex] = useState(0);

  const handleActiveChange = (updater) => {
    setActiveIndex(typeof updater === "function" ? updater : updater);
  };

  return (
    <section ref={ref} className="relative overflow-hidden border-b border-mkt-navy/10 bg-[#f7f8fc] py-20 md:py-28">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-1/4 size-96 rounded-full bg-mkt-lime/15 blur-[100px]" />
        <div className="absolute -right-24 bottom-1/4 size-96 rounded-full bg-mkt-pink/12 blur-[100px]" />
        <div
          className="absolute inset-0 opacity-[0.4]"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, rgba(10,21,80,0.06) 1px, transparent 0)",
            backgroundSize: "24px 24px",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.35em] text-mkt-navy/45">System map</p>
          <h2 className="mt-3 max-w-xl font-mkt-display text-3xl text-mkt-navy md:text-5xl">{title}</h2>
          <p className="mt-4 max-w-2xl text-base text-mkt-navy/65 md:text-lg">{subtitle}</p>
        </Reveal>

        <Reveal delay={0.08} className="relative mt-14">
          <div className="relative overflow-hidden rounded-[1.75rem] border border-white/70 bg-white/50 px-4 py-8 shadow-xl shadow-mkt-navy/[0.06] backdrop-blur-md sm:py-10 md:px-8 md:py-12">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-[1.75rem] opacity-60"
              style={{
                background:
                  "linear-gradient(135deg, rgba(197,240,66,0.06) 0%, rgba(78,192,232,0.05) 40%, rgba(255,107,91,0.05) 70%, rgba(255,77,141,0.06) 100%)",
              }}
            />
            <MktScaleViewport
              designWidth={680}
              designHeight={520}
              scaleBelow={768}
              innerClassName="relative"
            >
              <RiverAmbient play={play} />
              <StatusTicker activeIndex={activeIndex} play={play} />
              <div className="relative pt-6">
                <RiverDiagram play={play} activeIndex={activeIndex} onActiveChange={handleActiveChange} />
                <RiverPillLinks play={play} activeIndex={activeIndex} />
              </div>
            </MktScaleViewport>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
