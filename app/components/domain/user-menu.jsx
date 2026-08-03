import { ChevronsUpDown, UserRound } from "lucide-react";

import { SignOutMenuItem } from "@/app/components/domain/sign-out-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { cn } from "@/app/lib/utils";

function initials(name) {
  return String(name ?? "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

function SidebarAvatar({ name, avatarUrl }) {
  return (
    <span className="inline-flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-md bg-sidebar-primary text-xs font-semibold text-sidebar-primary-foreground">
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarUrl} alt="" className="size-full object-cover" />
      ) : (
        initials(name) || <UserRound aria-hidden="true" className="size-4" />
      )}
    </span>
  );
}

/**
 * @param {{ name: string, email: string, secondary?: string, avatarUrl?: string | null, align?: 'start' | 'end', side?: 'top' | 'bottom' | 'right', className?: string, compact?: boolean, variant?: 'default' | 'sidebar', scope?: string }} props
 */
export function UserMenu({
  name,
  email,
  secondary,
  avatarUrl,
  align = "end",
  side = "bottom",
  className,
  compact = false,
  variant = "default",
  scope = "INTERNAL",
}) {
  const isSidebar = variant === "sidebar";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          isSidebar
            ? "app-sidebar-user-trigger flex h-9 w-full min-w-0 items-center gap-2.5 rounded-lg px-2.5 text-left text-sm text-sidebar-foreground outline-none transition-[background-color,color,box-shadow] duration-150 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            : "flex w-full items-center gap-2.5 rounded-lg p-1.5 text-left transition-colors hover:bg-sidebar-accent focus-ring",
          compact && (isSidebar ? "size-8 justify-center p-0 hover:bg-sidebar-accent" : "w-auto p-1"),
          className,
        )}
      >
        {isSidebar ? (
          <SidebarAvatar name={name} avatarUrl={avatarUrl} />
        ) : (
          <Avatar className="size-8 shrink-0 rounded-lg after:hidden">
            {avatarUrl ? <AvatarImage src={avatarUrl} alt="" className="rounded-lg" /> : null}
            <AvatarFallback className="rounded-lg bg-muted text-[0.75rem] font-medium text-muted-foreground">
              {initials(name) || <UserRound aria-hidden="true" className="size-4" />}
            </AvatarFallback>
          </Avatar>
        )}
        {compact ? (
          <span className="sr-only">Open account menu for {name}</span>
        ) : (
          <>
            <span className="flex min-w-0 flex-1 flex-col gap-0.5 leading-none">
              <span className={cn("truncate font-medium", isSidebar ? "text-[0.8125rem]" : "text-caption")}>
                {name}
              </span>
              <span className="truncate text-[0.6875rem] text-sidebar-foreground/65">{secondary ?? email}</span>
            </span>
            <ChevronsUpDown aria-hidden="true" className="size-4 shrink-0 opacity-50" />
          </>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent align={align} side={side} className="w-60">
        <DropdownMenuLabel className="font-normal">
          <span className="block truncate font-medium">{name}</span>
          <span className="block truncate text-caption text-muted-foreground">{email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled>Profile &amp; preferences</DropdownMenuItem>
        <DropdownMenuItem disabled>Notification settings</DropdownMenuItem>
        <DropdownMenuSeparator />
        <SignOutMenuItem scope={scope} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
