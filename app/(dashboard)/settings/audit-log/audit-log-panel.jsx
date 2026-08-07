"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useLazyQuery } from "@apollo/client/react";
import { ChevronLeft, ChevronRight, Download, History, LoaderCircle } from "lucide-react";
import { toast } from "sonner";

import { DataTable } from "@/app/components/domain/data-table";
import { EntityAvatar } from "@/app/components/domain/entity-avatar";
import { SearchableSelect } from "@/app/components/domain/searchable-select";
import { EmptyState, SectionCard } from "@/app/components/domain/states";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { formatDateTime } from "@/app/lib/format";
import { AuditLogDocument } from "@/app/lib/graphql/generated/documents";
import { humanize } from "@/app/lib/status";
import { pickList } from "@/app/lib/api/safe-list";

const ENTITY_TYPES = [
  "company",
  "contact",
  "contract",
  "invoice",
  "milestone",
  "project",
  "project_phase",
  "retention_enrollment",
  "retention_sequence",
  "task",
  "task_dependency",
  "touchpoint",
  "user",
];

// Entity types with a real detail page we can deep-link to.
const ENTITY_HREF = {
  company: (id) => `/companies/${id}`,
  project: (id) => `/projects/${id}`,
};

// Fields that resolve to a user — shown by name instead of a raw ID.
const USER_ID_FIELDS = new Set(["assignee_id", "project_manager_id", "account_owner_id"]);

function humanizeDiffValue(key, value, usersById) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (USER_ID_FIELDS.has(key)) return usersById.get(value)?.name ?? value;
  if (key.endsWith("_id")) return value;
  return humanize(String(value));
}

/**
 * Activity diffs come in two shapes: `{before, after}` field snapshots from
 * a create/update/delete, or a flat one-off note like `{member_added: "X"}`
 * from actions that aren't a simple field change. Either way, turn it into
 * readable "Field: old -> new" rows instead of a raw JSON dump.
 */
function diffRows(diff, usersById) {
  if (!diff) return [];
  const { before, after, ...rest } = diff;
  if (before || after) {
    const keys = new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})]);
    keys.delete("id");
    const rows = [];
    for (const key of keys) {
      const oldValue = before?.[key];
      const newValue = after?.[key];
      const label = humanize(key);
      if (before && after) {
        if (oldValue === newValue) continue;
        rows.push({
          label,
          text: `${humanizeDiffValue(key, oldValue, usersById)} → ${humanizeDiffValue(key, newValue, usersById)}`,
        });
      } else {
        rows.push({ label, text: humanizeDiffValue(key, after ? newValue : oldValue, usersById) });
      }
    }
    return rows;
  }
  return Object.entries(rest).map(([key, value]) => ({
    label: humanize(key),
    text: humanizeDiffValue(key, value, usersById),
  }));
}

