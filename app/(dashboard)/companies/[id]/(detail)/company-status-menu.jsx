"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@apollo/client/react";
import { ChevronDown } from "lucide-react";
import { toast } from "sonner";

import { StatusBadge } from "@/app/components/domain/status-badge";
import { Button } from "@/app/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { UpdateCompanyDocument } from "@/app/lib/graphql/generated/documents";
import { getStatusMeta, listStatuses } from "@/app/lib/status";

const STATUS_OPTIONS = listStatuses("companyStatus");

/**
 * Lifecycle status change with optimistic feedback: the badge flips the moment
 * you choose, and rolls back with a toast if the mutation fails.
 *
 * The surrounding header is server-rendered, so the optimistic value is held
 * locally and cleared once the refreshed server value arrives.
 */
export function CompanyStatusMenu({ companyId, companyName, status }) {
  const router = useRouter();
  const [pendingStatus, setPendingStatus] = useState(null);
  const [updateCompany] = useMutation(UpdateCompanyDocument);

  // Once the refreshed server value arrives, drop the optimistic one. Adjusting
  // state during render (rather than in an effect) avoids a second paint.
  const [serverStatus, setServerStatus] = useState(status);
  if (serverStatus !== status) {
    setServerStatus(status);
    setPendingStatus(null);
  }

  const shownStatus = pendingStatus ?? status;

  async function changeStatus(next) {
    if (next === status) return;
    setPendingStatus(next);

    try {
      await updateCompany({
        variables: { id: companyId, input: { name: companyName, status: next } },
      });
      toast.success(`Status set to ${getStatusMeta("companyStatus", next).label.toLowerCase()}`);
      router.refresh();
    } catch (error) {
      setPendingStatus(null);
      toast.error("Couldn't change the status", {
        description: error?.message ?? "The change was rolled back.",
      });
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <StatusBadge kind="companyStatus" value={shownStatus} size="sm" />
          <ChevronDown aria-hidden="true" />
          <span className="sr-only">Change company status</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel>Lifecycle status</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={shownStatus} onValueChange={changeStatus}>
          {STATUS_OPTIONS.map((option) => (
            <DropdownMenuRadioItem key={option.value} value={option.value}>
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
