import { notFound } from "next/navigation";
import { CalendarClock } from "lucide-react";

import { EmptyState } from "@/app/components/domain/states";
import { TouchpointTimeline } from "@/app/components/domain/touchpoint-timeline";
import { getClient } from "@/app/lib/graphql/apollo-client";
import { CompanyTouchpointsDocument } from "@/app/lib/graphql/generated/documents";

export const metadata = { title: "Touchpoints" };

export default async function CompanyTouchpointsPage({ params }) {
  const { id } = await params;
  const { data } = await getClient().query({
    query: CompanyTouchpointsDocument,
    variables: { id },
  });

  if (!data.company) notFound();
  const touchpoints = data.company.touchpoints;

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
