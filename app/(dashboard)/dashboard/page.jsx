import { Building2, FolderKanban, GitPullRequestArrow } from "lucide-react";

import { PageHeader } from "@/app/components/domain/page-header";
import { StatusBadge } from "@/app/components/domain/status-badge";
import { ErrorState } from "@/app/components/domain/states";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { normalizeCompany, normalizeProject } from "@/app/lib/api/normalize";
import { getClient } from "@/app/lib/graphql/apollo-client";
import { FoundationSummaryDocument } from "@/app/lib/graphql/generated/documents";
import { requireViewer } from "@/app/lib/graphql/viewer";

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
        description="Your workspace overview — companies, projects, and change requests at a glance."
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

function SummaryGrid({ summary }) {
  const activeProjects = summary.projects.nodes.filter((project) => project.status === "ACTIVE");
  const atRiskProjects = activeProjects.filter((project) => project.health !== "ON_TRACK");
  const openCount = summary.changeRequestDashboard?.openCount ?? 0;

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
        value={openCount}
        detail={`${summary.changeRequestDashboard?.pendingApprovalCount ?? 0} pending approval`}
      />

      <Card className="sm:col-span-2 xl:col-span-3">
        <CardHeader>
          <CardTitle className="text-subheading">Project health snapshot</CardTitle>
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
