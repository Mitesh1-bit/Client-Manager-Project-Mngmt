/**
 * Assignee role categories for task assignment and retention steps.
 * Workspace RBAC roles (admin, project_manager) map directly; team members
 * can be grouped by optional job title (designer, developer, qa).
 */

export const ASSIGNEE_ROLE_CATEGORIES = [
  { value: "project_manager", label: "Project Manager (PM)" },
  { value: "team_member", label: "Team member" },
  { value: "designer", label: "Designer" },
  { value: "qa", label: "QA" },
  { value: "developer", label: "Developer" },
  { value: "admin", label: "Admin" },
];

const CATEGORY_BY_VALUE = Object.fromEntries(
  ASSIGNEE_ROLE_CATEGORIES.map((entry) => [entry.value, entry]),
);

/** @param {string | null | undefined} role */
export function normalizeWorkspaceRole(role) {
  return String(role ?? "")
    .trim()
    .toLowerCase()
    .replace(/-/g, "_");
}

/** @param {{ role?: string | null; jobTitle?: string | null; job_title?: string | null }} user */
export function getUserAssigneeCategory(user) {
  const role = normalizeWorkspaceRole(user?.role);

  if (role === "admin") return "admin";
  if (role === "project_manager") return "project_manager";

  const jobTitle = normalizeWorkspaceRole(user?.jobTitle ?? user?.job_title);
  if (jobTitle === "designer") return "designer";
  if (jobTitle === "qa") return "qa";
  if (jobTitle === "developer") return "developer";

  return "team_member";
}

/** @param {string} categoryValue */
export function assigneeCategoryLabel(categoryValue) {
  return CATEGORY_BY_VALUE[categoryValue]?.label ?? categoryValue;
}

/**
 * Role categories that have at least one user in the list.
 *
 * @param {Array<{ id: string; role?: string; jobTitle?: string | null; job_title?: string | null }>} users
 * @param {string[] | undefined} allowedCategories
 */
export function getAssigneeCategoriesPresent(users, allowedCategories) {
  const present = new Set(users.map((user) => getUserAssigneeCategory(user)));
  const allowed = allowedCategories ? new Set(allowedCategories) : null;

  return ASSIGNEE_ROLE_CATEGORIES.filter((category) => {
    if (!present.has(category.value)) return false;
    if (allowed && !allowed.has(category.value)) return false;
    return true;
  });
}

/**
 * @param {Array<{ id: string; name: string; role?: string; jobTitle?: string | null; job_title?: string | null }>} users
 * @param {string | null | undefined} categoryValue
 */
export function usersInAssigneeCategory(users, categoryValue) {
  if (!categoryValue) return [];
  return users.filter((user) => getUserAssigneeCategory(user) === categoryValue);
}

/** Options for retention sequence steps (role-only, no person). */
export const SEQUENCE_ASSIGNEE_ROLES = ASSIGNEE_ROLE_CATEGORIES.map((entry) => ({
  value: entry.value.toUpperCase(),
  label: entry.label,
}));
