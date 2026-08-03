import { Suspense } from "react";
import Link from "next/link";
import { FolderKanban, Plus, SearchX } from "lucide-react";

import { ListToolbar } from "@/app/components/domain/list-toolbar";
import { PageHeader } from "@/app/components/domain/page-header";
import { EmptyState, TableSkeleton } from "@/app/components/domain/states";
import { Button } from "@/app/components/ui/button";
import { paginateList } from "@/app/lib/api/connection";
import { filterProjects, normalizeProject } from "@/app/lib/api/normalize";
import { pickList } from "@/app/lib/api/safe-list";
import { getClient } from "@/app/lib/graphql/apollo-client";
import {
  ProjectFormOptionsDocument,
  ProjectListDocument,
} from "@/app/lib/graphql/generated/documents";
import { hasActiveFilters, parseListParams, readList, readString } from "@/app/lib/list-params";
import { listStatuses } from "@/app/lib/status";

import { ProjectsTable } from "./projects-table";

export const metadata = { title: "Projects" };

const SORTABLE = ["name", "status", "completionPercent", "endDate", "updatedAt"];
const FILTER_KEYS = ["q", "status", "health", "priority", "pm", "company"];

export default async function ProjectsPage({ searchParams }) {
  const params = await searchParams;
  let users = [];
  let companies = [];

  try {
    const { data: options } = await getClient().query({ query: ProjectFormOptionsDocument });
    users = pickList(options, "users");
    companies = pickList(options, "companies");
  } catch {
    users = [];
    companies = [];
  }

  const filters = [
    { key: "status", label: "Status", options: toOptions(listStatuses("projectStatus")) },
    { key: "health", label: "Health", options: toOptions(listStatuses("projectHealth")) },
    { key: "priority", label: "Priority", options: toOptions(listStatuses("priority")) },
    {
      key: "pm",
      label: "PM",
      multi: false,
      allLabel: "Anyone",
      options: users.map((user) => ({ value: user.id, label: user.name })),
    },
    {
      key: "company",
      label: "Client",
      multi: false,
      allLabel: "All clients",
      options: companies.map((company) => ({
        value: company.id,
        label: company.name,
      })),
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Delivery"
        title="Projects"
        description="Every engagement in flight, with health, progress and budget at a glance."
        actions={
          <Button asChild data-tour="projects-new-btn">
            <Link href="/projects/new">
              <Plus aria-hidden="true" />
              New project
            </Link>
          </Button>
        }
      />

      <div className="space-y-4" data-tour="projects-list">
        <ListToolbar
          searchPlaceholder="Search projects…"
          searchLabel="Search projects by name"
          filters={filters}
        />

        {/* Keyed on the query so changing a filter re-suspends and shows the
            skeleton, rather than leaving stale rows on screen. */}
        <Suspense key={JSON.stringify(params)} fallback={<TableSkeleton rows={8} columns={8} />}>
          <ProjectResults params={params} />
        </Suspense>
      </div>
    </>
  );
}

async function ProjectResults({ params }) {
  const { sort, pageInput } = parseListParams(params, {
    sortable: SORTABLE,
    defaultSort: "endDate",
    defaultDirection: "ASC",
  });

  const filter = {
    search: readString(params, "q"),
    status: nullIfEmpty(readList(params, "status")),
    health: nullIfEmpty(readList(params, "health")),
    priority: nullIfEmpty(readList(params, "priority")),
    projectManagerId: readString(params, "pm"),
    companyId: readString(params, "company"),
  };

  const { data } = await getClient().query({
    query: ProjectListDocument,
    variables: { companyId: filter.companyId },
  });

  const usersById = new Map((data.users ?? []).map((user) => [user.id, user]));
  const companiesById = new Map((data.companies ?? []).map((company) => [company.id, company]));
  const normalized = (data.projects ?? []).map((project) =>
    normalizeProject(project, usersById, companiesById),
  );
  const filtered = filterProjects(normalized, filter);
  const connection = paginateList(filtered, pageInput);

  return (
    <ProjectsTable
      connection={connection}
      sort={sort}
      emptyState={hasActiveFilters(params, FILTER_KEYS) ? <NoMatches /> : <NoProjects />}
    />
  );
}

const toOptions = (statuses) => statuses.map((status) => ({ value: status.value, label: status.label }));
const nullIfEmpty = (list) => (list.length ? list : null);

function NoMatches() {
  return (
    <EmptyState
      icon={SearchX}
      title="No projects match these filters"
      description="Try loosening a filter or clearing the search to see more."
      action={
        <Button variant="outline" asChild>
          <Link href="/projects">Clear all filters</Link>
        </Button>
      }
    />
  );
}

function NoProjects() {
  return (
    <EmptyState
      icon={FolderKanban}
      title="No projects yet"
      description="Create a project to start planning phases, milestones and tasks against a client."
      action={
        <Button asChild>
          <Link href="/projects/new">
            <Plus aria-hidden="true" />
            New project
          </Link>
        </Button>
      }
    />
  );
}
