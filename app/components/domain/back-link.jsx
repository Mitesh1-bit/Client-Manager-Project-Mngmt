import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { cn } from "@/app/lib/utils";

/**
 * Consistent back navigation for dashboard and portal.
 * Uses explicit `href` targets so users always know where they land.
 */
export function BackLink({ href, children, className, variant = "app", inline = false }) {
  if (variant === "portal") {
    return (
      <Link href={href} className={cn("portal-back-link", className)}>
        <ChevronLeft aria-hidden="true" className="size-4 shrink-0" />
        {children}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-1 rounded-sm text-caption text-muted-foreground transition-colors hover:text-foreground focus-ring",
        inline ? "mb-0" : "mb-4",
        className,
      )}
    >
      <ChevronLeft aria-hidden="true" className="size-4 shrink-0" />
      {children}
    </Link>
  );
}
