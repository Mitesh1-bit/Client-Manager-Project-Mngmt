"use client";

import { motion } from "framer-motion";

import { cn } from "@/app/lib/utils";

import { MKT_EASE, useMktMotion } from "./motion";

const VISUAL_KEYS = ["change-requests", "companies", "portal", "retention"];

export function getWhyVisualKey(index) {
  return VISUAL_KEYS[index] ?? VISUAL_KEYS[0];
}

const panelMotion = {
  initial: { opacity: 0, scale: 0.94, y: 28, filter: "blur(10px)" },
  animate: { opacity: 1, scale: 1, y: 0, filter: "blur(0px)" },
  exit: { opacity: 0, scale: 0.97, y: -20, filter: "blur(6px)" },
};

function WindowChrome({ title, badge, className }) {
  return (
    <div className={cn("flex items-center gap-2 border-b border-mkt-navy/8 bg-white/80 px-3 py-2.5", className)}>
      <span className="size-2 rounded-full bg-mkt-coral" />
      <span className="size-2 rounded-full bg-mkt-sun" />
      <span className="size-2 rounded-full bg-mkt-lime" />
      <span className="ml-1 truncate text-[0.65rem] font-semibold text-mkt-navy/70">{title}</span>
      {badge ? (
        <span className="ml-auto rounded-full bg-mkt-lime/35 px-2 py-0.5 text-[0.5rem] font-bold uppercase tracking-wider text-mkt-navy">
          {badge}
        </span>
      ) : null}
    </div>
  );
}

function Stagger({ children, className, animate: motionOn, delay = 0 }) {
  if (!motionOn) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.08, delayChildren: delay } },
      }}
    >
      {children}
    </motion.div>
  );
}

function Item({ children, className, animate: motionOn }) {
  if (!motionOn) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 16, scale: 0.96 },
        visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.55, ease: MKT_EASE } },
      }}
    >
      {children}
    </motion.div>
  );
}

