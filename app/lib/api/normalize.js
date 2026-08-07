/**
 * Maps backend snake_case / lowercase status values to UI enum keys.
 */

const TO_UI = {
  companyStatus: {
    lead: "LEAD",
    active: "ACTIVE",
    paused: "PAUSED",
    churned: "CHURNED",
  },
  contactStatus: {
    active: "ACTIVE",
    inactive: "INACTIVE",
  },
  projectStatus: {
    planning: "PLANNING",
    active: "ACTIVE",
    on_hold: "ON_HOLD",
    completed: "COMPLETED",
    cancelled: "CANCELLED",
  },
  projectHealth: {
    on_track: "ON_TRACK",
    at_risk: "AT_RISK",
    delayed: "DELAYED",
  },
  priority: {
    low: "LOW",
    medium: "MEDIUM",
    high: "HIGH",
    urgent: "URGENT",
  },
  taskStatus: {
    todo: "TODO",
    in_progress: "IN_PROGRESS",
    review: "REVIEW",
    done: "DONE",
  },
  phaseStatus: {
    not_started: "NOT_STARTED",
    in_progress: "IN_PROGRESS",
    at_risk: "AT_RISK",
    completed: "COMPLETED",
    on_hold: "ON_HOLD",
  },
  milestoneStatus: {
    not_started: "NOT_STARTED",
    in_progress: "IN_PROGRESS",
    at_risk: "AT_RISK",
    completed: "COMPLETED",
  },
  touchpointChannel: {
    email: "EMAIL",
    call: "CALL",
    meeting: "MEETING",
    internal_task: "INTERNAL_TASK",
  },
  preferredChannel: {
    email: "EMAIL",
    phone: "PHONE",
    meeting: "MEETING",
  },
  sequenceTriggerType: {
    manual: "MANUAL",
    on_company_created: "ON_COMPANY_CREATED",
    on_project_completed: "ON_PROJECT_COMPLETED",
    on_renewal_approaching: "ON_RENEWAL_APPROACHING",
  },
  sequenceStatus: {
    draft: "DRAFT",
    pending: "PENDING",
    approved: "APPROVED",
    rejected: "REJECTED",
    active: "ACTIVE",
  },
  sequenceSource: {
    ai: "AI",
    manual: "MANUAL",
  },
  changeRequestType: {
    scope_addition: "SCOPE_ADDITION",
    scope_reduction: "SCOPE_REDUCTION",
    timeline_change: "TIMELINE_CHANGE",
    budget_change: "BUDGET_CHANGE",
    bugfix: "BUGFIX",
    other: "OTHER",
  },
  changeRequestStatus: {
    submitted: "SUBMITTED",
    under_review: "UNDER_REVIEW",
    pending_impact_assessment: "PENDING_IMPACT_ASSESSMENT",
    pending_approval: "PENDING_APPROVAL",
    approved: "APPROVED",
    rejected: "REJECTED",
    on_hold: "ON_HOLD",
    in_progress: "IN_PROGRESS",
    implemented: "IMPLEMENTED",
    closed: "CLOSED",
  },
  contractStatus: {
    draft: "DRAFT",
    active: "ACTIVE",
    expired: "EXPIRED",
    cancelled: "CANCELLED",
  },
  invoiceStatus: {
    draft: "DRAFT",
    sent: "SENT",
    paid: "PAID",
    overdue: "OVERDUE",
    cancelled: "CANCELLED",
  },
};

const TO_API = Object.fromEntries(
  Object.entries(TO_UI).map(([kind, map]) => [
    kind,
    Object.fromEntries(Object.entries(map).map(([api, ui]) => [ui, api])),
  ]),
);

/** @param {keyof typeof TO_UI} kind @param {string | null | undefined} value */
export function toUiStatus(kind, value) {
  if (!value) return value;
  const upper = String(value).toUpperCase();
  if (TO_UI[kind]?.[value]) return TO_UI[kind][value];
  if (Object.values(TO_UI[kind] ?? {}).includes(upper)) return upper;
  return upper;
}

