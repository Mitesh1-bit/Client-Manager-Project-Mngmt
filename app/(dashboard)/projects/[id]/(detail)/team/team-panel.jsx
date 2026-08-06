"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@apollo/client/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { LoaderCircle, UserPlus, UserX } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { EntityAvatar } from "@/app/components/domain/entity-avatar";
import { FormField } from "@/app/components/domain/form-field";
import { EmptyState, SectionCard } from "@/app/components/domain/states";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { PasswordInput } from "@/app/components/ui/password-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import {
  AddProjectContactDocument,
  AddProjectMemberDocument,
  CreateUserDocument,
  ProjectTeamDocument,
  RemoveProjectContactDocument,
  RemoveProjectMemberDocument,
} from "@/app/lib/graphql/generated/documents";
import { ROLE_CATALOG } from "@/app/lib/rbac";
import { humanize } from "@/app/lib/status";

const createPersonSchema = z.object({
  name: z.string().trim().min(2, "Enter a name."),
  email: z.string().trim().email("Enter a valid email."),
  password: z.string().min(12, "Password must be at least 12 characters."),
  role: z.enum(["admin", "project_manager", "team_member"]),
});

function contactFullName(contact) {
  return `${contact.firstName} ${contact.lastName}`;
}

/**
 * Who's on this project — internal delivery team plus a client-contact
 * roster. Admins/PMs can add an existing person, or create a brand-new team
 * member without leaving the project. Client contacts here are a roster
 * entry only: it doesn't change what they can see in the client portal,
 * which stays scoped to all of their company's projects.
 */
