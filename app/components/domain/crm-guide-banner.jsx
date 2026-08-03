"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CircleHelp, X } from "lucide-react";

import { Button } from "@/app/components/ui/button";
import { guideBannerStorageKey } from "@/app/lib/guide/role-guides";
import { roleDefinition } from "@/app/lib/rbac";

/**
 * @param {{ role: string, scope?: 'INTERNAL' | 'PORTAL', href?: string }} props
 */
export function CrmGuideBanner({ role, scope = "INTERNAL", href = "/guide" }) {
  const [visible, setVisible] = useState(false);
  const roleLabel = scope === "PORTAL" ? "Client contact" : roleDefinition(role).label;

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem(guideBannerStorageKey(role, scope));
      setVisible(!dismissed);
    } catch {
      setVisible(true);
    }
  }, [role, scope]);

  function dismiss() {
    try {
      localStorage.setItem(guideBannerStorageKey(role, scope), "1");
    } catch {
      /* ignore */
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="mb-6 flex flex-col gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-primary">
          <CircleHelp aria-hidden="true" className="size-5" />
        </span>
        <div>
          <p className="font-medium">New to this CRM?</p>
          <p className="mt-0.5 text-caption text-muted-foreground">
            Take a short animated tour for{" "}
            <span className="font-medium text-foreground">{roleLabel}</span> — what to do and
            where to click.
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Button size="sm" asChild>
          <Link href={href}>Start guide</Link>
        </Button>
        <Button size="icon-sm" variant="ghost" onClick={dismiss} aria-label="Dismiss guide banner">
          <X aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
