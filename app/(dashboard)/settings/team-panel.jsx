"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@apollo/client/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch } from "react-hook-form";
import { LoaderCircle, Shield } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { FormField } from "@/app/components/domain/form-field";
import { SectionCard } from "@/app/components/domain/states";
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
import { Alert, AlertDescription, AlertTitle } from "@/app/components/ui/alert";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import {
  CreateUserDocument,
  DeleteUserDocument,
  TeamListDocument,
  UpdateUserDocument,
} from "@/app/lib/graphql/generated/documents";
import { ROLE_CATALOG, roleDefinition } from "@/app/lib/rbac";
import { humanize } from "@/app/lib/status";
import { cn } from "@/app/lib/utils";

const inviteSchema = z.object({
  name: z.string().trim().min(2, "Enter a name."),
  email: z.string().trim().email("Enter a valid email."),
  password: z.string().min(12, "Password must be at least 12 characters."),
  role: z.enum([
    "admin",
    "account_manager",
    "project_manager",
    "team_member",
    "finance_admin",
    "executive_viewer",
  ]),
});

export function TeamPanel({ users, currentUserId, isAdmin, isProjectManager = false }) {
  const router = useRouter();
  const [serverError, setServerError] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [createUser] = useMutation(CreateUserDocument);
  const [updateUser] = useMutation(UpdateUserDocument);
  const [deleteUser, { loading: deleting }] = useMutation(DeleteUserDocument);

  // Admins can invite/delete any role. Project managers can only bring on
  // (or remove) team members — everything else about the team stays admin-only.
  const canManageTeam = isAdmin || isProjectManager;
  const inviteRoleOptions = isAdmin
    ? ROLE_CATALOG
    : ROLE_CATALOG.filter((role) => role.value === "team_member");
  const defaultInviteRole = isAdmin ? "project_manager" : "team_member";

  function canDeleteUser(user) {
    if (user.id === currentUserId) return false;
    if (isAdmin) return true;
    return isProjectManager && user.role === "team_member";
  }

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(inviteSchema),
    defaultValues: { name: "", email: "", password: "", role: defaultInviteRole },
  });

  const selectedRole = useWatch({ control, name: "role" });
  const selectedRoleInfo = useMemo(() => roleDefinition(selectedRole), [selectedRole]);

  async function onInvite(values) {
    if (!canManageTeam) return;
    setServerError(null);
    try {
      await createUser({
        variables: values,
        refetchQueries: [{ query: TeamListDocument }],
      });
      toast.success(`${values.name} added to your team`);
      reset({ name: "", email: "", password: "", role: defaultInviteRole });
      router.refresh();
    } catch (error) {
      setServerError(error?.message ?? "Could not add this team member.");
    }
  }

  async function onRoleChange(userId, role) {
    if (!isAdmin || userId === currentUserId) return;
    try {
      await updateUser({
        variables: { id: userId, role },
        refetchQueries: [{ query: TeamListDocument }],
      });
      toast.success("Role updated");
      router.refresh();
    } catch (error) {
      toast.error("Couldn't update role", { description: error?.message });
    }
  }

  async function onStatusChange(userId, status) {
    if (!isAdmin || userId === currentUserId) return;
    try {
      await updateUser({
        variables: { id: userId, status },
        refetchQueries: [{ query: TeamListDocument }],
      });
      toast.success(status === "inactive" ? "Team member deactivated" : "Team member reactivated");
      router.refresh();
    } catch (error) {
      toast.error("Couldn't update status", { description: error?.message });
    }
  }

  async function confirmDelete() {
    if (!deleteTarget || !canDeleteUser(deleteTarget)) return;
    try {
      await deleteUser({
        variables: { id: deleteTarget.id },
        refetchQueries: [{ query: TeamListDocument }],
      });
      toast.success(`${deleteTarget.name} was deleted`);
      setDeleteTarget(null);
      router.refresh();
    } catch (error) {
      toast.error("Couldn't delete this team member", { description: error?.message });
    }
  }

  return (
    <div className="space-y-6">
      <SectionCard
        data-tour="settings-roles"
        title="Roles & access"
        description="What each role can do in your workspace. Client portal access is managed per contact, not per team member."
      >
        <div className="grid gap-3 lg:grid-cols-2">
          {ROLE_CATALOG.map((role) => (
            <article key={role.value} className="rounded-xl border bg-card p-4">
              <h3 className="font-medium">{role.label}</h3>
              <p className="mt-1 text-caption text-pretty text-muted-foreground">{role.summary}</p>
              <ul className="mt-3 space-y-1 text-[0.75rem] text-muted-foreground">
                {role.access.map((item) => (
                  <li key={item} className="flex gap-2">
                    <Shield aria-hidden="true" className="mt-0.5 size-3 shrink-0 text-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </SectionCard>

      {canManageTeam ? (
        <div data-tour="team-invite">
        <SectionCard
          title="Add team member"
          description={
            isAdmin
              ? "Create a dashboard account with a temporary password. Share login credentials securely — email invites are not enabled yet."
              : "As a project manager you can add team members to grow delivery capacity — other roles need an admin."
          }
        >
          <form noValidate onSubmit={handleSubmit(onInvite)} className="space-y-4">
            {serverError ? (
              <Alert variant="destructive">
                <AlertTitle>Couldn&apos;t add member</AlertTitle>
                <AlertDescription>{serverError}</AlertDescription>
              </Alert>
            ) : null}
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Full name" error={errors.name?.message} required>
                {(field) => <Input {...field} {...register("name")} className="h-10" />}
              </FormField>
              <FormField label="Work email" error={errors.email?.message} required>
                {(field) => (
                  <Input {...field} {...register("email")} type="email" className="h-10" />
                )}
              </FormField>
              <FormField label="Temporary password" error={errors.password?.message} required>
                {(field) => (
                  <Input
                    {...field}
                    {...register("password")}
                    type="password"
                    className="h-10"
                    autoComplete="new-password"
                  />
                )}
              </FormField>
              <FormField label="Role" error={errors.role?.message} required>
                {(field) => (
                  <Controller
                    control={control}
                    name="role"
                    render={({ field: control_ }) => (
                      <Select value={control_.value} onValueChange={control_.onChange}>
                        <SelectTrigger {...field} className="h-10 w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {inviteRoleOptions.map((role) => (
                            <SelectItem key={role.value} value={role.value}>
                              {role.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                )}
              </FormField>
            </div>
            {!isAdmin ? (
              <p className="text-caption text-muted-foreground">
                Only &quot;Team member&quot; is available here — inviting any other role needs an admin.
              </p>
            ) : null}
            {selectedRoleInfo ? (
              <p className="rounded-lg border bg-muted/40 px-3 py-2 text-caption text-muted-foreground">
                <span className="font-medium text-foreground">{selectedRoleInfo.label}</span>
                {" — "}
                {selectedRoleInfo.summary}
              </p>
            ) : null}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <LoaderCircle aria-hidden="true" className="animate-spin" />
                  Adding…
                </>
              ) : (
                "Add team member"
              )}
            </Button>
          </form>
        </SectionCard>
        </div>
      ) : (
        <SectionCard title="Team management" description="Only admins and project managers can add team members.">
          <p className="text-caption text-muted-foreground">
            You can view the team list below. Ask an admin if you need a role change, or an admin
            or project manager for a new colleague added.
          </p>
        </SectionCard>
      )}

      <SectionCard
        data-tour="settings-team"
        title="Team"
        description="Everyone with dashboard access in your organization."
      >
        <ul className="divide-y rounded-xl border">
          {users.map((user) => {
            const inactive = user.status === "inactive";
            return (
              <li
                key={user.id}
                className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className={cn("font-medium", inactive && "text-muted-foreground line-through")}>
                    {user.name}
                    {user.id === currentUserId ? (
                      <span className="ml-2 text-caption font-normal text-muted-foreground">(you)</span>
                    ) : null}
                  </p>
                  <p className="truncate text-caption text-muted-foreground">{user.email}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {isAdmin && user.id !== currentUserId ? (
                    <>
                      <Select value={user.role} onValueChange={(role) => onRoleChange(user.id, role)}>
                        <SelectTrigger className="h-9 w-full sm:w-44">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ROLE_CATALOG.map((role) => (
                            <SelectItem key={role.value} value={role.value}>
                              {role.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          onStatusChange(user.id, inactive ? "active" : "inactive")
                        }
                      >
                        {inactive ? "Reactivate" : "Deactivate"}
                      </Button>
                    </>
                  ) : (
                    <span className="text-caption text-muted-foreground">
                      {humanize(user.role)}
                      {inactive ? " · inactive" : ""}
                    </span>
                  )}
                  {/* Role change and deactivate stay admin-only above — a PM's
                      reach into team management is deliberately narrower:
                      they can only remove a team member, nothing else. */}
                  {canDeleteUser(user) ? (
                    <Button variant="destructive" size="sm" onClick={() => setDeleteTarget(user)}>
                      Delete
                    </Button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      </SectionCard>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes their account — unlike Deactivate, it can&apos;t be undone.
              Projects, tasks, and change requests assigned to them become unassigned rather than
              being deleted themselves.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmDelete} disabled={deleting}>
              {deleting ? "Deleting…" : "Delete team member"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
