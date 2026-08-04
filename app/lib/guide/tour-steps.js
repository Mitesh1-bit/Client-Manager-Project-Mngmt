/**
 * Interactive product-tour — master ordered steps with page detection & resume.
 */

import { firstStepForPath, matchTourRoutes } from "./tour-routes";
import { INTERNAL_TOUR_STEPS } from "./tour-steps-internal";
import { PORTAL_TOUR_STEPS } from "./tour-steps-portal";

/** @typedef {'INTERNAL' | 'PORTAL'} TourScope */
/** @typedef {'center' | 'bottom' | 'top' | 'right' | 'left'} TourPlacement */

/**
 * @typedef {Object} TourStep
 * @property {string} id
 * @property {TourScope} scope
 * @property {number} order
 * @property {string} title
 * @property {string} body
 * @property {string} [target]
 * @property {TourPlacement} [placement]
 * @property {string[]} [roles]
 * @property {string[]} [routes]
 * @property {string} [actionHref]
 * @property {string} [actionLabel]
 * @property {boolean} [interactive] allow editing — no blocking overlay, highlights field only
 * @property {string} [example] sample text showing what to enter
 * @property {boolean} [finish]
 */

export const TOUR_STEPS = [...INTERNAL_TOUR_STEPS, ...PORTAL_TOUR_STEPS];

export const ROLE_WELCOME_HINT = {
  admin: "As admin, you'll set up team, clients, and projects — this guide covers the full workflow.",
  account_manager: "As account manager, focus on companies, portal access, and retention steps.",
  project_manager: "As project manager, pay attention to projects, board, milestones, and change requests.",
  team_member: "As team member, you'll mainly use the project board to update assigned tasks.",
  finance_admin: "As finance admin, you have read-only access — creation steps are skipped for your role.",
  executive_viewer: "As executive viewer, you have a read-only overview — creation steps are skipped.",
};

/**
 * Full master tour for a role — sorted by order, role-filtered.
 *
 * @param {TourScope} scope
 * @param {string} role
 */
export function buildMasterTour(scope, role) {
  return TOUR_STEPS.filter((step) => {
    if (step.scope !== scope) return false;
    if (step.roles && !step.roles.includes(role)) return false;
    return true;
  }).sort((a, b) => a.order - b.order);
}

/**
 * Where to start: resume step, or first step matching current page, or welcome.
 *
 * Saved progress is stored per scope+role, not per page — someone can leave
 * mid-tour on one page (close the tab, click away without "Skip all") and
 * open a completely different page days later. Only honor the saved step if
 * it's actually reachable from here: either it's page-agnostic (no `routes`,
 * e.g. a sidebar nav step) or its routes match where we are right now.
 * Otherwise a stale resume would silently point at a step whose target can
 * never be found on this page — fall back to finding the right step for the
 * current page instead, same as starting fresh.
 *
 * @param {TourStep[]} masterSteps
 * @param {string} pathname
 * @param {string | null} resumeStepId
 */
export function resolveStartStepId(masterSteps, pathname, resumeStepId) {
  if (resumeStepId) {
    const resumeStep = masterSteps.find((step) => step.id === resumeStepId);
    if (resumeStep && (!resumeStep.routes || matchTourRoutes(pathname, resumeStep.routes))) {
      return resumeStepId;
    }
  }

  const pageStep = firstStepForPath(masterSteps, pathname);
  if (pageStep) return pageStep.id;

  return masterSteps[0]?.id ?? null;
}

/** @param {TourStep[]} masterSteps @param {string} stepId */
export function stepIndexById(masterSteps, stepId) {
  return masterSteps.findIndex((step) => step.id === stepId);
}

/** Legacy export for static guide page */
export function buildTourSteps(scope, role, pathname) {
  const master = buildMasterTour(scope, role);
  const startId = resolveStartStepId(master, pathname, null);
  const startIdx = stepIndexById(master, startId);
  return master.slice(startIdx >= 0 ? startIdx : 0);
}
