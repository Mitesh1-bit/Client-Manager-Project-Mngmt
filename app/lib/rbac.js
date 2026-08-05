/** Role catalog — mirrors backend `UserRole` and documents what each role can do. */

export const ROLE_CATALOG = [
  {
    value: "admin",
    label: "Admin",
    summary: "Full workspace control — team, clients, projects, billing, and settings.",
    access: [
      "Invite and manage team members",
      "Create and edit companies & contacts",
      "Create projects and manage delivery",
      "Assess and decide change requests",
      "Retention sequences and touchpoints",
      "Contracts, invoices, and audit logs",
    ],
  },
  {
    value: "project_manager",
    label: "Project manager",
    summary: "Runs delivery — projects, tasks, milestones, change requests, and client records.",
    access: [
      "Create and edit companies & contacts",
      "Create and manage projects",
      "Phases, tasks, milestones, and board",
      "Assess and decide change requests",
      "Mark milestones ready for client review",
      "Retention sequences and touchpoints",
      "Invoices (view and create)",
      "Add or remove team members (team member role only)",
    ],
  },
  {
    value: "team_member",
    label: "Team member",
    summary: "Contributes on assigned work — tasks and project boards.",
    access: [
      "View companies and projects",
      "Update tasks and board columns",
      "View change requests (no decisions)",
    ],
  },
  {
    value: "finance_admin",
    label: "Finance admin",
    summary: "Billing and contracts — no client or project delivery changes.",
    access: ["View companies and projects (read-only)", "Contracts and invoices"],
  },
  {
    value: "executive_viewer",
    label: "Executive viewer",
    summary: "Read-only overview for leadership — dashboard, clients, and audit.",
    access: ["View dashboard, companies, and projects", "Audit log export"],
  },
];

export const INTERNAL_ROLES = ROLE_CATALOG.map((role) => role.value);

/** @param {string} role */
export function roleDefinition(role) {
  return (
    ROLE_CATALOG.find((entry) => entry.value === role) ??
    ROLE_CATALOG.find((entry) => entry.value === "team_member")
  );
}

/**
 * Filter nav items by role. Items without `roles` are visible to all internal users.
 *
 * @param {string} role
 * @param {Array<{ href: string, roles?: string[] | null }>} items
 */
export function filterNavItems(role, items) {
  return items.filter((item) => !item.roles || item.roles.includes(role));
}

/**
 * Whether a role can invite/delete team members at all. Note this is
 * necessarily incomplete on its own: a project manager can only add or
 * remove the "team_member" role specifically, not manage the team broadly
 * the way an admin can — see the create/delete role checks in
 * backend/app/graphql/users/service.py for the actual scoped rule.
 *
 * @param {string} role
 */
export function canManageTeam(role) {
  return role === "admin" || role === "project_manager";
}

/** @param {string} role */
export function canManageClients(role) {
  return ["admin", "project_manager"].includes(role);
}

/** @param {string} role */
export function canManageProjects(role) {
  return ["admin", "project_manager"].includes(role);
}
