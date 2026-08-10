"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@apollo/client/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { CircleCheck, Flag, LoaderCircle, Pencil, Plus, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { FormField } from "@/app/components/domain/form-field";
import { EmptyState } from "@/app/components/domain/states";
import { StatusBadge } from "@/app/components/domain/status-badge";
import { Alert, AlertDescription, AlertTitle } from "@/app/components/ui/alert";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Progress } from "@/app/components/ui/progress";
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
import { Switch } from "@/app/components/ui/switch";
import { Textarea } from "@/app/components/ui/textarea";
import { formatDate, formatDateTime } from "@/app/lib/format";
import {
  CreateMilestoneDocument,
  CreatePhaseDocument,
  MarkMilestoneReadyForReviewDocument,
  UpdateMilestoneDocument,
  UpdatePhaseDocument,
} from "@/app/lib/graphql/generated/documents";
import { isTaskOverdue, parseDay, startOfDay } from "@/app/lib/project";
import { listStatuses } from "@/app/lib/status";
import { cn } from "@/app/lib/utils";

import {
  milestoneOrderIndex,
  milestoneSchema,
  milestoneToFormValues,
  phaseSchema,
  phaseToFormValues,
  toCreateMilestoneVariables,
  toCreatePhaseVariables,
  toUpdateMilestoneVariables,
  toUpdatePhaseVariables,
} from "./plan-schema";

const PHASE_STATUS_OPTIONS = listStatuses("phaseStatus");

/**
 * The plan: phases as sections, each holding its milestones and the tasks that
 * roll up to them. Client sign-off state is shown but not actioned here — the
 * approval flow itself belongs to the client portal in Phase 4.
 */
export function ProjectPlan({ projectId, phases = [], milestones = [], canManage = false }) {
  const [panel, setPanel] = useState(null);
  const close = () => setPanel(null);

  const unphased = milestones.filter((milestone) => !milestone.phase);

  if (phases.length === 0) {
    return (
      <>
        <EmptyState
          icon={Flag}
          title="No phases yet"
          description="Phases group milestones and tasks into stages of delivery — discovery, build, launch."
          action={
            canManage ? (
              <Button onClick={() => setPanel({ mode: "phase-create" })}>
                <Plus aria-hidden="true" />
                Add phase
              </Button>
            ) : null
          }
        />
        {canManage ? (
          <PlanSheet
            projectId={projectId}
            panel={panel}
            phases={phases}
            milestones={milestones}
            onClose={close}
          />
        ) : null}
      </>
    );
  }

  return (
    <>
      <div className="mb-4 toolbar-row" data-tour="milestones-panel">
        <p className="text-caption text-muted-foreground">
          {phases.length} phases · {milestones.length} milestones
        </p>
        {canManage ? (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPanel({ mode: "phase-create" })}>
              <Plus aria-hidden="true" />
              Add phase
            </Button>
            <Button size="sm" onClick={() => setPanel({ mode: "milestone-create" })}>
              <Plus aria-hidden="true" />
              Add milestone
            </Button>
          </div>
        ) : null}
      </div>

      <div data-tour="project-milestones-list" className="space-y-4">
        {phases.map((phase) => (
          <PhaseSection
            key={phase.id}
            phase={phase}
            canManage={canManage}
            onEditPhase={() => setPanel({ mode: "phase-edit", phaseId: phase.id })}
            onAddMilestone={() =>
              setPanel({ mode: "milestone-create", defaults: { phaseId: phase.id } })
            }
            onEditMilestone={(milestoneId) =>
              setPanel({ mode: "milestone-edit", milestoneId })
            }
          />
        ))}

        {unphased.length > 0 ? (
          <section className="rounded-xl border bg-card p-4">
            <h2 className="text-subheading">Milestones without a phase</h2>
            <ul className="mt-3 space-y-3">
              {unphased.map((milestone) => (
                <MilestoneRow
                  key={milestone.id}
                  milestone={milestone}
                  canManage={canManage}
                  onEdit={() => setPanel({ mode: "milestone-edit", milestoneId: milestone.id })}
                />
              ))}
            </ul>
          </section>
        ) : null}
      </div>

      {canManage ? (
        <PlanSheet
          projectId={projectId}
          panel={panel}
          phases={phases}
          milestones={milestones}
          onClose={close}
        />
      ) : null}
    </>
  );
}

