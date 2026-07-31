import { GraphQLError, GraphQLScalarType } from "graphql";

import * as db from "./data.js";
import { signMockToken } from "./token.js";

let sequence = 1000;
const nextId = (prefix) => `${prefix}_${++sequence}`;

const byId = (rows, id) => rows.find((row) => row.id === id) ?? null;
const where = (rows, key, value) => rows.filter((row) => row[key] === value);

function paginate(rows, page) {
  const pageNumber = page?.page ?? 1;
  const pageSize = page?.pageSize ?? 25;
  const start = (pageNumber - 1) * pageSize;
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  return {
    nodes: rows.slice(start, start + pageSize),
    totalCount: rows.length,
    pageInfo: {
      page: pageNumber,
      pageSize,
      totalPages,
      hasNextPage: pageNumber < totalPages,
      hasPreviousPage: pageNumber > 1,
    },
  };
}

function sortRows(rows, page) {
  if (!page?.sortBy) return rows;
  const direction = page.sortDirection === "DESC" ? -1 : 1;
  return [...rows].sort((a, b) => {
    const left = a[page.sortBy];
    const right = b[page.sortBy];
    if (left === right) return 0;
    if (left === null || left === undefined) return 1;
    if (right === null || right === undefined) return -1;
    return left > right ? direction : -direction;
  });
}

function matchesText(haystack, needle) {
  return String(haystack ?? "").toLowerCase().includes(needle.toLowerCase());
}

const contactName = (contact) => `${contact.firstName} ${contact.lastName}`;

/**
 * Would adding `task depends on dependsOn` close a loop? Walks the existing
 * edges forward from `dependsOn` looking for the way back to `task`.
 */
function createsCycle(taskId, dependsOnTaskId) {
  const seen = new Set();
  const queue = [dependsOnTaskId];
  while (queue.length) {
    const current = queue.shift();
    if (current === taskId) return true;
    if (seen.has(current)) continue;
    seen.add(current);
    for (const edge of db.taskDependencies.filter((d) => d.taskId === current)) {
      queue.push(edge.dependsOnTaskId);
    }
  }
  return false;
}

/** Top-level tasks in one status column, in board order. */
function boardColumn(projectId, status) {
  return db.tasks
    .filter(
      (task) =>
        task.projectId === projectId && task.parentTaskId === null && task.status === status,
    )
    .sort((a, b) => a.orderIndex - b.orderIndex);
}

/** Rewrites `orderIndex` to 0..n-1 so gaps from a move never accumulate. */
function reindexColumn(projectId, status) {
  const column = boardColumn(projectId, status);
  column.forEach((task, index) => {
    task.orderIndex = index;
  });
  return column;
}

/**
 * Change-request derivations. These mirror `app/lib/change-requests.js` on
 * purpose: the server owns the answer, the client owns the presentation, and
 * both have to agree. If they ever drift, the client's copy is the one to
 * delete — see NEEDED_SCHEMA_CHANGES.md §8.3.
 */
const RESPONSE_SLA_DAYS = {
  SUBMITTED: 2,
  UNDER_REVIEW: 3,
  PENDING_IMPACT_ASSESSMENT: 5,
  PENDING_APPROVAL: 5,
};

function approvalsFor(entityType, entityId) {
  return db.approvals.filter((a) => a.entityType === entityType && a.entityId === entityId);
}

function awaitingPartyFor(request) {
  if (request.status === "PENDING_APPROVAL") {
    const pending = approvalsFor("CHANGE_REQUEST", request.id).filter(
      (approval) => approval.status === "PENDING",
    );
    if (pending.some((approval) => approval.approverType === "INTERNAL")) return "AGENCY";
    if (pending.some((approval) => approval.approverType === "CLIENT")) return "CLIENT";
    return "AGENCY";
  }
  if (
    ["SUBMITTED", "UNDER_REVIEW", "PENDING_IMPACT_ASSESSMENT", "IN_PROGRESS"].includes(
      request.status,
    )
  ) {
    return "AGENCY";
  }
  return "NOBODY";
}

