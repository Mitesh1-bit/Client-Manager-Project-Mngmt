"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@apollo/client/react";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/app/components/ui/alert";
import { Button } from "@/app/components/ui/button";
import { Label } from "@/app/components/ui/label";
import { Switch } from "@/app/components/ui/switch";
import {
  MyNotificationPreferencesDocument,
  UpdateMyNotificationPreferencesDocument,
} from "@/app/lib/graphql/generated/documents";
import { notificationMeta } from "@/app/lib/profile/notification-catalog";

/** GraphQL input field names (camelCase) keyed by preference id (snake_case). */
const PREFERENCE_INPUT_FIELDS = {
  change_requests: "changeRequests",
  task_assignments: "taskAssignments",
  milestone_approvals: "milestoneApprovals",
  retention_touchpoints: "retentionTouchpoints",
  project_updates: "projectUpdates",
};

/** @param {Array<{ key: string; email: boolean; inApp: boolean }>} preferences */
function toState(preferences) {
  return Object.fromEntries(
    preferences.map((row) => [row.key, { email: row.email, inApp: row.inApp }]),
  );
}

/** @param {Record<string, { email: boolean; inApp: boolean }>} state */
function toVariables(state) {
  const preferences = {};
  for (const [key, row] of Object.entries(state)) {
    const field = PREFERENCE_INPUT_FIELDS[key] ?? key;
    preferences[field] = { email: row.email, inApp: row.inApp };
  }
  return { preferences };
}

/**
 * @param {{
 *   scope: 'INTERNAL' | 'PORTAL';
 *   preferences: Array<{ key: string; email: boolean; inApp: boolean }>;
 * }} props
 */
export function NotificationSettingsForm({ scope, preferences }) {
  const router = useRouter();
  const [serverError, setServerError] = useState(null);
  const [draft, setDraft] = useState(() => toState(preferences));
  const [updatePreferences, { loading }] = useMutation(UpdateMyNotificationPreferencesDocument);

  const rows = useMemo(() => {
    return preferences
      .map((row) => ({
        ...row,
        meta: notificationMeta(row.key),
      }))
      .filter((row) => scope === "INTERNAL" || !row.meta.internalOnly);
  }, [preferences, scope]);

  function setChannel(key, channel, value) {
    setDraft((current) => ({
      ...current,
      [key]: { ...current[key], [channel]: value },
    }));
  }

  async function onSave() {
    setServerError(null);
    try {
      await updatePreferences({
        variables: toVariables(draft),
        refetchQueries: [{ query: MyNotificationPreferencesDocument }],
      });
      toast.success("Notification settings saved");
      router.refresh();
    } catch (error) {
      setServerError(error?.message ?? "We couldn't save your notification settings.");
    }
  }

  return (
    <div className="space-y-6">
      <p className="text-caption text-muted-foreground">
        Choose how you want to be notified. In-app alerts appear in the notification bell when
        enabled; email delivery requires SMTP to be configured on the server.
      </p>

      {serverError ? (
        <Alert variant="destructive">
          <AlertTitle>Couldn&apos;t save settings</AlertTitle>
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      ) : null}

      <ul className="divide-y rounded-xl border">
        {rows.map((row) => (
          <li key={row.key} className="space-y-4 px-4 py-4">
            <div>
              <p className="font-medium">{row.meta.label}</p>
              {row.meta.description ? (
                <p className="mt-0.5 text-caption text-muted-foreground">{row.meta.description}</p>
              ) : null}
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:gap-8">
              <div className="flex items-center justify-between gap-3 sm:justify-start">
                <Label htmlFor={`${row.key}-in-app`} className="text-caption font-normal">
                  In-app
                </Label>
                <Switch
                  id={`${row.key}-in-app`}
                  checked={draft[row.key]?.inApp ?? false}
                  onCheckedChange={(value) => setChannel(row.key, "inApp", value)}
                />
              </div>
              <div className="flex items-center justify-between gap-3 sm:justify-start">
                <Label htmlFor={`${row.key}-email`} className="text-caption font-normal">
                  Email
                </Label>
                <Switch
                  id={`${row.key}-email`}
                  checked={draft[row.key]?.email ?? false}
                  onCheckedChange={(value) => setChannel(row.key, "email", value)}
                />
              </div>
            </div>
          </li>
        ))}
      </ul>

      <Button type="button" onClick={onSave} disabled={loading}>
        {loading ? (
          <>
            <LoaderCircle aria-hidden="true" className="animate-spin" />
            Saving…
          </>
        ) : (
          "Save notification settings"
        )}
      </Button>
    </div>
  );
}
