/**
 * Change-request lifecycle.
 *
 * The frontend prompt points at §7.3 of the master plan for the flow but the
 * text isn't in the brief, so the state machine below is inferred from
 * `ChangeRequestStatus` plus the three mutations the contract already names
 * (create → assess → decide). Anything the backend defines differently should
 * replace this wholesale — it lives in one module for that reason, and the
 * transitions are logged in NEEDED_SCHEMA_CHANGES.md §8.2 for confirmation.
 *
 * Everything here is pure, so the queue, the internal detail view and the
 * portal can never disagree about what state a request is in.
 */

/** Statuses where the request has not yet been decided. */
export const OPEN_STATUSES = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "PENDING_IMPACT_ASSESSMENT",
  "PENDING_APPROVAL",
  "ON_HOLD",
];

/** Decided, but the work isn't finished. */
export const ACTIVE_STATUSES = ["APPROVED", "IN_PROGRESS"];

export const CLOSED_STATUSES = ["REJECTED", "IMPLEMENTED", "CLOSED"];

/**
 * How long the current holder has to respond, in days, before the request
 * counts as overdue. The backend now owns this for real (single org-level
 * `cr_response_sla_days` setting, exposed as `ChangeRequestType.responseDueAt`
 * / `isOverdue` — see §8.3) — every real API response already carries those
 * fields, so `responseDueAt()`/`isOverdue()` below only run as a fallback for
 * mock mode. This per-status table was always a guess at the real shape and
 * intentionally doesn't match the backend's flat number; don't "fix" it to
 * match — replace it if the mock's org settings model changes instead.
 */
export const RESPONSE_SLA_DAYS = {
  SUBMITTED: 2,
  UNDER_REVIEW: 3,
  PENDING_IMPACT_ASSESSMENT: 5,
  PENDING_APPROVAL: 5,
};

/**
 * Legal transitions for the "move it along" mutation. Assessment and decision
 * have their own mutations and are not listed here.
 */
const TRANSITIONS = {
  SUBMITTED: ["UNDER_REVIEW", "ON_HOLD", "CLOSED"],
  UNDER_REVIEW: ["PENDING_IMPACT_ASSESSMENT", "ON_HOLD", "CLOSED"],
  PENDING_IMPACT_ASSESSMENT: ["UNDER_REVIEW", "ON_HOLD", "CLOSED"],
  PENDING_APPROVAL: ["ON_HOLD", "CLOSED"],
  ON_HOLD: ["UNDER_REVIEW", "PENDING_IMPACT_ASSESSMENT", "PENDING_APPROVAL", "CLOSED"],
  APPROVED: ["IN_PROGRESS", "ON_HOLD", "CLOSED"],
  IN_PROGRESS: ["IMPLEMENTED", "ON_HOLD"],
  IMPLEMENTED: ["CLOSED"],
  REJECTED: ["CLOSED"],
  CLOSED: [],
};

export function allowedTransitions(status) {
  return TRANSITIONS[status] ?? [];
}

export function canTransition(from, to) {
  return allowedTransitions(from).includes(to);
}

export const isOpen = (status) => OPEN_STATUSES.includes(status);
export const isDecided = (status) => !isOpen(status);

/**
 * Who the request is sitting with. This is the change-request equivalent of
 * the milestone approval question from Phase 4: the queue, the detail view and
 * the portal all render from this one answer.
 *
 * @param {{ status: string, approvals?: Array<object> }} request
 * @returns {'AGENCY' | 'CLIENT' | 'NOBODY'}
 */
export function awaitingParty(request) {
  if (request.status === "PENDING_APPROVAL") {
    const pending = (request.approvals ?? []).filter(
      (approval) => approval.status === "PENDING",
    );
    // Internal sign-off is required before the client is asked, so an
    // outstanding internal approval keeps it on the agency's side.
    if (pending.some((approval) => approval.approverType === "INTERNAL")) return "AGENCY";
    if (pending.some((approval) => approval.approverType === "CLIENT")) return "CLIENT";
    return "AGENCY";
  }

  if (["SUBMITTED", "UNDER_REVIEW", "PENDING_IMPACT_ASSESSMENT", "IN_PROGRESS"].includes(request.status)) {
    return "AGENCY";
  }

  return "NOBODY";
}

