"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@apollo/client/react";
import { LoaderCircle, Workflow } from "lucide-react";
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
import { EnrollInSequenceDocument } from "@/app/lib/graphql/generated/documents";

/**
 * Enrolls a company into a sequence. Works from either direction: fix the
 * company and pick a sequence (used from the at-risk dashboard), or fix the
 * sequence and pick a company (used from a sequence's own detail page).
 * Whichever side isn't fixed needs its option list passed in.
 *
 * @param {{
 *   trigger: React.ReactNode,
 *   companyId?: string, companyName?: string,
 *   sequenceId?: string, sequenceName?: string,
 *   sequences?: Array<{ id: string, name: string, isActive: boolean }>,
 *   companies?: Array<{ id: string, name: string }>,
 * }} props
 */
export function EnrollInSequenceDialog({
  trigger,
  companyId,
  companyName,
  sequenceId,
  sequenceName,
  sequences,
  companies,
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState(companyId ?? "");
  const [selectedSequenceId, setSelectedSequenceId] = useState(sequenceId ?? "");
  const [error, setError] = useState(null);
  const [enroll, { loading }] = useMutation(EnrollInSequenceDocument);

  const activeSequences = sequences?.filter((sequence) => sequence.isActive) ?? [];

  async function handleEnroll() {
    const finalCompanyId = companyId ?? selectedCompanyId;
    const finalSequenceId = sequenceId ?? selectedSequenceId;
    if (!finalCompanyId || !finalSequenceId) {
      setError(companyId ? "Choose a sequence." : "Choose a company.");
      return;
    }

    setError(null);
    try {
      await enroll({ variables: { sequenceId: finalSequenceId, companyId: finalCompanyId } });
      const enrolledSequenceName =
        sequenceName ?? sequences?.find((s) => s.id === finalSequenceId)?.name ?? "the sequence";
      const enrolledCompanyName =
        companyName ?? companies?.find((c) => c.id === finalCompanyId)?.name ?? "the company";
      toast.success(`${enrolledCompanyName} enrolled`, {
        description: `Touchpoints for "${enrolledSequenceName}" are now scheduled.`,
      });
      setOpen(false);
      router.refresh();
    } catch (mutationError) {
      setError(mutationError?.message ?? "We couldn't enroll them. Try again.");
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setError(null);
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enroll in a sequence</DialogTitle>
          <DialogDescription>
            {companyName
              ? `Schedules ${companyName}'s touchpoints for whichever sequence you choose.`
              : sequenceName
                ? `Schedules "${sequenceName}"'s touchpoints for whichever company you choose.`
                : "Schedules the sequence's touchpoints starting today."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {companyName ? (
            <Field label="Company">
              <p className="flex h-10 items-center rounded-lg border bg-muted px-3 text-caption font-medium">
                {companyName}
              </p>
            </Field>
          ) : (
            <Field label="Company" required>
              <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
                <SelectTrigger className="h-10 w-full">
                  <SelectValue placeholder="Choose a company" />
                </SelectTrigger>
                <SelectContent>
                  {companies?.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}

          {sequenceName ? (
            <Field label="Sequence">
              <p className="flex h-10 items-center gap-2 rounded-lg border bg-muted px-3 text-caption font-medium">
                <Workflow aria-hidden="true" className="size-3.5 text-muted-foreground" />
                {sequenceName}
              </p>
            </Field>
          ) : (
            <Field label="Sequence" required>
              <Select value={selectedSequenceId} onValueChange={setSelectedSequenceId}>
                <SelectTrigger className="h-10 w-full">
                  <SelectValue placeholder="Choose a sequence" />
                </SelectTrigger>
                <SelectContent>
                  {activeSequences.length === 0 ? (
                    <p className="px-2 py-1.5 text-caption text-muted-foreground">
                      No active sequences yet
                    </p>
                  ) : (
                    activeSequences.map((sequence) => (
                      <SelectItem key={sequence.id} value={sequence.id}>
                        {sequence.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </Field>
          )}

          {error ? <p className="text-caption font-medium text-destructive">{error}</p> : null}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleEnroll} disabled={loading}>
            {loading ? <LoaderCircle aria-hidden="true" className="animate-spin" /> : null}
            Enroll
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, required, children }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-caption font-medium">
        {label}
        {required ? (
          <span aria-hidden="true" className="-ml-1 text-destructive">
            *
          </span>
        ) : null}
      </Label>
      {children}
    </div>
  );
}
