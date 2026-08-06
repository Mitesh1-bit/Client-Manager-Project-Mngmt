import { NotificationSettingsForm } from "@/app/components/domain/notification-settings-form";
import { getClient } from "@/app/lib/graphql/apollo-client";
import { MyNotificationPreferencesDocument } from "@/app/lib/graphql/generated/documents";
import { requireViewer } from "@/app/lib/graphql/viewer";

import { PortalBackLink, PortalPageHeader } from "../portal-ui";

export const metadata = { title: "Notification settings" };

export default async function PortalNotificationSettingsPage() {
  await requireViewer("PORTAL");
  const { data } = await getClient().query({ query: MyNotificationPreferencesDocument });
  const preferences = data?.myNotificationPreferences ?? [];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PortalBackLink href="/portal">Back to overview</PortalBackLink>
      <PortalPageHeader
        eyebrow="Account"
        title="Notification settings"
        description="Choose how you hear about approvals, change requests, and project updates."
      />
      <NotificationSettingsForm scope="PORTAL" preferences={preferences} />
    </div>
  );
}
