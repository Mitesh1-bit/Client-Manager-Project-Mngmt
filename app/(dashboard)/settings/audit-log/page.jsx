import { redirect } from "next/navigation";

import { PageHeader } from "@/app/components/domain/page-header";
import { pickList } from "@/app/lib/api/safe-list";
import { getClient } from "@/app/lib/graphql/apollo-client";
import { AuditLogDocument } from "@/app/lib/graphql/generated/documents";
import { requireViewer } from "@/app/lib/graphql/viewer";

import { AuditLogPanel } from "./audit-log-panel";
import { SettingsTabs } from "../settings-tabs";

// Mirrors the backend's activityLogs gate (require_role in
// app/graphql/audit/schema.py).
const AUDIT_LOG_ROLES = ["admin", "project_manager"];
const PAGE_SIZE = 15;

export const metadata = { title: "Audit log" };

export default async function AuditLogPage() {
  const viewer = await requireViewer("INTERNAL");
  if (!AUDIT_LOG_ROLES.includes(viewer.role)) redirect("/settings");

  const { data } = await getClient().query({
    query: AuditLogDocument,
    variables: { limit: PAGE_SIZE, offset: 0 },
  });

  return (
    <>
      <PageHeader
        eyebrow="Settings"
        title="Audit log"
        description="Every create, edit, and delete across your workspace — who did what, and when."
      />

      <div className="space-y-6">
        <SettingsTabs role={viewer.role} />
        <AuditLogPanel
          initialEntries={pickList(data, "activityLogs")}
          initialTotalCount={data.activityLogsCount ?? 0}
          users={pickList(data, "users")}
          pageSize={PAGE_SIZE}
        />
      </div>
    </>
  );
}
