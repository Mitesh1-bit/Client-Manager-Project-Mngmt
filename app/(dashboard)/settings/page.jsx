import { PageHeader } from "@/app/components/domain/page-header";
import { getClient } from "@/app/lib/graphql/apollo-client";
import { OrganizationSettingsDocument } from "@/app/lib/graphql/generated/documents";
import { requireViewer } from "@/app/lib/graphql/viewer";

import { OrgSettingsPanel } from "./org-settings-panel";
import { RolesAccessPanel } from "./roles-access-panel";
import { SettingsTabs } from "./settings-tabs";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const viewer = await requireViewer("INTERNAL");
  const isAdmin = viewer.role === "admin";

  let orgSettings = null;
  if (isAdmin) {
    const { data } = await getClient().query({ query: OrganizationSettingsDocument });
    orgSettings = data?.organizationSettings ?? null;
  }

  return (
    <>
      <PageHeader
        eyebrow="Workspace"
        title="Settings"
        description="Workspace roles, access levels, and your personal preferences."
      />

      <div className="space-y-6">
        <SettingsTabs role={viewer.role} />
        <RolesAccessPanel />
        {isAdmin && orgSettings ? <OrgSettingsPanel settings={orgSettings} /> : null}
      </div>
    </>
  );
}