function PhaseSection({ phase, canManage, onEditPhase, onAddMilestone, onEditMilestone }) {
  const tasks = phase.tasks.filter((task) => !task.parentTask);
  const done = tasks.filter((task) => task.status === "DONE").length;
  const percent = tasks.length === 0 ? 0 : Math.round((done / tasks.length) * 100);

  const dueDate = parseDay(phase.dueDate);
  const overdue = dueDate && phase.status !== "COMPLETED" && dueDate < startOfDay(new Date());

  return (
    <section className="rounded-xl border bg-card">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b p-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-subheading">{phase.name}</h2>
            <StatusBadge kind="phaseStatus" value={phase.status} size="sm" />
          </div>
          <p
            className={cn(
              "mt-1 text-caption",
              overdue ? "font-medium text-tone-critical-fg" : "text-muted-foreground",
            )}
          >
            {formatDate(phase.startDate)} – {formatDate(phase.dueDate)}
            {overdue ? " · overdue" : ""}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-32">
            <div className="mb-1 flex items-center justify-between text-[0.75rem] text-muted-foreground">
              <span>Tasks</span>
              <span className="tabular">
                {done}/{tasks.length}
              </span>
            </div>
            <Progress value={percent} aria-label={`${phase.name} is ${percent}% complete`} />
          </div>
          {canManage ? (
            <Button variant="ghost" size="icon-sm" onClick={onEditPhase}>
              <Pencil aria-hidden="true" />
              <span className="sr-only">Edit {phase.name}</span>
            </Button>
          ) : null}
        </div>
      </div>

      <div className="p-4">
        {phase.milestones.length === 0 ? (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-dashed px-3 py-4">
            <p className="text-caption text-muted-foreground">
              No milestones in this phase yet.
            </p>
            {canManage ? (
              <Button variant="outline" size="sm" onClick={onAddMilestone}>
                <Plus aria-hidden="true" />
                Add milestone
              </Button>
            ) : null}
          </div>
        ) : (
          <>
            <ul className="space-y-3">
              {phase.milestones.map((milestone) => (
                <MilestoneRow
                  key={milestone.id}
                  milestone={milestone}
                  canManage={canManage}
                  onEdit={() => onEditMilestone(milestone.id)}
                />
              ))}
            </ul>
            {canManage ? (
              <Button variant="ghost" size="sm" className="mt-3" onClick={onAddMilestone}>
                <Plus aria-hidden="true" />
                Add milestone to {phase.name}
              </Button>
            ) : null}
          </>
        )}
      </div>
    </section>
  );
}

function MilestoneRow({ milestone, canManage, onEdit }) {
  const done = milestone.tasks.filter((task) => task.status === "DONE").length;
  const dueDate = parseDay(milestone.dueDate);
  const overdue =
    dueDate && milestone.status !== "COMPLETED" && dueDate < startOfDay(new Date());
  const overdueTasks = milestone.tasks.filter((task) => isTaskOverdue(task)).length;

  return (
    <li className="rounded-lg border p-3.5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-medium text-pretty">{milestone.title}</h3>
            <StatusBadge kind="milestoneStatus" value={milestone.status} size="sm" />
            {milestone.requiresClientApproval ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-tone-accent-border bg-tone-accent-bg px-1.5 py-0.5 text-[0.6875rem] font-medium text-tone-accent-fg">
                <ShieldCheck aria-hidden="true" className="size-3" />
                Client sign-off
              </span>
            ) : null}
          </div>

          {milestone.description ? (
            <p className="mt-1 text-caption text-pretty text-muted-foreground">
              {milestone.description}
            </p>
          ) : null}

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.75rem] text-muted-foreground">
            <span className={cn(overdue && "font-medium text-tone-critical-fg")}>
              Due {formatDate(milestone.dueDate)}
              {overdue ? " · overdue" : ""}
            </span>
            <span className="tabular">
              {done} of {milestone.tasks.length} tasks done
            </span>
            {overdueTasks > 0 ? (
              <span className="text-tone-critical-fg">{overdueTasks} overdue</span>
            ) : null}
          </div>
        </div>

        {canManage ? (
          <Button variant="ghost" size="icon-sm" onClick={onEdit}>
            <Pencil aria-hidden="true" />
            <span className="sr-only">Edit {milestone.title}</span>
          </Button>
        ) : null}
      </div>

      {milestone.requiresClientApproval ? (
        <ApprovalState milestone={milestone} canManage={canManage} />
      ) : null}
    </li>
  );
}

