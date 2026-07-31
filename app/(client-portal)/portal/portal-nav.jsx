"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, GitPullRequestArrow, House, LayoutList, ShieldCheck } from "lucide-react";

import { cn } from "@/app/lib/utils";

const ITEMS = [
  { href: "/portal", label: "Overview", icon: House, exact: true },
  { href: "/portal/projects", label: "Projects", icon: LayoutList },
  { href: "/portal/approvals", label: "Approvals", icon: ShieldCheck, badgeKey: "approvals" },
  { href: "/portal/change-requests", label: "Requests", icon: GitPullRequestArrow },
  { href: "/portal/documents", label: "Documents", icon: FileText },
];

function useActiveHref() {
  const pathname = usePathname();
  return (item) =>
    item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
}

/**
 * @param {{ badges?: { approvals?: number } }} props counts rendered next to
 * nav items, so "something needs you" is visible from every screen.
 */
export function PortalNavBar({ badges = {} }) {
  const isActive = useActiveHref();

  return (
    <nav aria-label="Portal" className="hidden md:block">
      <ul className="flex items-center gap-1">
        {ITEMS.map((item) => {
          const active = isActive(item);
          const count = item.badgeKey ? (badges[item.badgeKey] ?? 0) : 0;

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2 rounded-full px-3.5 py-2 text-caption font-medium transition-colors focus-ring",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                <item.icon aria-hidden="true" className="size-4" />
                {item.label}
                {count > 0 ? (
                  <span className="tabular flex min-w-5 items-center justify-center rounded-full bg-tone-caution px-1.5 py-0.5 text-[0.625rem] font-semibold text-white">
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
    <nav
      aria-label="Portal"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <ul className="grid grid-cols-5">
        {ITEMS.map((item) => {
          const active = isActive(item);
          const count = item.badgeKey ? (badges[item.badgeKey] ?? 0) : 0;

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-1 px-1 py-2.5 text-[0.6875rem] font-medium transition-colors focus-ring",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <span className="relative">
                  <item.icon aria-hidden="true" className="size-5" />
                  {count > 0 ? (
                    <span className="tabular absolute -top-1.5 -right-2 flex min-w-4 items-center justify-center rounded-full bg-tone-caution px-1 text-[0.5625rem] font-semibold text-white">
                      {count}
                      <span className="sr-only"> waiting on you</span>
                    </span>
                  ) : null}
                </span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