/** @param {keyof typeof TO_UI} kind @param {string | null | undefined} value */
export function toApiStatus(kind, value) {
  if (!value) return value;
  const lower = String(value).toLowerCase();
  return TO_API[kind]?.[value] ?? TO_API[kind]?.[String(value).toUpperCase()] ?? lower;
}

/** @param {{ firstName?: string, lastName?: string, email?: string | null }} contact */
export function contactFullName(contact) {
  const name = [contact?.firstName, contact?.lastName].filter(Boolean).join(" ").trim();
  return name || contact?.email || "Contact";
}

/** @param {Record<string, unknown> | null | undefined} company */
export function normalizeCompany(company) {
  if (!company) return company;
  const primary = company.primaryContact
    ? {
        ...company.primaryContact,
        fullName: contactFullName(company.primaryContact),
        status: toUiStatus("contactStatus", company.primaryContact.status),
      }
    : null;

  return {
    ...company,
    logoUrl: company.logoUrl ?? null,
    status: toUiStatus("companyStatus", company.status),
    healthScoreTrend: company.healthScoreTrend ?? [],
    tags: company.tags ?? [],
    activity: company.activity ?? [],
    openChangeRequestCount: company.openChangeRequestCount ?? 0,
    updatedAt: company.updatedAt ?? company.createdAt ?? new Date().toISOString(),
    primaryContact: primary,
    contacts: (company.contacts ?? []).map(normalizeContact),
  };
}

/** @param {Record<string, unknown> | null | undefined} contact */
export function normalizeContact(contact) {
  if (!contact) return contact;
  const preferredChannel = contact.preferredChannel
    ? toUiStatus("preferredChannel", contact.preferredChannel)
    : null;
  return {
    ...contact,
    fullName: contact.fullName ?? contactFullName(contact),
    status: toUiStatus("contactStatus", contact.status),
    preferredChannel,
    bestTimeToContact: contact.bestTimeToContact ?? null,
    tags: contact.tags ?? [],
    activity: contact.activity ?? [],
    touchpoints: contact.touchpoints ?? [],
    updatedAt: contact.updatedAt ?? new Date().toISOString(),
  };
}

/** @param {Record<string, unknown> | null | undefined} project @param {Map<string, { id: string, name: string, avatarUrl?: string | null }>} [usersById] @param {Map<string, { id: string, name: string }>} [companiesById] */
export function normalizeProject(project, usersById, companiesById) {
  if (!project) return project;
  const manager =
    project.projectManager ??
    (project.projectManagerId && usersById?.get(String(project.projectManagerId))) ??
    null;
  const company =
    project.company ??
    (project.companyId && companiesById?.get(String(project.companyId))) ??
    null;

  return {
    ...project,
    status: toUiStatus("projectStatus", project.status),
    health: toUiStatus("projectHealth", project.health),
    priority: toUiStatus("priority", project.priority) ?? null,
    tags: project.tags ?? [],
    team: project.members ?? [],
    completionPercent: project.completionPercent ?? 0,
    actualCost: project.actualCost ?? 0,
    budget: project.budget ?? null,
    startDate: project.startDate ?? null,
    endDate: project.endDate ?? null,
    updatedAt: project.updatedAt ?? new Date().toISOString(),
    projectManager: manager,
    company,
    phases: (project.phases ?? []).map((phase) => ({
      ...phase,
      milestones: phase.milestones ?? [],
      tasks: (phase.tasks ?? []).map((task) => normalizeTask(task, usersById)),
    })),
    tasks: (project.tasks ?? []).map((task) => normalizeTask(task, usersById)),
    milestones: (project.milestones ?? []).length
      ? project.milestones
      : (project.phases ?? []).flatMap((phase) =>
          (phase.milestones ?? []).map((milestone) => ({
            ...milestone,
            phase: { id: phase.id, name: phase.name },
          })),
        ),
  };
}

