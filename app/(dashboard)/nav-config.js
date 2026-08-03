import {
  Building2,
  FolderKanban,
  GitPullRequestArrow,
  LayoutDashboard,
  Settings,
  HeartHandshake,
} from "lucide-react";

export const NAV_GROUPS = [
  {
    label: "Workspace",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true, tourId: "nav-dashboard" },
      {
        href: "/companies",
        label: "Companies",
        icon: Building2,
        tourId: "nav-companies",
        roles: ["admin", "account_manager", "project_manager", "team_member", "finance_admin", "executive_viewer"],
      },
      {
        href: "/projects",
        label: "Projects",
        icon: FolderKanban,
        tourId: "nav-projects",
        roles: ["admin", "account_manager", "project_manager", "team_member", "finance_admin", "executive_viewer"],
      },
    ],
  },
  {
    label: "Operations",
    items: [
      {
        href: "/change-requests",
        label: "Change requests",
        icon: GitPullRequestArrow,
        tourId: "nav-change-requests",
        roles: ["admin", "account_manager", "project_manager"],
      },
      {
        href: "/retention",
        label: "Retention",
        icon: HeartHandshake,
        tourId: "nav-retention",
        roles: ["admin", "account_manager", "project_manager"],
      },
    ],
  },
];

export const FOOTER_NAV = [
  {
    href: "/settings",
    label: "Settings",
    icon: Settings,
    tourId: "nav-settings",
    roles: ["admin", "account_manager", "project_manager", "team_member", "finance_admin", "executive_viewer"],
  },
];

/**
 * @param {string} pathname
 * @param {{ href: string, exact?: boolean }} item
 */
export function isNavItemActive(pathname, item) {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
