/** @typedef {{ active: boolean, stepId: string, updatedAt: number }} TourProgress */

export const TOUR_PROGRESS_KEY = "crm-tour-progress-v2";

/** @param {import('./tour-steps').TourScope} scope @param {string} role */
export function tourProgressStorageKey(scope, role) {
  return `${TOUR_PROGRESS_KEY}:${scope}:${role}`;
}

/** @param {import('./tour-steps').TourScope} scope @param {string} role */
export function loadTourProgress(scope, role) {
  try {
    const raw = localStorage.getItem(tourProgressStorageKey(scope, role));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.active || !parsed?.stepId) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** @param {import('./tour-steps').TourScope} scope @param {string} role @param {TourProgress} progress */
export function saveTourProgress(scope, role, progress) {
  try {
    localStorage.setItem(
      tourProgressStorageKey(scope, role),
      JSON.stringify({ ...progress, updatedAt: Date.now() }),
    );
  } catch {
    /* ignore quota errors */
  }
}

/** @param {import('./tour-steps').TourScope} scope @param {string} role */
export function clearTourProgress(scope, role) {
  try {
    localStorage.removeItem(tourProgressStorageKey(scope, role));
  } catch {
    /* ignore */
  }
}