/** @param {Record<string, unknown>} task @param {Map<string, { id: string, name: string, avatarUrl?: string | null }>} [usersById] @param {Map<string, Record<string, unknown>>} [tasksById] */
export function normalizeTask(task, usersById, tasksById) {
  if (!task) return task;
  const assignee =
    task.assignee ?? (task.assigneeId && usersById?.get(String(task.assigneeId))) ?? null;
  return {
    ...task,
    assignee,
    orderIndex: task.orderIndex ?? 0,
    status: toUiStatus("taskStatus", task.status) ?? "TODO",
    priority: toUiStatus("priority", task.priority) ?? "MEDIUM",
    phase: task.phase ?? (task.phaseId ? { id: String(task.phaseId) } : null),
    startDate: task.startDate ?? null,
    dueDate: task.dueDate ?? null,
    subtasks: (task.subtasks ?? []).map((sub) => normalizeTask(sub, usersById, tasksById)),
    dependencies: (task.dependencies ?? []).map((dep) => {
      const dependsOn =
        dep.dependsOnTask ??
        (dep.dependsOnTaskId && tasksById?.get(String(dep.dependsOnTaskId))) ?? {
          id: dep.dependsOnTaskId,
          title: "Task",
          status: "TODO",
        };
      return { ...dep, dependsOnTask: dependsOn };
    }),
  };
}

/** @param {Record<string, unknown> | null | undefined} sequence */
export function normalizeRetentionSequence(sequence) {
  if (!sequence) return sequence;
  return {
    ...sequence,
    triggerType: toUiStatus("sequenceTriggerType", sequence.triggerType) ?? "MANUAL",
    status: toUiStatus("sequenceStatus", sequence.status) ?? "DRAFT",
    source: toUiStatus("sequenceSource", sequence.source) ?? "MANUAL",
    steps: (sequence.steps ?? []).map((step) => {
      const channel = toUiStatus("touchpointChannel", step.channel) ?? "CALL";
      return {
        ...step,
        channel,
        assigneeRole: step.assigneeRole ? String(step.assigneeRole).toUpperCase() : null,
      };
    }),
  };
}

/** @param {Record<string, unknown>} cr */
export function normalizeChangeRequest(cr) {
  if (!cr) return cr;
  return {
    ...cr,
    status: toUiStatus("changeRequestStatus", cr.status),
    reference: cr.reference ?? cr.id?.slice(0, 8),
    updatedAt: cr.updatedAt ?? cr.createdAt,
    comments: cr.comments ?? [],
    approvals: cr.approvals ?? [],
    attachments: cr.attachments ?? [],
  };
}

/** @param {Record<string, unknown>[]} companies @param {{ search?: string | null, status?: string[] | null, accountOwnerId?: string | null }} filter */
export function filterCompanies(companies, filter = {}) {
  let rows = companies;
  if (filter.search) {
    const q = filter.search.toLowerCase();
    rows = rows.filter(
      (row) =>
        row.name?.toLowerCase().includes(q) ||
        row.industry?.toLowerCase().includes(q) ||
        row.primaryContact?.fullName?.toLowerCase().includes(q),
    );
  }
  if (filter.status?.length) {
    const allowed = new Set(filter.status.map((s) => toUiStatus("companyStatus", s)));
    rows = rows.filter((row) => allowed.has(row.status));
  }
  if (filter.accountOwnerId) {
    rows = rows.filter((row) => row.accountOwner?.id === filter.accountOwnerId);
  }
  if (filter.tagIds?.length) {
    const allowed = new Set(filter.tagIds);
    rows = rows.filter((row) => (row.tags ?? []).some((tag) => allowed.has(tag.id)));
  }
  return rows;
}

/** @param {Record<string, unknown>[]} projects @param {{ search?: string | null, status?: string[] | null, companyId?: string | null, tagIds?: string[] | null }} filter */
export function filterProjects(projects, filter = {}) {
  let rows = projects;
  if (filter.search) {
    const q = filter.search.toLowerCase();
    rows = rows.filter((row) => row.name?.toLowerCase().includes(q));
  }
  if (filter.status?.length) {
    const allowed = new Set(filter.status.map((s) => toUiStatus("projectStatus", s)));
    rows = rows.filter((row) => allowed.has(row.status));
  }
  if (filter.companyId) {
    rows = rows.filter((row) => row.company?.id === filter.companyId || row.companyId === filter.companyId);
  }
  if (filter.tagIds?.length) {
    const allowed = new Set(filter.tagIds);
    rows = rows.filter((row) => (row.tags ?? []).some((tag) => allowed.has(tag.id)));
  }
  return rows;
}
