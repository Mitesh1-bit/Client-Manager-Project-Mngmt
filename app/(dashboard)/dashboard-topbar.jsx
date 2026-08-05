"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Search } from "lucide-react";

import { CrmTourTrigger } from "@/app/components/domain/crm-tour-trigger";
import { Button } from "@/app/components/ui/button";
import { Separator } from "@/app/components/ui/separator";
import { SidebarTrigger } from "@/app/components/ui/sidebar";

import { FOOTER_NAV, NAV_GROUPS, isNavItemActive } from "./nav-config";

const ALL_ITEMS = [...NAV_GROUPS.flatMap((group) => group.items), ...FOOTER_NAV];

export function DashboardTopbar() {
  const pathname = usePathname();
  const current = ALL_ITEMS.find((item) => isNavItemActive(pathname, item));

  return (
    <header className="sticky top-0 z-30 flex h-(--topbar-height) min-w-0 shrink-0 items-center gap-2 border-b bg-background/85 px-4 backdrop-blur-sm">
      <SidebarTrigger />
      <Separator orientation="vertical" className="mr-1 !h-5" />
      <span className="min-w-0 truncate font-medium">{current?.label ?? "Meridian"}</span>

      <div className="ml-auto flex items-center gap-1.5">
        <Button variant="outline" size="sm" className="gap-2 text-muted-foreground" asChild data-tour="topbar-search">
          <Link href="/search">
            <Search aria-hidden="true" />
            <span className="hidden sm:inline">Search</span>
          </Link>
        </Button>
        <CrmTourTrigger />
        <Button variant="ghost" size="icon-sm" aria-label="Notifications" disabled>
          <Bell aria-hidden="true" />
        </Button>
      </div>
    </header>
  );
}
