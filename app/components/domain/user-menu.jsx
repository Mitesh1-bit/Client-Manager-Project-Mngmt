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

/**
 * @param {{ name: string, email: string, secondary?: string, avatarUrl?: string | null, align?: 'start' | 'end', side?: 'top' | 'bottom' | 'right', className?: string, compact?: boolean }} props
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
  scope = "INTERNAL",
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "flex w-full items-center gap-2.5 rounded-lg p-1.5 text-left transition-colors hover:bg-sidebar-accent focus-ring",
          compact && "w-auto p-1",
          className,
        )}
      >
        <Avatar className="size-8 rounded-lg">
          {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
          <AvatarFallback className="rounded-lg text-[0.75rem] font-medium">
            {initials(name) || <UserRound aria-hidden="true" className="size-4" />}
          </AvatarFallback>
        </Avatar>
        {compact ? (
          <span className="sr-only">Open account menu for {name}</span>
        ) : (
          <>
            <span className="flex min-w-0 flex-1 flex-col leading-tight">
              <span className="truncate text-caption font-medium">{name}</span>
              <span className="truncate text-[0.6875rem] opacity-70">{secondary ?? email}</span>
            </span>
            <ChevronsUpDown aria-hidden="true" className="size-4 shrink-0 opacity-60" />
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
