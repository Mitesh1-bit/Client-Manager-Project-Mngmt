/** Role catalog — mirrors backend `UserRole` and documents what each role can do. */

export const ROLE_CATALOG = [
  {
    value: "admin",
    label: "Admin",
    summary: "Full workspace control — team, clients, projects, billing, and settings.",
    access: [
      "Sees every client and project — not limited to what they're added to",
      "Invite, edit, and remove team members (any role)",
      "Create and edit companies & contacts",
      "Create projects and manage delivery",
      "Add or remove anyone from a project's team, or create a new person and add them",
      "Assess and decide change requests",
      "Retention sequences and touchpoints, including duplicating a sequence",
      "Contracts, invoices, and the audit log",
    ],
  },
  {
    value: "project_manager",
    label: "Project manager",
    summary: "Runs delivery — projects, tasks, milestones, change requests, billing, and client records.",
    access: [
      "Sees every client and project — not limited to what they're added to",
      "Create and edit companies & contacts",
      "Create and manage projects",
      "Phases, tasks, milestones, and board",
      "Add or remove a project's team members — team member role only — or create a new one and add them",
      "Add or remove a project's client-contact roster",
      "Assess and decide change requests",
      "Mark milestones ready for client review",
      "Retention sequences and touchpoints (not duplicating a sequence — admin only)",
      "Contracts and invoices",
      "Audit log — view, filter, and export",
      "Invite, deactivate/reactivate, or remove a team member (team member role only) from Settings — can't change their name or role",
    ],
  },
  {
    value: "team_member",
    label: "Team member",
    summary: "Contributes on assigned work — tasks and project boards.",
    access: [
      "Sees only the clients and projects they've been added to",
      "Update the status of tasks assigned to them — not other people's tasks",
      "View change requests raised on their projects — creating and deciding them needs a PM or admin",
    ],
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
