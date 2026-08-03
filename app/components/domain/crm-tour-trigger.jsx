"use client";

import { usePathname } from "next/navigation";
import { CircleHelp } from "lucide-react";

import { Button } from "@/app/components/ui/button";

import { useCrmTour } from "./crm-tour-context";

/**
 * Header ? button — starts the interactive product tour for the current page & role.
 */
export function CrmTourTrigger({ className }) {
  const pathname = usePathname();
  const { startTour } = useCrmTour();

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      className={className}
      aria-label="Start product guide tour"
      data-tour="tour-trigger"
      onClick={() => startTour(pathname)}
    >
      <CircleHelp aria-hidden="true" />
    </Button>
  );
}
