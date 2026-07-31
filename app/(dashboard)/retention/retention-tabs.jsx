"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/app/lib/utils";

const TABS = [
  { href: "/retention", label: "At risk", exact: true },
  { href: "/retention/sequences", label: "Sequences" },
];

/** Section-level tabs shared by the at-risk dashboard and the sequences list. */
export function RetentionTabs({ counts = {} }) {
  const pathname = usePathname();

  return (
    <div className="-mx-(--content-gutter) overflow-x-auto px-(--content-gutter)">
      <nav aria-label="Retention">
        <ul className="flex min-w-max items-center gap-1 border-b">
          {TABS.map((tab) => {
            const active = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);
            const count = counts[tab.href];

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
                  {typeof count === "number" ? (
                    <span
                      className={cn(
                        "tabular rounded-full px-1.5 py-0.5 text-[0.6875rem]",
                        active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
                      )}
                    >
                      {count}
                    </span>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
