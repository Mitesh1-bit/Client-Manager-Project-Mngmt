/**
 * Match tour step routes against the current pathname.
 * Supports exact paths, prefixes, and `:id` dynamic segments.
 *
 * @param {string} pathname
 * @param {string[]} routes
 */
export function matchTourRoutes(pathname, routes) {
  const path = (pathname.replace(/\/$/, "") || "/").toLowerCase();
  const segments = path.split("/").filter(Boolean);

  return routes.some((route) => {
    const pattern = route.toLowerCase();

    if (pattern.includes(":id")) {
      const regex = new RegExp(`^${pattern.replace(/:id/g, "[^/]+")}$`);
      if (!regex.test(path)) return false;
      const idSegment = segments[1];
      if (idSegment === "new" || idSegment === "edit") return false;
      return true;
    }

    if (pattern.endsWith("/*")) {
      const prefix = pattern.slice(0, -2);
      return path === prefix || path.startsWith(`${prefix}/`);
    }

    return path === pattern || path.startsWith(`${pattern}/`);
  });
}

/**
 * @param {import('./tour-steps').TourStep[]} steps
 * @param {string} pathname
 */
export function firstStepForPath(steps, pathname) {
  return steps.find((step) => step.routes && matchTourRoutes(pathname, step.routes)) ?? null;
}

/**
 * Advance tour when user navigates to a page that matches a later step.
 *
 * @param {string} pathname
 * @param {string} currentStepId
 * @param {import('./tour-steps').TourStep[]} masterSteps
 */
export function stepIdAfterNavigation(pathname, currentStepId, masterSteps) {
  const currentIdx = masterSteps.findIndex((step) => step.id === currentStepId);
  if (currentIdx < 0) return currentStepId;

  const current = masterSteps[currentIdx];

  if (current?.actionHref && matchTourRoutes(pathname, [current.actionHref])) {
    for (let i = currentIdx + 1; i < masterSteps.length; i += 1) {
      const step = masterSteps[i];
      if (step.routes && matchTourRoutes(pathname, step.routes)) return step.id;
    }
    const next = masterSteps[currentIdx + 1];
    return next?.id ?? currentStepId;
  }

  for (let i = currentIdx + 1; i < masterSteps.length; i += 1) {
    const step = masterSteps[i];
    if (step.routes && matchTourRoutes(pathname, step.routes)) return step.id;
  }

  return currentStepId;
}
