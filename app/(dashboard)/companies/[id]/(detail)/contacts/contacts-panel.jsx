"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@apollo/client/react";
import {
  Archive,
  BadgeCheck,
  Ellipsis,
  ExternalLink,
  Mail,
  Phone,
  Plus,
  ShieldCheck,
  UserRound,
  UserRoundX,
} from "lucide-react";
import { toast } from "sonner";

import { ActivityTimeline } from "@/app/components/domain/activity-timeline";
import { DataTable } from "@/app/components/domain/data-table";
import { EntityAvatar } from "@/app/components/domain/entity-avatar";
import { EmptyState } from "@/app/components/domain/states";
import { StatusBadge } from "@/app/components/domain/status-badge";
import { TouchpointTimeline } from "@/app/components/domain/touchpoint-timeline";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/app/components/ui/sheet";
import { displayUrl, formatRelativeDays } from "@/app/lib/format";
import { normalizeContact } from "@/app/lib/api/normalize";
import { asArray } from "@/app/lib/api/safe-list";
import { cn } from "@/app/lib/utils";
import {
  ArchiveContactDocument,
  UpdateContactDocument,
} from "@/app/lib/graphql/generated/documents";

import { ContactForm } from "./contact-form";
import { contactToFormValues, toUpdateContactVariables } from "./contact-schema";

const CHANNEL_LABELS = { EMAIL: "Email", PHONE: "Phone", MEETING: "Meeting" };

/**
 * Contacts nested under a company. One side panel serves three jobs — view,
 * create and edit — so the user never loses their place in the list.
 */
