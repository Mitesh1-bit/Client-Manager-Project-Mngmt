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

  SidebarSeparator,

} from "@/app/components/ui/sidebar";



import { FOOTER_NAV, NAV_GROUPS, isNavItemActive } from "./nav-config";

import { filterNavItems } from "@/app/lib/rbac";



const navButtonClass = "h-9 gap-2.5 rounded-lg px-2.5 font-medium";



export function DashboardSidebar({ viewer, organizationName }) {

  const pathname = usePathname();

  const navGroups = NAV_GROUPS.map((group) => ({

    ...group,

    items: filterNavItems(viewer.role, group.items),

  })).filter((group) => group.items.length > 0);

  const footerNav = filterNavItems(viewer.role, FOOTER_NAV);



  return (

    <Sidebar collapsible="icon" className="app-sidebar">

      <SidebarHeader className="gap-0 border-b border-sidebar-border/80 px-3 py-2.5">

        <SidebarMenu>

          <SidebarMenuItem>

            <SidebarMenuButton size="lg" asChild className="h-10 gap-2.5 rounded-lg px-2 hover:bg-sidebar-accent/90">

              <Link href="/dashboard">

                <BrandMark size="sm" className="rounded-md bg-sidebar-primary text-sidebar-primary-foreground" />

                <span className="flex min-w-0 flex-col gap-0.5 leading-none group-data-[collapsible=icon]:hidden">

                  <span className="truncate text-[0.9375rem] font-semibold tracking-tight">Meridian</span>

                  <span className="truncate text-[0.6875rem] font-medium text-sidebar-foreground/55">

                    {organizationName}

                  </span>

                </span>

              </Link>

            </SidebarMenuButton>

          </SidebarMenuItem>

        </SidebarMenu>

      </SidebarHeader>



      <SidebarContent className="gap-0 px-3 py-2">

        {navGroups.map((group, groupIndex) => (

          <SidebarGroup key={group.label} className="p-0">

            {groupIndex > 0 ? <SidebarSeparator className="-mx-1 my-2 bg-sidebar-border/60" /> : null}

            <SidebarGroupLabel className="mb-1 h-6 px-2.5 text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-sidebar-foreground/45">

              {group.label}

            </SidebarGroupLabel>

            <SidebarGroupContent>

              <SidebarMenu className="gap-0.5">

                {group.items.map((item) => {

                  const active = isNavItemActive(pathname, item);

                  return (

                    <SidebarMenuItem key={item.href}>

                      <SidebarMenuButton

                        asChild

                        isActive={active}

                        tooltip={item.label}

                        aria-current={active ? "page" : undefined}

                        className={navButtonClass}

                      >

                        <Link href={item.href} data-tour={item.tourId}>

                          <item.icon aria-hidden="true" className="size-[1.05rem] shrink-0 opacity-90" />

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



      <SidebarFooter className="gap-0 border-t border-sidebar-border/80 px-3 py-2.5">

        <SidebarMenu className="gap-0.5">

          {footerNav.map((item) => {

            const active = isNavItemActive(pathname, item);

            return (

              <SidebarMenuItem key={item.href}>

                <SidebarMenuButton

                  asChild

                  isActive={active}

                  tooltip={item.label}

                  aria-current={active ? "page" : undefined}

                  className={navButtonClass}

                >

                  <Link href={item.href} data-tour={item.tourId}>

                    <item.icon aria-hidden="true" className="size-[1.05rem] shrink-0 opacity-90" />

                    <span>{item.label}</span>

                  </Link>

                </SidebarMenuButton>

              </SidebarMenuItem>

            );

          })}

          <SidebarSeparator className="-mx-1 my-2 bg-sidebar-border/60 group-data-[collapsible=icon]:hidden" />

          <SidebarMenuItem className="hidden group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">

            <UserMenu

              variant="sidebar"

              compact

              name={viewer.name}

              email={viewer.email}

              avatarUrl={viewer.avatarUrl}

              side="right"

              align="end"

            />

          </SidebarMenuItem>

          <SidebarMenuItem className="group-data-[collapsible=icon]:hidden">

            <UserMenu

              variant="sidebar"

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


