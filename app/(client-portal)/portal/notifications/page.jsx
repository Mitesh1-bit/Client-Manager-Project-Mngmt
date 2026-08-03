import Link from "next/link";

import { NotificationSettingsForm } from "@/app/components/domain/notification-settings-form";
import { Button } from "@/app/components/ui/button";
import { getClient } from "@/app/lib/graphql/apollo-client";
import { MyNotificationPreferencesDocument } from "@/app/lib/graphql/generated/documents";
import { requireViewer } from "@/app/lib/graphql/viewer";

export const metadata = { title: "Notification settings" };

export default async function PortalNotificationSettingsPage() {
  await requireViewer("PORTAL");
  const { data } = await getClient().query({ query: MyNotificationPreferencesDocument });
  const preferences = data?.myNotificationPreferences ?? [];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-caption font-medium uppercase tracking-wide text-muted-foreground">
            Account
          </p>
          <h1 className="mt-1 text-title">Notification settings</h1>
          <p className="mt-2 text-caption text-muted-foreground">
            Choose how you hear about approvals, change requests, and project updates.
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/portal">Back to portal</Link>
        </Button>
      </div>
      <NotificationSettingsForm scope="PORTAL" preferences={preferences} />
    </div>
  );
}