export function TeamPanel({
  projectId,
  members,
  clientContacts,
  allUsers,
  companyContacts,
  isAdmin,
  isProjectManager,
}) {
  const router = useRouter();
  const canManage = isAdmin || isProjectManager;
  const defaultRole = isAdmin ? "project_manager" : "team_member";

  const [addMode, setAddMode] = useState("existing");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedContactId, setSelectedContactId] = useState("");
  const [removingMemberId, setRemovingMemberId] = useState(null);
  const [removingContactId, setRemovingContactId] = useState(null);
  const [createError, setCreateError] = useState(null);

  const [addMember, { loading: adding }] = useMutation(AddProjectMemberDocument);
  const [removeMember] = useMutation(RemoveProjectMemberDocument);
  const [createUser, { loading: creating }] = useMutation(CreateUserDocument);
  const [addContact, { loading: addingContact }] = useMutation(AddProjectContactDocument);
  const [removeContact] = useMutation(RemoveProjectContactDocument);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createPersonSchema),
    defaultValues: { name: "", email: "", password: "", role: defaultRole },
  });

  const memberIds = useMemo(() => new Set(members.map((member) => member.id)), [members]);
  const addableUsers = useMemo(() => {
    const notAlreadyOn = allUsers.filter((user) => !memberIds.has(user.id));
    // Mirrors the backend rule: a PM can only add a team member; admins see everyone.
    return isAdmin ? notAlreadyOn : notAlreadyOn.filter((user) => user.role === "team_member");
  }, [allUsers, memberIds, isAdmin]);

  const createRoleOptions = isAdmin ? ROLE_CATALOG : ROLE_CATALOG.filter((role) => role.value === "team_member");

  const contactIds = useMemo(() => new Set(clientContacts.map((contact) => contact.id)), [clientContacts]);
  const addableContacts = useMemo(
    () => companyContacts.filter((contact) => !contactIds.has(contact.id)),
    [companyContacts, contactIds],
  );

  const refetch = { refetchQueries: [{ query: ProjectTeamDocument, variables: { id: projectId } }] };

  async function handleAddExisting() {
    if (!selectedUserId) return;
    try {
      await addMember({ variables: { projectId, userId: selectedUserId }, ...refetch });
      toast.success("Added to the project");
      setSelectedUserId("");
      router.refresh();
    } catch (error) {
      toast.error("Couldn't add them to the project", { description: error?.message });
    }
  }

  async function handleCreateAndAdd(values) {
    setCreateError(null);
    try {
      const { data } = await createUser({ variables: values });
      await addMember({
        variables: { projectId, userId: data.createUser.id },
        ...refetch,
      });
      toast.success(`${values.name} created and added to the project`);
      reset({ name: "", email: "", password: "", role: defaultRole });
      setAddMode("existing");
      router.refresh();
    } catch (error) {
      setCreateError(error?.message ?? "Couldn't create this person.");
    }
  }

  async function handleRemoveMember(userId) {
    setRemovingMemberId(userId);
    try {
      await removeMember({ variables: { projectId, userId }, ...refetch });
      toast.success("Removed from the project");
      router.refresh();
    } catch (error) {
      toast.error("Couldn't remove them from the project", { description: error?.message });
    } finally {
      setRemovingMemberId(null);
    }
  }

  async function handleAddContact() {
    if (!selectedContactId) return;
    try {
      await addContact({ variables: { projectId, contactId: selectedContactId }, ...refetch });
      toast.success("Added to the project roster");
      setSelectedContactId("");
      router.refresh();
    } catch (error) {
      toast.error("Couldn't add this contact", { description: error?.message });
    }
  }

  async function handleRemoveContact(contactId) {
    setRemovingContactId(contactId);
    try {
      await removeContact({ variables: { projectId, contactId }, ...refetch });
      toast.success("Removed from the project roster");
      router.refresh();
    } catch (error) {
      toast.error("Couldn't remove this contact", { description: error?.message });
    } finally {
      setRemovingContactId(null);
    }
  }

  return (
    <div className="space-y-6">
      {canManage ? (
        <SectionCard
          title="Add someone"
          description={
            isAdmin
              ? "Add an existing person, or create a brand-new account for this project."
              : "Add an existing team member, or create a new one for this project. Other roles need an admin."
          }
        >
          <Tabs value={addMode} onValueChange={setAddMode}>
            <TabsList className="mb-4">
              <TabsTrigger value="existing">Existing person</TabsTrigger>
              <TabsTrigger value="create">Create new</TabsTrigger>
            </TabsList>

            <TabsContent value="existing">
              <div className="flex flex-col gap-3 sm:flex-row">
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger className="h-10 w-full sm:max-w-sm">
                    <SelectValue placeholder="Choose someone to add" />
                  </SelectTrigger>
                  <SelectContent>
                    {addableUsers.length === 0 ? (
                      <p className="px-2 py-1.5 text-caption text-muted-foreground">
                        Everyone eligible is already on this project
                      </p>
                    ) : (
                      addableUsers.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name} · {humanize(user.role)}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <Button onClick={handleAddExisting} disabled={!selectedUserId || adding}>
                  <UserPlus aria-hidden="true" />
                  {adding ? "Adding…" : "Add to project"}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="create">
              <form noValidate onSubmit={handleSubmit(handleCreateAndAdd)} className="space-y-4">
                {createError ? (
                  <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-caption text-destructive">
                    {createError}
                  </p>
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
                      <PasswordInput
                        {...field}
                        {...register("password")}
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
                              {createRoleOptions.map((role) => (
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
                <Button type="submit" disabled={creating}>
                  {creating ? (
                    <>
                      <LoaderCircle aria-hidden="true" className="animate-spin" />
                      Creating…
                    </>
                  ) : (
                    <>
                      <UserPlus aria-hidden="true" />
                      Create and add to project
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </SectionCard>
      ) : null}

      <SectionCard title="Team" description={`${members.length} on this project`}>
        {members.length === 0 ? (
          <EmptyState
            icon={UserPlus}
            title="Nobody's been added yet"
            description={
              canManage
                ? "Add people above so this project shows up for them."
                : "Ask a project manager or admin to add you here."
            }
          />
        ) : (
          <ul className="divide-y rounded-xl border">
            {members.map((member) => (
              <li key={member.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <EntityAvatar name={member.name} imageUrl={member.avatarUrl} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate font-medium">{member.name}</p>
                    <p className="truncate text-caption text-muted-foreground">{humanize(member.role)}</p>
                  </div>
                </div>
                {canManage ? (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    disabled={removingMemberId === member.id}
                    onClick={() => handleRemoveMember(member.id)}
                  >
                    <UserX aria-hidden="true" />
                    <span className="sr-only">Remove {member.name} from the project</span>
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      {canManage ? (
        <SectionCard
          title="Add a client contact"
          description="A roster entry only — it doesn't change what this contact can see in their portal."
        >
          <div className="flex flex-col gap-3 sm:flex-row">
            <Select value={selectedContactId} onValueChange={setSelectedContactId}>
              <SelectTrigger className="h-10 w-full sm:max-w-sm">
                <SelectValue placeholder="Choose a client contact" />
              </SelectTrigger>
              <SelectContent>
                {addableContacts.length === 0 ? (
                  <p className="px-2 py-1.5 text-caption text-muted-foreground">
                    No more contacts to add for this client
                  </p>
                ) : (
                  addableContacts.map((contact) => (
                    <SelectItem key={contact.id} value={contact.id}>
                      {contactFullName(contact)}
                      {contact.isPrimary ? " (primary)" : ""}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <Button onClick={handleAddContact} disabled={!selectedContactId || addingContact}>
              <UserPlus aria-hidden="true" />
              {addingContact ? "Adding…" : "Add to roster"}
            </Button>
          </div>
        </SectionCard>
      ) : null}

      <SectionCard title="Client contacts" description={`${clientContacts.length} on this project's roster`}>
        {clientContacts.length === 0 ? (
          <EmptyState
            icon={UserPlus}
            title="No client contacts on the roster"
            description="Add the client-side point of contact for this project above."
          />
        ) : (
          <ul className="divide-y rounded-xl border">
            {clientContacts.map((contact) => (
              <li key={contact.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <EntityAvatar name={contactFullName(contact)} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {contactFullName(contact)}
                      {contact.isPrimary ? (
                        <span className="ml-1.5 text-caption font-normal text-muted-foreground">
                          (primary)
                        </span>
                      ) : null}
                    </p>
                    <p className="truncate text-caption text-muted-foreground">
                      {contact.title || contact.email || "Client contact"}
                    </p>
                  </div>
                </div>
                {canManage ? (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    disabled={removingContactId === contact.id}
                    onClick={() => handleRemoveContact(contact.id)}
                  >
                    <UserX aria-hidden="true" />
                    <span className="sr-only">
                      Remove {contactFullName(contact)} from the project roster
                    </span>
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}
