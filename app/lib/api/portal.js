import { asArray } from "@/app/lib/api/safe-list";
import { toUiStatus } from "@/app/lib/api/normalize";
import { awaitingParty, isOverdue, responseDueAt } from "@/app/lib/change-requests";

function upperEnum(value) {
  return value ? String(value).toUpperCase() : value;
}

/** @param {Record<string, unknown> | null | undefined} approval */
function normalizeApproval(approval) {
  if (!approval) return approval;
  return {
    ...approval,
    approverType: upperEnum(approval.approverType),
    status: upperEnum(approval.status),
  };
}

/** @param {Record<string, unknown> | null | undefined} milestone */
function normalizePortalMilestone(milestone) {
  if (!milestone) return milestone;
  return {
    ...milestone,
    status: upperEnum(milestone.status)?.replace("NOT_STARTED", "NOT_STARTED") ?? milestone.status,
    dueDate: milestone.dueDate ?? null,
    approvedAt: milestone.approvedAt ?? null,
    requiresClientApproval: milestone.requiresClientApproval ?? false,
    approvals: (milestone.approvals ?? []).map(normalizeApproval),
  };
}

/** @param {Record<string, unknown> | null | undefined} project */
export function normalizePortalProject(project) {
  if (!project) return project;

  const flatMilestones =
    project.milestones?.length > 0
      ? project.milestones
      : (project.phases ?? []).flatMap((phase) => phase.milestones ?? []);

  return {
    ...project,
    status: toUiStatus("projectStatus", project.status),
    health: toUiStatus("projectHealth", project.health),
    completionPercent: project.completionPercent ?? 0,
    startDate: project.startDate ?? null,
    endDate: project.endDate ?? null,
    milestones: flatMilestones.map(normalizePortalMilestone),
    phases: (project.phases ?? []).map((phase) => ({
      ...phase,
      milestones: (phase.milestones ?? []).map(normalizePortalMilestone),
    })),
    tasks: project.tasks ?? [],
    documents: (project.documents ?? []).map((doc) => ({
      ...doc,
      name: doc.fileUrl?.split("/").pop() ?? "Document",
      sizeBytes: doc.sizeBytes ?? 0,
      createdAt: doc.createdAt ?? null,
    })),
    changeRequests: (project.changeRequests ?? []).map(normalizePortalChangeRequest),
    projectManager: project.projectManager ?? null,
  };
}

/** @param {unknown} value */
export function normalizePortalProjects(value) {
  return asArray(value).map((project) => normalizePortalProject(project));
}

/** @param {Record<string, unknown> | null | undefined} cr */
export function normalizePortalChangeRequest(cr) {
  if (!cr) return cr;
  const normalized = {
    ...cr,
    status: toUiStatus("changeRequestStatus", cr.status),
    priority: upperEnum(cr.priority),
    type: upperEnum(cr.type),
    reference: cr.reference ?? String(cr.id).slice(0, 8),
    updatedAt: cr.updatedAt ?? cr.createdAt,
    impactCost: cr.impactCost ?? null,
    impactTimelineDays: cr.impactTimelineDays ?? null,
    impactHours: cr.impactHours ?? null,
    project: cr.project ?? { id: cr.projectId, name: "Project" },
    approvals: (cr.approvals ?? []).map(normalizeApproval),
    attachments: cr.attachments ?? [],
    comments: cr.comments ?? [],
  };
  normalized.awaitingParty = awaitingParty(normalized);
  // The backend now computes these from the org's real SLA setting; the local
  // helpers are a fallback for mock mode only — see app/lib/change-requests.js.
  normalized.responseDueAt = cr.responseDueAt ?? responseDueAt(normalized);
  normalized.isOverdue = cr.isOverdue ?? isOverdue(normalized);
  return normalized;
}

/** @param {unknown} value */
export function normalizePortalChangeRequests(value) {
  return asArray(value).map((cr) => normalizePortalChangeRequest(cr));
}

/** @param {{ firstName?: string, lastName?: string }} contact */
export function portalContactName(contact) {
  return [contact?.firstName, contact?.lastName].filter(Boolean).join(" ").trim() || null;
}

/** Map UI form values to backend createChangeRequest variables. */
export function toCreateChangeRequestVariables(values) {
  const typeMap = {
    SCOPE_ADDITION: "scope_addition",
    SCOPE_REDUCTION: "scope_reduction",
    TIMELINE_CHANGE: "timeline_change",
    BUDGET_CHANGE: "budget_change",
    BUGFIX: "bugfix",
    OTHER: "other",
  };
  const priorityMap = {
    LOW: "low",
    MEDIUM: "medium",
    HIGH: "high",
    URGENT: "urgent",
  };
  return {
    projectId: values.projectId,
    title: values.title,
    type: typeMap[values.type] ?? String(values.type).toLowerCase(),
    description: values.description,
    priority: priorityMap[values.priority] ?? String(values.priority).toLowerCase(),
    desiredDueDate: values.desiredDueDate || undefined,
  };
}
