"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronsUpDown } from "lucide-react";

import { UserMenu } from "@/app/components/domain/user-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/app/components/ui/sidebar";
import { cn } from "@/app/lib/utils";

import { FOOTER_NAV, NAV_GROUPS, isNavItemActive } from "./nav-config";

function NavIcon({ icon: Icon, active }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex size-7 shrink-0 items-center justify-center rounded-lg transition-colors duration-150",
        active
          ? "bg-sidebar-primary/15 text-sidebar-primary shadow-[inset_0_0_0_1px_oklch(1_0_0/8%)]"
          : "text-sidebar-foreground/55 group-hover/menu-button:bg-sidebar-accent group-hover/menu-button:text-sidebar-foreground",
      )}
    >
      <Icon className="size-4" />
    </span>
  );
}

function NavLink({ item, active }) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={active}
        tooltip={item.label}
        aria-current={active ? "page" : undefined}
        className="relative gap-2.5 rounded-xl pl-2.5"
      >
        <Link href={item.href}>
          <span
            aria-hidden="true"
            className={cn(
              "absolute inset-y-1.5 left-0 w-[3px] origin-center rounded-full bg-gradient-to-b from-sidebar-primary to-brand-600 transition-transform duration-200 ease-out group-data-[collapsible=icon]:hidden",
              active ? "scale-y-100" : "scale-y-0",
            )}
          />
          <NavIcon icon={item.icon} active={active} />
          <span className={cn(active && "text-sidebar-foreground")}>{item.label}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export function DashboardSidebar({ viewer, organizationName }) {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="group/switcher flex w-full items-center gap-2.5 rounded-xl p-2 text-left transition-colors hover:bg-sidebar-accent focus-ring group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-1.5"
                >
                  <span className="relative flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sidebar-primary to-brand-600 font-semibold text-sidebar-primary-foreground shadow-[0_1px_0_0_oklch(1_0_0/12%)_inset,0_4px_10px_-4px_oklch(0_0_0/45%)]">
                    M
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col leading-tight group-data-[collapsible=icon]:hidden">
                    <span className="truncate font-semibold tracking-tight">Meridian</span>
                    <span className="truncate text-[0.6875rem] text-sidebar-foreground/60">
                      {organizationName}
                    </span>
                  </span>
                  <ChevronsUpDown
                    aria-hidden="true"
                    className="size-3.5 shrink-0 text-sidebar-foreground/40 transition-colors group-hover/switcher:text-sidebar-foreground/80 group-data-[collapsible=icon]:hidden"
                  />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" side="bottom" className="w-64">
                <DropdownMenuLabel className="font-normal">
                  <span className="block truncate font-medium">{organizationName}</span>
                  <span className="block truncate text-caption text-muted-foreground">
                    Current workspace
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem disabled>Invite teammates</DropdownMenuItem>
                <DropdownMenuItem disabled>Workspace settings</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/">Go to dashboard</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {NAV_GROUPS.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="gap-1.5">
              <span aria-hidden="true" className="size-1 shrink-0 rounded-full bg-sidebar-foreground/30" />
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <NavLink key={item.href} item={item} active={isNavItemActive(pathname, item)} />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarSeparator className="mb-1" />
        <SidebarMenu>
          {FOOTER_NAV.map((item) => (
            <NavLink key={item.href} item={item} active={isNavItemActive(pathname, item)} />
          ))}
          <SidebarMenuItem className="group-data-[collapsible=icon]:hidden">
            <UserMenu
              name={viewer.name}
              email={viewer.email}
              secondary={viewer.roleLabel}
              avatarUrl={viewer.avatarUrl}
              side="top"
              align="start"
            />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
