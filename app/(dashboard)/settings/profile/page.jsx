import { ProfileSettingsForm } from "@/app/components/domain/profile-settings-form";
import { PageHeader } from "@/app/components/domain/page-header";
import { requireViewer } from "@/app/lib/graphql/viewer";

import { SettingsTabs } from "../settings-tabs";

export const metadata = { title: "Profile & preferences" };

export default async function ProfileSettingsPage() {
  const viewer = await requireViewer("INTERNAL");

  return (
    <>
      <PageHeader
        eyebrow="Settings"
        title="Profile & preferences"
        description="Update how you appear in the workspace and change your password."
      />

      <div className="space-y-6">
        <SettingsTabs role={viewer.role} />
        <ProfileSettingsForm scope="INTERNAL" viewer={viewer} />
      </div>
    </>
  );
}
