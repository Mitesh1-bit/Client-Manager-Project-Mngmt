"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/app/lib/utils";

/**
 * Link-based tabs for entity detail pages. Real routes rather than local state,
 * so each tab is deep-linkable, server-rendered and independently cacheable.
 *
 * @param {{ tabs: Array<{ href: string, label: string, count?: number | null }>, className?: string }} props
 */
export function DetailTabs({ tabs, className }) {
  const pathname = usePathname();

  return (
    <div className={cn("-mx-(--content-gutter) overflow-x-auto px-(--content-gutter)", className)}>
      <nav aria-label="Sections">
        <ul className="flex min-w-max items-center gap-1 border-b">
          {tabs.map((tab) => {
            const active = pathname === tab.href;
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
                  {typeof tab.count === "number" ? (
                    <span
                      className={cn(
                        "tabular rounded-full px-1.5 py-0.5 text-[0.6875rem]",
                        active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
                      )}
                    >
                      {tab.count}
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
