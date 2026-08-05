"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@apollo/client/react";
import { LoaderCircle, Plus } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import { Label } from "@/app/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { Textarea } from "@/app/components/ui/textarea";
import { CHANNEL_OPTIONS } from "@/app/lib/channels";
import { LogTouchpointDocument } from "@/app/lib/graphql/generated/documents";

/**
 * Records a touchpoint that already happened — a call made, a meeting held —
 * as opposed to the ones a retention sequence schedules ahead of time.
 *
 * @param {{ companyId: string, contacts: Array<{ id: string, firstName: string, lastName: string, isPrimary?: boolean }> }} props
 */
export function LogTouchpointDialog({ companyId, contacts = [] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [contactId, setContactId] = useState("");
  const [type, setType] = useState("CALL");
  const [outcome, setOutcome] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState(null);
  const [logTouchpoint, { loading }] = useMutation(LogTouchpointDocument);

  function reset() {
    setContactId("");
    setType("CALL");
    setOutcome("");
    setNotes("");
    setError(null);
  }

  async function handleSubmit() {
    const finalContactId = contactId || contacts.find((c) => c.isPrimary)?.id || "";
    if (!finalContactId) {
      setError("Choose a contact.");
      return;
    }

    setError(null);
    try {
      await logTouchpoint({
        variables: {
          companyId,
          contactId: finalContactId,
          type: type.toLowerCase(),
          outcome: outcome ? outcome.toLowerCase() : null,
          notes: notes.trim() || null,
        },
      });
      toast.success("Touchpoint logged");
      setOpen(false);
      reset();
      router.refresh();
    } catch (mutationError) {
      setError(mutationError?.message ?? "We couldn't log this. Try again.");
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus aria-hidden="true" />
          Log a touchpoint
        </Button>
      </DialogTrigger>
      <DialogContent size="form">
        <DialogHeader>
          <DialogTitle>Log a touchpoint</DialogTitle>
          <DialogDescription>Record a call, email, or meeting that already happened.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-caption font-medium">
              Contact <span aria-hidden="true" className="-ml-1 text-destructive">*</span>
            </Label>
            <Select value={contactId} onValueChange={setContactId}>
              <SelectTrigger className="h-10 w-full">
                <SelectValue placeholder="Who was it with?" />
              </SelectTrigger>
              <SelectContent>
                {contacts.length === 0 ? (
                  <p className="px-2 py-1.5 text-caption text-muted-foreground">
                    No contacts on file for this client
                  </p>
                ) : (
                  contacts.map((contact) => (
                    <SelectItem key={contact.id} value={contact.id}>
                      {contact.firstName} {contact.lastName}
                      {contact.isPrimary ? " (primary)" : ""}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-caption font-medium">Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="h-10 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CHANNEL_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-caption font-medium">
              Outcome <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Select value={outcome} onValueChange={setOutcome}>
              <SelectTrigger className="h-10 w-full">
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
            <Label className="text-caption font-medium">
              Notes <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={3}
              placeholder="What was discussed."
            />
          </div>

          {error ? <p className="text-caption font-medium text-destructive">{error}</p> : null}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? <LoaderCircle aria-hidden="true" className="animate-spin" /> : null}
            Log it
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
