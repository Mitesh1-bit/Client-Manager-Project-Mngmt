import { NotificationSettingsForm } from "@/app/components/domain/notification-settings-form";
import { PageHeader } from "@/app/components/domain/page-header";
import { getClient } from "@/app/lib/graphql/apollo-client";
import { MyNotificationPreferencesDocument } from "@/app/lib/graphql/generated/documents";
import { requireViewer } from "@/app/lib/graphql/viewer";

import { SettingsTabs } from "../settings-tabs";

export const metadata = { title: "Notification settings" };

export default async function NotificationSettingsPage() {
  await requireViewer("INTERNAL");
  const { data } = await getClient().query({ query: MyNotificationPreferencesDocument });
  const preferences = data?.myNotificationPreferences ?? [];

  return (
    <>
      <PageHeader
        eyebrow="Settings"
        title="Notification settings"
        description="Control which updates reach you in-app and by email."
      />

      <div className="space-y-6">
        <SettingsTabs />
        <NotificationSettingsForm scope="INTERNAL" preferences={preferences} />
      </div>
    </>
  );
}
