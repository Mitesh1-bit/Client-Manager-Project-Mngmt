/**
 * The single source of truth for how every status enum in the schema is
 * presented: label, colour tone, and an icon so status is never conveyed by
 * colour alone. Add new statuses here, not in components.
 *
 * Tones map to the `--tone-*` design tokens in app/globals.css.
 */

export const TONES = ["positive", "caution", "critical", "info", "neutral", "accent"];

const PROJECT_HEALTH = {
  ON_TRACK: { label: "On track", tone: "positive", icon: "check" },
  AT_RISK: { label: "At risk", tone: "caution", icon: "alert" },
  DELAYED: { label: "Delayed", tone: "critical", icon: "clock-alert" },
};

const PROJECT_STATUS = {
  PLANNING: { label: "Planning", tone: "info", icon: "draft" },
  ACTIVE: { label: "Active", tone: "accent", icon: "play" },
  ON_HOLD: { label: "On hold", tone: "neutral", icon: "pause" },
  COMPLETED: { label: "Completed", tone: "positive", icon: "check" },
  CANCELLED: { label: "Cancelled", tone: "neutral", icon: "cross" },
};

const COMPANY_STATUS = {
  LEAD: { label: "Lead", tone: "info", icon: "sparkle" },
  ACTIVE: { label: "Active", tone: "positive", icon: "check" },
  PAUSED: { label: "Paused", tone: "caution", icon: "pause" },
  CHURNED: { label: "Churned", tone: "critical", icon: "cross" },
};

const CONTACT_STATUS = {
  ACTIVE: { label: "Active", tone: "positive", icon: "check" },
  INACTIVE: { label: "Archived", tone: "neutral", icon: "archive" },
};

const MILESTONE_STATUS = {
  NOT_STARTED: { label: "Not started", tone: "neutral", icon: "circle" },
  IN_PROGRESS: { label: "In progress", tone: "info", icon: "progress" },
  AT_RISK: { label: "At risk", tone: "caution", icon: "alert" },
  COMPLETED: { label: "Completed", tone: "positive", icon: "check" },
};

const TASK_STATUS = {
  TODO: { label: "To do", tone: "neutral", icon: "circle" },
  IN_PROGRESS: { label: "In progress", tone: "info", icon: "progress" },
  REVIEW: { label: "In review", tone: "accent", icon: "eye" },
  DONE: { label: "Done", tone: "positive", icon: "check" },
};

const CHANGE_REQUEST_STATUS = {
  SUBMITTED: { label: "Submitted", tone: "info", icon: "inbox" },
  UNDER_REVIEW: { label: "Under review", tone: "info", icon: "eye" },
  PENDING_IMPACT_ASSESSMENT: { label: "Awaiting assessment", tone: "caution", icon: "clock" },
  PENDING_APPROVAL: { label: "Pending approval", tone: "caution", icon: "clock" },
  APPROVED: { label: "Approved", tone: "positive", icon: "check" },
  REJECTED: { label: "Rejected", tone: "critical", icon: "cross" },
  ON_HOLD: { label: "On hold", tone: "neutral", icon: "pause" },
  IN_PROGRESS: { label: "In progress", tone: "accent", icon: "progress" },
  IMPLEMENTED: { label: "Implemented", tone: "positive", icon: "check" },
  CLOSED: { label: "Closed", tone: "neutral", icon: "archive" },
};

const APPROVAL_STATUS = {
  PENDING: { label: "Pending", tone: "caution", icon: "clock" },
  APPROVED: { label: "Approved", tone: "positive", icon: "check" },
  REJECTED: { label: "Rejected", tone: "critical", icon: "cross" },
};

const TOUCHPOINT_STATUS = {
  SCHEDULED: { label: "Scheduled", tone: "info", icon: "calendar" },
  COMPLETED: { label: "Completed", tone: "positive", icon: "check" },
  SKIPPED: { label: "Skipped", tone: "neutral", icon: "skip" },
  OVERDUE: { label: "Overdue", tone: "critical", icon: "clock-alert" },
};

