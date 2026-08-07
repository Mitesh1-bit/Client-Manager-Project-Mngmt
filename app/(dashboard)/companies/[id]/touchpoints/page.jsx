import { notFound } from "next/navigation";
import { CalendarClock } from "lucide-react";

import { EmptyState } from "@/app/components/domain/states";
import { LogTouchpointDialog } from "@/app/components/domain/log-touchpoint-dialog";
import { TouchpointTimeline } from "@/app/components/domain/touchpoint-timeline";
import { asArray } from "@/app/lib/api/safe-list";
import { getClient } from "@/app/lib/graphql/apollo-client";
import {
  CompanyDetailHeaderDocument,
  CompanyTouchpointsDocument,
} from "@/app/lib/graphql/generated/documents";

export const metadata = { title: "Touchpoints" };

export default async function CompanyTouchpointsPage({ params }) {
  const { id } = await params;
  const [{ data: header }, { data: touchpointData }] = await Promise.all([
    getClient().query({ query: CompanyDetailHeaderDocument, variables: { id } }),
    getClient().query({ query: CompanyTouchpointsDocument, variables: { companyId: id } }),
  ]);

  if (!header.company) notFound();

  const contacts = asArray(touchpointData.company?.contacts);
  const touchpoints = asArray(touchpointData.companyTouchpoints).map((tp) => ({
    ...tp,
    status: tp.status?.toUpperCase() ?? "SCHEDULED",
    outcome: tp.outcome?.toUpperCase() ?? null,
  }));

  if (touchpoints.length === 0) {
    return (
      <div data-tour="company-touchpoints" className="space-y-4">
        <div className="flex justify-end">
          <LogTouchpointDialog companyId={id} contacts={contacts} />
        </div>
        <EmptyState
          icon={CalendarClock}
          title="No touchpoints yet"
          description="Enrol this client in a retention sequence, or log a call or meeting, and the history builds up here."
        />
      </div>
    );
  }

  const overdue = touchpoints.filter((tp) => tp.status === "OVERDUE").length;

  return (
    <div data-tour="company-touchpoints" className="space-y-4">
      <div className="toolbar-row">
        <p className="text-caption text-muted-foreground">
          {touchpoints.length} logged
          {overdue > 0 ? (
            <>
              {" · "}
              <span className="font-medium text-tone-critical-fg">{overdue} overdue</span>
            </>
          ) : null}
        </p>
        <LogTouchpointDialog companyId={id} contacts={contacts} />
      </div>
      <TouchpointTimeline touchpoints={touchpoints} />
    </div>
  );
}
