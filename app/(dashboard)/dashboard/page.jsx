import { PageHeader } from "@/app/components/domain/page-header";
import { ErrorState } from "@/app/components/domain/states";
import { normalizeCompany, normalizeProject } from "@/app/lib/api/normalize";
import { getClient } from "@/app/lib/graphql/apollo-client";
import { FoundationSummaryDocument } from "@/app/lib/graphql/generated/documents";
import { requireViewer } from "@/app/lib/graphql/viewer";

import { SummaryGrid } from "./summary-grid";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const viewer = await requireViewer("INTERNAL");

  let summary = null;
  try {
    const { data } = await getClient().query({ query: FoundationSummaryDocument });
    summary = {
      companies: {
        totalCount: data.companies?.length ?? 0,
        nodes: (data.companies ?? []).map(normalizeCompany),
      },
      projects: {
        totalCount: data.projects?.length ?? 0,
        nodes: (data.projects ?? []).map((project) => normalizeProject(project)),
      },
      changeRequestDashboard: data.changeRequestDashboard,
    };
  } catch {
    summary = null;
  }

  return (
    <>
      <PageHeader
        eyebrow={viewer.organization.name}
        title={`Good to see you, ${viewer.name.split(" ")[0]}`}
        description="Your workspace overview — clients, projects, and change requests at a glance."
      />

      {summary ? (
        <div data-tour="dashboard-overview">
          <SummaryGrid summary={summary} />
        </div>
      ) : (
        <ErrorState />
      )}
    </>
  );
}
