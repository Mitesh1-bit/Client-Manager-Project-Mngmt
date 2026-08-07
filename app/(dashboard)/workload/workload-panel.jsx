"use client";

import { useMemo, useState } from "react";
import { useLazyQuery } from "@apollo/client/react";
import { Gauge, LoaderCircle } from "lucide-react";
import { toast } from "sonner";

import { DataTable } from "@/app/components/domain/data-table";
import { EntityAvatar } from "@/app/components/domain/entity-avatar";
import { SearchableSelect } from "@/app/components/domain/searchable-select";
import { EmptyState, SectionCard } from "@/app/components/domain/states";
import { Progress } from "@/app/components/ui/progress";
import { pickList } from "@/app/lib/api/safe-list";
import { WorkloadDocument } from "@/app/lib/graphql/generated/documents";
import { cn } from "@/app/lib/utils";

export function WorkloadPanel({ initialRows, users, projects }) {
  const [rows, setRows] = useState(initialRows);
  const [projectId, setProjectId] = useState("");
  const [runQuery, { loading }] = useLazyQuery(WorkloadDocument, { fetchPolicy: "network-only" });

  const usersById = useMemo(() => new Map(users.map((user) => [user.id, user])), [users]);
  const projectOptions = useMemo(
    () => [{ value: "all", label: "All projects" }, ...projects.map((p) => ({ value: p.id, label: p.name }))],
    [projects],
  );

  const sortedRows = useMemo(
    () => [...rows].sort((a, b) => b.totalEstimatedHours - a.totalEstimatedHours),
    [rows],
  );

  async function handleProjectChange(value) {
    const nextProjectId = value === "all" ? "" : value;
    setProjectId(nextProjectId);
    try {
      const { data } = await runQuery({ variables: { projectId: nextProjectId || null } });
      setRows(pickList(data, "workload"));
    } catch (error) {
      toast.error("Couldn't load workload", { description: error?.message });
    }
  }

  const columns = useMemo(
    () => [
      {
        id: "person",
        header: "Person",
        cell: ({ row }) => {
          const user = usersById.get(row.original.assigneeId);
          return (
            <div className="flex items-center gap-2.5">
              <EntityAvatar name={user?.name ?? "Unknown"} imageUrl={user?.avatarUrl} size="sm" />
              <div className="min-w-0">
                <p className="truncate font-medium">{user?.name ?? "Unknown"}</p>
                {user?.role ? (
                  <p className="truncate text-caption text-muted-foreground">
                    {user.role.replace(/_/g, " ")}
                  </p>
                ) : null}
              </div>
            </div>
          );
        },
      },
      {
        id: "openTaskCount",
        header: "Open tasks",
        meta: { width: "8rem" },
        cell: ({ row }) => <span className="tabular">{row.original.openTaskCount}</span>,
      },
      {
        id: "totalEstimatedHours",
        header: "Estimated",
        meta: { width: "8rem" },
        cell: ({ row }) => <span className="tabular">{row.original.totalEstimatedHours}h</span>,
      },
      {
        id: "totalActualHours",
        header: "Actual",
        meta: { width: "8rem" },
        cell: ({ row }) => <span className="tabular">{row.original.totalActualHours}h</span>,
      },
      {
        id: "progress",
        header: "Logged vs. estimated",
        meta: { width: "12rem" },
        enableSorting: false,
        cell: ({ row }) => {
          const { totalEstimatedHours, totalActualHours } = row.original;
          if (totalEstimatedHours <= 0) return <span className="text-muted-foreground">—</span>;
          const percent = Math.round((totalActualHours / totalEstimatedHours) * 100);
          const over = percent > 100;
          return (
            <div className="flex items-center gap-2">
              <Progress value={Math.min(percent, 100)} className="w-24" />
              <span className={cn("tabular text-caption", over && "font-medium text-tone-critical-fg")}>
                {percent}%
              </span>
            </div>
          );
        },
      },
    ],
    [usersById],
  );

  return (
    <SectionCard
      title="Open task load"
      description={`${sortedRows.length} ${sortedRows.length === 1 ? "person" : "people"} with open tasks`}
    >
      <div className="mb-4 max-w-xs">
        <SearchableSelect
          options={projectOptions}
          value={projectId || "all"}
          onChange={handleProjectChange}
          placeholder="All projects"
          emptyText="No project matches."
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10 text-muted-foreground">
          <LoaderCircle aria-hidden="true" className="animate-spin" />
        </div>
      ) : (
        <DataTable
          data={sortedRows}
          columns={columns}
          getRowId={(row) => row.assigneeId}
          emptyState={
            <EmptyState
              icon={Gauge}
              title="Nobody has open tasks"
              description="Once tasks are assigned, each person's load shows up here."
            />
          }
        />
      )}
    </SectionCard>
  );
}
