"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@apollo/client/react";
import { UserPlus, UserX } from "lucide-react";
import { toast } from "sonner";

import { EntityAvatar } from "@/app/components/domain/entity-avatar";
import { EmptyState, SectionCard } from "@/app/components/domain/states";
import { Button } from "@/app/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import {
  AddProjectMemberDocument,
  ProjectTeamDocument,
  RemoveProjectMemberDocument,
} from "@/app/lib/graphql/generated/documents";
import { humanize } from "@/app/lib/status";

/**
 * Who's on this project's delivery team, and — for admin/PM — the ability to
 * add or remove people. Mirrors the backend's addProjectMember/removeProjectMember
 * scoping: admins can add anyone, project managers can only add a team member.
 */
export function TeamPanel({ projectId, members, allUsers, isAdmin, isProjectManager }) {
  const router = useRouter();
  const canManage = isAdmin || isProjectManager;
  const [selectedUserId, setSelectedUserId] = useState("");
  const [removingId, setRemovingId] = useState(null);
  const [addMember, { loading: adding }] = useMutation(AddProjectMemberDocument);
  const [removeMember] = useMutation(RemoveProjectMemberDocument);

  const memberIds = useMemo(() => new Set(members.map((member) => member.id)), [members]);
  const addableUsers = useMemo(() => {
    const notAlreadyOn = allUsers.filter((user) => !memberIds.has(user.id));
    // Mirrors the backend rule: a PM can only add a team member; admins see everyone.
    return isAdmin ? notAlreadyOn : notAlreadyOn.filter((user) => user.role === "team_member");
  }, [allUsers, memberIds, isAdmin]);

  async function handleAdd() {
    if (!selectedUserId) return;
    try {
      await addMember({
        variables: { projectId, userId: selectedUserId },
        refetchQueries: [{ query: ProjectTeamDocument, variables: { id: projectId } }],
      });
      toast.success("Added to the project");
      setSelectedUserId("");
      router.refresh();
    } catch (error) {
      toast.error("Couldn't add them to the project", { description: error?.message });
    }
  }

  async function handleRemove(userId) {
    setRemovingId(userId);
    try {
      await removeMember({
        variables: { projectId, userId },
        refetchQueries: [{ query: ProjectTeamDocument, variables: { id: projectId } }],
      });
      toast.success("Removed from the project");
      router.refresh();
    } catch (error) {
      toast.error("Couldn't remove them from the project", { description: error?.message });
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {canManage ? (
        <SectionCard
          title="Add someone"
          description={
            isAdmin
              ? "Add anyone in your workspace to this project's delivery team."
              : "You can add team members to this project. Other roles need an admin."
          }
        >
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
            <Button onClick={handleAdd} disabled={!selectedUserId || adding}>
              <UserPlus aria-hidden="true" />
              {adding ? "Adding…" : "Add to project"}
            </Button>
          </div>
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
              <li
                key={member.id}
                className="flex items-center justify-between gap-3 px-4 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <EntityAvatar name={member.name} imageUrl={member.avatarUrl} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate font-medium">{member.name}</p>
                    <p className="truncate text-caption text-muted-foreground">
                      {humanize(member.role)}
                    </p>
                  </div>
                </div>
                {canManage ? (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    disabled={removingId === member.id}
                    onClick={() => handleRemove(member.id)}
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
    </div>
  );
}
