"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@apollo/client/react";
import { ChevronRight, GitBranch, ListTodo, Lock, Plus } from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/app/components/domain/states";
import { StatusBadge } from "@/app/components/domain/status-badge";
import { Button } from "@/app/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { formatDate, initials } from "@/app/lib/format";
import { UpdateTaskStatusDocument } from "@/app/lib/graphql/generated/documents";
import { blockingTasks, isTaskBlocked, isTaskOverdue } from "@/app/lib/project";
import { listStatuses } from "@/app/lib/status";
import { cn } from "@/app/lib/utils";

import { TaskSheet } from "../task-sheet";

const STATUS_OPTIONS = listStatuses("taskStatus");

/**
 * The flat, scannable counterpart to the board: every task grouped by phase,
 * with subtasks nested under their parent and status editable inline.
 */
export function TaskList({
  projectId,
  tasks = [],
  phases = [],
  milestones = [],
  users = [],
  canManage = false,
}) {
  const router = useRouter();
  const [updateTaskStatus] = useMutation(UpdateTaskStatusDocument);

  const [panel, setPanel] = useState(null);
  const [collapsed, setCollapsed] = useState(() => new Set());
  const [pendingStatus, setPendingStatus] = useState({});

  const groups = useMemo(() => groupByPhase(tasks, phases), [tasks, phases]);

  function toggle(key) {
    setCollapsed((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function changeStatus(task, status) {
    if (status === task.status) return;
    setPendingStatus((current) => ({ ...current, [task.id]: status }));
    try {
      // Sending the end of the destination column matches what a drag to the
      // bottom of that column would do.
      await updateTaskStatus({ variables: { id: task.id, status, orderIndex: 9999 } });
      router.refresh();
    } catch (error) {
      toast.error("Couldn't change that status", { description: error?.message });
    } finally {
      setPendingStatus((current) => {
        const next = { ...current };
        delete next[task.id];
        return next;
      });
    }
  }

  if (tasks.length === 0) {
    return (
      <>
        <EmptyState
          icon={ListTodo}
          title="No tasks yet"
          description="Break the work down into tasks and they'll show up here, grouped by phase."
          action={
            canManage ? (
              <Button onClick={() => setPanel({ mode: "create" })}>
                <Plus aria-hidden="true" />
                Add task
              </Button>
            ) : null
          }
        />
        <TaskSheet
          projectId={projectId}
          panel={panel}
          onPanelChange={setPanel}
          tasks={tasks}
          phases={phases}
          milestones={milestones}
          users={users}
        />
      </>
    );
  }

  return (
    <>
      <div className="mb-4 toolbar-row">
        <p className="text-caption text-muted-foreground">
          {tasks.filter((task) => !task.parentTask).length} tasks ·{" "}
          {tasks.filter((task) => task.parentTask).length} subtasks
        </p>
        {canManage ? (
          <Button size="sm" onClick={() => setPanel({ mode: "create" })}>
            <Plus aria-hidden="true" />
            Add task
          </Button>
        ) : null}
      </div>

      <div data-tour="project-task-list" className="space-y-4">
        {groups.map((group) => {
          const isCollapsed = collapsed.has(group.key);
          return (
            <section key={group.key} className="overflow-hidden rounded-xl border bg-card">
              <h2>
                <button
                  type="button"
                  onClick={() => toggle(group.key)}
                  aria-expanded={!isCollapsed}
                  className="flex w-full items-center gap-2 border-b px-4 py-3 text-left transition-colors hover:bg-muted/50 focus-ring"
                >
                  <ChevronRight
                    aria-hidden="true"
                    className={cn("size-4 shrink-0 transition-transform", !isCollapsed && "rotate-90")}
                  />
                  <span className="font-medium">{group.name}</span>
                  {group.status ? (
                    <StatusBadge kind="phaseStatus" value={group.status} size="sm" />
                  ) : null}
                  <span className="tabular ml-auto text-caption text-muted-foreground">
                    {group.tasks.filter((task) => task.status === "DONE").length} of{" "}
                    {group.tasks.length} done
                  </span>
                </button>
              </h2>

              {!isCollapsed ? (
                <ul className="divide-y">
                  {group.tasks.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      pendingStatus={pendingStatus[task.id]}
                      onOpen={() => setPanel({ mode: "view", taskId: task.id })}
                      onStatusChange={changeStatus}
                      onAddSubtask={() =>
                        setPanel({
                          mode: "create",
                          defaults: {
                            parentTaskId: task.id,
                            phaseId: task.phase?.id,
                            milestoneId: task.milestone?.id,
                          },
                        })
                      }
                      subtaskRows={task.subtasks.map((subtask) => {
                        const full = tasks.find((row) => row.id === subtask.id);
                        return full ?? subtask;
                      })}
                      onOpenSubtask={(subtaskId) => setPanel({ mode: "view", taskId: subtaskId })}
                      onSubtaskStatusChange={changeStatus}
                    />
                  ))}
                </ul>
              ) : null}
            </section>
          );
        })}
      </div>

      <TaskSheet
        projectId={projectId}
        panel={panel}
        onPanelChange={setPanel}
        tasks={tasks}
        phases={phases}
        milestones={milestones}
        users={users}
      />
    </>
  );
}

function TaskRow({
  task,
  pendingStatus,
  onOpen,
  onStatusChange,
  onAddSubtask,
  subtaskRows,
  onOpenSubtask,
  onSubtaskStatusChange,
}) {
  const [showSubtasks, setShowSubtasks] = useState(true);
  const blocked = isTaskBlocked(task);
  const blockers = blockingTasks(task);
  const overdue = isTaskOverdue(task);
  const status = pendingStatus ?? task.status;

  return (
    <li>
      <div className="flex flex-wrap items-center gap-3 px-4 py-3">
        {subtaskRows.length > 0 ? (
          <button
            type="button"
            onClick={() => setShowSubtasks((value) => !value)}
            aria-expanded={showSubtasks}
            className="-ml-1 shrink-0 rounded p-0.5 text-muted-foreground hover:text-foreground focus-ring"
          >
            <ChevronRight
              aria-hidden="true"
              className={cn("size-4 transition-transform", showSubtasks && "rotate-90")}
            />
            <span className="sr-only">
              {showSubtasks ? "Hide" : "Show"} subtasks of {task.title}
            </span>
          </button>
        ) : (
          <span className="w-4 shrink-0" aria-hidden="true" />
        )}

        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={onOpen}
            className="block max-w-full truncate text-left font-medium hover:underline focus-ring rounded-sm"
          >
            {task.title}
          </button>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[0.75rem] text-muted-foreground">
            {task.milestone ? <span className="truncate">{task.milestone.title}</span> : null}
            {task.dueDate ? (
              <time
                dateTime={task.dueDate}
                className={cn(overdue && "font-medium text-tone-critical-fg")}
              >
                {formatDate(task.dueDate)}
                {overdue ? " · overdue" : ""}
              </time>
            ) : null}
            {blocked ? (
              <span
                className="inline-flex items-center gap-1 font-medium text-tone-critical-fg"
                title={`Waiting on ${blockers.map((item) => item.title).join(", ")}`}
              >
                <Lock aria-hidden="true" className="size-3" />
                Blocked
              </span>
            ) : null}
            {task.dependencies.length > 0 && !blocked ? (
              <span className="inline-flex items-center gap-1">
                <GitBranch aria-hidden="true" className="size-3" />
                {task.dependencies.length}
              </span>
            ) : null}
          </div>
        </div>

        <StatusBadge kind="priority" value={task.priority} size="sm" />

        {task.assignee ? (
          <span
            title={task.assignee.name}
            className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-[0.625rem] font-medium"
          >
            {initials(task.assignee.name)}
            <span className="sr-only">Assigned to {task.assignee.name}</span>
          </span>
        ) : (
          <span className="w-6 shrink-0" aria-hidden="true" />
        )}

        <Select value={status} onValueChange={(value) => onStatusChange(task, value)}>
          <SelectTrigger className="h-8 w-36" aria-label={`Status of ${task.title}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="ghost" size="icon-sm" onClick={onAddSubtask}>
          <Plus aria-hidden="true" />
          <span className="sr-only">Add a subtask to {task.title}</span>
        </Button>
      </div>

      {showSubtasks && subtaskRows.length > 0 ? (
        <ul className="border-t bg-muted/30">
          {subtaskRows.map((subtask) => (
            <li
              key={subtask.id}
              className="flex flex-wrap items-center gap-3 py-2 pr-4 pl-12 not-last:border-b"
            >
              <button
                type="button"
                onClick={() => onOpenSubtask(subtask.id)}
                className={cn(
                  "min-w-0 flex-1 truncate text-left text-caption hover:underline focus-ring rounded-sm",
                  subtask.status === "DONE" && "text-muted-foreground line-through",
                )}
              >
                {subtask.title}
              </button>
              {subtask.assignee ? (
                <span
                  title={subtask.assignee.name}
                  className="flex size-5 shrink-0 items-center justify-center rounded-full bg-background text-[0.5625rem] font-medium"
                >
                  {initials(subtask.assignee.name)}
                  <span className="sr-only">Assigned to {subtask.assignee.name}</span>
                </span>
              ) : null}
              <Select
                value={subtask.status}
                onValueChange={(value) => onSubtaskStatusChange(subtask, value)}
              >
                <SelectTrigger className="h-7 w-32 text-[0.75rem]" aria-label={`Status of ${subtask.title}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </li>
          ))}
        </ul>
      ) : null}
    </li>
  );
}

/** Top-level tasks grouped by phase, with unphased work last. */
function groupByPhase(tasks, phases) {
  const topLevel = tasks.filter((task) => !task.parentTask);

  const groups = phases.map((phase) => ({
    key: phase.id,
    name: phase.name,
    status: phase.status,
    tasks: topLevel.filter((task) => task.phase?.id === phase.id),
  }));

  const unphased = topLevel.filter((task) => !task.phase);
  if (unphased.length > 0) {
    groups.push({ key: "__unphased__", name: "No phase", status: null, tasks: unphased });
  }

  return groups.filter((group) => group.tasks.length > 0);
}
