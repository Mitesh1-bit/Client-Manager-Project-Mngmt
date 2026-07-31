"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { BrandMark } from "@/app/components/domain/brand-mark";
import { UserMenu } from "@/app/components/domain/user-menu";
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
} from "@/app/components/ui/sidebar";

import { FOOTER_NAV, NAV_GROUPS, isNavItemActive } from "./nav-config";
import { filterNavItems } from "@/app/lib/rbac";

export function DashboardSidebar({ viewer, organizationName }) {
  const pathname = usePathname();
  const navGroups = NAV_GROUPS.map((group) => ({
    ...group,
    items: filterNavItems(viewer.role, group.items),
  })).filter((group) => group.items.length > 0);
  const footerNav = filterNavItems(viewer.role, FOOTER_NAV);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <BrandMark className="bg-sidebar-primary text-sidebar-primary-foreground" />
                <span className="flex min-w-0 flex-col leading-tight">
                  <span className="truncate font-semibold tracking-tight">Meridian</span>
                  <span className="truncate text-[0.6875rem] opacity-70">{organizationName}</span>
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {navGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const active = isNavItemActive(pathname, item);
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        tooltip={item.label}
                        aria-current={active ? "page" : undefined}
                      >
                        <Link href={item.href}>
                          <item.icon aria-hidden="true" />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          {footerNav.map((item) => {
            const active = isNavItemActive(pathname, item);
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={active}
                  tooltip={item.label}
                  aria-current={active ? "page" : undefined}
                >
                  <Link href={item.href}>
                    <item.icon aria-hidden="true" />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
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
