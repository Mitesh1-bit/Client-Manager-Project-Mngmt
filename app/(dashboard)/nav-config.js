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
      { href: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
      { href: "/companies", label: "Companies", icon: Building2 },
      { href: "/projects", label: "Projects", icon: FolderKanban },
    ],
  },
  {
    label: "Operations",
    items: [
      { href: "/change-requests", label: "Change requests", icon: GitPullRequestArrow },
      { href: "/retention", label: "Retention", icon: HeartHandshake },
    ],
  },
];

export const FOOTER_NAV = [{ href: "/settings", label: "Settings", icon: Settings }];

/**
 * @param {string} pathname
 * @param {{ href: string, exact?: boolean }} item
 */
export function isNavItemActive(pathname, item) {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
