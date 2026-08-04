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

    // Exact match only. A plain route like "/companies" must NOT also match
    // "/companies/<id>" — that sub-path has its own, more specific `:id`
    // step. Genuine "this page and everything under it" intent has to opt in
    // via the explicit "/*" suffix above.
    return path === pattern;
  });
}

/**
 * If `pathname` already sits under the same `:id` entity a `targetRoute`
 * needs (e.g. moving from `/projects/abc/board` to `/projects/abc/change-requests`),
 * return that id so the tour can navigate there directly. Returns null when
 * the current page isn't under a matching prefix (different entity type
 * entirely, or a list page with no id yet) — the caller should leave
 * navigation to the app itself in that case.
 *
 * @param {string} pathname
 * @param {string} targetRoute
 */
export function idFromCurrentPath(pathname, targetRoute) {
  const targetSegments = targetRoute.split("/").filter(Boolean);
  const idIndex = targetSegments.indexOf(":id");
  if (idIndex === -1) return null;

  const prefix = targetSegments.slice(0, idIndex);
  const currentSegments = pathname.split("/").filter(Boolean);
  if (currentSegments.length <= idIndex) return null;

  const prefixMatches = prefix.every(
    (segment, i) => currentSegments[i]?.toLowerCase() === segment.toLowerCase(),
  );
  if (!prefixMatches) return null;

  const candidate = currentSegments[idIndex];
  if (!candidate || candidate === "new" || candidate === "edit") return null;
  return candidate;
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

  // The step's own "open create form" link was followed — that's a more
  // specific match than the step's general `routes`, so check it first and
  // advance past this step.
  if (current?.actionHref && matchTourRoutes(pathname, [current.actionHref])) {
    for (let i = currentIdx + 1; i < masterSteps.length; i += 1) {
      const step = masterSteps[i];
      if (step.routes && matchTourRoutes(pathname, step.routes)) return step.id;
    }
    const next = masterSteps[currentIdx + 1];
    return next?.id ?? currentStepId;
  }

  // Already on the step that matches this page (e.g. the tour itself just
  // navigated here) — don't skip past it looking for a later match.
  if (current?.routes && matchTourRoutes(pathname, current.routes)) {
    return currentStepId;
  }

  for (let i = currentIdx + 1; i < masterSteps.length; i += 1) {
    const step = masterSteps[i];
    if (step.routes && matchTourRoutes(pathname, step.routes)) return step.id;
  }

  return currentStepId;
}
