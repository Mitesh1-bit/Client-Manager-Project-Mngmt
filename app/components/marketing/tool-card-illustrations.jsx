"use client";

import { cn } from "@/app/lib/utils";

/** Animated mini UI inside each tool carousel card */
export function ToolCardIllustration({ toolId, className }) {
  return (
    <div className={cn("pointer-events-none absolute inset-x-0 top-0 h-[55%] px-5 pt-6", className)}>
      {toolId === "companies" && <CompaniesIllustration />}
      {toolId === "projects" && <ProjectsIllustration />}
      {toolId === "change-requests" && <ChangeRequestsIllustration />}
      {toolId === "portal" && <PortalIllustration />}
      {toolId === "retention" && <RetentionIllustration />}
    </div>
  );
}

function CompaniesIllustration() {
  return (
    <div className="relative h-full">
      <div className="mkt-card-float absolute left-0 top-2">
        <div
          className="mkt-card-enter flex items-center gap-2 rounded-xl border border-white/50 bg-white/80 px-3 py-2 shadow-md backdrop-blur-sm"
          style={{ animationDelay: "0.1s" }}
        >
          <span className="size-7 rounded-full bg-mkt-lime" />
          <div className="space-y-1">
            <div className="h-1.5 w-14 rounded-full bg-mkt-navy/25" />
            <div className="h-1 w-10 rounded-full bg-mkt-navy/15" />
          </div>
        </div>
      </div>
      <div className="mkt-card-float-delayed absolute right-2 top-10">
        <div
          className="mkt-card-enter flex items-center gap-2 rounded-xl border border-white/50 bg-white/70 px-3 py-2 shadow-md backdrop-blur-sm"
          style={{ animationDelay: "0.25s" }}
        >
          <span className="size-7 rounded-full bg-mkt-sky" />
          <div className="space-y-1">
            <div className="h-1.5 w-12 rounded-full bg-mkt-navy/25" />
            <div className="h-1 w-8 rounded-full bg-mkt-navy/15" />
          </div>
        </div>
      </div>
      <div className="mkt-card-float absolute left-6 top-[4.5rem]" style={{ animationDelay: "1s" }}>
        <div
          className="mkt-card-enter flex items-center gap-2 rounded-xl border border-white/40 bg-white/60 px-2.5 py-1.5 shadow-sm backdrop-blur-sm"
          style={{ animationDelay: "0.4s" }}
        >
          <span className="size-5 rounded-full bg-mkt-coral" />
          <div className="h-1 w-8 rounded-full bg-mkt-navy/20" />
        </div>
      </div>
      <div className="mkt-card-badge-pop absolute bottom-4 left-1/2 rounded-full bg-mkt-navy/10 px-3 py-1 text-[0.6rem] font-bold uppercase tracking-wider text-mkt-navy/60">
        3 contacts
      </div>
    </div>
  );
}

function ProjectsIllustration() {
  const cols = ["Todo", "Active", "Done"];

  return (
    <div className="relative flex h-full gap-2 px-1">
      {cols.map((col) => (
        <div key={col} className="flex flex-1 flex-col gap-1.5">
          <span className="text-[0.55rem] font-bold uppercase tracking-wider text-mkt-navy/45">{col}</span>
          <div className="min-h-[72px] rounded-lg border border-white/40 bg-white/30 p-1.5" />
        </div>
      ))}

      <div
        className="mkt-card-kanban absolute left-1 top-[1.35rem] w-[calc(33.333%-4px)] rounded-md border border-white/50 bg-white/90 p-1.5 shadow-md"
        style={{ width: "calc(33.333% - 6px)" }}
      >
        <div className="h-1 w-full rounded-full bg-mkt-navy/20" />
        <div className="mt-1.5 h-1 w-[66%] rounded-full bg-mkt-navy/10" />
      </div>
    </div>
  );
}

function ChangeRequestsIllustration() {
  const steps = ["Draft", "Review", "Approved"];

  return (
    <div className="relative flex h-full flex-col justify-center gap-2">
      {steps.map((step, i) => (
        <div
          key={step}
          className="mkt-card-enter flex items-center gap-2"
          style={{ animationDelay: `${0.15 + i * 0.12}s` }}
        >
          <span
            className={cn(
              "mkt-card-pulse flex size-5 shrink-0 items-center justify-center rounded-full text-[0.55rem] font-bold",
              i < 2 ? "bg-mkt-navy text-white" : "border-2 border-mkt-navy/30 bg-white/70 text-mkt-navy/40",
            )}
            style={{ animationDelay: `${i * 0.35}s` }}
          >
            {i < 2 ? "✓" : "3"}
          </span>
          <div className="flex-1 rounded-lg border border-white/45 bg-white/75 px-2 py-1.5">
            <p className="text-[0.6rem] font-semibold text-mkt-navy/70">{step}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function PortalIllustration() {
  return (
    <div className="relative mx-auto mt-1 w-[88%] overflow-hidden rounded-xl border border-white/50 bg-white/85 shadow-lg">
      <div className="flex items-center gap-1 border-b border-mkt-navy/8 px-2 py-1.5">
        <span className="size-1.5 rounded-full bg-mkt-coral" />
        <span className="size-1.5 rounded-full bg-mkt-sun" />
        <span className="size-1.5 rounded-full bg-mkt-lime" />
      </div>
      <div className="space-y-2 p-3">
        <div className="mkt-card-enter h-1.5 w-3/4 rounded-full bg-mkt-navy/15" style={{ animationDelay: "0.1s" }} />
        <div className="mkt-card-enter h-1.5 w-1/2 rounded-full bg-mkt-navy/10" style={{ animationDelay: "0.2s" }} />
        <div
          className="mkt-card-pulse mt-2 rounded-md bg-mkt-cta px-2 py-1.5 text-center text-[0.6rem] font-bold text-white"
          style={{ animationDelay: "0.4s" }}
        >
          Approve milestone
        </div>
      </div>
    </div>
  );
}

function RetentionIllustration() {
  return (
    <div className="relative flex h-full items-center justify-center">
      <div className="relative size-20 sm:size-24">
        <svg viewBox="0 0 100 100" className="size-full -rotate-90" aria-hidden="true">
          <circle cx={50} cy={50} r={42} fill="none" stroke="rgb(10 21 80 / 0.12)" strokeWidth={8} />
          <circle
            cx={50}
            cy={50}
            r={42}
            fill="none"
            stroke="currentColor"
            strokeWidth={8}
            strokeLinecap="round"
            strokeDasharray={264}
            strokeDashoffset={52}
            className="mkt-card-ring text-mkt-navy"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mkt-display text-lg text-mkt-navy sm:text-xl">82</span>
          <span className="text-[0.5rem] font-bold uppercase tracking-wider text-mkt-navy/50 sm:text-[0.55rem]">
            Health
          </span>
        </div>
      </div>
      <div className="mkt-card-float absolute bottom-1 right-0 max-w-[45%] truncate rounded-lg border border-white/50 bg-white/80 px-2 py-1 text-[0.5rem] font-bold text-mkt-navy/70 shadow-sm sm:bottom-2 sm:max-w-none sm:text-[0.55rem]">
        ↑ At risk
      </div>
    </div>
  );
}
