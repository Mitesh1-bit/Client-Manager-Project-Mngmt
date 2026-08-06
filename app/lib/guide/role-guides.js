/**
 * Role-based CRM walkthrough content — used by /guide and /portal/guide.
 */

import { ROLE_CATALOG } from "@/app/lib/rbac";

/** @typedef {{ id: string, title: string, body: string, href?: string, action?: string, icon: string }} GuideStep */

/** @type {Record<string, { label: string, tagline: string, steps: GuideStep[] }>} */
export const INTERNAL_ROLE_GUIDES = {
  admin: {
    label: "Admin",
    tagline: "You run the workspace — team, clients, delivery, and settings.",
    steps: [
      {
        id: "welcome",
        title: "Welcome, workspace admin",
        body: "You have full control: invite staff, manage clients, run projects, and configure the workspace. This guide walks through the usual setup order.",
        icon: "Shield",
      },
      {
        id: "team",
        title: "Invite your team",
        body: "Go to Settings → Members → Add team member. Pick a role (project manager, finance admin, etc.) and share login credentials securely.",
        href: "/settings/members",
        action: "Open Settings",
        icon: "Users",
      },
      {
        id: "company",
        title: "Add a client",
        body: "Clients are the customer organizations you work with. Create one with name, industry, and status before adding contacts or projects.",
        href: "/companies/new",
        action: "Add client",
        icon: "Building2",
      },
      {
        id: "contact",
        title: "Enable the client portal",
        body: "Under the client → Contacts, add a person and turn on portal access with a password. They log in at Client portal login.",
        href: "/companies",
        action: "View clients",
        icon: "UserPlus",
      },
      {
        id: "project",
        title: "Create a project",
        body: "Link a project to the client. Use the board for tasks, milestones for client approvals, and track health on the dashboard.",
        href: "/projects/new",
        action: "New project",
        icon: "FolderKanban",
      },
      {
        id: "changes",
        title: "Handle change requests",
        body: "Clients submit scope or timeline changes in the portal. Review, assess impact, and approve or reject from Change requests.",
        href: "/change-requests",
        action: "Change requests",
        icon: "GitPullRequestArrow",
      },
    ],
  },
  project_manager: {
    label: "Project manager",
    tagline: "You run delivery — board, milestones, and change-request decisions.",
    steps: [
      {
        id: "welcome",
        title: "Your focus: delivery",
        body: "You manage projects day-to-day — tasks on the board, milestones for client sign-off, and change-request workflow.",
        icon: "Kanban",
      },
      {
        id: "board",
        title: "Run the board",
        body: "Open a project → Board. Create tasks, assign team members, and move cards across To do → In progress → Done.",
        href: "/projects",
        action: "Projects",
        icon: "Columns3",
      },
      {
        id: "milestones",
        title: "Plan milestones",
        body: "Add phases and milestones under Milestones. Mark deliverables ready for client review when it's time to approve.",
        href: "/projects",
        action: "Open a project",
        icon: "Flag",
      },
      {
        id: "changes",
        title: "Assess change requests",
        body: "When a client submits a change, open it, add impact (hours, cost, timeline), and decide approve or reject.",
        href: "/change-requests",
        action: "Change requests",
        icon: "GitPullRequestArrow",
      },
      {
        id: "team",
        title: "Coordinate the team",
        body: "Team members update assigned tasks. You keep the board current and unblock work.",
        href: "/dashboard",
        action: "Dashboard",
        icon: "Users",
      },
    ],
  },
  team_member: {
    label: "Team member",
    tagline: "You contribute on assigned tasks — boards and project views.",
    steps: [
      {
        id: "welcome",
        title: "Your focus: assigned work",
        body: "You can view clients and projects, and update tasks on the board. You won't manage clients or decide change requests.",
        icon: "CheckSquare",
      },
      {
        id: "find",
        title: "Find your projects",
        body: "Go to Projects and open the project you're on. The board shows all tasks by status.",
        href: "/projects",
        action: "Projects",
        icon: "FolderKanban",
      },
      {
        id: "board",
        title: "Update the board",
        body: "Drag your task cards as work progresses. Add details, due dates, and hours if your PM asks.",
        href: "/projects",
        action: "Open board",
        icon: "Columns3",
      },
      {
        id: "requests",
        title: "View change requests",
        body: "You can read change requests to stay aligned — decisions are made by PMs and admins.",
        href: "/change-requests",
        action: "Change requests",
        icon: "Eye",
      },
    ],
  },
};

export const PORTAL_GUIDE = {
  label: "Client contact",
  tagline: "Your portal — projects, approvals, and change requests for your company only.",
  steps: [
    {
      id: "welcome",
      title: "Welcome to your portal",
      body: "You see only your company's projects — not the whole agency workspace. Staff manage delivery; you approve milestones and request changes.",
      icon: "House",
    },
    {
      id: "projects",
      title: "View your projects",
      body: "Projects lists everything in flight for your organization. Open one for milestones, documents, and status.",
      href: "/portal/projects",
      action: "Your projects",
      icon: "LayoutList",
    },
    {
      id: "approvals",
      title: "Approve milestones",
      body: "When the agency marks a deliverable ready, you'll see it under Approvals. Approve or request changes.",
      href: "/portal/approvals",
      action: "Approvals",
      icon: "ShieldCheck",
    },
    {
      id: "changes",
      title: "Submit change requests",
      body: "Need a scope, timeline, or budget change? Submit a formal request — the agency will assess and respond.",
      href: "/portal/change-requests/new",
      action: "New request",
      icon: "GitPullRequestArrow",
    },
    {
      id: "documents",
      title: "Shared documents",
      body: "Files the agency shares with you live under Documents.",
      href: "/portal/documents",
      action: "Documents",
      icon: "FileText",
    },
  ],
};

/** @param {string} role */
export function guideForInternalRole(role) {
  return INTERNAL_ROLE_GUIDES[role] ?? INTERNAL_ROLE_GUIDES.team_member;
}

export const GUIDE_STORAGE_KEY = "crm-guide-banner-v1";

/** @param {string} role @param {'INTERNAL' | 'PORTAL'} scope */
export function guideBannerStorageKey(role, scope) {
  return `${GUIDE_STORAGE_KEY}:${scope}:${role}`;
}

/** Short role summaries for the "all roles" picker. */
export const ALL_ROLES_SUMMARY = ROLE_CATALOG.map((role) => ({
  value: role.value,
  label: role.label,
  summary: role.summary,
}));
