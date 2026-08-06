"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/app/lib/utils";

const TABS = [
  { href: "/settings", label: "General", exact: true },
  { href: "/settings/members", label: "Members" },
  { href: "/settings/profile", label: "Profile" },
  { href: "/settings/notifications", label: "Notifications" },
];

// Mirrors the backend's activityLogs gate (require_role in
// app/graphql/audit/schema.py).
const AUDIT_LOG_TAB = { href: "/settings/audit-log", label: "Audit log" };
const AUDIT_LOG_ROLES = ["admin", "project_manager"];

export function SettingsTabs({ role }) {
  const pathname = usePathname();
  const tabs = AUDIT_LOG_ROLES.includes(role) ? [...TABS, AUDIT_LOG_TAB] : TABS;

  return (
    <div className="-mx-(--content-gutter) overflow-x-auto px-(--content-gutter)">
      <nav aria-label="Settings">
        <ul className="flex min-w-max items-center gap-1 border-b">
          {tabs.map((tab) => {
            const active = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);

            return (
              <li key={tab.href}>
                <Link
                  href={tab.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "-mb-px flex items-center gap-2 border-b-2 px-3 py-2.5 text-caption font-medium whitespace-nowrap transition-colors focus-ring",
                    active
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:border-border hover:text-foreground",
                  )}
                >
                  {tab.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
