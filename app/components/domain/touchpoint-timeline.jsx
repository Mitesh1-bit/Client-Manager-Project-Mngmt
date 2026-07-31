"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@apollo/client/react";
import { Check, LoaderCircle } from "lucide-react";
import { toast } from "sonner";

import { StatusBadge } from "@/app/components/domain/status-badge";
import { Button } from "@/app/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { Textarea } from "@/app/components/ui/textarea";
import { CompleteTouchpointDocument } from "@/app/lib/graphql/generated/documents";
import { channelIcon, channelLabel } from "@/app/lib/channels";
import { formatDateTime, formatRelativeDays } from "@/app/lib/format";
import { cn } from "@/app/lib/utils";

/**
 * Touchpoint history for a company or contact. Scheduled items sort ahead of
 * completed ones so "what's coming" reads before "what happened". Scheduled
 * and overdue items get a "Mark complete" action, since those are the two
 * statuses `completeTouchpoint` can advance.
 *
 * @param {{ touchpoints: unknown[], className?: string }} props
 */
export function TouchpointTimeline({ touchpoints = [], className }) {
  const sorted = [...touchpoints].sort((a, b) => {
    const upcoming = (tp) => (tp.status === "SCHEDULED" || tp.status === "OVERDUE" ? 0 : 1);
    if (upcoming(a) !== upcoming(b)) return upcoming(a) - upcoming(b);
    const aDate = new Date(a.completedAt ?? a.scheduledAt ?? 0);
    const bDate = new Date(b.completedAt ?? b.scheduledAt ?? 0);
    return bDate - aDate;
  });

  return (
    <ol className={cn("space-y-2.5", className)}>
      {sorted.map((touchpoint) => {
        const Icon = channelIcon(touchpoint.type);
        const when = touchpoint.completedAt ?? touchpoint.scheduledAt;

        return (
          <li
            key={touchpoint.id}
            className="flex gap-3.5 rounded-xl border bg-card p-3.5 transition-shadow hover:shadow-card"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <Icon aria-hidden="true" className="size-4" />
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{channelLabel(touchpoint.type)}</span>
                {touchpoint.contact ? (
                  <span className="text-caption text-muted-foreground">
                    with {touchpoint.contact.fullName}
                  </span>
                ) : null}
                <StatusBadge kind="touchpointStatus" value={touchpoint.status} size="sm" />
                {touchpoint.outcome ? (
                  <StatusBadge kind="touchpointOutcome" value={touchpoint.outcome} size="sm" />
                ) : null}
              </div>

              {touchpoint.notes ? (
                <p className="mt-1.5 text-caption text-pretty text-muted-foreground">
                  {touchpoint.notes}
                </p>
              ) : null}

              <p className="mt-1.5 flex flex-wrap items-center gap-x-2 text-[0.75rem] text-muted-foreground">
                <time dateTime={when} title={formatDateTime(when)}>
                  {formatRelativeDays(when)}
                </time>
                {touchpoint.project ? <span>· {touchpoint.project.name}</span> : null}
                {touchpoint.createdBy ? <span>· logged by {touchpoint.createdBy.name}</span> : null}
              </p>
            </div>

            {touchpoint.status === "SCHEDULED" || touchpoint.status === "OVERDUE" ? (
              <CompleteTouchpointAction touchpointId={touchpoint.id} />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

function CompleteTouchpointAction({ touchpointId }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [outcome, setOutcome] = useState("");
  const [notes, setNotes] = useState("");
  const [completeTouchpoint, { loading }] = useMutation(CompleteTouchpointDocument);

  async function onSubmit(event) {
    event.preventDefault();
    try {
      await completeTouchpoint({
        variables: { id: touchpointId, input: { outcome: outcome || null, notes: notes || null } },
      });
      toast.success("Touchpoint marked complete");
      setOpen(false);
      setOutcome("");
      setNotes("");
      router.refresh();
    } catch (error) {
      toast.error("Couldn't complete this touchpoint", { description: error?.message });
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="shrink-0 self-start">
          <Check aria-hidden="true" />
          Mark complete
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <label htmlFor={`outcome-${touchpointId}`} className="text-caption font-medium">
              Outcome
            </label>
            <Select value={outcome} onValueChange={setOutcome}>
              <SelectTrigger id={`outcome-${touchpointId}`} className="h-9 w-full">
                <SelectValue placeholder="How did it go?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="POSITIVE">Positive</SelectItem>
                <SelectItem value="NEUTRAL">Neutral</SelectItem>
                <SelectItem value="AT_RISK">At risk</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label htmlFor={`notes-${touchpointId}`} className="text-caption font-medium">
              Notes
            </label>
            <Textarea
              id={`notes-${touchpointId}`}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={2}
              placeholder="What happened."
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={loading}>
              {loading ? <LoaderCircle aria-hidden="true" className="animate-spin" /> : null}
              Complete
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}