/**
 * When the current holder needs to respond by. Null once the request has been
 * decided or parked — an on-hold request is waiting on a decision that has no
 * clock attached.
 *
 * @param {{ status: string, updatedAt: string }} request
 */
export function responseDueAt(request) {
  const days = RESPONSE_SLA_DAYS[request.status];
  if (days === undefined) return null;

  const from = new Date(request.updatedAt);
  if (Number.isNaN(from.getTime())) return null;

  return new Date(from.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
}

export function isOverdue(request, now = Date.now()) {
  const due = request.responseDueAt ?? responseDueAt(request);
  return Boolean(due) && new Date(due).getTime() < now;
}

/**
 * The single sentence each audience leads with. Written from the reader's
 * point of view — the client should never read agency jargon, and the PM
 * should never have to work out whether the ball is theirs.
 *
 * @param {object} request
 * @param {'INTERNAL' | 'CLIENT'} audience
 */
export function nextAction(request, audience = "INTERNAL") {
  const party = request.awaitingParty ?? awaitingParty(request);
  const client = audience === "CLIENT";

  switch (request.status) {
    case "SUBMITTED":
      return client
        ? "We've received this and will come back to you shortly."
        : "Pick this up and start reviewing it.";
    case "UNDER_REVIEW":
      return client
        ? "We're reviewing what this would involve."
        : "Work out the impact, then send it for approval.";
    case "PENDING_IMPACT_ASSESSMENT":
      return client
        ? "We're costing this up for you."
        : "Add the cost, hours and timeline impact.";
    case "PENDING_APPROVAL":
      if (party === "CLIENT") {
        return client
          ? "Your approval is needed before we can start."
          : "Waiting on the client to approve.";
      }
      return client
        ? "This is with our team for internal sign-off."
        : "Waiting on internal sign-off.";
    case "APPROVED":
      return client
        ? "Approved — this is queued to be built."
        : "Approved. Schedule it and move it into progress.";
    case "REJECTED":
      return client ? "This one won't be going ahead." : "Rejected — nothing further to do.";
    case "ON_HOLD":
      return client
        ? "Parked for now. We'll pick it back up with you."
        : "Parked. Resume it when the blocker clears.";
    case "IN_PROGRESS":
      return client ? "We're building this now." : "In build. Mark it implemented when it ships.";
    case "IMPLEMENTED":
      return client ? "Delivered. Let us know if anything looks off." : "Delivered — close it off.";
    case "CLOSED":
      return client ? "Closed." : "Closed. Nothing further to do.";
    default:
      return client ? "We'll be in touch." : "No action defined for this status.";
  }
}

/** True when the request is ready for a PM to record an impact assessment. */
export function canAssess(request) {
  return ["SUBMITTED", "UNDER_REVIEW", "PENDING_IMPACT_ASSESSMENT", "ON_HOLD"].includes(
    request.status,
  );
}

/**
 * Whether a given approver may decide right now.
 *
 * @param {object} request
 * @param {'INTERNAL' | 'CLIENT'} approverType
 */
export function canDecide(request, approverType) {
  if (request.status !== "PENDING_APPROVAL") return false;

  const pending = (request.approvals ?? []).filter((approval) => approval.status === "PENDING");
  const mine = pending.filter((approval) => approval.approverType === approverType);
  if (mine.length === 0) return false;

  // Client approval is only asked for once internal sign-off has landed.
  if (approverType === "CLIENT") {
    return !pending.some((approval) => approval.approverType === "INTERNAL");
  }
  return true;
}

/** Net financial impact, or null when the request hasn't been assessed. */
export function isAssessed(request) {
  return (
    request.impactCost !== null &&
    request.impactCost !== undefined &&
    request.impactTimelineDays !== null &&
    request.impactTimelineDays !== undefined
  );
}

/**
 * Queue buckets for the org-wide dashboard, matching the three the brief names.
 * A request can sit in more than one (an overdue approval is both).
 */
export function queueBuckets(requests, now = Date.now()) {
  return {
    submitted: requests.filter((request) =>
      ["SUBMITTED", "UNDER_REVIEW", "PENDING_IMPACT_ASSESSMENT"].includes(request.status),
    ),
    pendingApproval: requests.filter((request) => request.status === "PENDING_APPROVAL"),
    overdue: requests.filter((request) => isOverdue(request, now)),
  };
}
