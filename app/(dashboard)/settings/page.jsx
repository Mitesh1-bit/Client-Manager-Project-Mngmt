import { PageHeader } from "@/app/components/domain/page-header";
import { requireViewer } from "@/app/lib/graphql/viewer";

import { RolesAccessPanel } from "./roles-access-panel";
import { SettingsTabs } from "./settings-tabs";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const viewer = await requireViewer("INTERNAL");

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
      </div>
    </>
  );
}