function csvEscape(value) {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function downloadCsv(rows, usersById) {
  const header = ["Timestamp", "Actor", "Action", "Entity type", "Entity ID", "Details"];
  const lines = [header.map(csvEscape).join(",")];
  for (const row of rows) {
    const actor = usersById.get(row.actorId);
    lines.push(
      [
        row.createdAt,
        actor?.name ?? row.actorId,
        row.action,
        row.entityType,
        row.entityId,
        row.diff ? JSON.stringify(row.diff) : "",
      ]
        .map(csvEscape)
        .join(","),
    );
  }
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function AuditLogPanel({ initialEntries, initialTotalCount, users, pageSize }) {
  const [entries, setEntries] = useState(initialEntries);
  const [totalCount, setTotalCount] = useState(initialTotalCount);
  const [page, setPage] = useState(1);
  const [entityType, setEntityType] = useState("");
  const [actorId, setActorId] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");

  const usersById = useMemo(() => new Map(users.map((user) => [user.id, user])), [users]);
  const actorOptions = useMemo(
    () => [
      { value: "all", label: "Everyone" },
      ...users.map((user) => ({ value: user.id, label: user.name })),
    ],
    [users],
  );
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const [runQuery, { loading }] = useLazyQuery(AuditLogDocument, {
    fetchPolicy: "network-only",
  });

  function buildVariables(targetPage) {
    return {
      entityType: entityType || null,
      actorId: actorId || null,
      startAt: startAt ? new Date(startAt).toISOString() : null,
      endAt: endAt ? new Date(`${endAt}T23:59:59`).toISOString() : null,
      limit: pageSize,
      offset: (targetPage - 1) * pageSize,
    };
  }

  async function goToPage(targetPage) {
    try {
      const { data } = await runQuery({ variables: buildVariables(targetPage) });
      setEntries(pickList(data, "activityLogs"));
      setTotalCount(data?.activityLogsCount ?? 0);
      setPage(targetPage);
    } catch (error) {
      toast.error("Couldn't load the audit log", { description: error?.message });
    }
  }

  function applyFilters() {
    goToPage(1);
  }

  function handleExport() {
    if (entries.length === 0) return;
    downloadCsv(entries, usersById);
  }

  const columns = useMemo(
    () => [
      {
        id: "createdAt",
        header: "When",
        meta: { width: "11rem" },
        cell: ({ row }) => (
          <span className="tabular text-caption">{formatDateTime(row.original.createdAt)}</span>
        ),
      },
      {
        id: "actor",
        header: "Actor",
        cell: ({ row }) => {
          const actor = usersById.get(row.original.actorId);
          return (
            <div className="flex items-center gap-2">
              <EntityAvatar name={actor?.name ?? "Unknown"} size="xs" />
              <span className="truncate">{actor?.name ?? "Unknown"}</span>
            </div>
          );
        },
      },
      {
        id: "action",
        header: "Action",
        cell: ({ row }) => <span>{humanize(row.original.action)}</span>,
      },
      {
        id: "entity",
        header: "Entity",
        cell: ({ row }) => {
          const href = ENTITY_HREF[row.original.entityType]?.(row.original.entityId);
          const label = humanize(row.original.entityType);
          return href ? (
            <Link href={href} className="rounded-sm hover:underline focus-ring">
              {label}
            </Link>
          ) : (
            <span className="text-muted-foreground">{label}</span>
          );
        },
      },
      {
        id: "details",
        header: "Details",
        enableSorting: false,
        cell: ({ row }) => {
          const rows = diffRows(row.original.diff, usersById);
          if (rows.length === 0) return <span className="text-muted-foreground">—</span>;
          return (
            <details>
              <summary className="cursor-pointer text-caption text-muted-foreground hover:text-foreground">
                {rows.length} change{rows.length === 1 ? "" : "s"}
              </summary>
              <dl className="mt-1.5 max-w-md space-y-1">
                {rows.map((entry) => (
                  <div key={entry.label} className="flex gap-1.5 text-caption">
                    <dt className="shrink-0 font-medium">{entry.label}:</dt>
                    <dd className="truncate text-muted-foreground">{entry.text}</dd>
                  </div>
                ))}
              </dl>
            </details>
          );
        },
      },
    ],
    [usersById],
  );

  return (
    <SectionCard
      title="Activity"
      description={`${totalCount} entr${totalCount === 1 ? "y" : "ies"} total`}
      actions={
        <Button variant="outline" size="sm" onClick={handleExport} disabled={entries.length === 0}>
          <Download aria-hidden="true" />
          Export CSV
        </Button>
      }
    >
      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Select
          value={entityType || "all"}
          onValueChange={(value) => setEntityType(value === "all" ? "" : value)}
        >
          <SelectTrigger className="h-9 w-full">
            <SelectValue placeholder="All entity types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All entity types</SelectItem>
            {ENTITY_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {humanize(type)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <SearchableSelect
          options={actorOptions}
          value={actorId || "all"}
          onChange={(value) => setActorId(value === "all" ? "" : value)}
          placeholder="Everyone"
          emptyText="No one matches."
        />

        <Input
          type="date"
          value={startAt}
          onChange={(event) => setStartAt(event.target.value)}
          className="h-9"
          aria-label="From date"
        />
        <Input
          type="date"
          value={endAt}
          onChange={(event) => setEndAt(event.target.value)}
          className="h-9"
          aria-label="To date"
        />
      </div>

      <div className="mb-4 flex justify-end">
        <Button size="sm" onClick={applyFilters} disabled={loading}>
          {loading ? <LoaderCircle aria-hidden="true" className="animate-spin" /> : null}
          Apply filters
        </Button>
      </div>

      <DataTable
        data={entries}
        columns={columns}
        getRowId={(row) => row.id}
        emptyState={
          <EmptyState
            icon={History}
            title="Nothing recorded yet"
            description="Activity across your workspace — creates, edits, and deletes — will show up here."
          />
        }
      />

      {totalCount > 0 ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-caption text-muted-foreground" aria-live="polite">
            Showing{" "}
            <span className="tabular font-medium text-foreground">
              {(page - 1) * pageSize + 1}
            </span>
            –
            <span className="tabular font-medium text-foreground">
              {Math.min(page * pageSize, totalCount)}
            </span>{" "}
            of <span className="tabular font-medium text-foreground">{totalCount}</span>
          </p>

          {totalPages > 1 ? (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || loading}
                onClick={() => goToPage(page - 1)}
              >
                <ChevronLeft aria-hidden="true" />
                Previous
              </Button>
              <span className="tabular px-1 text-caption text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages || loading}
                onClick={() => goToPage(page + 1)}
              >
                Next
                <ChevronRight aria-hidden="true" />
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </SectionCard>
  );
}
