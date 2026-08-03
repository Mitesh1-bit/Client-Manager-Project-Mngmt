"use client";

import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CircleHelp, Sparkles } from "lucide-react";

import { Button } from "@/app/components/ui/button";
import { ROLE_WELCOME_HINT } from "@/app/lib/guide/tour-steps";
import { cn } from "@/app/lib/utils";

import { useCrmTour } from "./crm-tour-context";

const PAD = 8;
const GAP = 12;
const VIEWPORT_MARGIN = 16;

/** @typedef {{ top: number, left: number, width: number, height: number }} TargetRect */
/** @typedef {{ top: number, left: number, placement: string }} TooltipPosition */

function useTargetRect(targetId, open, stepIndex) {
  const [rect, setRect] = useState(null);

  const measure = useCallback(() => {
    if (!targetId) {
      setRect(null);
      return;
    }
    const el = document.querySelector(`[data-tour="${targetId}"]`);
    if (!el) {
      setRect(null);
      return;
    }
    el.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
    const box = el.getBoundingClientRect();
    setRect({
      top: box.top - PAD,
      left: box.left - PAD,
      width: box.width + PAD * 2,
      height: box.height + PAD * 2,
    });
  }, [targetId]);

  useEffect(() => {
    if (!open) return undefined;
    measure();
    const onLayout = () => measure();
    window.addEventListener("resize", onLayout);
    window.addEventListener("scroll", onLayout, true);
    return () => {
      window.removeEventListener("resize", onLayout);
      window.removeEventListener("scroll", onLayout, true);
    };
  }, [open, stepIndex, measure]);

  return rect;
}

/**
 * Pick a position that keeps the tooltip fully inside the viewport.
 *
 * @param {string | undefined} preferred
 * @param {TargetRect} rect
 * @param {{ width: number, height: number }} size
 * @param {string | undefined} targetId
 */
function computeTooltipPosition(preferred, rect, size, targetId) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const { width: tw, height: th } = size;
  const isSidebarTarget = targetId?.startsWith("nav-") || targetId === "account-menu";

  /** @type {Array<'right' | 'left' | 'bottom' | 'top'>} */
  const candidates = [];

  if (isSidebarTarget) {
    candidates.push("right", "bottom", "top", "left");
  } else if (preferred === "right" || preferred === "left" || preferred === "top" || preferred === "bottom") {
    candidates.push(preferred, "bottom", "top", "right", "left");
  } else {
    candidates.push("bottom", "top", "right", "left");
  }

  const unique = [...new Set(candidates)];

  for (const placement of unique) {
    let top = 0;
    let left = 0;

    switch (placement) {
      case "right":
        left = rect.left + rect.width + GAP;
        top = rect.top + rect.height / 2 - th / 2;
        break;
      case "left":
        left = rect.left - GAP - tw;
        top = rect.top + rect.height / 2 - th / 2;
        break;
      case "top":
        top = rect.top - GAP - th;
        left = rect.left + rect.width / 2 - tw / 2;
        break;
      case "bottom":
      default:
        top = rect.top + rect.height + GAP;
        left = rect.left + rect.width / 2 - tw / 2;
        break;
    }

    top = Math.max(VIEWPORT_MARGIN, Math.min(top, vh - th - VIEWPORT_MARGIN));
    left = Math.max(VIEWPORT_MARGIN, Math.min(left, vw - tw - VIEWPORT_MARGIN));

    const fitsVertically = top >= VIEWPORT_MARGIN && top + th <= vh - VIEWPORT_MARGIN;
    const fitsHorizontally = left >= VIEWPORT_MARGIN && left + tw <= vw - VIEWPORT_MARGIN;

    if (fitsVertically && fitsHorizontally) {
      return { top, left, placement };
    }
  }

  return {
    top: Math.max(VIEWPORT_MARGIN, Math.min(rect.top, vh - th - VIEWPORT_MARGIN)),
    left: Math.max(VIEWPORT_MARGIN, Math.min(rect.left + rect.width + GAP, vw - tw - VIEWPORT_MARGIN)),
    placement: "right",
  };
}

