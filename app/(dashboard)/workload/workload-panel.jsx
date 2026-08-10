"use client";

import { useMemo, useState } from "react";
import { useLazyQuery, useMutation } from "@apollo/client/react";
import { useRouter } from "next/navigation";
import { Gauge, LoaderCircle, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { DataTable } from "@/app/components/domain/data-table";
import { EntityAvatar } from "@/app/components/domain/entity-avatar";
import { SearchableSelect } from "@/app/components/domain/searchable-select";
import { EmptyState, SectionCard } from "@/app/components/domain/states";
import { Button } from "@/app/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { Progress } from "@/app/components/ui/progress";
import { pickList } from "@/app/lib/api/safe-list";
import { AddProjectMemberDocument, WorkloadDocument } from "@/app/lib/graphql/generated/documents";
import { cn } from "@/app/lib/utils";

export function WorkloadPanel({ initialRows, users, projects, viewerRole }) {
  const router = useRouter();
  const [rows, setRows] = useState(initialRows);
  const [projectId, setProjectId] = useState("");
  const [runQuery, { loading }] = useLazyQuery(WorkloadDocument, { fetchPolicy: "network-only" });
  const [assignTarget, setAssignTarget] = useState(null); // { assigneeId, name }
  const [assignProjectId, setAssignProjectId] = useState("");
  const [addMember, { loading: assigning }] = useMutation(AddProjectMemberDocument);

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

  const assignProjectOptions = useMemo(() => projects.map((p) => ({ value: p.id, label: p.name })), [projects]);

  function openAssign(user) {
    setAssignTarget(user);
    setAssignProjectId("");
  }

  async function handleAssign() {
    if (!assignTarget || !assignProjectId) return;
    try {
      await addMember({ variables: { projectId: assignProjectId, userId: assignTarget.id } });
      toast.success(`${assignTarget.name} added to the project`);
      setAssignTarget(null);
      router.refresh();
    } catch (error) {
      toast.error("Couldn't add them to that project", { description: error?.message });
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
        id: "projectCount",
        header: "Projects",
        meta: { width: "6rem" },
        cell: ({ row }) => <span className="tabular">{row.original.projectCount}</span>,
      },
      {
        id: "clientCount",
        header: "Clients",
        meta: { width: "6rem" },
        cell: ({ row }) => <span className="tabular">{row.original.clientCount}</span>,
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
      {
        id: "assign",
        header: () => <span className="sr-only">Assign</span>,
        enableSorting: false,
        meta: { width: "6rem", className: "text-right" },
        cell: ({ row }) => {
          const user = usersById.get(row.original.assigneeId);
          if (!user) return null;
          // Mirrors the project Team tab's rule: a PM can only add a team
          // member; admins can add anyone.
          const canAssign = viewerRole === "admin" || (viewerRole === "project_manager" && user.role === "team_member");
          if (!canAssign) return null;
          return (
            <Button variant="ghost" size="sm" onClick={() => openAssign(user)}>
              <UserPlus aria-hidden="true" />
              Assign
            </Button>
          );
        },
      },
    ],
    [usersById, viewerRole],
  );

  return (
    <>
      <SectionCard
        title="Team workload"
        description={`${sortedRows.length} ${sortedRows.length === 1 ? "person" : "people"} across active projects`}
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
                title="Nobody to show yet"
                description="Once someone is added to a project or assigned a task, their load shows up here."
              />
            }
          />
        )}
      </SectionCard>

      <Dialog open={Boolean(assignTarget)} onOpenChange={(open) => !open && setAssignTarget(null)}>
        <DialogContent size="form">
          <DialogHeader>
            <DialogTitle>Add {assignTarget?.name} to a project</DialogTitle>
            <DialogDescription>
              They&apos;ll show up on that project&apos;s Team tab right away.
            </DialogDescription>
          </DialogHeader>

          <SearchableSelect
            options={assignProjectOptions}
            value={assignProjectId}
            onChange={setAssignProjectId}
            placeholder="Choose a project"
            emptyText="No project matches."
          />

          <DialogFooter>
            <Button variant="ghost" onClick={() => setAssignTarget(null)}>
              Cancel
            </Button>
            <Button onClick={handleAssign} disabled={!assignProjectId || assigning}>
              {assigning ? <LoaderCircle aria-hidden="true" className="animate-spin" /> : null}
              Add to project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
