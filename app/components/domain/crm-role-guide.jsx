"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Activity,
  Building2,
  CheckSquare,
  Columns3,
  Eye,
  FileText,
  Flag,
  FolderKanban,
  GitPullRequestArrow,
  HeartHandshake,
  House,
  Kanban,
  KeyRound,
  LayoutDashboard,
  LayoutList,
  LineChart,
  Receipt,
  Shield,
  ShieldCheck,
  UserPlus,
  Users,
} from "lucide-react";

import { Button } from "@/app/components/ui/button";
import { cn } from "@/app/lib/utils";
import {
  ALL_ROLES_SUMMARY,
  INTERNAL_ROLE_GUIDES,
  PORTAL_GUIDE,
  guideForInternalRole,
} from "@/app/lib/guide/role-guides";
import { roleDefinition } from "@/app/lib/rbac";

const ICONS = {
  Shield,
  Users,
  Building2,
  UserPlus,
  FolderKanban,
  GitPullRequestArrow,
  HeartHandshake,
  KeyRound,
  Activity,
  Kanban,
  Columns3,
  Flag,
  CheckSquare,
  Eye,
  Receipt,
  LayoutDashboard,
  LineChart,
  House,
  LayoutList,
  ShieldCheck,
  FileText,
};

/**
 * @param {{
 *   scope: 'INTERNAL' | 'PORTAL';
 *   userRole?: string;
 *   className?: string;
 * }} props
 */
export function CrmRoleGuide({ scope, userRole = "team_member", className }) {
  const reduceMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [activeRole, setActiveRole] = useState(scope === "PORTAL" ? "portal" : userRole);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => setMounted(true), []);

  const guide = useMemo(() => {
    if (scope === "PORTAL") return PORTAL_GUIDE;
    return INTERNAL_ROLE_GUIDES[activeRole] ?? guideForInternalRole(activeRole);
  }, [scope, activeRole]);

  const steps = guide.steps;
  const step = steps[stepIndex];
  const StepIcon = ICONS[step?.icon] ?? Shield;
  const isLast = stepIndex >= steps.length - 1;
  const userRoleInfo = scope === "INTERNAL" ? roleDefinition(userRole) : null;

  useEffect(() => {
    setStepIndex(0);
  }, [activeRole, scope]);

  function goNext() {
    if (!isLast) setStepIndex((index) => index + 1);
  }

  function goBack() {
    if (stepIndex > 0) setStepIndex((index) => index - 1);
  }

  const animateSteps = mounted && !reduceMotion;

  const slide = animateSteps
    ? {
        initial: { opacity: 0, x: 24 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -24 },
        transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
      }
    : {
        initial: false,
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -24 },
      };

  return (
    <div className={cn("space-y-6", className)}>
      {scope === "INTERNAL" ? (
        <div className="space-y-3">
          <p className="text-caption text-muted-foreground">
            {userRoleInfo ? (
              <>
                Signed in as <span className="font-medium text-foreground">{userRoleInfo.label}</span>
                {" — "}
                switch roles below to see what others do.
              </>
            ) : (
              "Pick a role to see its workflow."
            )}
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {ALL_ROLES_SUMMARY.map((role) => {
              const selected = activeRole === role.value;
              return (
                <button
                  key={role.value}
                  type="button"
                  onClick={() => setActiveRole(role.value)}
                  className={cn(
                    "shrink-0 rounded-full border px-3 py-1.5 text-caption font-medium transition-colors focus-ring",
                    selected
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground",
                    role.value === userRole && !selected && "ring-1 ring-primary/20",
                  )}
                >
                  {role.label}
                  {role.value === userRole ? " (you)" : ""}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="border-b bg-muted/30 px-5 py-4 sm:px-6">
          <p className="text-caption font-medium uppercase tracking-wide text-primary">{guide.label}</p>
          <h2 className="mt-1 text-title text-balance">{guide.tagline}</h2>
        </div>

        <div className="grid gap-6 p-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] sm:p-6">
          <div className="relative flex min-h-[220px] items-center justify-center rounded-xl bg-gradient-to-br from-primary/8 via-background to-accent/10 p-6">
            <AnimatePresence mode="wait">
              <motion.div key={step?.id} {...slide} className="flex flex-col items-center text-center">
                <motion.span
                  className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-primary/12 text-primary"
                  animate={animateSteps ? { scale: [1, 1.06, 1] } : undefined}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                >
                  <StepIcon aria-hidden="true" className="size-8" />
                </motion.span>
                <ol className="flex items-center gap-1.5" aria-label="Guide progress">
                  {steps.map((item, index) => (
                    <li key={item.id}>
                      <span
                        className={cn(
                          "block h-1.5 rounded-full transition-all duration-300",
                          index === stepIndex ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30",
                        )}
                      />
                    </li>
                  ))}
                </ol>
                <p className="mt-3 text-caption text-muted-foreground">
                  Step {stepIndex + 1} of {steps.length}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex min-h-[220px] flex-col justify-between gap-4">
            <AnimatePresence mode="wait">
              <motion.div key={step?.id} {...slide} className="space-y-3">
                <h3 className="text-subheading text-balance">{step.title}</h3>
                <p className="text-caption text-pretty text-muted-foreground leading-relaxed">{step.body}</p>
                {step.href && step.action ? (
                  <Button variant="outline" size="sm" asChild className="mt-2">
                    <Link href={step.href}>{step.action}</Link>
                  </Button>
                ) : null}
              </motion.div>
            </AnimatePresence>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-4">
              <Button type="button" variant="ghost" size="sm" onClick={goBack} disabled={stepIndex === 0}>
                Back
              </Button>
              <div className="flex gap-2">
                {!isLast ? (
                  <Button type="button" size="sm" onClick={goNext}>
                    Next
                  </Button>
                ) : (
                  <Button type="button" size="sm" variant="secondary" onClick={() => setStepIndex(0)}>
                    Restart tour
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {scope === "INTERNAL" ? (
        <section className="rounded-xl border bg-muted/20 p-4 sm:p-5">
          <h3 className="font-medium">How the CRM fits together</h3>
          <ol className="mt-3 grid gap-2 text-caption text-muted-foreground sm:grid-cols-2 lg:grid-cols-3">
            <li className="rounded-lg border bg-card px-3 py-2">1. Admin creates workspace & team</li>
            <li className="rounded-lg border bg-card px-3 py-2">2. PM adds clients & portal</li>
            <li className="rounded-lg border bg-card px-3 py-2">3. PM runs projects on the board</li>
            <li className="rounded-lg border bg-card px-3 py-2">4. Team updates assigned tasks</li>
            <li className="rounded-lg border bg-card px-3 py-2">5. Client approves in portal</li>
            <li className="rounded-lg border bg-card px-3 py-2">6. Change requests loop back to staff</li>
          </ol>
        </section>
      ) : null}
    </div>
  );
}
