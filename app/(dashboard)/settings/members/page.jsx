import { Suspense } from "react";

import { PageHeader } from "@/app/components/domain/page-header";
import { pickList } from "@/app/lib/api/safe-list";
import { getClient } from "@/app/lib/graphql/apollo-client";
import { TeamListDocument } from "@/app/lib/graphql/generated/documents";
import { requireViewer } from "@/app/lib/graphql/viewer";

import { MembersPanel } from "../members-panel";
import { SettingsTabs } from "../settings-tabs";

export const metadata = { title: "Members" };

export default async function SettingsMembersPage() {
  const viewer = await requireViewer("INTERNAL");
  const { data } = await getClient().query({ query: TeamListDocument });
  const users = pickList(data, "users");
  const isAdmin = viewer.role === "admin";
  const isProjectManager = viewer.role === "project_manager";

  return (
    <>
      <PageHeader
        eyebrow="Settings"
        title="Members"
        description="Add colleagues and manage who has dashboard access in your organization."
      />

      <div className="space-y-6">
        <SettingsTabs />
        <Suspense fallback={null}>
          <MembersPanel
            users={users}
            currentUserId={viewer.id}
            isAdmin={isAdmin}
            isProjectManager={isProjectManager}
          />
        </Suspense>
      </div>
    </>
  );
}
