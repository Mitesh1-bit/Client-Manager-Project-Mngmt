"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@apollo/client/react";
import { Check, GitBranch, Lock, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { StatusBadge } from "@/app/components/domain/status-badge";
import { Button } from "@/app/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/app/components/ui/sheet";
import { formatDate, humanizeType, initials } from "@/app/lib/format";
import {
  AddTaskDependencyDocument,
  RemoveTaskDependencyDocument,
} from "@/app/lib/graphql/generated/documents";
import { blockingTasks } from "@/app/lib/project";
import { cn } from "@/app/lib/utils";

import { TaskForm } from "./task-form";

/**
 * One panel serving view, create and edit for a task — the same pattern the
 * contacts module uses, so people don't lose their place in the board or list.
 *
 * @param {{ panel: { mode: 'view'|'edit'|'create', taskId?: string, defaults?: object } | null }} props
 */
export function TaskSheet({ projectId, panel, onPanelChange, tasks, phases, milestones, users }) {
  const selected = panel?.taskId ? tasks.find((task) => task.id === panel.taskId) : null;
  const close = () => onPanelChange(null);

  return (
    <Sheet open={Boolean(panel)} onOpenChange={(open) => !open && close()}>
      <SheetContent className="w-full gap-0 p-0 sm:max-w-xl">
        {panel?.mode === "create" ? (
          <>
            <SheetHeader className="border-b pr-12">
              <SheetTitle>Add a task</SheetTitle>
              <SheetDescription>
                {panel.defaults?.parentTaskId
                  ? `Subtask of “${tasks.find((t) => t.id === panel.defaults.parentTaskId)?.title}”.`
                  : "New task on this project."}
              </SheetDescription>
            </SheetHeader>
            <TaskForm
              projectId={projectId}
              defaults={panel.defaults}
              phases={phases}
              milestones={milestones}
              users={users}
              tasks={tasks}
              onDone={close}
              onCancel={close}
            />
          </>
        ) : null}

        {panel?.mode === "edit" && selected ? (
          <>
            <SheetHeader className="border-b pr-12">
              <SheetTitle className="truncate">Edit “{selected.title}”</SheetTitle>
              <SheetDescription>Task details and scheduling.</SheetDescription>
            </SheetHeader>
            <TaskForm
              projectId={projectId}
              task={selected}
              phases={phases}
              milestones={milestones}
              users={users}
              tasks={tasks}
              onDone={() => onPanelChange({ mode: "view", taskId: selected.id })}
              onCancel={() => onPanelChange({ mode: "view", taskId: selected.id })}
            />
          </>
        ) : null}

        {panel?.mode === "view" && selected ? (
          <TaskDetail
            task={selected}
            tasks={tasks}
            onEdit={() => onPanelChange({ mode: "edit", taskId: selected.id })}
            onOpenTask={(taskId) => onPanelChange({ mode: "view", taskId })}
            onAddSubtask={() =>
              onPanelChange({
                mode: "create",
                defaults: {
                  parentTaskId: selected.id,
                  phaseId: selected.phase?.id,
                  milestoneId: selected.milestone?.id,
                },
              })
            }
          />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function TaskDetail({ task, tasks, onEdit, onOpenTask, onAddSubtask }) {
  const blockers = blockingTasks(task);
  const doneSubtasks = task.subtasks.filter((subtask) => subtask.status === "DONE").length;

  return (
    <>
      <SheetHeader className="border-b pr-12">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <SheetTitle className="text-pretty">{task.title}</SheetTitle>
            <SheetDescription>
              {task.phase ? task.phase.name : "No phase"}
              {task.parentTask ? ` · subtask of “${task.parentTask.title}”` : ""}
            </SheetDescription>
          </div>
          <Button variant="outline" size="sm" onClick={onEdit}>
            Edit
          </Button>
        </div>
      </SheetHeader>

      <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
        {blockers.length > 0 ? (
          <div className="flex gap-2.5 rounded-lg border border-tone-critical-border bg-tone-critical-bg p-3 text-tone-critical-fg">
            <Lock aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            <div className="text-caption">
              <p className="font-medium">Blocked</p>
              <p className="mt-0.5">
                Waiting on {blockers.map((item) => `“${item.title}”`).join(", ")}.
              </p>
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge kind="taskStatus" value={task.status} />
          <StatusBadge kind="priority" value={task.priority} size="sm" />
        </div>

        {task.description ? (
          <p className="text-caption text-pretty text-muted-foreground">{task.description}</p>
        ) : null}

        <dl className="meta-grid gap-x-6 gap-y-3 text-caption">
          <Field label="Assignee">
            {task.assignee ? (
              <span className="flex items-center gap-1.5">
                <span
                  aria-hidden="true"
                  className="flex size-5 items-center justify-center rounded-full bg-muted text-[0.5625rem] font-medium"
                >
                  {initials(task.assignee.name)}
                </span>
                {task.assignee.name}
              </span>
            ) : (
              "Unassigned"
            )}
          </Field>
          <Field label="Milestone">{task.milestone?.title ?? "—"}</Field>
          <Field label="Start">{formatDate(task.startDate)}</Field>
          <Field label="Due">{formatDate(task.dueDate)}</Field>
          <Field label="Estimate">
            {task.estimatedHours === null || task.estimatedHours === undefined
              ? "—"
              : `${task.estimatedHours}h`}
          </Field>
          <Field label="Logged">
            <span
              className={cn(
                task.estimatedHours && task.actualHours > task.estimatedHours
                  ? "text-tone-critical-fg"
                  : undefined,
              )}
            >
              {task.actualHours === null || task.actualHours === undefined
                ? "—"
                : `${task.actualHours}h`}
            </span>
          </Field>
        </dl>

        <section>
          <div className="mb-2.5 flex items-center justify-between gap-3">
            <h3 className="text-subheading">
              Subtasks
              {task.subtasks.length > 0 ? (
                <span className="tabular ml-2 text-caption font-normal text-muted-foreground">
                  {doneSubtasks} of {task.subtasks.length} done
                </span>
              ) : null}
            </h3>
            {!task.parentTask ? (
              <Button variant="ghost" size="sm" onClick={onAddSubtask}>
                <Plus aria-hidden="true" />
                Add
              </Button>
            ) : null}
          </div>

          {task.subtasks.length === 0 ? (
            <p className="text-caption text-muted-foreground">
              {task.parentTask
                ? "Subtasks can't have subtasks of their own."
                : "No subtasks yet."}
            </p>
          ) : (
            <ul className="divide-y rounded-lg border">
              {task.subtasks.map((subtask) => (
                <li key={subtask.id} className="flex items-center gap-2.5 px-3 py-2">
                  <span
                    aria-hidden="true"
                    className={cn(
                      "flex size-4 shrink-0 items-center justify-center rounded-full border",
                      subtask.status === "DONE"
                        ? "border-tone-positive-border bg-tone-positive-bg text-tone-positive-fg"
                        : "border-border",
                    )}
                  >
                    {subtask.status === "DONE" ? <Check className="size-2.5" /> : null}
                  </span>
                  <button
                    type="button"
                    onClick={() => onOpenTask(subtask.id)}
                    className={cn(
                      "min-w-0 flex-1 truncate text-left text-caption hover:underline focus-ring rounded-sm",
                      subtask.status === "DONE" && "text-muted-foreground line-through",
                    )}
                  >
                    {subtask.title}
                  </button>
                  <StatusBadge kind="taskStatus" value={subtask.status} size="sm" />
                </li>
              ))}
            </ul>
          )}
        </section>

        <DependencySection task={task} tasks={tasks} onOpenTask={onOpenTask} />
      </div>
    </>
  );
}

function DependencySection({ task, tasks, onOpenTask }) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [addDependency, { loading: addLoading }] = useMutation(AddTaskDependencyDocument);
  const [removeDependency] = useMutation(RemoveTaskDependencyDocument);

  const existing = new Set(task.dependencies.map((dep) => dep.dependsOnTask.id));
  const candidates = tasks.filter(
    (candidate) => candidate.id !== task.id && !existing.has(candidate.id) && !candidate.parentTask,
  );

  async function add(dependsOnTaskId) {
    try {
      await addDependency({
        variables: { taskId: task.id, dependsOnTaskId, type: "FINISH_TO_START" },
      });
      toast.success("Dependency added");
      setAdding(false);
      router.refresh();
    } catch (error) {
      // Cycles and cross-project links are rejected server-side; surface the
      // reason rather than a generic failure.
      toast.error("Couldn't add that dependency", { description: error?.message });
    }
  }

  async function remove(dependencyId) {
    try {
      await removeDependency({ variables: { id: dependencyId } });
      toast.success("Dependency removed");
      router.refresh();
    } catch (error) {
      toast.error("Couldn't remove that dependency", { description: error?.message });
    }
  }

  return (
    <section>
      <div className="mb-2.5 flex items-center justify-between gap-3">
        <h3 className="text-subheading">Depends on</h3>
        {!adding && candidates.length > 0 ? (
          <Button variant="ghost" size="sm" onClick={() => setAdding(true)}>
            <Plus aria-hidden="true" />
            Add
          </Button>
        ) : null}
      </div>

      {adding ? (
        <div className="mb-3 flex items-center gap-2">
          <Select onValueChange={add} disabled={addLoading}>
            <SelectTrigger className="h-9 flex-1" aria-label="Task this one depends on">
              <SelectValue placeholder="Choose a task…" />
            </SelectTrigger>
            <SelectContent>
              {candidates.map((candidate) => (
                <SelectItem key={candidate.id} value={candidate.id}>
                  {candidate.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="ghost" size="icon-sm" onClick={() => setAdding(false)}>
            <X aria-hidden="true" />
            <span className="sr-only">Cancel adding a dependency</span>
          </Button>
        </div>
      ) : null}

      {task.dependencies.length === 0 ? (
        <p className="text-caption text-muted-foreground">
          Nothing has to finish before this task can start.
        </p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {task.dependencies.map((dep) => (
            <li key={dep.id} className="flex items-center gap-2.5 px-3 py-2">
              <GitBranch aria-hidden="true" className="size-3.5 shrink-0 text-muted-foreground" />
              <button
                type="button"
                onClick={() => onOpenTask(dep.dependsOnTask.id)}
                className="min-w-0 flex-1 truncate text-left text-caption hover:underline focus-ring rounded-sm"
              >
                {dep.dependsOnTask.title}
              </button>
              <span className="hidden text-[0.6875rem] text-muted-foreground sm:inline">
                {humanizeType(dep.type)}
              </span>
              <StatusBadge kind="taskStatus" value={dep.dependsOnTask.status} size="sm" />
              <Button variant="ghost" size="icon-sm" onClick={() => remove(dep.id)}>
                <Trash2 aria-hidden="true" />
                <span className="sr-only">Remove dependency on {dep.dependsOnTask.title}</span>
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Field({ label, children }) {
  return (
    <div className="min-w-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-medium break-words">{children}</dd>
    </div>
  );
}