const TOUCHPOINT_OUTCOME = {
  POSITIVE: { label: "Positive", tone: "positive", icon: "check" },
  NEUTRAL: { label: "Neutral", tone: "neutral", icon: "circle" },
  AT_RISK: { label: "At risk", tone: "critical", icon: "alert" },
};

const PRIORITY = {
  LOW: { label: "Low", tone: "neutral", icon: "priority-low" },
  MEDIUM: { label: "Medium", tone: "info", icon: "priority-medium" },
  HIGH: { label: "High", tone: "caution", icon: "priority-high" },
  URGENT: { label: "Urgent", tone: "critical", icon: "priority-urgent" },
};

const ENROLLMENT_STATUS = {
  ACTIVE: { label: "Active", tone: "positive", icon: "play" },
  PAUSED: { label: "Paused", tone: "caution", icon: "pause" },
  COMPLETED: { label: "Completed", tone: "neutral", icon: "check" },
  CANCELLED: { label: "Cancelled", tone: "neutral", icon: "cross" },
};

const REGISTRY = {
  projectHealth: PROJECT_HEALTH,
  projectStatus: PROJECT_STATUS,
  companyStatus: COMPANY_STATUS,
  contactStatus: CONTACT_STATUS,
  milestoneStatus: MILESTONE_STATUS,
  // `PhaseStatus` and `MilestoneStatus` are separate enums in the schema with
  // identical members; they share one presentation until that stops being true.
  phaseStatus: MILESTONE_STATUS,
  taskStatus: TASK_STATUS,
  changeRequestStatus: CHANGE_REQUEST_STATUS,
  approvalStatus: APPROVAL_STATUS,
  touchpointStatus: TOUCHPOINT_STATUS,
  touchpointOutcome: TOUCHPOINT_OUTCOME,
  priority: PRIORITY,
  enrollmentStatus: ENROLLMENT_STATUS,
};

const UNKNOWN = { label: "Unknown", tone: "neutral", icon: "circle" };

/**
 * @param {keyof REGISTRY} kind
 * @param {string | null | undefined} value
 */
export function getStatusMeta(kind, value) {
  const group = REGISTRY[kind];
  if (!group) throw new Error(`Unknown status kind "${kind}".`);
  if (!value) return UNKNOWN;
  return group[value] ?? { ...UNKNOWN, label: humanize(value) };
}

/** @param {keyof REGISTRY} kind */
export function listStatuses(kind) {
  const group = REGISTRY[kind];
  if (!group) throw new Error(`Unknown status kind "${kind}".`);
  return Object.entries(group).map(([value, meta]) => ({ value, ...meta }));
}

/** @param {string} value */
export function humanize(value) {
  const lower = String(value).toLowerCase().replace(/_/g, " ");
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

/**
 * Client health score bands, shared by the badge, the at-risk dashboard and
 * any list filter that needs "healthy / watch / at risk".
 *
 * @param {number | null | undefined} score
 */
export function getHealthBand(score) {
  if (score === null || score === undefined) return { label: "Not scored", tone: "neutral" };
  if (score >= 70) return { label: "Healthy", tone: "positive" };
  if (score >= 45) return { label: "Watch", tone: "caution" };
  return { label: "At risk", tone: "critical" };
}

/**
 * @param {number[]} history oldest-first health scores
 * @returns {{ direction: 'up' | 'down' | 'flat', delta: number }}
 */
export function getHealthTrend(history) {
  if (!Array.isArray(history) || history.length < 2) return { direction: "flat", delta: 0 };
  const delta = history[history.length - 1] - history[history.length - 2];
  if (delta > 1) return { direction: "up", delta };
  if (delta < -1) return { direction: "down", delta };
  return { direction: "flat", delta };
}
