"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@apollo/client/react";
import { ChevronDown, LoaderCircle, UserRound } from "lucide-react";
import { toast } from "sonner";

import { RoleAssigneePicker } from "@/app/components/domain/role-assignee-picker";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/components/ui/alert-dialog";
import { Button } from "@/app/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/popover";
import { Textarea } from "@/app/components/ui/textarea";
import { allowedTransitions } from "@/app/lib/change-requests";
import {
  AssignChangeRequestDocument,
  UpdateChangeRequestStatusDocument,
} from "@/app/lib/graphql/generated/documents";
import { getStatusMeta } from "@/app/lib/status";
import { normalizeWorkspaceRole } from "@/app/lib/assignee-roles";

/**
 * The "move it along" controls that aren't an assessment or a decision:
 * parking it, resuming it, marking it built, reassigning the PM. Only the
 * transitions `allowedTransitions()` says are legal from the current status
 * are ever offered, so this can't be used to skip a step in the lifecycle.
 */
export function ChangeRequestActions({ request, users = [] }) {
  const router = useRouter();
  const [updateStatus] = useMutation(UpdateChangeRequestStatusDocument);
  const [assignPm] = useMutation(AssignChangeRequestDocument);

  const [confirming, setConfirming] = useState(null); // { status, note } | null
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [assigning, setAssigning] = useState(false);

  const transitions = allowedTransitions(request.status);
  const assignedPm = users.find((user) => user.id === request.assignedPmId) ?? null;
  const pmCandidates = users.filter((user) =>
    ["admin", "project_manager"].includes(normalizeWorkspaceRole(user.role)),
  );

  async function move(status) {
    setBusy(true);
    try {
      await updateStatus({
        variables: {
          id: request.id,
          toStatus: status.toLowerCase(),
          reason: note.trim() || null,
        },
      });
      toast.success(`Moved to ${getStatusMeta("changeRequestStatus", status).label.toLowerCase()}`);
      setConfirming(null);
      setNote("");
      router.refresh();
    } catch (error) {
      toast.error("Couldn't update the status", { description: error?.message });
    } finally {
      setBusy(false);
    }
  }

  async function reassign(userId) {
    setAssigning(true);
    try {
      await assignPm({
        variables: { id: request.id, assignedPmId: userId || null },
      });
      const assignee = users.find((user) => user.id === userId);
      toast.success(assignee ? `Assigned to ${assignee.name}` : "Unassigned");
      router.refresh();
    } catch (error) {
      toast.error("Couldn't update the assignee", { description: error?.message });
    } finally {
      setAssigning(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" disabled={assigning}>
            {assigning ? (
              <LoaderCircle aria-hidden="true" className="animate-spin" />
            ) : (
              <UserRound aria-hidden="true" />
            )}
            {assignedPm ? assignedPm.name : "Unassigned"}
            <ChevronDown aria-hidden="true" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-[min(100vw-2rem,22rem)]">
          <p className="mb-3 text-subheading">Assigned PM</p>
          <RoleAssigneePicker
            users={pmCandidates}
            value={assignedPm?.id ?? ""}
            onChange={reassign}
            allowedCategories={["project_manager", "admin"]}
            disabled={assigning}
          />
        </PopoverContent>
      </Popover>

      {transitions.length > 0 ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              Move to…
              <ChevronDown aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {transitions.map((status) => (
              <DropdownMenuItem key={status} onSelect={() => setConfirming({ status })}>
                {getStatusMeta("changeRequestStatus", status).label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}

      <AlertDialog open={Boolean(confirming)} onOpenChange={(open) => !open && setConfirming(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Move to {confirming ? getStatusMeta("changeRequestStatus", confirming.status).label.toLowerCase() : ""}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirming?.status === "ON_HOLD"
                ? "The client sees this as parked. Add a note if it helps explain why."
                : confirming?.status === "CLOSED"
                  ? "This closes the request without a decision. Use reject instead if the client needs to know why it didn't go ahead."
                  : "This updates what the client sees for this request."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Optional note — visible internally only"
            rows={2}
          />
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setNote("")}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={busy} onClick={() => confirming && move(confirming.status)}>
              {busy ? <LoaderCircle aria-hidden="true" className="animate-spin" /> : null}
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