/** CR approval pipeline — steps + impact card */
function ChangeRequestsVisual({ motionOn }) {
  const steps = [
    { label: "Draft", state: "done" },
    { label: "Impact review", state: "done" },
    { label: "Client approval", state: "active" },
    { label: "Implement", state: "pending" },
  ];

  return (
    <div className="relative mx-auto w-full max-w-[400px]">
      <div className="mkt-why-glow absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-mkt-coral/25 via-mkt-sky/15 to-transparent blur-2xl" />

      <Stagger animate={motionOn} className="relative space-y-3" delay={0.05}>
        <Item animate={motionOn}>
          <div className="overflow-hidden rounded-2xl border border-white/80 bg-white shadow-xl ring-1 ring-mkt-navy/5">
            <WindowChrome title="Change request #47" badge="In review" />
            <div className="space-y-4 p-4">
              <div className="flex items-center justify-between gap-2">
                {steps.map((step, i) => (
                  <div key={step.label} className="flex flex-1 flex-col items-center gap-1.5">
                    <span
                      className={cn(
                        "flex size-7 items-center justify-center rounded-full text-[0.55rem] font-bold",
                        step.state === "done" && "bg-mkt-lime text-mkt-navy",
                        step.state === "active" && "bg-mkt-sky text-mkt-navy ring-2 ring-mkt-sky/40",
                        step.state === "pending" && "bg-mkt-navy/8 text-mkt-navy/40",
                      )}
                    >
                      {step.state === "done" ? "✓" : i + 1}
                    </span>
                    <span className="text-center text-[0.48rem] font-semibold uppercase leading-tight text-mkt-navy/55">
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
              {motionOn ? (
                <motion.div
                  className="h-1 overflow-hidden rounded-full bg-mkt-navy/8"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-mkt-cta to-mkt-coral"
                    initial={{ width: "0%" }}
                    animate={{ width: "68%" }}
                    transition={{ delay: 0.45, duration: 0.9, ease: MKT_EASE }}
                  />
                </motion.div>
              ) : (
                <div className="h-1 rounded-full bg-mkt-navy/8">
                  <div className="h-full w-[68%] rounded-full bg-gradient-to-r from-mkt-cta to-mkt-coral" />
                </div>
              )}
            </div>
          </div>
        </Item>

        <Item animate={motionOn}>
          <div className={cn("mkt-why-float ml-6 rounded-xl border border-mkt-coral/30 bg-gradient-to-br from-mkt-coral/20 to-white p-3 shadow-lg")}>
            <p className="text-[0.55rem] font-bold uppercase tracking-wider text-mkt-navy/50">Impact assessment</p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {[
                { k: "Hours", v: "+12h" },
                { k: "Cost", v: "$4.2k" },
                { k: "Timeline", v: "+5d" },
              ].map((m) => (
                <div key={m.k} className="rounded-lg bg-white/90 px-2 py-1.5 text-center">
                  <p className="font-mkt-display text-sm text-mkt-navy">{m.v}</p>
                  <p className="text-[0.45rem] uppercase text-mkt-navy/45">{m.k}</p>
                </div>
              ))}
            </div>
          </div>
        </Item>

        <Item animate={motionOn}>
          <div className="mr-4 flex items-center gap-2 rounded-xl border border-mkt-lime/40 bg-mkt-lime/15 px-3 py-2 shadow-md">
            <span className="size-2 animate-pulse rounded-full bg-mkt-lime" />
            <p className="text-[0.65rem] font-semibold text-mkt-navy">Budget locked until client signs off</p>
          </div>
        </Item>
      </Stagger>
    </div>
  );
}

/** Company hub — contacts orbit + touchpoints */
function CompaniesVisual({ motionOn }) {
  const contacts = [
    { name: "Sarah K.", role: "VP Ops", tone: "bg-mkt-lime" },
    { name: "James L.", role: "PM", tone: "bg-mkt-sky" },
    { name: "Mia R.", role: "Finance", tone: "bg-mkt-sun" },
  ];

  return (
    <div className="relative mx-auto w-full max-w-[400px]">
      <div className="mkt-why-glow absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-mkt-lime/30 via-mkt-sky/10 to-transparent blur-2xl" />

      <Stagger animate={motionOn} className="relative" delay={0.05}>
        <Item animate={motionOn}>
          <div className="overflow-hidden rounded-2xl border border-white/80 bg-white shadow-xl ring-1 ring-mkt-navy/5">
            <WindowChrome title="Northwind Studio" badge="Health 88" />
            <div className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-mkt-lime to-mkt-sky font-mkt-display text-lg text-mkt-navy">
                  N
                </div>
                <div>
                  <p className="text-sm font-bold text-mkt-navy">Northwind Studio</p>
                  <p className="text-[0.65rem] text-mkt-navy/50">Retainer · 3 active projects</p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {contacts.map((c, i) => (
                  <motion.div
                    key={c.name}
                    className={cn("flex items-center gap-2 rounded-full border border-mkt-navy/8 bg-white px-2.5 py-1.5 shadow-sm", motionOn && "mkt-why-float")}
                    style={motionOn ? { animationDelay: `${i * 0.4}s` } : undefined}
                    initial={motionOn ? { opacity: 0, scale: 0.9 } : false}
                    animate={motionOn ? { opacity: 1, scale: 1 } : undefined}
                    transition={{ delay: 0.2 + i * 0.1, duration: 0.5, ease: MKT_EASE }}
                  >
                    <span className={cn("size-5 rounded-full", c.tone)} />
                    <div>
                      <p className="text-[0.62rem] font-semibold text-mkt-navy">{c.name}</p>
                      <p className="text-[0.5rem] text-mkt-navy/45">{c.role}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </Item>

        <Item animate={motionOn}>
          <div className="mkt-why-float-slow -mt-2 ml-8 rounded-xl border border-mkt-sky/35 bg-mkt-sky/15 p-3 shadow-lg">
            <p className="text-[0.55rem] font-bold uppercase tracking-wider text-mkt-navy/55">Recent touchpoints</p>
            <div className="mt-2 space-y-2">
              {["QBR completed · 2d ago", "Contract renewed · 1w ago"].map((t) => (
                <div key={t} className="flex items-center gap-2 text-[0.62rem] text-mkt-navy/70">
                  <span className="size-1.5 rounded-full bg-mkt-sky" />
                  {t}
                </div>
              ))}
            </div>
          </div>
        </Item>
      </Stagger>
    </div>
  );
}

/** Client portal — focused approve view */
function PortalVisual({ motionOn }) {
  return (
    <div className="relative mx-auto w-full max-w-[380px]">
      <div className="mkt-why-glow absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-mkt-sun/35 via-mkt-coral/15 to-transparent blur-2xl" />

      <Stagger animate={motionOn} className="relative space-y-3" delay={0.05}>
        <Item animate={motionOn}>
          <div className="overflow-hidden rounded-2xl border-2 border-mkt-sun/50 bg-white shadow-2xl">
            <div className="bg-gradient-to-r from-mkt-navy to-mkt-navy-muted px-4 py-3">
              <p className="text-xs font-bold text-white">Client portal</p>
              <p className="text-[0.6rem] text-white/65">Northwind · view only</p>
            </div>
            <div className="space-y-3 p-4">
              <div className="rounded-xl border border-mkt-navy/8 bg-mkt-navy/[0.02] p-3">
                <p className="text-[0.65rem] font-bold text-mkt-navy">Homepage hero refresh</p>
                <p className="mt-1 text-[0.6rem] text-mkt-navy/50">Milestone ready for approval</p>
                {motionOn ? (
                  <motion.button
                    type="button"
                    className="mkt-why-pulse mt-3 w-full rounded-lg bg-mkt-cta py-2 text-[0.65rem] font-bold text-white"
                    initial={{ scale: 0.95 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5, duration: 0.4, ease: MKT_EASE }}
                  >
                    Approve milestone
                  </motion.button>
                ) : (
                  <div className="mt-3 rounded-lg bg-mkt-cta py-2 text-center text-[0.65rem] font-bold text-white">
                    Approve milestone
                  </div>
                )}
              </div>
              <div className="rounded-lg border border-dashed border-mkt-navy/15 px-3 py-2 text-center">
                <p className="text-[0.55rem] font-medium text-mkt-navy/40">Internal boards & budgets hidden</p>
              </div>
            </div>
          </div>
        </Item>

        <Item animate={motionOn}>
          <div className="mkt-why-float ml-auto mr-2 flex w-[210px] items-center gap-2 rounded-xl border border-mkt-lime/40 bg-white px-3 py-2 shadow-xl">
            <span className="flex size-7 items-center justify-center rounded-lg bg-mkt-lime text-xs font-bold text-mkt-navy">✓</span>
            <p className="text-[0.62rem] font-semibold text-mkt-navy">Approved without email thread</p>
          </div>
        </Item>
      </Stagger>
    </div>
  );
}

/** Retention — health ring + at-risk list */
function RetentionVisual({ motionOn }) {
  const accounts = [
    { name: "Summit Co.", score: 42, tone: "text-mkt-coral" },
    { name: "Studio Arc", score: 58, tone: "text-mkt-sun" },
    { name: "Northwind", score: 88, tone: "text-mkt-lime" },
  ];

  return (
    <div className="relative mx-auto w-full max-w-[400px]">
      <div className="mkt-why-glow absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-mkt-sun/30 via-mkt-coral/15 to-transparent blur-2xl" />

      <Stagger animate={motionOn} className="relative space-y-3" delay={0.05}>
        <Item animate={motionOn}>
          <div className="overflow-hidden rounded-2xl border border-white/80 bg-white shadow-xl ring-1 ring-mkt-navy/5">
            <WindowChrome title="At-risk dashboard" badge="3 accounts" />
            <div className="flex gap-4 p-4">
              <div className="relative size-24 shrink-0">
                <svg viewBox="0 0 100 100" className="size-full -rotate-90">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="rgb(10 21 80 / 0.1)" strokeWidth="8" />
                  {motionOn ? (
                    <motion.circle
                      cx="50"
                      cy="50"
                      r="42"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray="264"
                      className="text-mkt-coral"
                      initial={{ strokeDashoffset: 264 }}
                      animate={{ strokeDashoffset: 90 }}
                      transition={{ delay: 0.35, duration: 1.1, ease: MKT_EASE }}
                    />
                  ) : (
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray="264"
                      strokeDashoffset="90"
                      className="text-mkt-coral"
                    />
                  )}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-mkt-display text-2xl text-mkt-navy">66</span>
                  <span className="text-[0.5rem] font-bold uppercase text-mkt-navy/45">Avg health</span>
                </div>
              </div>

              <div className="min-w-0 flex-1 space-y-2">
                {accounts.map((a, i) => (
                  <motion.div
                    key={a.name}
                    className="flex items-center justify-between rounded-lg border border-mkt-navy/8 bg-mkt-navy/[0.02] px-2.5 py-2"
                    initial={motionOn ? { opacity: 0, x: 12 } : false}
                    animate={motionOn ? { opacity: 1, x: 0 } : undefined}
                    transition={{ delay: 0.25 + i * 0.1, duration: 0.45, ease: MKT_EASE }}
                  >
                    <span className="text-[0.65rem] font-semibold text-mkt-navy">{a.name}</span>
                    <span className={cn("font-mkt-display text-sm", a.tone)}>{a.score}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </Item>

        <Item animate={motionOn}>
          <div className="mkt-why-float-slow ml-4 rounded-xl border border-mkt-sun/40 bg-mkt-sun/20 px-3 py-2.5 shadow-md">
            <p className="text-[0.62rem] font-bold text-mkt-navy">Retention sequence triggered</p>
            <p className="text-[0.58rem] text-mkt-navy/55">Summit Co. · renewal in 14 days</p>
          </div>
        </Item>
      </Stagger>
    </div>
  );
}

const VISUALS = {
  "change-requests": ChangeRequestsVisual,
  companies: CompaniesVisual,
  portal: PortalVisual,
  retention: RetentionVisual,
};

export function WhyMeridianVisual({ visualKey, className }) {
  const { animate } = useMktMotion();
  const Visual = VISUALS[visualKey] ?? ChangeRequestsVisual;

  return (
    <div className={cn("relative min-h-[380px] py-4", className)}>
      <Visual motionOn={animate} />
    </div>
  );
}

export function WhyMeridianVisualPanel({ activeIndex, className }) {
  const { animate } = useMktMotion();
  const visualKey = getWhyVisualKey(activeIndex);
  const Visual = VISUALS[visualKey] ?? ChangeRequestsVisual;

  const body = (
    <div className={cn("flex w-full items-center justify-center py-4", className)}>
      <Visual motionOn={animate} />
    </div>
  );

  if (!animate) {
    return body;
  }

  return (
    <motion.div
      variants={panelMotion}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.55, ease: MKT_EASE }}
    >
      {body}
    </motion.div>
  );
}
