import Link from "next/link";

import { PageHeader } from "@/app/components/domain/page-header";
import { Button } from "@/app/components/ui/button";
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
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link href="/settings/profile">Profile & preferences</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/settings/notifications">Notification settings</Link>
            </Button>
          </div>
        }
      />
      <TeamPanel users={users} currentUserId={viewer.id} isAdmin={isAdmin} />
    </>
  );
}