export function CrmProductTour() {
  const reduceMotion = useReducedMotion();
  const { open, step, stepIndex, steps, role, scope, nextStep, skipStep, skipAll, close, restartTour } = useCrmTour();
  const rect = useTargetRect(step?.target, open, stepIndex);
  const tooltipRef = useRef(null);
  const [tooltipPos, setTooltipPos] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) {
      setAnimateIn(false);
      return undefined;
    }
    setAnimateIn(false);
    const id = requestAnimationFrame(() => setAnimateIn(true));
    return () => cancelAnimationFrame(id);
  }, [open, stepIndex]);

  const isInteractive = Boolean(step?.interactive);
  const isCenter =
    step?.placement === "center" || (!step?.target && !isInteractive) || (!rect && !isInteractive);

  useLayoutEffect(() => {
    if (!open || isCenter || !rect || !tooltipRef.current) {
      setTooltipPos(null);
      return;
    }

    const measure = () => {
      const el = tooltipRef.current;
      if (!el || !rect) return;
      const size = { width: el.offsetWidth, height: el.offsetHeight };
      setTooltipPos(computeTooltipPosition(step?.placement, rect, size, step?.target));
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(tooltipRef.current);
    window.addEventListener("resize", measure);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [open, isCenter, rect, step?.placement, step?.target, stepIndex]);

  if (!mounted || !open || !step) return null;

  const animateSteps = animateIn && !reduceMotion;
  const welcomeHint = step.id === "internal-welcome" ? ROLE_WELCOME_HINT[role] : null;
  const portalHint =
    step.id === "portal-welcome" ? "You're signed in as a client contact — staff use a separate login." : null;
  const hint = welcomeHint ?? portalHint;
  const showSpotlight = !isCenter && Boolean(rect);
  const showBlockingOverlay = !isInteractive && (showSpotlight || step?.placement === "center");

  const content = (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="tour-root"
          className={cn("fixed inset-0 z-[100]", isInteractive && "pointer-events-none")}
          initial={false}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.2 }}
          role={isInteractive ? "complementary" : "dialog"}
          aria-modal={isInteractive ? undefined : "true"}
          aria-labelledby="crm-tour-title"
          aria-describedby="crm-tour-body"
        >
          {showSpotlight ? (
            <>
              <div
                className={cn(
                  "pointer-events-none absolute rounded-lg border-2 border-primary shadow-[0_0_0_4px_rgba(59,130,246,0.25)]",
                  isInteractive && "z-[101]",
                )}
                style={{
                  top: rect.top,
                  left: rect.left,
                  width: rect.width,
                  height: rect.height,
                  zIndex: 101,
                }}
              />
              {!isInteractive ? (
                <div
                  className="pointer-events-none absolute inset-0 bg-black/50"
                  style={{ clipPath: clipSpotlight(rect), zIndex: 100 }}
                />
              ) : null}
            </>
          ) : showBlockingOverlay ? (
            <div className="pointer-events-auto absolute inset-0 bg-black/50" aria-hidden="true" />
          ) : null}

          <motion.div
            ref={tooltipRef}
            key={step.id}
            className={cn(
              "pointer-events-auto z-[102] flex max-h-[min(24rem,calc(100vh-2rem))] w-[min(22rem,calc(100vw-2rem))] flex-col rounded-xl border bg-card p-4 shadow-2xl",
              isInteractive && "ring-2 ring-primary/20",
              isCenter && "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
              !isCenter && !tooltipPos && "fixed opacity-0",
            )}
            style={
              isCenter
                ? undefined
                : tooltipPos
                  ? { position: "fixed", top: tooltipPos.top, left: tooltipPos.left }
                  : { position: "fixed", top: VIEWPORT_MARGIN, left: VIEWPORT_MARGIN, visibility: "hidden" }
            }
            initial={animateSteps ? { opacity: 0, y: isCenter ? 8 : 10, scale: 0.98 } : false}
            animate={{ opacity: isCenter || tooltipPos ? 1 : 0, y: 0, scale: 1 }}
            exit={animateSteps ? { opacity: 0, y: 8, scale: 0.98 } : undefined}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            {!isCenter && tooltipPos && rect ? (
              <TourPointer placement={tooltipPos.placement} rect={rect} tooltipRect={tooltipPos} />
            ) : null}

            <div className="mb-3 flex shrink-0 items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-primary">
                {step.finish ? (
                  <Sparkles aria-hidden="true" className="size-4" />
                ) : (
                  <CircleHelp aria-hidden="true" className="size-4" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-caption font-medium text-primary">
                  Step {stepIndex + 1} of {steps.length}
                  {scope === "PORTAL" ? " · Client portal" : ""}
                </p>
                <h2 id="crm-tour-title" className="mt-0.5 text-subheading text-balance">
                  {step.title}
                </h2>
              </div>
            </div>

            <p id="crm-tour-body" className="min-h-0 flex-1 overflow-y-auto text-caption text-pretty text-muted-foreground leading-relaxed">
              {step.body}
            </p>
            {step.example ? (
              <p className="mt-2 shrink-0 rounded-lg border border-dashed bg-muted/40 px-3 py-2 text-caption text-pretty text-foreground/85">
                <span className="font-medium">Example: </span>
                {step.example}
              </p>
            ) : null}
            {isInteractive ? (
              <p className="mt-2 shrink-0 text-caption text-primary/90">
                You can edit this field now — click Next when ready.
              </p>
            ) : null}
            {hint ? <p className="mt-2 shrink-0 text-caption text-pretty text-foreground/80">{hint}</p> : null}

            {step.actionHref && step.actionLabel ? (
              <Button variant="outline" size="sm" asChild className="mt-3 shrink-0 self-start">
                <Link href={step.actionHref}>{step.actionLabel}</Link>
              </Button>
            ) : null}

            <div className="mt-4 flex shrink-0 flex-wrap items-center justify-between gap-2 border-t pt-3">
              <div className="flex flex-wrap gap-1">
                <Button type="button" variant="ghost" size="sm" onClick={skipAll}>
                  Skip all
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={restartTour}>
                  Restart
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {!step.finish ? (
                  <Button type="button" variant="outline" size="sm" onClick={skipStep}>
                    Skip step
                  </Button>
                ) : null}
                <Button type="button" size="sm" onClick={step.finish ? close : nextStep}>
                  {step.finish ? "Done" : "Next"}
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}

/**
 * Small arrow pointing from the tooltip toward the highlighted target.
 *
 * @param {{ placement: string, rect: TargetRect, tooltipRect: TooltipPosition }} props
 */
function TourPointer({ placement, rect, tooltipRect }) {
  const targetCenterY = rect.top + rect.height / 2;
  const arrowTop = Math.max(16, Math.min(targetCenterY - tooltipRect.top - 8, 200));

  if (placement !== "right") return null;

  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute left-0 size-3 -translate-x-[calc(100%-1px)] rotate-45 border border-border bg-card"
      style={{ top: arrowTop }}
    />
  );
}

/** @param {TargetRect} rect */
function clipSpotlight(rect) {
  const { top, left, width, height } = rect;
  const r = 8;
  const x = left;
  const y = top;
  const w = width;
  const h = height;
  return `polygon(
    0% 0%, 0% 100%, 100% 100%, 100% 0%, 0% 0%,
    ${x}px 0%,
    ${x}px ${y + r}px,
    ${x + r}px ${y}px,
    ${x + w - r}px ${y}px,
    ${x + w}px ${y + r}px,
    ${x + w}px ${y + h - r}px,
    ${x + w - r}px ${y + h}px,
    ${x + r}px ${y + h}px,
    ${x}px ${y + h - r}px,
    ${x}px 0%
  )`;
}
