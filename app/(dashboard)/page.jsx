import { Building2, FolderKanban, GitPullRequestArrow } from "lucide-react";

import { PageHeader } from "@/app/components/domain/page-header";
import { StatusBadge } from "@/app/components/domain/status-badge";
import { ErrorState } from "@/app/components/domain/states";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { getClient } from "@/app/lib/graphql/apollo-client";
import { FoundationSummaryDocument } from "@/app/lib/graphql/generated/documents";
import { requireViewer } from "@/app/lib/graphql/viewer";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const viewer = await requireViewer("INTERNAL");

  let summary = null;
  try {
    const { data } = await getClient().query({ query: FoundationSummaryDocument });
    summary = data;
  } catch {
    summary = null;
  }

  return (
    <>
      <PageHeader
        eyebrow={viewer.organization.name}
        title={`Good to see you, ${viewer.name.split(" ")[0]}`}
        description="The KPI dashboard lands with the reporting work. For now this page confirms the foundation is wired end to end: Server Components querying GraphQL through Apollo, against the local mock schema."
      />

      {summary ? <SummaryGrid summary={summary} /> : <ErrorState />}
    </>
  );
}

function SummaryGrid({ summary }) {
  const activeProjects = summary.projects.nodes.filter((project) => project.status === "ACTIVE");
  const atRiskProjects = activeProjects.filter((project) => project.health !== "ON_TRACK");
  const openChangeRequests = summary.changeRequests.filter(
    (request) => !["APPROVED", "REJECTED", "CLOSED", "IMPLEMENTED"].includes(request.status),
  );

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <SummaryCard
        icon={Building2}
        label="Companies"
        value={summary.companies.totalCount}
        detail={`${summary.companies.nodes.filter((c) => c.status === "ACTIVE").length} active`}
      />
      <SummaryCard
        icon={FolderKanban}
        label="Active projects"
        value={activeProjects.length}
        detail={`${atRiskProjects.length} needing attention`}
      />
      <SummaryCard
        icon={GitPullRequestArrow}
        label="Open change requests"
        value={openChangeRequests.length}
        detail={`${summary.changeRequests.length} total on record`}
      />

      <Card className="sm:col-span-2 xl:col-span-3">
        <CardHeader>
          <CardTitle className="text-subheading">Project health, straight from the mock API</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {activeProjects.map((project) => (
            <span
              key={project.id}
              className="inline-flex items-center gap-2 rounded-full border bg-card py-1 pr-1.5 pl-3 text-caption"
            >
              <span className="truncate">{project.name}</span>
              <StatusBadge kind="projectHealth" value={project.health} size="sm" />
            </span>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, detail }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
        <CardTitle className="text-caption font-medium text-muted-foreground">{label}</CardTitle>
        <Icon aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <p className="tabular text-title">{value}</p>
        <p className="mt-1 text-caption text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  );
}