/** Where the client sign-off has got to. Phase 4 owns actually deciding it. */
function ApprovalState({ milestone, canManage }) {
  const router = useRouter();
  const [sendForReview, { loading }] = useMutation(MarkMilestoneReadyForReviewDocument);

  if (milestone.approvedAt) {
    return (
      <p className="mt-2.5 flex items-center gap-1.5 rounded-md bg-tone-positive-bg px-2.5 py-1.5 text-[0.75rem] text-tone-positive-fg">
        <CircleCheck aria-hidden="true" className="size-3.5 shrink-0" />
        Approved {formatDateTime(milestone.approvedAt)}
      </p>
    );
  }

  const pending = milestone.approvals.filter((approval) => approval.status === "PENDING");

  async function handleSendForReview() {
    try {
      await sendForReview({ variables: { milestoneId: milestone.id } });
      toast.success("Sent for client review");
      router.refresh();
    } catch (error) {
      toast.error("Couldn't send this for review", { description: error?.message });
    }
  }

  return (
    <div className="mt-2.5 flex flex-wrap items-center gap-2 rounded-md bg-tone-caution-bg px-2.5 py-1.5 text-[0.75rem] text-tone-caution-fg">
      <ShieldCheck aria-hidden="true" className="size-3.5 shrink-0" />
      <span className="flex-1">
        {pending.length > 0
          ? `Waiting on ${pending.map((approval) => approval.approverName ?? "the client").join(", ")}`
          : "Not yet sent for client approval"}
      </span>
      {canManage && pending.length === 0 ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 bg-background px-2.5 text-[0.75rem]"
          disabled={loading}
          onClick={handleSendForReview}
        >
          {loading ? <LoaderCircle aria-hidden="true" className="size-3.5 animate-spin" /> : null}
          Send for review
        </Button>
      ) : null}
    </div>
  );
}

