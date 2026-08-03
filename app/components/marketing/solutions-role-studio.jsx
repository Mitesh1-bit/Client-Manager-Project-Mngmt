"use client";

import Link from "next/link";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";

import { cn } from "@/app/lib/utils";
import { personaShowcaseContent, solutionRoles } from "@/app/lib/marketing/site";

import { CrmMockup } from "./crm-mockup";
import { MKT_EASE, Reveal, useMktMotion } from "./motion";

const ROLE_ACCENTS = {
  "account-managers": "text-mkt-lime",
  "project-managers": "text-mkt-sky",
  leadership: "text-mkt-sun",
  clients: "text-mkt-pink",
};

function BrowserChrome({ url, children }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-mkt-navy/12 bg-[#ececec] shadow-2xl shadow-mkt-navy/15">
      <div className="flex items-center gap-2 border-b border-mkt-navy/10 bg-[#e4e4e4] px-4 py-2.5">
        <span className="size-2.5 rounded-full bg-[#ff5f57]" />
        <span className="size-2.5 rounded-full bg-[#febc2e]" />
        <span className="size-2.5 rounded-full bg-[#28c840]" />
        <div className="ml-3 flex-1 truncate rounded-md bg-white/80 px-3 py-1 font-mono text-[0.62rem] text-mkt-navy/55">
          {url}
        </div>
      </div>
      <div className="bg-white max-h-[360px] overflow-hidden">{children}</div>
    </div>
  );
}

export function SolutionsRoleStudio() {
  const personas = personaShowcaseContent.personas;
  const roles = useMemo(
    () =>
      personas.map((p) => {
        const meta = solutionRoles.find((r) => r.id === p.id);
        return { ...p, body: meta?.body ?? "", bullets: meta?.bullets ?? [] };
      }),
    [personas],
  );

  const [active, setActive] = useState(0);
  const { animate } = useMktMotion();
  const current = roles[active];

  const selectTab = useCallback(
    (index) => {
      setActive(index);
      const id = roles[index]?.id;
      if (id && typeof window !== "undefined") {
        window.history.replaceState(null, "", `#${id}`);
      }
    },
    [roles],
  );

  useEffect(() => {
    function syncFromHash() {
      const hash = window.location.hash.replace("#", "");
      const index = roles.findIndex((p) => p.id === hash);
      if (index >= 0) setActive(index);
    }
    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, [roles]);

  return (
    <section id="role-studio" className="scroll-mt-20 border-y border-mkt-navy/8 bg-white py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="font-mkt-display text-3xl text-mkt-navy md:text-5xl">One tool. Your workflow.</h2>
          <p className="mt-4 text-base text-mkt-navy/65 md:text-lg">
            Select a role — the preview updates like switching apps, not scrolling another product tour.
          </p>
        </Reveal>

        <LayoutGroup>
          <div
            role="tablist"
            aria-label="Roles"
            className="relative z-20 mt-12 flex flex-wrap justify-center gap-2"
          >
            {roles.map((role, i) => {
              const selected = i === active;
              return (
                <button
                  key={role.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => selectTab(i)}
                  className={cn(
                    "relative rounded-full px-4 py-2.5 text-sm font-semibold transition-colors",
                    selected ? "text-mkt-navy" : "text-mkt-navy/50 hover:text-mkt-navy/80",
                  )}
                >
                  {selected && animate ? (
                    <motion.span
                      layoutId="sol-role-tab"
                      className="absolute inset-0 rounded-full bg-mkt-navy shadow-md"
                      transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    />
                  ) : selected ? (
                    <span className="absolute inset-0 rounded-full bg-mkt-navy shadow-md" />
                  ) : null}
                  <span className={cn("relative z-10", selected && "text-white")}>{role.label}</span>
                </button>
              );
            })}
          </div>
        </LayoutGroup>

        <div className="mt-14 grid items-start gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-14">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              id={current.id}
              className="scroll-mt-28 lg:sticky lg:top-28"
              initial={false}
              animate={{ opacity: 1, x: 0 }}
              exit={animate ? { opacity: 0, x: 12 } : undefined}
              transition={{ duration: animate ? 0.35 : 0.01, ease: MKT_EASE }}
            >
              <p className="font-mono text-[0.62rem] uppercase tracking-wider text-mkt-navy/40">
                meridian.app/solutions#{current.id}
              </p>
              <h3 className="mt-4 font-mkt-display text-2xl text-mkt-navy md:text-4xl">
                Meridian for{" "}
                <em className={cn("not-italic", ROLE_ACCENTS[current.id])}>{current.label.toLowerCase()}</em>
              </h3>
              <p className="mt-4 text-base leading-relaxed text-mkt-navy/65">{current.body}</p>

              <ul className="mt-8 space-y-3">
                {current.bullets.map((item, i) => (
                  <motion.li
                    key={item}
                    className="flex gap-3 text-sm text-mkt-navy/80"
                    initial={animate ? { opacity: 0, x: -10 } : false}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.08 + i * 0.07, duration: 0.4, ease: MKT_EASE }}
                  >
                    <span className={cn("font-bold", ROLE_ACCENTS[current.id])}>→</span>
                    {item}
                  </motion.li>
                ))}
              </ul>

              {current.useCase ? (
                <motion.div
                  className="mt-8 rounded-xl border border-mkt-navy/10 bg-[#faf9f6] p-4"
                  initial={animate ? { opacity: 0, y: 10 } : false}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25, duration: 0.45, ease: MKT_EASE }}
                >
                  <p className="text-xs font-bold uppercase tracking-wider text-mkt-coral">
                    {current.useCase.tag || "Highlight"}
                  </p>
                  <p className="mt-1 font-semibold text-mkt-navy">{current.useCase.title}</p>
                  <p className="mt-1 text-sm text-mkt-navy/55">{current.useCase.description}</p>
                </motion.div>
              ) : null}

              <Link
                href="/signup"
                className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-mkt-navy transition hover:gap-3"
              >
                {current.cta}
                <span aria-hidden>→</span>
              </Link>
            </motion.div>
          </AnimatePresence>

          <AnimatePresence mode="wait">
            <motion.div
              key={`mock-${current.id}`}
              initial={false}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={animate ? { opacity: 0, y: -16, scale: 0.98 } : undefined}
              transition={{ duration: animate ? 0.4 : 0.01, ease: MKT_EASE }}
            >
              <BrowserChrome url={`meridian.app/solutions#${current.id}`}>
                <CrmMockup
                  activeTab={current.activeTab ?? 0}
                  data={current.mockup}
                  skipEntrance
                  live
                />
              </BrowserChrome>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