export function ContactsPanel({ companyId, companyName, contacts = [] }) {
  const router = useRouter();
  const [panel, setPanel] = useState(null); // { mode: 'view' | 'edit' | 'create', contactId? }
  const [archiveTarget, setArchiveTarget] = useState(null);

  const rows = useMemo(
    () => asArray(contacts).map((contact) => normalizeContact(contact)),
    [contacts],
  );

  const [updateContact] = useMutation(UpdateContactDocument);
  const [archiveContact] = useMutation(ArchiveContactDocument);

  const selected = panel?.contactId
    ? rows.find((contact) => contact.id === panel.contactId)
    : null;

  async function makePrimary(contact) {
    try {
      await updateContact({
        variables: toUpdateContactVariables(contact.id, {
          ...contactToFormValues(contact),
          isPrimary: true,
        }),
      });
      toast.success(`${contact.fullName} is now the primary contact`);
      router.refresh();
    } catch (error) {
      toast.error("Couldn't set the primary contact", { description: error?.message });
    }
  }

  async function confirmArchive() {
    const contact = archiveTarget;
    setArchiveTarget(null);
    try {
      await archiveContact({ variables: { id: contact.id } });
      toast.success(`${contact.fullName} archived`);
      if (panel?.contactId === contact.id) setPanel(null);
      router.refresh();
    } catch (error) {
      toast.error("Couldn't archive this contact", { description: error?.message });
    }
  }

  const columns = useMemo(
    () => [
      {
        id: "name",
        header: "Contact",
        meta: { width: "22rem" },
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <EntityAvatar name={row.original.fullName} size="sm" />
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 truncate font-medium">
                {row.original.fullName}
                {row.original.isPrimary ? (
                  <BadgeCheck
                    aria-label="Primary contact"
                    className="size-4 shrink-0 text-tone-accent"
                  />
                ) : null}
              </p>
              <p className="truncate text-caption text-muted-foreground">
                {row.original.title ?? "No title"}
                {row.original.department ? ` · ${row.original.department}` : ""}
              </p>
            </div>
          </div>
        ),
      },
      {
        id: "email",
        header: "Contact details",
        cell: ({ row }) => (
          <div className="space-y-0.5 text-caption">
            <a
              href={`mailto:${row.original.email}`}
              className="flex items-center gap-1.5 rounded-sm text-muted-foreground hover:text-foreground focus-ring"
            >
              <Mail aria-hidden="true" className="size-3.5 shrink-0" />
              <span className="truncate">{row.original.email}</span>
            </a>
            {row.original.phone ? (
              <a
                href={`tel:${row.original.phone}`}
                className="flex items-center gap-1.5 rounded-sm text-muted-foreground hover:text-foreground focus-ring"
              >
                <Phone aria-hidden="true" className="size-3.5 shrink-0" />
                {row.original.phone}
              </a>
            ) : null}
          </div>
        ),
      },
      {
        id: "flags",
        header: "Access",
        cell: ({ row }) => (
          <div className="flex flex-wrap items-center gap-1.5">
            <StatusBadge kind="contactStatus" value={row.original.status} size="sm" />
            {row.original.portalAccessEnabled ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-tone-info-border bg-tone-info-bg px-1.5 py-0.5 text-[0.6875rem] font-medium text-tone-info-fg">
                <ShieldCheck aria-hidden="true" className="size-3" />
                Portal
              </span>
            ) : null}
            {row.original.doNotContact ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-tone-critical-border bg-tone-critical-bg px-1.5 py-0.5 text-[0.6875rem] font-medium text-tone-critical-fg">
                <UserRoundX aria-hidden="true" className="size-3" />
                Do not contact
              </span>
            ) : null}
          </div>
        ),
      },
      {
        id: "updatedAt",
        header: "Updated",
        cell: ({ row }) => (
          <time
            dateTime={row.original.updatedAt}
            className="text-caption whitespace-nowrap text-muted-foreground"
          >
            {formatRelativeDays(row.original.updatedAt)}
          </time>
        ),
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        meta: { className: "w-12 text-right" },
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm">
                <Ellipsis aria-hidden="true" />
                <span className="sr-only">Actions for {row.original.fullName}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onSelect={() => setPanel({ mode: "view", contactId: row.original.id })}
              >
                View details
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => setPanel({ mode: "edit", contactId: row.original.id })}
              >
                Edit
              </DropdownMenuItem>
              {!row.original.isPrimary && row.original.status === "ACTIVE" ? (
                <DropdownMenuItem onSelect={() => makePrimary(row.original)}>
                  Make primary contact
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                disabled={row.original.isPrimary || row.original.status === "INACTIVE"}
                onSelect={() => setArchiveTarget(row.original)}
              >
                <Archive />
                Archive
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    // makePrimary is stable enough for this list; it only closes over mutation
    // helpers that don't change identity in a way the table cares about.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return (
    <div data-tour="contacts-panel">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-caption text-muted-foreground" aria-live="polite">
          {rows.length} {rows.length === 1 ? "contact" : "contacts"} at {companyName}
        </p>
        <Button size="sm" onClick={() => setPanel({ mode: "create" })}>
          <Plus aria-hidden="true" />
          Add contact
        </Button>
      </div>

      <DataTable
        data={rows}
        columns={columns}
        getRowId={(row) => row.id}
        onRowClick={(row) => setPanel({ mode: "view", contactId: row.id })}
        caption={`Contacts at ${companyName}`}
        emptyState={
          <EmptyState
            icon={UserRound}
            title="No contacts yet"
            description="Add the people you work with at this company so touchpoints and portal access have somewhere to hang."
            action={
              <Button onClick={() => setPanel({ mode: "create" })}>
                <Plus aria-hidden="true" />
                Add contact
              </Button>
            }
          />
        }
      />

      <Sheet open={Boolean(panel)} onOpenChange={(open) => !open && setPanel(null)}>
        <SheetContent className="flex h-svh max-h-svh w-full max-w-[min(100vw,42rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
          {panel?.mode === "create" ? (
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <SheetHeader className="shrink-0 border-b">
                <SheetTitle>Add a contact</SheetTitle>
                <SheetDescription>New contact at {companyName}.</SheetDescription>
              </SheetHeader>
              <ContactForm
                companyId={companyId}
                onDone={() => setPanel(null)}
                onCancel={() => setPanel(null)}
              />
            </div>
          ) : null}

          {panel?.mode === "edit" && selected ? (
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <SheetHeader className="shrink-0 border-b">
                <SheetTitle>Edit {selected.fullName}</SheetTitle>
                <SheetDescription>Contact at {companyName}.</SheetDescription>
              </SheetHeader>
              <ContactForm
                companyId={companyId}
                contact={selected}
                onDone={() => setPanel({ mode: "view", contactId: selected.id })}
                onCancel={() => setPanel({ mode: "view", contactId: selected.id })}
              />
            </div>
          ) : null}

          {panel?.mode === "view" && selected ? (
            <ContactDetail
              contact={selected}
              onEdit={() => setPanel({ mode: "edit", contactId: selected.id })}
            />
          ) : null}
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={Boolean(archiveTarget)}
        onOpenChange={(open) => !open && setArchiveTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive {archiveTarget?.fullName}?</AlertDialogTitle>
            <AlertDialogDescription>
              They&apos;ll be marked inactive and lose portal access. Their touchpoint history and
              past change requests stay on the record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmArchive}>Archive contact</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ContactDetail({ contact, onEdit }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {/* pr-12 keeps the header clear of the sheet's own close button. */}
      <SheetHeader className="shrink-0 border-b pr-12">
        <div className="flex items-start gap-3">
          <EntityAvatar name={contact.fullName} size="md" />
          <div className="min-w-0 flex-1">
            <SheetTitle className="flex items-center gap-2">
              {contact.fullName}
              {contact.isPrimary ? (
                <BadgeCheck aria-label="Primary contact" className="size-4 text-tone-accent" />
              ) : null}
            </SheetTitle>
            <SheetDescription>{contact.title ?? "No title recorded"}</SheetDescription>
          </div>
          <Button variant="outline" size="sm" onClick={onEdit}>
            Edit
          </Button>
        </div>
      </SheetHeader>

      <div className="min-h-0 flex-1 space-y-6 overflow-x-hidden overflow-y-auto overscroll-contain px-5 py-5 pb-6">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-caption">
          <Field label="Email">
            <a href={`mailto:${contact.email}`} className="rounded-sm text-primary hover:underline focus-ring">
              {contact.email}
            </a>
          </Field>
          <Field label="Phone">{contact.phone ?? "—"}</Field>
          <Field label="Department">{contact.department ?? "—"}</Field>
          <Field label="Preferred channel">
            {CHANNEL_LABELS[contact.preferredChannel] ?? "—"}
          </Field>
          <Field label="Best time">{contact.bestTimeToContact ?? "—"}</Field>
          <Field label="Timezone">{contact.timezone?.replace(/_/g, " ") ?? "—"}</Field>
          <Field label="Portal access">{contact.portalAccessEnabled ? "Enabled" : "Not enabled"}</Field>
          <Field label="Status">
            <StatusBadge kind="contactStatus" value={contact.status} size="sm" />
          </Field>
          {contact.linkedinUrl ? (
            <Field label="LinkedIn" className="col-span-2">
              <a
                href={contact.linkedinUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1 rounded-sm text-primary hover:underline focus-ring"
              >
                {displayUrl(contact.linkedinUrl)}
                <ExternalLink aria-hidden="true" className="size-3" />
              </a>
            </Field>
          ) : null}
        </dl>

        <section>
          <h3 className="mb-3 text-subheading">Touchpoints</h3>
          {(contact.touchpoints ?? []).length === 0 ? (
            <p className="text-caption text-muted-foreground">
              No touchpoints logged with this person yet.
            </p>
          ) : (
            <TouchpointTimeline touchpoints={contact.touchpoints ?? []} />
          )}
        </section>

        <section>
          <h3 className="mb-3 text-subheading">History</h3>
          <ActivityTimeline entries={contact.activity ?? []} />
        </section>
      </div>
    </div>
  );
}

function Field({ label, children, className }) {
  return (
    <div className={cn("min-w-0", className)}>
      <dt className="text-muted-foreground">{label}</dt>
      {/* Long emails and URLs wrap inside their column rather than running
          into the next one. */}
      <dd className="mt-0.5 font-medium break-words">{children}</dd>
    </div>
  );
}
