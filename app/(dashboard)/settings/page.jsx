import { PageHeader } from "@/app/components/domain/page-header";
import { pickList } from "@/app/lib/api/safe-list";
import { getClient } from "@/app/lib/graphql/apollo-client";
import { TeamListDocument } from "@/app/lib/graphql/generated/documents";
import { requireViewer } from "@/app/lib/graphql/viewer";

import { TeamPanel } from "./team-panel";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const viewer = await requireViewer("INTERNAL");
  const { data } = await getClient().query({ query: TeamListDocument });
  const users = pickList(data, "users");
  const isAdmin = viewer.role === "admin";

  return (
    <>
      <PageHeader
        eyebrow="Workspace"
        title="Settings"
        description="Manage your team, roles, and who can work with clients and projects."
      />
      <TeamPanel users={users} currentUserId={viewer.id} isAdmin={isAdmin} />
    </>
  );
}
