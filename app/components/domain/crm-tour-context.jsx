"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

import {
  buildMasterTour,
  resolveStartStepId,
  stepIndexById,
} from "@/app/lib/guide/tour-steps";
import {
  clearTourProgress,
  loadTourProgress,
  saveTourProgress,
} from "@/app/lib/guide/tour-progress";
import { stepIdAfterNavigation } from "@/app/lib/guide/tour-routes";

/** @typedef {import('@/app/lib/guide/tour-steps').TourScope} TourScope */

const CrmTourContext = createContext(null);

/**
 * @param {{ scope: TourScope, role: string, children: React.ReactNode }} props
 */
export function CrmTourProvider({ scope, role, children }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [stepId, setStepId] = useState(null);
  const [hydrated, setHydrated] = useState(false);

  const masterSteps = useMemo(() => buildMasterTour(scope, role), [scope, role]);
  const stepIndex = stepId ? stepIndexById(masterSteps, stepId) : -1;
  const step = stepIndex >= 0 ? masterSteps[stepIndex] : null;
  const isLast = step?.finish === true || stepIndex >= masterSteps.length - 1;

  const persistStep = useCallback(
    (id, active) => {
      if (!id) return;
      if (active) {
        saveTourProgress(scope, role, { active: true, stepId: id });
      } else {
        clearTourProgress(scope, role);
      }
    },
    [scope, role],
  );

  const close = useCallback(() => {
    setOpen(false);
    persistStep(stepId, false);
  }, [persistStep, stepId]);

  const goToStepId = useCallback(
    (id) => {
      if (!id || !masterSteps.some((item) => item.id === id)) return;
      setStepId(id);
      if (open) persistStep(id, true);
    },
    [masterSteps, open, persistStep],
  );

  const startTour = useCallback(
    (currentPathname, { restart = false } = {}) => {
      if (restart) clearTourProgress(scope, role);

      const progress = restart ? null : loadTourProgress(scope, role);
      const resumeId = progress?.active ? progress.stepId : null;
      const id = resolveStartStepId(masterSteps, currentPathname, resumeId);

      if (!id) return;

      setStepId(id);
      setOpen(true);
      saveTourProgress(scope, role, { active: true, stepId: id });
    },
    [masterSteps, scope, role],
  );

  const restartTour = useCallback(() => {
    clearTourProgress(scope, role);
    const first = masterSteps[0];
    if (!first) return;
    setStepId(first.id);
    setOpen(true);
    saveTourProgress(scope, role, { active: true, stepId: first.id });
  }, [masterSteps, scope, role]);

  const nextStep = useCallback(() => {
    if (stepIndex < 0) return;
    const next = masterSteps[stepIndex + 1];
    if (!next) {
      setOpen(false);
      clearTourProgress(scope, role);
      return;
    }
    goToStepId(next.id);
  }, [stepIndex, masterSteps, goToStepId, scope, role]);

  const skipStep = useCallback(() => {
    nextStep();
  }, [nextStep]);

  const skipAll = useCallback(() => {
    close();
  }, [close]);

  const navigateWithTour = useCallback(
    (href) => {
      if (stepId) persistStep(stepId, true);
      setOpen(true);
    },
    [persistStep, stepId],
  );

  // Resume active tour after refresh
  useEffect(() => {
    const progress = loadTourProgress(scope, role);
    if (progress?.active && progress.stepId) {
      setStepId(progress.stepId);
      setOpen(true);
    }
    setHydrated(true);
  }, [scope, role]);

  // Advance when user navigates to the next guide page (e.g. after "Create company")
  useEffect(() => {
    if (!hydrated || !open || !stepId) return;

    const nextId = stepIdAfterNavigation(pathname, stepId, masterSteps);
    if (nextId !== stepId) {
      setStepId(nextId);
      saveTourProgress(scope, role, { active: true, stepId: nextId });
    }
  }, [pathname, hydrated, open, stepId, masterSteps, scope, role]);

  const value = useMemo(
    () => ({
      open,
      scope,
      role,
      masterSteps,
      steps: masterSteps,
      step,
      stepIndex: stepIndex >= 0 ? stepIndex : 0,
      isLast,
      startTour,
      restartTour,
      nextStep,
      skipStep,
      skipAll,
      close,
      navigateWithTour,
    }),
    [
      open,
      scope,
      role,
      masterSteps,
      step,
      stepIndex,
      isLast,
      startTour,
      restartTour,
      nextStep,
      skipStep,
      skipAll,
      close,
      navigateWithTour,
    ],
  );

  return <CrmTourContext.Provider value={value}>{children}</CrmTourContext.Provider>;
}

export function useCrmTour() {
  const ctx = useContext(CrmTourContext);
  if (!ctx) {
    throw new Error("useCrmTour must be used within CrmTourProvider");
  }
  return ctx;
}
