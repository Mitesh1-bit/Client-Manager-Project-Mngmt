"use client";

import { useEffect, useMemo, useState } from "react";
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
import { Checkbox } from "@/app/components/ui/checkbox";
import { Label } from "@/app/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { EnrollInSequenceDocument } from "@/app/lib/graphql/generated/documents";
import { cn } from "@/app/lib/utils";

/**
 * Enrolls one or more contacts from a client company into a sequence.
 */
export function EnrollInSequenceDialog({
  trigger,
  companyId,
  companyName,
  sequenceId,
  sequenceName,
  sequences,
  companies,
  contacts,
  enrolledContactIds = [],
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState(companyId ?? "");
  const [selectedSequenceId, setSelectedSequenceId] = useState(sequenceId ?? "");
  const [selectedContactIds, setSelectedContactIds] = useState([]);
  const [error, setError] = useState(null);
  const [enroll, { loading }] = useMutation(EnrollInSequenceDocument);

  const activeSequences =
    sequences?.filter(
      (sequence) =>
        sequence.isActive &&
        ["approved", "active", "APPROVED", "ACTIVE"].includes(String(sequence.status ?? "active")) &&
        (!companyId || !sequence.companyId || sequence.companyId === companyId),
    ) ?? [];

  const resolvedCompanyId = companyId ?? selectedCompanyId;

  const companyContacts = useMemo(() => {
    if (contacts?.length) return contacts;
    return companies?.find((company) => company.id === resolvedCompanyId)?.contacts ?? [];
  }, [contacts, companies, resolvedCompanyId]);

  const availableContacts = useMemo(
    () => companyContacts.filter((contact) => !enrolledContactIds.includes(contact.id)),
    [companyContacts, enrolledContactIds],
  );

  useEffect(() => {
    if (!open) return;
    const defaults = availableContacts.filter((contact) => contact.isPrimary).map((contact) => contact.id);
    setSelectedContactIds(defaults.length ? defaults : availableContacts.slice(0, 1).map((contact) => contact.id));
  }, [open, availableContacts]);

  function toggleContact(contactId, checked) {
    setSelectedContactIds((current) =>
      checked ? [...new Set([...current, contactId])] : current.filter((id) => id !== contactId),
    );
  }

  async function handleEnroll() {
    const finalCompanyId = companyId ?? selectedCompanyId;
    const finalSequenceId = sequenceId ?? selectedSequenceId;

    if (!finalCompanyId || !finalSequenceId) {
      setError(companyId ? "Choose a sequence." : "Choose a client.");
      return;
    }
    if (selectedContactIds.length === 0) {
      setError("Choose at least one contact.");
      return;
    }

    setError(null);
    try {
      for (const contactId of selectedContactIds) {
        await enroll({
          variables: { sequenceId: finalSequenceId, companyId: finalCompanyId, contactId },
        });
      }

      const enrolledSequenceName =
        sequenceName ?? sequences?.find((s) => s.id === finalSequenceId)?.name ?? "the sequence";
      const enrolledCompanyName =
        companyName ?? companies?.find((c) => c.id === finalCompanyId)?.name ?? "the client";
      const contactLabel =
        selectedContactIds.length === 1 ? "1 contact" : `${selectedContactIds.length} contacts`;

      toast.success(`${enrolledCompanyName} enrolled`, {
        description: `${contactLabel} added to "${enrolledSequenceName}".`,
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
      <DialogContent size="form">
        <DialogHeader>
          <DialogTitle>Enroll in a sequence</DialogTitle>
          <DialogDescription>
            {companyName
              ? `Schedule touchpoints for ${companyName}. Select one or more contacts to include.`
              : sequenceName
                ? `Schedule "${sequenceName}" for a client and choose who should receive the touchpoints.`
                : "Schedule the sequence's touchpoints starting today."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {companyName ? (
            <Field label="Client">
              <p className="flex h-10 items-center rounded-lg border bg-muted px-3 text-caption font-medium">
                {companyName}
              </p>
            </Field>
          ) : (
            <Field label="Client" required>
              <Select
                value={selectedCompanyId}
                onValueChange={(value) => {
                  setSelectedCompanyId(value);
                  setSelectedContactIds([]);
                }}
              >
                <SelectTrigger className="h-10 w-full">
                  <SelectValue placeholder="Choose a client" />
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

          <Field label="Contacts" required>
            {availableContacts.length === 0 ? (
              <p className="rounded-lg border border-dashed px-3 py-2.5 text-caption text-muted-foreground">
                No contacts available for this client.
                {companyId ? (
                  <>
                    {" "}
                    <a href={`/companies/${companyId}/contacts`} className="font-medium text-primary hover:underline">
                      Add contacts
                    </a>
                  </>
                ) : null}
              </p>
            ) : (
              <ul className="max-h-48 space-y-2 overflow-y-auto rounded-lg border p-3">
                {availableContacts.map((contact) => {
                  const checked = selectedContactIds.includes(contact.id);
                  return (
                    <li key={contact.id}>
                      <label
                        className={cn(
                          "flex cursor-pointer items-start gap-3 rounded-md px-1 py-1.5 hover:bg-muted/60",
                          checked && "bg-muted/40",
                        )}
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(value) => toggleContact(contact.id, value === true)}
                          className="mt-0.5"
                        />
                        <span className="min-w-0 text-caption">
                          <span className="font-medium">
                            {contact.firstName} {contact.lastName}
                          </span>
                          {contact.isPrimary ? (
                            <span className="ml-1 text-muted-foreground">(primary)</span>
                          ) : null}
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
          </Field>

          {error ? <p className="text-caption font-medium text-destructive">{error}</p> : null}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleEnroll} disabled={loading || availableContacts.length === 0}>
            {loading ? <LoaderCircle aria-hidden="true" className="animate-spin" /> : null}
            Enroll{selectedContactIds.length > 1 ? ` (${selectedContactIds.length})` : ""}
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
