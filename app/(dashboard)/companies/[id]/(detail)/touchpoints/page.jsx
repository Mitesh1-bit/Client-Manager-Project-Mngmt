import { notFound } from "next/navigation";
import { CalendarClock } from "lucide-react";

import { EmptyState } from "@/app/components/domain/states";
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
    getClient().query({ query: CompanyTouchpointsDocument }),
  ]);

  if (!header.company) notFound();

  const touchpoints = asArray(touchpointData.upcomingTouchpoints)
    .filter((tp) => tp.companyId === id)
    .map((tp) => ({
      ...tp,
      status: tp.status?.toUpperCase() ?? "SCHEDULED",
      contact: { id: tp.contactId, fullName: "Contact" },
    }));

  if (touchpoints.length === 0) {
    return (
      <EmptyState
        icon={CalendarClock}
        title="No touchpoints yet"
        description="Enrol this company in a retention sequence, or log a call or meeting, and the history builds up here."
      />
    );
  }

  const overdue = touchpoints.filter((tp) => tp.status === "OVERDUE").length;

  return (
    <div className="space-y-4">
      <p className="text-caption text-muted-foreground">
        {touchpoints.length} logged
        {overdue > 0 ? (
          <>
            {" · "}
            <span className="font-medium text-tone-critical-fg">{overdue} overdue</span>
          </>
        ) : null}
      </p>
      <TouchpointTimeline touchpoints={touchpoints} />
    </div>
  );
}
