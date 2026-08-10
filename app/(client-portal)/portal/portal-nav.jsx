"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, GitPullRequestArrow, House, LayoutList, ShieldCheck } from "lucide-react";

const ITEMS = [
  { href: "/portal", label: "Overview", icon: House, exact: true, tourId: "portal-nav-overview" },
  { href: "/portal/projects", label: "Projects", icon: LayoutList, tourId: "portal-nav-projects" },
  {
    href: "/portal/approvals",
    label: "Approvals",
    shortLabel: "Approve",
    icon: ShieldCheck,
    badgeKey: "approvals",
    tourId: "portal-nav-approvals",
  },
  {
    href: "/portal/change-requests",
    label: "Changes",
    shortLabel: "Changes",
    icon: GitPullRequestArrow,
    tourId: "portal-nav-requests",
  },
  { href: "/portal/documents", label: "Documents", shortLabel: "Files", icon: FileText, tourId: "portal-nav-documents" },
];

function useActiveHref() {
  const pathname = usePathname();
  return (item) =>
    item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
}

/**
 * @param {{ badges?: { approvals?: number } }} props
 */
export function PortalNavBar({ badges = {} }) {
  const isActive = useActiveHref();

  return (
    <nav aria-label="Portal" className="hidden md:block">
      <ul className="flex items-center gap-1 rounded-full border border-[oklch(0.91_0.012_255/0.9)] bg-white/70 p-1 shadow-sm">
        {ITEMS.map((item) => {
          const active = isActive(item);
          const count = item.badgeKey ? (badges[item.badgeKey] ?? 0) : 0;

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                data-tour={item.tourId}
                data-active={active ? "true" : "false"}
                aria-current={active ? "page" : undefined}
                className="portal-nav-link focus-ring"
              >
                <item.icon aria-hidden="true" className="size-4" />
                {item.label}
                {count > 0 ? (
                  <span className="tabular flex min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 py-0.5 text-[0.625rem] font-bold text-white shadow-sm">
                    {count}
                    <span className="sr-only"> waiting on you</span>
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function PortalTabBar({ badges = {} }) {
  const isActive = useActiveHref();

  return (
    <nav aria-label="Portal" className="portal-tab-bar md:hidden">
      <ul className="grid grid-cols-5">
        {ITEMS.map((item) => {
          const active = isActive(item);
          const count = item.badgeKey ? (badges[item.badgeKey] ?? 0) : 0;

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                data-tour={item.tourId}
                data-active={active ? "true" : "false"}
                aria-current={active ? "page" : undefined}
                className="portal-tab-item focus-ring"
              >
                <span className="portal-tab-item__icon relative">
                  <item.icon aria-hidden="true" className="size-[1.125rem]" />
                  {count > 0 ? (
                    <span className="tabular absolute -top-1 -right-1.5 flex min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[0.5625rem] font-bold text-white ring-2 ring-white">
                      {count}
                      <span className="sr-only"> waiting on you</span>
                    </span>
                  ) : null}
                </span>
                <span className="max-w-full truncate text-center">{item.shortLabel ?? item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