function PlanSheet({ projectId, panel, phases, milestones, onClose }) {
  const phase = panel?.phaseId ? phases.find((row) => row.id === panel.phaseId) : null;
  const milestone = panel?.milestoneId
    ? milestones.find((row) => row.id === panel.milestoneId)
    : null;

  const isPhase = panel?.mode?.startsWith("phase");

  return (
    <Sheet open={Boolean(panel)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full gap-0 p-0 sm:max-w-lg">
        {panel ? (
          <>
            <SheetHeader className="border-b pr-12">
              <SheetTitle>
                {panel.mode === "phase-create"
                  ? "Add a phase"
                  : panel.mode === "phase-edit"
                    ? `Edit ${phase?.name}`
                    : panel.mode === "milestone-create"
                      ? "Add a milestone"
                      : `Edit ${milestone?.title}`}
              </SheetTitle>
              <SheetDescription>
                {isPhase
                  ? "Phases group milestones and tasks into stages of delivery."
                  : "Milestones are the dates the client cares about."}
              </SheetDescription>
            </SheetHeader>

            {isPhase ? (
              <PhaseForm
                key={phase?.id ?? "create"}
                projectId={projectId}
                phase={panel.mode === "phase-edit" ? phase : null}
                orderIndex={phase?.orderIndex ?? phases.length}
                onDone={onClose}
                onCancel={onClose}
              />
            ) : (
              <MilestoneForm
                key={milestone?.id ?? "create"}
                milestone={panel.mode === "milestone-edit" ? milestone : null}
                defaults={panel.defaults}
                phases={phases}
                onDone={onClose}
                onCancel={onClose}
              />
            )}
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function PhaseForm({ projectId, phase, orderIndex, onDone, onCancel }) {
  const router = useRouter();
  const [serverError, setServerError] = useState(null);
  const [createPhase] = useMutation(CreatePhaseDocument);
  const [updatePhase] = useMutation(UpdatePhaseDocument);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(phaseSchema),
    defaultValues: phaseToFormValues(phase),
  });

  async function onSubmit(values) {
    setServerError(null);
    try {
      if (phase) {
        await updatePhase({
          variables: toUpdatePhaseVariables(phase.id, values, orderIndex),
        });
      } else {
        await createPhase({
          variables: toCreatePhaseVariables(values, projectId, orderIndex),
        });
      }
      toast.success(phase ? "Phase updated" : "Phase added");
      router.refresh();
      onDone();
    } catch (error) {
      setServerError(error?.message ?? "We couldn't save this phase. Try again.");
    }
  }

  return (
    <FormShell
      onSubmit={handleSubmit(onSubmit)}
      onCancel={onCancel}
      isSubmitting={isSubmitting}
      submitLabel={phase ? "Save changes" : "Add phase"}
      serverError={serverError}
    >
      <FormField label="Phase name" error={errors.name?.message} required>
        {(field) => <Input {...field} {...register("name")} className="h-10" autoFocus />}
      </FormField>

      <FormField label="Status" error={errors.status?.message} required>
        {(field) => (
          <Controller
            control={control}
            name="status"
            render={({ field: control_ }) => (
              <Select value={control_.value} onValueChange={control_.onChange}>
                <SelectTrigger {...field} className="h-10 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PHASE_STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        )}
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Start date" error={errors.startDate?.message}>
          {(field) => <Input {...field} {...register("startDate")} type="date" className="h-10" />}
        </FormField>
        <FormField label="End date" error={errors.dueDate?.message}>
          {(field) => <Input {...field} {...register("dueDate")} type="date" className="h-10" />}
        </FormField>
      </div>
    </FormShell>
  );
}

function MilestoneForm({ milestone, defaults, phases, onDone, onCancel }) {
  const router = useRouter();
  const [serverError, setServerError] = useState(null);
  const [createMilestone] = useMutation(CreateMilestoneDocument);
  const [updateMilestone] = useMutation(UpdateMilestoneDocument);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(milestoneSchema),
    defaultValues: milestoneToFormValues(milestone, defaults),
  });

  async function onSubmit(values) {
    setServerError(null);
    try {
      if (milestone) {
        await updateMilestone({
          variables: toUpdateMilestoneVariables(milestone.id, values),
        });
      } else {
        await createMilestone({
          variables: toCreateMilestoneVariables(
            values,
            milestoneOrderIndex(phases, values.phaseId),
          ),
        });
      }
      toast.success(milestone ? "Milestone updated" : "Milestone added");
      router.refresh();
      onDone();
    } catch (error) {
      setServerError(error?.message ?? "We couldn't save this milestone. Try again.");
    }
  }

  return (
    <FormShell
      onSubmit={handleSubmit(onSubmit)}
      onCancel={onCancel}
      isSubmitting={isSubmitting}
      submitLabel={milestone ? "Save changes" : "Add milestone"}
      serverError={serverError}
    >
      <FormField label="Title" error={errors.title?.message} required>
        {(field) => <Input {...field} {...register("title")} className="h-10" autoFocus />}
      </FormField>

      <FormField label="Phase" error={errors.phaseId?.message} required>
        {(field) => (
          <Controller
            control={control}
            name="phaseId"
            render={({ field: control_ }) => (
              <Select value={control_.value} onValueChange={control_.onChange}>
                <SelectTrigger {...field} className="h-10 w-full">
                  <SelectValue placeholder="Choose a phase" />
                </SelectTrigger>
                <SelectContent>
                  {phases.map((phase) => (
                    <SelectItem key={phase.id} value={phase.id}>
                      {phase.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        )}
      </FormField>

      <FormField label="Description" error={errors.description?.message}>
        {(field) => <Textarea {...field} {...register("description")} rows={3} />}
      </FormField>

      <FormField label="Due date" error={errors.dueDate?.message}>
        {(field) => <Input {...field} {...register("dueDate")} type="date" className="h-10" />}
      </FormField>

      <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
        <div className="min-w-0">
          <Label htmlFor="requiresClientApproval" className="text-caption font-medium">
            Needs client sign-off
          </Label>
          <p className="mt-0.5 text-[0.75rem] text-pretty text-muted-foreground">
            The client is asked to approve this milestone in their portal before it counts
            as complete.
          </p>
        </div>
        <Controller
          control={control}
          name="requiresClientApproval"
          render={({ field }) => (
            <Switch
              id="requiresClientApproval"
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          )}
        />
      </div>
    </FormShell>
  );
}

function FormShell({ onSubmit, onCancel, isSubmitting, submitLabel, serverError, children }) {
  return (
    <form noValidate onSubmit={onSubmit} className="flex h-full flex-col">
      <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
        {serverError ? (
          <Alert variant="destructive">
            <AlertTitle>Couldn&apos;t save</AlertTitle>
            <AlertDescription>{serverError}</AlertDescription>
          </Alert>
        ) : null}
        {children}
      </div>

      <div className="flex items-center justify-end gap-2 border-t px-5 py-3">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <LoaderCircle aria-hidden="true" className="animate-spin" />
              Saving…
            </>
          ) : (
            submitLabel
          )}
        </Button>
      </div>
    </form>
  );
}
