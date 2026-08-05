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

export function SettingsTabs() {
  const pathname = usePathname();

  return (
    <div className="-mx-(--content-gutter) overflow-x-auto px-(--content-gutter)">
      <nav aria-label="Settings">
        <ul className="flex min-w-max items-center gap-1 border-b">
          {TABS.map((tab) => {
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