function responseDueAtFor(request) {
  const days = RESPONSE_SLA_DAYS[request.status];
  if (days === undefined) return null;
  const from = new Date(request.updatedAt);
  if (Number.isNaN(from.getTime())) return null;
  return new Date(from.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
}

function isOverdueRequest(request) {
  const due = responseDueAtFor(request);
  return Boolean(due) && new Date(due).getTime() < Date.now();
}

/** Legal "move it along" transitions. Assessment and decision have their own. */
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

/** `INTERNAL_TASK` → `Internal task`. Enum tokens only — never whole sentences. */
const enumLabel = (value) => {
  const lower = String(value).toLowerCase().replace(/_/g, " ");
  return lower.charAt(0).toUpperCase() + lower.slice(1);
};

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * A scheduled touchpoint doesn't become overdue the instant its date passes —
 * it gets `touchpointOverdueDays` of grace first (see §9.3 for why this
 * interpretation was chosen over "overdue the moment the date passes").
 * Every other status is trusted as stored; only `SCHEDULED` is time-derived.
 */
function deriveTouchpointStatus(touchpoint) {
  if (touchpoint.status !== "SCHEDULED" || !touchpoint.scheduledAt) return touchpoint.status;
  const graceDays = db.organization.settings.touchpointOverdueDays ?? 3;
  const overdueAt = new Date(touchpoint.scheduledAt).getTime() + graceDays * DAY_MS;
  return Date.now() > overdueAt ? "OVERDUE" : "SCHEDULED";
}

/**
 * Turns the builder's ordered step list into stored steps. `stepOrder` is
 * always the array position — the builder's drag order is the order, there is
 * no separate index to fall out of sync with it. Step ids are regenerated on
 * every save rather than preserved, which is safe because nothing outside the
 * sequence references a step by id: `SequenceEnrollment.currentStep` is a
 * position, not a step id.
 */
function toSequenceSteps(stepsInput) {
  if (!stepsInput?.length) {
    throw new GraphQLError("A sequence needs at least one step.", {
      extensions: { code: "BAD_USER_INPUT", field: "steps" },
    });
  }

  let previousOffset = -1;
  for (const step of stepsInput) {
    if (step.offsetDays < 0) {
      throw new GraphQLError(`"${step.name}" can't fire before enrollment (offset must be 0 or more).`, {
        extensions: { code: "BAD_USER_INPUT", field: "offsetDays" },
      });
    }
    if (step.offsetDays < previousOffset) {
      throw new GraphQLError(
        `"${step.name}" fires before the step ahead of it — steps must run in day order.`,
        { extensions: { code: "BAD_USER_INPUT", field: "offsetDays" } },
      );
    }
    previousOffset = step.offsetDays;
  }

  return stepsInput.map((step, index) => ({
    id: nextId("stp"),
    stepOrder: index,
    name: step.name,
    channel: step.channel,
    offsetDays: step.offsetDays,
    assigneeRole: step.assigneeRole ?? null,
    templateId: step.templateId ?? null,
  }));
}

const AT_RISK_HEALTH_THRESHOLD = 45; // matches getHealthBand()'s "At risk" band in app/lib/status.js

/**
 * The at-risk dashboard's query, computed server-side rather than shipping
 * every company to the client to filter — see NEEDED_SCHEMA_CHANGES.md §9.3.
 * Only companies with an active relationship are considered: a lead hasn't
 * started, and a churned company is already lost, not "at risk" of it.
 */
function buildAtRiskCompanies() {
  const noContactDays = db.organization.settings.retentionNoContactDays ?? 30;
  const now = Date.now();

  return db.companies
    .filter((company) => ["ACTIVE", "PAUSED"].includes(company.status))
    .map((company) => {
      const companyTouchpoints = where(db.touchpoints, "companyId", company.id);
      const overdueTouchpointCount = companyTouchpoints.filter(
        (touchpoint) => deriveTouchpointStatus(touchpoint) === "OVERDUE",
      ).length;

      const completedAt = companyTouchpoints
        .filter((touchpoint) => touchpoint.completedAt)
        .map((touchpoint) => new Date(touchpoint.completedAt).getTime());
      const lastTouchpointAt = completedAt.length ? new Date(Math.max(...completedAt)).toISOString() : null;

      const reasons = [];
      if (company.healthScore !== null && company.healthScore < AT_RISK_HEALTH_THRESHOLD) {
        reasons.push("LOW_HEALTH_SCORE");
      }
      if (overdueTouchpointCount > 0) reasons.push("OVERDUE_TOUCHPOINTS");
      if (!lastTouchpointAt || now - new Date(lastTouchpointAt).getTime() > noContactDays * DAY_MS) {
        reasons.push("NO_RECENT_CONTACT");
      }

      return {
        company,
        reasons,
        overdueTouchpointCount,
        lastTouchpointAt,
        activeEnrollments: db.enrollments.filter(
          (enrollment) => enrollment.companyId === company.id && enrollment.status === "ACTIVE",
        ),
      };
    })
    .filter((row) => row.reasons.length > 0)
    .sort(
      (a, b) =>
        b.reasons.length - a.reasons.length || (a.company.healthScore ?? 100) - (b.company.healthScore ?? 100),
    );
}

/** A company has at most one primary contact. */
function demotePrimaryContacts(companyId, keepId) {
  for (const contact of db.contacts) {
    if (contact.companyId === companyId && contact.id !== keepId) contact.isPrimary = false;
  }
}

function logActivity(entityType, entityId, action, summary, diff = null) {
  db.activity.unshift({
    id: nextId("act"),
    entityType,
    entityId,
    action,
    summary,
    actorName: "You",
    actorAvatarUrl: null,
    diff,
    createdAt: new Date().toISOString(),
  });
}

/**
 * The single company/contact feed §3.A and §3.B ask for: stored audit rows
 * merged with touchpoints, change requests, projects and milestones.
 */
function buildTimeline({ entityType, entityId, companyId, contactId }) {
  const entries = db.activity
    .filter((row) => row.entityType === entityType && row.entityId === entityId)
    .map((row) => ({ ...row }));

  const touchpoints = db.touchpoints.filter((tp) =>
    contactId ? tp.contactId === contactId : tp.companyId === companyId,
  );
  for (const touchpoint of touchpoints) {
    const contact = byId(db.contacts, touchpoint.contactId);
    const outcome = touchpoint.outcome ? ` — outcome ${touchpoint.outcome.toLowerCase().replace(/_/g, " ")}` : "";
    entries.push({
      id: `tl_tp_${touchpoint.id}`,
      entityType: "touchpoint",
      entityId: touchpoint.id,
      action: `touchpoint.${touchpoint.status.toLowerCase()}`,
      summary:
        touchpoint.status === "COMPLETED"
          ? `${enumLabel(touchpoint.type)} with ${contact ? contactName(contact) : "the client"} logged${outcome}`
          : `${enumLabel(touchpoint.type)} ${touchpoint.status.toLowerCase()} with ${contact ? contactName(contact) : "the client"}`,
      actorName: byId(db.users, touchpoint.createdById)?.name ?? "Automation",
      actorAvatarUrl: null,
      diff: null,
      createdAt: touchpoint.completedAt ?? touchpoint.scheduledAt,
    });
  }

  if (!contactId) {
    for (const request of db.changeRequests.filter((cr) => cr.companyId === companyId)) {
      entries.push({
        id: `tl_cr_${request.id}`,
        entityType: "change_request",
        entityId: request.id,
        action: `change_request.${request.status.toLowerCase()}`,
        summary: `${request.reference} “${request.title}” is ${request.status.toLowerCase().replace(/_/g, " ")}`,
        actorName: byId(db.users, request.assignedPmId)?.name ?? null,
        actorAvatarUrl: null,
        diff: null,
        createdAt: request.updatedAt,
      });
    }

    for (const project of db.projects.filter((p) => p.companyId === companyId)) {
      entries.push({
        id: `tl_prj_${project.id}`,
        entityType: "project",
        entityId: project.id,
        action: "project.created",
        summary: `Project “${project.name}” created`,
        actorName: byId(db.users, project.projectManagerId)?.name ?? null,
        actorAvatarUrl: null,
        diff: null,
        createdAt: project.createdAt,
      });
    }
  } else {
    entries.push({
      id: `tl_con_${contactId}`,
      entityType: "contact",
      entityId: contactId,
      action: "contact.created",
      summary: "Contact added",
      actorName: null,
      actorAvatarUrl: null,
      diff: null,
      createdAt: byId(db.contacts, contactId)?.createdAt,
    });
  }

  return entries
    .filter((entry) => Boolean(entry.createdAt))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function resolveViewer(claims) {
  if (!claims) return null;
  if (claims.scope === "PORTAL") {
    const contact = byId(db.contacts, claims.sub);
    if (!contact) return null;
    return {
      id: contact.id,
      name: `${contact.firstName} ${contact.lastName}`,
      email: contact.email,
      role: "VIEWER",
      status: "ACTIVE",
      avatarUrl: null,
      scope: "PORTAL",
      contactId: contact.id,
      companyId: contact.companyId,
    };
  }
  const user = byId(db.users, claims.sub);
  return user ? { ...user, contactId: null, companyId: null } : null;
}

const isoScalar = (name) =>
  new GraphQLScalarType({
    name,
    serialize: (value) => (value instanceof Date ? value.toISOString() : value),
    parseValue: (value) => value,
    parseLiteral: (node) => node.value,
  });

export const resolvers = {
  DateTime: isoScalar("DateTime"),
  Date: isoScalar("Date"),
  JSON: new GraphQLScalarType({
    name: "JSON",
    serialize: (value) => value,
    parseValue: (value) => value,
    parseLiteral: (node) => node.value,
  }),

  Query: {
    me: (_parent, _args, ctx) => resolveViewer(ctx.claims),

    company: (_parent, { id }, ctx) => {
      const company = byId(db.companies, id);
      if (!company) return null;
      if (ctx.claims?.scope === "PORTAL" && ctx.claims.companyId !== company.id) return null;
      return company;
    },

    companies: (_parent, { filter, page }, ctx) => {
      let rows = db.companies;
      if (ctx.claims?.scope === "PORTAL") {
        rows = rows.filter((company) => company.id === ctx.claims.companyId);
      }
      if (filter?.search) {
        rows = rows.filter(
          (company) =>
            matchesText(company.name, filter.search) ||
            matchesText(company.industry, filter.search),
        );
      }
      if (filter?.status?.length) rows = rows.filter((c) => filter.status.includes(c.status));
      if (filter?.accountOwnerId) rows = where(rows, "accountOwnerId", filter.accountOwnerId);
      if (filter?.industry) rows = where(rows, "industry", filter.industry);
      if (filter?.tagIds?.length) {
        rows = rows.filter((c) => c.tagIds.some((tagId) => filter.tagIds.includes(tagId)));
      }
      if (typeof filter?.healthScoreBelow === "number") {
        rows = rows.filter((c) => c.healthScore !== null && c.healthScore < filter.healthScoreBelow);
      }
      return paginate(sortRows(rows, page), page);
    },

    project: (_parent, { id }, ctx) => {
      const project = byId(db.projects, id);
      if (!project) return null;
      if (ctx.claims?.scope === "PORTAL" && ctx.claims.companyId !== project.companyId) return null;
      return project;
    },

    projects: (_parent, { filter, page }, ctx) => {
      let rows = db.projects;
      if (ctx.claims?.scope === "PORTAL") {
        rows = rows.filter((project) => project.companyId === ctx.claims.companyId);
      }
      if (filter?.search) rows = rows.filter((p) => matchesText(p.name, filter.search));
      if (filter?.status?.length) rows = rows.filter((p) => filter.status.includes(p.status));
      if (filter?.health?.length) rows = rows.filter((p) => filter.health.includes(p.health));
      if (filter?.priority?.length) rows = rows.filter((p) => filter.priority.includes(p.priority));
      if (filter?.companyId) rows = where(rows, "companyId", filter.companyId);
      if (filter?.projectManagerId) {
        rows = where(rows, "projectManagerId", filter.projectManagerId);
      }
      if (filter?.tagIds?.length) {
        rows = rows.filter((p) => p.tagIds.some((tagId) => filter.tagIds.includes(tagId)));
      }
      return paginate(sortRows(rows, page), page);
    },

    changeRequests: (_parent, { projectId, status }, ctx) => {
      let rows = db.changeRequests;
      if (ctx.claims?.scope === "PORTAL") {
        rows = rows.filter((cr) => cr.companyId === ctx.claims.companyId);
      }
      if (projectId) rows = where(rows, "projectId", projectId);
      if (status) rows = where(rows, "status", status);
      return rows;
    },

    changeRequest: (_parent, { id }, ctx) => {
      const request = byId(db.changeRequests, id);
      if (!request) return null;
      if (ctx.claims?.scope === "PORTAL" && ctx.claims.companyId !== request.companyId) return null;
      return request;
    },

    changeRequestQueue: (_parent, { filter, page }, ctx) => {
      let rows = db.changeRequests;
      if (ctx.claims?.scope === "PORTAL") {
        rows = rows.filter((cr) => cr.companyId === ctx.claims.companyId);
      }

      if (filter?.search) {
        rows = rows.filter(
          (cr) => matchesText(cr.title, filter.search) || matchesText(cr.reference, filter.search),
        );
      }
      if (filter?.status?.length) rows = rows.filter((cr) => filter.status.includes(cr.status));
      if (filter?.type?.length) rows = rows.filter((cr) => filter.type.includes(cr.type));
      if (filter?.priority?.length) rows = rows.filter((cr) => filter.priority.includes(cr.priority));
      if (filter?.companyId) rows = where(rows, "companyId", filter.companyId);
      if (filter?.projectId) rows = where(rows, "projectId", filter.projectId);
      if (filter?.assignedPmId) rows = where(rows, "assignedPmId", filter.assignedPmId);
      if (filter?.awaiting) {
        rows = rows.filter((cr) => awaitingPartyFor(cr) === filter.awaiting);
      }
      if (filter?.overdueOnly) rows = rows.filter((cr) => isOverdueRequest(cr));

      // `age` sorts by how long a request has been waiting, which is what the
      // queue is actually for — oldest first.
      if (page?.sortBy === "age") {
        const sorted = [...rows].sort((a, b) => new Date(a.updatedAt) - new Date(b.updatedAt));
        if (page.sortDirection === "DESC") sorted.reverse();
        return paginate(sorted, page);
      }

      return paginate(sortRows(rows, page), page);
    },

    retentionSequences: () => db.retentionSequences,
    retentionSequence: (_parent, { id }) => byId(db.retentionSequences, id),

    atRiskCompanies: (_parent, _args, ctx) => {
      // Internal-only view — retention risk is not something a client reads
      // about themselves.
      if (ctx.claims?.scope === "PORTAL") return [];
      return buildAtRiskCompanies();
    },

    tags: () => db.tags,
    users: () => db.users.filter((user) => user.status === "ACTIVE"),
  },

  Mutation: {
    login: (_parent, { email, password }) => {
      const account = db.demoAccounts.find(
        (candidate) => candidate.email.toLowerCase() === String(email).trim().toLowerCase(),
      );
      if (!account || password !== db.DEMO_PASSWORD) {
        throw new GraphQLError("Invalid email or password.", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }
      const claims =
        account.scope === "PORTAL"
          ? (() => {
              const contact = byId(db.contacts, account.contactId);
              return {
                sub: contact.id,
                scope: "PORTAL",
                email: contact.email,
                name: `${contact.firstName} ${contact.lastName}`,
                role: "CLIENT_CONTACT",
                companyId: contact.companyId,
              };
            })()
          : (() => {
              const user = byId(db.users, account.userId);
              return {
                sub: user.id,
                scope: "INTERNAL",
                email: user.email,
                name: user.name,
                role: user.role,
              };
            })();

      const { token, expiresAt } = signMockToken(claims);
      return {
        accessToken: token,
        expiresAt,
        scope: claims.scope,
        user: resolveViewer(claims),
      };
    },

    refreshToken: (_parent, _args, ctx) => {
      if (!ctx.claims) {
        throw new GraphQLError("No refresh session.", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }
      const { token, expiresAt } = signMockToken(ctx.claims);
      return {
        accessToken: token,
        expiresAt,
        scope: ctx.claims.scope,
        user: resolveViewer(ctx.claims),
      };
    },

    logout: () => true,

    createCompany: (_parent, { input }) => {
      const company = {
        id: nextId("cmp"),
        logoUrl: null,
        healthScore: null,
        address: null,
        industry: null,
        website: null,
        size: null,
        timezone: null,
        accountOwnerId: null,
        ...input,
        status: input.status ?? "LEAD",
        tagIds: input.tagIds ?? [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      db.companies.unshift(company);
      logActivity("company", company.id, "company.created", "Company created");
      return company;
    },

    updateCompany: (_parent, { id, input }) => {
      const company = byId(db.companies, id);
      if (!company) throw new GraphQLError("Company not found.");
      const previousStatus = company.status;
      Object.assign(company, input, { updatedAt: new Date().toISOString() });
      if (input.status && input.status !== previousStatus) {
        logActivity(
          "company",
          company.id,
          "company.status_changed",
          `Status changed from ${previousStatus.toLowerCase()} to ${input.status.toLowerCase()}`,
          { status: [previousStatus, input.status] },
        );
      } else {
        logActivity("company", company.id, "company.updated", "Company details updated");
      }
      return company;
    },

    updateProject: (_parent, { id, input }) => {
      const project = byId(db.projects, id);
      if (!project) throw new GraphQLError("Project not found.");
      if (input.endDate && input.startDate && input.endDate < input.startDate) {
        throw new GraphQLError("A project can't end before it starts.", {
          extensions: { code: "BAD_USER_INPUT", field: "endDate" },
        });
      }
      const previousStatus = project.status;
      const { tagIds, projectManagerId, ...rest } = input;
      Object.assign(project, rest, { updatedAt: new Date().toISOString() });
      if (tagIds !== undefined) project.tagIds = tagIds ?? [];
      if (projectManagerId !== undefined) project.projectManagerId = projectManagerId;

      logActivity(
        "company",
        project.companyId,
        input.status && input.status !== previousStatus
          ? "project.status_changed"
          : "project.updated",
        input.status && input.status !== previousStatus
          ? `“${project.name}” moved from ${previousStatus.toLowerCase().replace(/_/g, " ")} to ${input.status.toLowerCase().replace(/_/g, " ")}`
          : `“${project.name}” updated`,
      );
      return project;
    },

    updateTask: (_parent, { id, input }) => {
      const task = byId(db.tasks, id);
      if (!task) throw new GraphQLError("Task not found.");
      if (input.parentTaskId === id) {
        throw new GraphQLError("A task can't be its own parent.", {
          extensions: { code: "BAD_USER_INPUT", field: "parentTaskId" },
        });
      }
      if (input.dueDate && input.startDate && input.dueDate < input.startDate) {
        throw new GraphQLError("A task can't be due before it starts.", {
          extensions: { code: "BAD_USER_INPUT", field: "dueDate" },
        });
      }

      const previousStatus = task.status;
      Object.assign(task, input);

      // A status change from the task form still has to leave the board's
      // columns contiguous, exactly as a drag would.
      if (input.status && input.status !== previousStatus && task.parentTaskId === null) {
        task.orderIndex = boardColumn(task.projectId, input.status).length;
        reindexColumn(task.projectId, previousStatus);
        reindexColumn(task.projectId, input.status);
      }
      return task;
    },

    updateTaskStatus: (_parent, { id, status, orderIndex }) => {
      const task = byId(db.tasks, id);
      if (!task) throw new GraphQLError("Task not found.");

      // A subtask isn't on the board: its siblings are the other children of
      // its parent, and they aren't partitioned by status.
      if (task.parentTaskId !== null) {
        task.status = status;
        const siblings = db.tasks
          .filter((row) => row.parentTaskId === task.parentTaskId && row.id !== id)
          .sort((a, b) => a.orderIndex - b.orderIndex);
        const at = Math.max(0, Math.min(orderIndex, siblings.length));
        siblings.splice(at, 0, task);
        siblings.forEach((row, index) => {
          row.orderIndex = index;
        });
        return siblings;
      }

      const from = task.status;
      const destination = boardColumn(task.projectId, status).filter((row) => row.id !== id);
      const at = Math.max(0, Math.min(orderIndex, destination.length));

      task.status = status;
      destination.splice(at, 0, task);
      destination.forEach((row, index) => {
        row.orderIndex = index;
      });

      // Return every task the move touched so the client can reconcile its
      // optimistic order in a single cache write.
      const touched = [...destination];
      if (from !== status) touched.push(...reindexColumn(task.projectId, from));
      return touched;
    },

    createPhase: (_parent, { input }) => {
      const project = byId(db.projects, input.projectId);
      if (!project) throw new GraphQLError("Project not found.");
      const siblings = where(db.phases, "projectId", input.projectId);
      const phase = {
        id: nextId("phs"),
        startDate: null,
        dueDate: null,
        ...input,
        status: input.status ?? "NOT_STARTED",
        orderIndex: input.orderIndex ?? siblings.length,
      };
      db.phases.push(phase);
      return phase;
    },

    updatePhase: (_parent, { id, input }) => {
      const phase = byId(db.phases, id);
      if (!phase) throw new GraphQLError("Phase not found.");
      Object.assign(phase, input);
      return phase;
    },

    updateMilestone: (_parent, { id, input }) => {
      const milestone = byId(db.milestones, id);
      if (!milestone) throw new GraphQLError("Milestone not found.");
      const wasComplete = milestone.status === "COMPLETED";
      Object.assign(milestone, input);

      // Completing a milestone that the client has to sign off doesn't itself
      // approve it — that's the Phase 4 approval flow's job.
      if (!wasComplete && milestone.status === "COMPLETED" && !milestone.requiresClientApproval) {
        milestone.approvedAt = milestone.approvedAt ?? new Date().toISOString();
      }
      return milestone;
    },

    addTaskDependency: (_parent, { taskId, dependsOnTaskId, type }) => {
      const task = byId(db.tasks, taskId);
      const dependsOn = byId(db.tasks, dependsOnTaskId);
      if (!task || !dependsOn) throw new GraphQLError("Task not found.");
      if (taskId === dependsOnTaskId) {
        throw new GraphQLError("A task can't depend on itself.", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }
      if (task.projectId !== dependsOn.projectId) {
        throw new GraphQLError("Dependencies have to stay within one project.", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }
      if (db.taskDependencies.some((d) => d.taskId === taskId && d.dependsOnTaskId === dependsOnTaskId)) {
        throw new GraphQLError("That dependency already exists.", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }
      if (createsCycle(taskId, dependsOnTaskId)) {
        throw new GraphQLError(
          `That would create a circular dependency — “${dependsOn.title}” already depends on this task.`,
          { extensions: { code: "BAD_USER_INPUT" } },
        );
      }

      db.taskDependencies.push({
        id: nextId("dep"),
        taskId,
        dependsOnTaskId,
        type: type ?? "FINISH_TO_START",
      });
      return task;
    },

    removeTaskDependency: (_parent, { id }) => {
      const index = db.taskDependencies.findIndex((d) => d.id === id);
      if (index === -1) throw new GraphQLError("Dependency not found.");
      const [removed] = db.taskDependencies.splice(index, 1);
      return byId(db.tasks, removed.taskId);
    },

    decideMilestoneApproval: (_parent, { id, decision }, ctx) => {
      const milestone = byId(db.milestones, id);
      if (!milestone) throw new GraphQLError("Milestone not found.");
      if (!milestone.requiresClientApproval) {
        throw new GraphQLError("This milestone doesn't need sign-off.", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      const pending = db.approvals.find(
        (approval) =>
          approval.entityType === "MILESTONE" &&
          approval.entityId === id &&
          approval.approverType === decision.approverType &&
          approval.status === "PENDING",
      );
      if (!pending) {
        throw new GraphQLError("There's nothing waiting on your approval here.", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      // A portal caller may only decide their own approval row. Without this
      // one contact could sign off work assigned to a colleague.
      // `claims.sub` is the contact id for a portal session.
      if (ctx.claims?.scope === "PORTAL") {
        const contact = byId(db.contacts, ctx.claims.sub);
        if (!contact || pending.approverName !== contactName(contact)) {
          throw new GraphQLError("This approval is assigned to someone else.", {
            extensions: { code: "FORBIDDEN" },
          });
        }
      }

      if (decision.outcome === "REJECTED" && !decision.comment?.trim()) {
        throw new GraphQLError("Tell us what needs to change.", {
          extensions: { code: "BAD_USER_INPUT", field: "comment" },
        });
      }

      Object.assign(pending, {
        status: decision.outcome,
        comment: decision.comment?.trim() || null,
        decidedAt: new Date().toISOString(),
      });

      const clientApprovals = db.approvals.filter(
        (approval) =>
          approval.entityType === "MILESTONE" &&
          approval.entityId === id &&
          approval.approverType === "CLIENT",
      );

      if (decision.outcome === "APPROVED") {
        // Only complete the milestone once every client approver has signed.
        if (clientApprovals.every((approval) => approval.status === "APPROVED")) {
          milestone.status = "COMPLETED";
          milestone.approvedAt = new Date().toISOString();
        }
      } else {
        // Rejection reopens the milestone rather than failing it — the team
        // makes changes and asks again.
        milestone.status = "IN_PROGRESS";
        milestone.approvedAt = null;
      }

      const phase = byId(db.phases, milestone.phaseId);
      const project = phase ? byId(db.projects, phase.projectId) : null;
      if (project) {
        logActivity(
          "company",
          project.companyId,
          `milestone.${decision.outcome.toLowerCase()}`,
          decision.outcome === "APPROVED"
            ? `${pending.approverName} approved “${milestone.title}”`
            : `${pending.approverName} requested changes to “${milestone.title}”`,
        );
      }

      return milestone;
    },

    requestUploadUrl: (_parent, { input }) => {
      const uploadId = nextId("upl");
      const safeName = input.fileName.replace(/[^\w.-]+/g, "-").toLowerCase();
      return {
        uploadId,
        // Stand-ins for the presigned S3 pair the backend will issue.
        uploadUrl: `/mock-uploads/${uploadId}/${safeName}`,
        fileUrl: `/mock-files/${uploadId}-${safeName}`,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      };
    },

    confirmUpload: (_parent, { input }, ctx) => {
      const [entityType, entityId] = input.milestoneId
        ? ["milestone", input.milestoneId]
        : input.projectId
          ? ["project", input.projectId]
          : ["company", input.companyId];

      if (!entityId) {
        throw new GraphQLError("An upload has to belong to a company, project or milestone.", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      // `claims.sub` is the contact id for a portal session, the user id for an
      // internal one.
      const uploader =
        ctx.claims?.scope === "PORTAL"
          ? (() => {
              const contact = byId(db.contacts, ctx.claims.sub);
              return contact ? contactName(contact) : "Client";
            })()
          : (byId(db.users, ctx.claims?.sub)?.name ?? "Unknown");

      // Uploading the same filename again bumps the version rather than
      // silently creating a second row with the same name.
      const previous = db.documents.filter(
        (doc) => doc.entityType === entityType && doc.entityId === entityId && doc.name === input.name,
      );

      const document = {
        id: nextId("doc"),
        entityType,
        entityId,
        name: input.name,
        fileUrl: `/mock-files/${input.uploadId}-${input.name.replace(/[^\w.-]+/g, "-").toLowerCase()}`,
        mimeType: input.mimeType ?? null,
        sizeBytes: input.sizeBytes ?? null,
        version: previous.length + 1,
        uploadedByName: uploader,
        createdAt: new Date().toISOString(),
      };
      db.documents.unshift(document);
      return document;
    },

    createContact: (_parent, { input }) => {
      const company = byId(db.companies, input.companyId);
      if (!company) throw new GraphQLError("Company not found.");
      if (db.contacts.some((c) => c.email.toLowerCase() === input.email.toLowerCase())) {
        throw new GraphQLError("A contact with that email already exists.", {
          extensions: { code: "BAD_USER_INPUT", field: "email" },
        });
      }

      const contact = {
        id: nextId("con"),
        phone: null,
        title: null,
        department: null,
        preferredChannel: null,
        bestTimeToContact: null,
        timezone: null,
        linkedinUrl: null,
        ...input,
        isPrimary: input.isPrimary ?? false,
        doNotContact: input.doNotContact ?? false,
        portalAccessEnabled: input.portalAccessEnabled ?? false,
        status: input.status ?? "ACTIVE",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (contact.isPrimary) demotePrimaryContacts(contact.companyId, contact.id);
      db.contacts.push(contact);
      logActivity("company", contact.companyId, "contact.created", `${contactName(contact)} added as a contact`);
      logActivity("contact", contact.id, "contact.created", "Contact added");
      return contact;
    },

    updateContact: (_parent, { id, input }) => {
      const contact = byId(db.contacts, id);
      if (!contact) throw new GraphQLError("Contact not found.");
      const clash = db.contacts.find(
        (other) => other.id !== id && other.email.toLowerCase() === input.email.toLowerCase(),
      );
      if (clash) {
        throw new GraphQLError("A contact with that email already exists.", {
          extensions: { code: "BAD_USER_INPUT", field: "email" },
        });
      }

      Object.assign(contact, input, { updatedAt: new Date().toISOString() });
      if (contact.isPrimary) demotePrimaryContacts(contact.companyId, contact.id);
      logActivity("contact", contact.id, "contact.updated", "Contact details updated");
      return contact;
    },

    archiveContact: (_parent, { id }) => {
      const contact = byId(db.contacts, id);
      if (!contact) throw new GraphQLError("Contact not found.");
      if (contact.isPrimary) {
        throw new GraphQLError(
          "Make another contact primary before archiving this one.",
          { extensions: { code: "BAD_USER_INPUT" } },
        );
      }
      Object.assign(contact, {
        status: "INACTIVE",
        portalAccessEnabled: false,
        updatedAt: new Date().toISOString(),
      });
      logActivity("contact", contact.id, "contact.archived", "Contact archived");
      logActivity("company", contact.companyId, "contact.archived", `${contactName(contact)} archived`);
      return contact;
    },

    createProject: (_parent, { input }) => {
      const project = {
        id: nextId("prj"),
        health: "ON_TRACK",
        actualCost: 0,
        completionPercent: 0,
        teamIds: input.projectManagerId ? [input.projectManagerId] : [],
        description: null,
        startDate: null,
        endDate: null,
        budget: null,
        projectManagerId: null,
        ...input,
        status: input.status ?? "PLANNING",
        priority: input.priority ?? "MEDIUM",
        tagIds: input.tagIds ?? [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      db.projects.unshift(project);
      return project;
    },

    createTask: (_parent, { input }) => {
      const task = {
        id: nextId("tsk"),
        description: null,
        assigneeId: null,
        phaseId: null,
        milestoneId: null,
        parentTaskId: null,
        startDate: null,
        dueDate: null,
        estimatedHours: null,
        actualHours: 0,
        ...input,
        status: input.status ?? "TODO",
        priority: input.priority ?? "MEDIUM",
        orderIndex: db.tasks.length,
      };
      db.tasks.push(task);
      return task;
    },

    createMilestone: (_parent, { input }) => {
      const milestone = {
        id: nextId("mst"),
        description: null,
        dueDate: null,
        approvedAt: null,
        ...input,
        status: "NOT_STARTED",
        requiresClientApproval: input.requiresClientApproval ?? false,
        orderIndex: input.orderIndex ?? db.milestones.length,
      };
      db.milestones.push(milestone);
      return milestone;
    },

    createChangeRequest: (_parent, { input }, ctx) => {
      const project = byId(db.projects, input.projectId);
      if (!project) throw new GraphQLError("Project not found.");
      const changeRequest = {
        id: nextId("chr"),
        reference: `CR-${1044 + db.changeRequests.length}`,
        companyId: project.companyId,
        requestedByContactId: ctx.claims?.scope === "PORTAL" ? ctx.claims.sub : null,
        assignedPmId: project.projectManagerId,
        impactHours: null,
        impactCost: null,
        impactTimelineDays: null,
        assessmentNotes: null,
        desiredDueDate: null,
        decidedAt: null,
        decisionReason: null,
        ...input,
        status: "SUBMITTED",
        priority: input.priority ?? "MEDIUM",
        requiresClientApproval: true,
        requiresInternalApproval: false,
        revisionCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      db.changeRequests.unshift(changeRequest);
      return changeRequest;
    },

    assessChangeRequest: (_parent, { id, input }) => {
      const changeRequest = byId(db.changeRequests, id);
      if (!changeRequest) throw new GraphQLError("Change request not found.");
      if (["APPROVED", "REJECTED", "IMPLEMENTED", "CLOSED"].includes(changeRequest.status)) {
        throw new GraphQLError("This request has already been decided.", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      const threshold = db.organization.settings.changeRequestInternalApprovalThresholdCost ?? 0;
      const requiresInternalApproval =
        input.requiresInternalApproval ?? Math.abs(input.impactCost ?? 0) >= threshold;
      const requiresClientApproval = input.requiresClientApproval ?? true;

      Object.assign(changeRequest, input, {
        status: "PENDING_APPROVAL",
        requiresInternalApproval,
        requiresClientApproval,
        revisionCount: changeRequest.revisionCount + 1,
        updatedAt: new Date().toISOString(),
      });

      // Assessing is what creates the approval rows to route against. Without
      // these the approval UI has nothing to show and nobody to name.
      const existing = approvalsFor("CHANGE_REQUEST", id);
      const openFor = (type) =>
        existing.some((a) => a.approverType === type && a.status === "PENDING");

      if (requiresInternalApproval && !openFor("INTERNAL")) {
        const approver = byId(db.users, changeRequest.assignedPmId);
        db.approvals.push({
          id: nextId("apr"),
          entityType: "CHANGE_REQUEST",
          entityId: id,
          approverType: "INTERNAL",
          approverName: approver?.name ?? "Delivery lead",
          status: "PENDING",
          comment: null,
          decidedAt: null,
          createdAt: new Date().toISOString(),
        });
      }

      if (requiresClientApproval && !openFor("CLIENT")) {
        const contact =
          byId(db.contacts, changeRequest.requestedByContactId) ??
          db.contacts.find((c) => c.companyId === changeRequest.companyId && c.isPrimary);
        db.approvals.push({
          id: nextId("apr"),
          entityType: "CHANGE_REQUEST",
          entityId: id,
          approverType: "CLIENT",
          approverName: contact ? contactName(contact) : "Client contact",
          status: "PENDING",
          comment: null,
          decidedAt: null,
          createdAt: new Date().toISOString(),
        });
      }

      // Nothing to approve — an absorbed defect, say — goes straight through.
      if (!requiresInternalApproval && !requiresClientApproval) {
        Object.assign(changeRequest, {
          status: "APPROVED",
          decidedAt: new Date().toISOString(),
        });
      }

      return changeRequest;
    },

    decideChangeRequest: (_parent, { id, decision }, ctx) => {
      const changeRequest = byId(db.changeRequests, id);
      if (!changeRequest) throw new GraphQLError("Change request not found.");
      if (changeRequest.status !== "PENDING_APPROVAL") {
        throw new GraphQLError("This request isn't waiting for a decision.", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      const pending = approvalsFor("CHANGE_REQUEST", id).filter((a) => a.status === "PENDING");
      const mine = pending.find((a) => a.approverType === decision.approverType);
      if (!mine) {
        throw new GraphQLError("There's no decision outstanding from you on this request.", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      // Internal sign-off gates the client's. Deciding out of order would let a
      // client approve something the agency hasn't agreed to deliver.
      if (
        decision.approverType === "CLIENT" &&
        pending.some((a) => a.approverType === "INTERNAL")
      ) {
        throw new GraphQLError("This is still with the delivery team for internal sign-off.", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      if (ctx.claims?.scope === "PORTAL" && decision.approverType !== "CLIENT") {
        throw new GraphQLError("You can only record a client decision.", {
          extensions: { code: "FORBIDDEN" },
        });
      }

      if (decision.outcome === "REJECTED" && !decision.comment?.trim()) {
        throw new GraphQLError("Give a reason so the other side knows what happened.", {
          extensions: { code: "BAD_USER_INPUT", field: "comment" },
        });
      }

      const decider =
        ctx.claims?.scope === "PORTAL"
          ? byId(db.contacts, ctx.claims.sub)
          : byId(db.users, ctx.claims?.sub);

      Object.assign(mine, {
        status: decision.outcome,
        comment: decision.comment?.trim() || null,
        decidedAt: new Date().toISOString(),
        approverName: decider
          ? (decider.name ?? contactName(decider))
          : mine.approverName,
      });

      const now = new Date().toISOString();

      if (decision.outcome === "REJECTED") {
        // Either side rejecting ends it, and the reason is what the other side
        // reads — so it is stored on the request, not only on the approval.
        Object.assign(changeRequest, {
          status: "REJECTED",
          decidedAt: now,
          decisionReason: decision.comment?.trim() || null,
          updatedAt: now,
        });
        return changeRequest;
      }

      const stillPending = approvalsFor("CHANGE_REQUEST", id).filter(
        (a) => a.status === "PENDING",
      );
      if (stillPending.length === 0) {
        Object.assign(changeRequest, { status: "APPROVED", decidedAt: now, updatedAt: now });
      } else {
        // Internal approved, client still to go: it stays pending, but the
        // clock restarts because the ball has changed hands.
        Object.assign(changeRequest, { updatedAt: now });
      }

      return changeRequest;
    },

    updateChangeRequestStatus: (_parent, { id, status, note }, ctx) => {
      const changeRequest = byId(db.changeRequests, id);
      if (!changeRequest) throw new GraphQLError("Change request not found.");
      if (ctx.claims?.scope === "PORTAL") {
        throw new GraphQLError("Only the delivery team can move a request along.", {
          extensions: { code: "FORBIDDEN" },
        });
      }
      if (!TRANSITIONS[changeRequest.status]?.includes(status)) {
        throw new GraphQLError(
          `A request can't go from ${enumLabel(changeRequest.status).toLowerCase()} to ${enumLabel(status).toLowerCase()}.`,
          { extensions: { code: "BAD_USER_INPUT" } },
        );
      }

      Object.assign(changeRequest, { status, updatedAt: new Date().toISOString() });

      if (note?.trim()) {
        db.comments.push({
          id: nextId("cmt"),
          entityType: "change_request",
          entityId: id,
          authorType: "INTERNAL",
          authorName: byId(db.users, ctx.claims?.sub)?.name ?? "Delivery team",
          authorAvatarUrl: null,
          body: note.trim(),
          isClientVisible: false,
          createdAt: new Date().toISOString(),
        });
      }

      return changeRequest;
    },

    assignChangeRequest: (_parent, { id, assignedPmId }, ctx) => {
      const changeRequest = byId(db.changeRequests, id);
      if (!changeRequest) throw new GraphQLError("Change request not found.");
      if (ctx.claims?.scope === "PORTAL") {
        throw new GraphQLError("Only the delivery team can reassign a request.", {
          extensions: { code: "FORBIDDEN" },
        });
      }
      if (assignedPmId && !byId(db.users, assignedPmId)) {
        throw new GraphQLError("That person isn't in this workspace.", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      Object.assign(changeRequest, {
        assignedPmId: assignedPmId ?? null,
        updatedAt: new Date().toISOString(),
      });
      return changeRequest;
    },

    withdrawChangeRequest: (_parent, { id, reason }, ctx) => {
      const changeRequest = byId(db.changeRequests, id);
      if (!changeRequest) throw new GraphQLError("Change request not found.");
      if (
        ctx.claims?.scope === "PORTAL" &&
        ctx.claims.companyId !== changeRequest.companyId
      ) {
        throw new GraphQLError("Change request not found.");
      }
      if (["APPROVED", "REJECTED", "IMPLEMENTED", "CLOSED"].includes(changeRequest.status)) {
        throw new GraphQLError("This request has already been decided.", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      // Any approval still outstanding is moot once the requester pulls it.
      for (const approval of approvalsFor("CHANGE_REQUEST", id)) {
        if (approval.status === "PENDING") {
          Object.assign(approval, { status: "REJECTED", decidedAt: new Date().toISOString() });
        }
      }

      Object.assign(changeRequest, {
        status: "CLOSED",
        decidedAt: new Date().toISOString(),
        decisionReason: reason?.trim() || "Withdrawn by the client.",
        updatedAt: new Date().toISOString(),
      });
      return changeRequest;
    },

    addComment: (_parent, { input }, ctx) => {
      const entityType = input.entityType.toLowerCase();
      if (entityType === "change_request") {
        const changeRequest = byId(db.changeRequests, input.entityId);
        if (!changeRequest) throw new GraphQLError("Change request not found.");
        if (
          ctx.claims?.scope === "PORTAL" &&
          ctx.claims.companyId !== changeRequest.companyId
        ) {
          throw new GraphQLError("Change request not found.");
        }
      }
      if (!input.body?.trim()) {
        throw new GraphQLError("Write something first.", {
          extensions: { code: "BAD_USER_INPUT", field: "body" },
        });
      }

      const isPortal = ctx.claims?.scope === "PORTAL";
      const author = isPortal
        ? byId(db.contacts, ctx.claims.sub)
        : byId(db.users, ctx.claims?.sub);

      const comment = {
        id: nextId("cmt"),
        entityType,
        entityId: input.entityId,
        authorType: isPortal ? "CLIENT" : "INTERNAL",
        authorName: author
          ? (author.name ?? contactName(author))
          : isPortal
            ? "Client"
            : "Delivery team",
        authorAvatarUrl: author?.avatarUrl ?? null,
        body: input.body.trim(),
        // A client can never post an internal-only note.
        isClientVisible: isPortal ? true : (input.isClientVisible ?? true),
        createdAt: new Date().toISOString(),
      };
      db.comments.push(comment);
      return comment;
    },

    enrollInSequence: (_parent, { sequenceId, companyId }) => {
      const sequence = byId(db.retentionSequences, sequenceId);
      if (!sequence) throw new GraphQLError("Sequence not found.");
      const company = byId(db.companies, companyId);
      if (!company) throw new GraphQLError("Company not found.");
      if (!sequence.isActive) {
        throw new GraphQLError("This sequence is inactive — activate it before enrolling anyone.", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }
      if (
        db.enrollments.some(
          (e) => e.sequenceId === sequenceId && e.companyId === companyId && e.status === "ACTIVE",
        )
      ) {
        throw new GraphQLError(`${company.name} is already enrolled in this sequence.`, {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      const enrolledAt = new Date();
      const contactId = db.contacts.find((c) => c.companyId === companyId && c.isPrimary)?.id ?? null;
      const enrollment = {
        id: nextId("enr"),
        sequenceId,
        companyId,
        contactId,
        status: "ACTIVE",
        currentStep: 0,
        enrolledAt: enrolledAt.toISOString(),
      };
      db.enrollments.push(enrollment);

      // Enrolling is the automation firing, not just a record of intent — it
      // has to actually book the touchpoints the sequence promises.
      // `stepIndex` is an internal bookkeeping field (not part of the public
      // schema) that lets completeTouchpoint advance the right step even if
      // touchpoints are completed out of order.
      const orderedSteps = [...sequence.steps].sort((a, b) => a.stepOrder - b.stepOrder);
      for (const [stepIndex, step] of orderedSteps.entries()) {
        db.touchpoints.push({
          id: nextId("tpt"),
          companyId,
          contactId,
          projectId: null,
          enrollmentId: enrollment.id,
          stepIndex,
          type: step.channel,
          status: "SCHEDULED",
          outcome: null,
          notes: null,
          scheduledAt: new Date(enrolledAt.getTime() + step.offsetDays * DAY_MS).toISOString(),
          completedAt: null,
          createdById: null,
        });
      }

      logActivity("company", companyId, "sequence.enrolled", `Enrolled in "${sequence.name}"`);
      return enrollment;
    },

    updateEnrollmentStatus: (_parent, { id, status }) => {
      const enrollment = byId(db.enrollments, id);
      if (!enrollment) throw new GraphQLError("Enrollment not found.");
      if (["COMPLETED", "CANCELLED"].includes(enrollment.status)) {
        throw new GraphQLError("This enrollment has already finished.", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      Object.assign(enrollment, { status });

      // Cancelling clears whatever the automation still had booked — those
      // touchpoints are never going to happen now.
      if (status === "CANCELLED") {
        for (const touchpoint of db.touchpoints) {
          if (touchpoint.enrollmentId === id && touchpoint.status === "SCHEDULED") {
            touchpoint.status = "SKIPPED";
          }
        }
      }

      return enrollment;
    },

    logTouchpoint: (_parent, { input }, ctx) => {
      const touchpoint = {
        id: nextId("tpt"),
        contactId: null,
        projectId: null,
        enrollmentId: null,
        scheduledAt: null,
        completedAt: null,
        outcome: null,
        notes: null,
        ...input,
        status: input.completedAt ? "COMPLETED" : "SCHEDULED",
        createdById: ctx.claims?.scope === "INTERNAL" ? ctx.claims.sub : null,
      };
      db.touchpoints.unshift(touchpoint);
      return touchpoint;
    },

    completeTouchpoint: (_parent, { id, input }) => {
      const touchpoint = byId(db.touchpoints, id);
      if (!touchpoint) throw new GraphQLError("Touchpoint not found.");
      if (touchpoint.status === "COMPLETED") {
        throw new GraphQLError("This touchpoint is already marked complete.", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      Object.assign(touchpoint, {
        status: "COMPLETED",
        completedAt: input.completedAt ?? new Date().toISOString(),
        outcome: input.outcome ?? touchpoint.outcome,
        notes: input.notes ?? touchpoint.notes,
      });

      // Only advance the enrollment if this touchpoint is the step it's
      // actually waiting on — completing a stray or out-of-order one shouldn't
      // skip the sequence ahead.
      if (touchpoint.enrollmentId && Number.isInteger(touchpoint.stepIndex)) {
        const enrollment = byId(db.enrollments, touchpoint.enrollmentId);
        if (enrollment?.status === "ACTIVE" && touchpoint.stepIndex === enrollment.currentStep) {
          const sequence = byId(db.retentionSequences, enrollment.sequenceId);
          const totalSteps = sequence?.steps.length ?? 0;
          enrollment.currentStep += 1;
          if (enrollment.currentStep >= totalSteps) enrollment.status = "COMPLETED";
        }
      }

      return touchpoint;
    },

    createRetentionSequence: (_parent, { input }) => {
      const sequence = {
        id: nextId("seq"),
        name: input.name,
        description: input.description?.trim() || null,
        triggerType: input.triggerType,
        isActive: input.isActive ?? true,
        isTemplate: false,
        steps: toSequenceSteps(input.steps),
      };
      db.retentionSequences.push(sequence);
      return sequence;
    },

    updateRetentionSequence: (_parent, { id, input }) => {
      const sequence = byId(db.retentionSequences, id);
      if (!sequence) throw new GraphQLError("Sequence not found.");

      Object.assign(sequence, {
        name: input.name,
        description: input.description?.trim() || null,
        triggerType: input.triggerType,
        isActive: input.isActive ?? sequence.isActive,
        steps: toSequenceSteps(input.steps),
      });
      return sequence;
    },
  },

  User: {
    organization: () => db.organization,
    contact: (user) => (user.contactId ? byId(db.contacts, user.contactId) : null),
    company: (user) => (user.companyId ? byId(db.companies, user.companyId) : null),
  },

  Company: {
    accountOwner: (company) => byId(db.users, company.accountOwnerId),
    tags: (company) => db.tags.filter((tag) => company.tagIds.includes(tag.id)),
    contactCount: (company) =>
      db.contacts.filter((c) => c.companyId === company.id && c.status === "ACTIVE").length,
    projectCount: (company) => where(db.projects, "companyId", company.id).length,
    openChangeRequestCount: (company) =>
      db.changeRequests.filter(
        (cr) =>
          cr.companyId === company.id &&
          !["APPROVED", "REJECTED", "CLOSED", "IMPLEMENTED"].includes(cr.status),
      ).length,
    primaryContact: (company) =>
      db.contacts.find((c) => c.companyId === company.id && c.isPrimary) ?? null,
    contacts: (company) =>
      where(db.contacts, "companyId", company.id).sort(
        (a, b) =>
          Number(b.isPrimary) - Number(a.isPrimary) ||
          a.firstName.localeCompare(b.firstName) ||
          a.lastName.localeCompare(b.lastName),
      ),
    projects: (company) => where(db.projects, "companyId", company.id),
    touchpoints: (company) => where(db.touchpoints, "companyId", company.id),
    changeRequests: (company) => where(db.changeRequests, "companyId", company.id),
    contracts: (company) => where(db.contracts, "companyId", company.id),
    documents: (company) =>
      db.documents.filter((d) => d.entityType === "company" && d.entityId === company.id),
    activity: (company) =>
      buildTimeline({ entityType: "company", entityId: company.id, companyId: company.id }),
    healthScoreTrend: (company) =>
      (db.healthScoreHistory[company.id] ?? []).map((score, index, all) => ({
        id: `${company.id}_hs_${index}`,
        score,
        factors: null,
        calculatedAt: db.iso((index - all.length + 1) * 30),
      })),
  },

  Contact: {
    fullName: (contact) => contactName(contact),
    company: (contact) => byId(db.companies, contact.companyId),
    touchpoints: (contact) => where(db.touchpoints, "contactId", contact.id),
    activity: (contact) =>
      buildTimeline({
        entityType: "contact",
        entityId: contact.id,
        companyId: contact.companyId,
        contactId: contact.id,
      }),
  },

  Project: {
    company: (project) => byId(db.companies, project.companyId),
    projectManager: (project) => byId(db.users, project.projectManagerId),
    team: (project) => db.users.filter((user) => project.teamIds.includes(user.id)),
    tags: (project) => db.tags.filter((tag) => project.tagIds.includes(tag.id)),
    phases: (project) =>
      where(db.phases, "projectId", project.id).sort((a, b) => a.orderIndex - b.orderIndex),
    milestones: (project) => {
      const phaseIds = where(db.phases, "projectId", project.id).map((phase) => phase.id);
      return db.milestones.filter((milestone) => phaseIds.includes(milestone.phaseId));
    },
    tasks: (project) =>
      where(db.tasks, "projectId", project.id).sort((a, b) => a.orderIndex - b.orderIndex),
    changeRequests: (project) => where(db.changeRequests, "projectId", project.id),
    documents: (project) =>
      db.documents.filter((d) => d.entityType === "project" && d.entityId === project.id),
  },

  ProjectPhase: {
    milestones: (phase) =>
      where(db.milestones, "phaseId", phase.id).sort((a, b) => a.orderIndex - b.orderIndex),
    tasks: (phase) => where(db.tasks, "phaseId", phase.id),
  },

  Milestone: {
    phase: (milestone) => byId(db.phases, milestone.phaseId),
    project: (milestone) => {
      const phase = byId(db.phases, milestone.phaseId);
      return phase ? byId(db.projects, phase.projectId) : null;
    },
    tasks: (milestone) => where(db.tasks, "milestoneId", milestone.id),
    approvals: (milestone) =>
      db.approvals
        .filter((a) => a.entityType === "MILESTONE" && a.entityId === milestone.id)
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)),
    documents: (milestone) =>
      db.documents.filter((d) => d.entityType === "milestone" && d.entityId === milestone.id),
  },

  Task: {
    assignee: (task) => byId(db.users, task.assigneeId),
    phase: (task) => byId(db.phases, task.phaseId),
    milestone: (task) => byId(db.milestones, task.milestoneId),
    parentTask: (task) => byId(db.tasks, task.parentTaskId),
    subtasks: (task) =>
      where(db.tasks, "parentTaskId", task.id).sort((a, b) => a.orderIndex - b.orderIndex),
    dependencies: (task) => where(db.taskDependencies, "taskId", task.id),
  },

  TaskDependency: {
    dependsOnTask: (dependency) => byId(db.tasks, dependency.dependsOnTaskId),
  },

  ChangeRequest: {
    project: (changeRequest) => byId(db.projects, changeRequest.projectId),
    company: (changeRequest) => byId(db.companies, changeRequest.companyId),
    requestedByContact: (cr) => byId(db.contacts, cr.requestedByContactId),
    assignedPm: (changeRequest) => byId(db.users, changeRequest.assignedPmId),
    awaitingParty: (changeRequest) => awaitingPartyFor(changeRequest),
    responseDueAt: (changeRequest) => responseDueAtFor(changeRequest),
    isOverdue: (changeRequest) => isOverdueRequest(changeRequest),
    approvals: (changeRequest) =>
      approvalsFor("CHANGE_REQUEST", changeRequest.id).sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
      ),
    comments: (changeRequest, _args, ctx) =>
      db.comments
        .filter((c) => c.entityType === "change_request" && c.entityId === changeRequest.id)
        // Internal-only notes never reach a portal caller. Enforced here rather
        // than in the UI so the data simply isn't sent.
        .filter((c) => (ctx.claims?.scope === "PORTAL" ? c.isClientVisible : true))
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)),
    attachments: (changeRequest) =>
      db.documents.filter(
        (d) => d.entityType === "change_request" && d.entityId === changeRequest.id,
      ),
  },

  RetentionSequence: {
    enrollments: (sequence_) => where(db.enrollments, "sequenceId", sequence_.id),
    activeEnrollmentCount: (sequence_) =>
      db.enrollments.filter((e) => e.sequenceId === sequence_.id && e.status === "ACTIVE").length,
  },

  SequenceEnrollment: {
    sequence: (enrollment) => byId(db.retentionSequences, enrollment.sequenceId),
    company: (enrollment) => byId(db.companies, enrollment.companyId),
    contact: (enrollment) => byId(db.contacts, enrollment.contactId),
  },

  Touchpoint: {
    // Derived rather than trusted verbatim — a SCHEDULED touchpoint whose date
    // has passed its grace period reads as OVERDUE without anything having to
    // sweep the database and flip a stored flag. See §9.3.
    status: (touchpoint) => deriveTouchpointStatus(touchpoint),
    company: (touchpoint) => byId(db.companies, touchpoint.companyId),
    contact: (touchpoint) => byId(db.contacts, touchpoint.contactId),
    project: (touchpoint) => byId(db.projects, touchpoint.projectId),
    enrollment: (touchpoint) => byId(db.enrollments, touchpoint.enrollmentId),
    createdBy: (touchpoint) => byId(db.users, touchpoint.createdById),
  },
};
