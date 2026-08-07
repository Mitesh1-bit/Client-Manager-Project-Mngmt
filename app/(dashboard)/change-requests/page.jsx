import { Suspense } from "react";
import Link from "next/link";
import { GitPullRequestArrow, SearchX } from "lucide-react";

import { ListToolbar } from "@/app/components/domain/list-toolbar";
import { PageHeader } from "@/app/components/domain/page-header";
import { EmptyState, TableSkeleton } from "@/app/components/domain/states";
import { Button } from "@/app/components/ui/button";
import { paginateList } from "@/app/lib/api/connection";
import { fetchChangeRequestQueue } from "@/app/lib/api/change-requests";
import { pickList } from "@/app/lib/api/safe-list";
import { getClient } from "@/app/lib/graphql/apollo-client";
import {
  ChangeRequestFormOptionsDocument,
  ChangeRequestQueueCountsDocument,
} from "@/app/lib/graphql/generated/documents";
import { hasActiveFilters, parseListParams, readList, readString } from "@/app/lib/list-params";
import { listStatuses } from "@/app/lib/status";

import { ChangeRequestsTable } from "./change-requests-table";
import { NewChangeRequestDialog } from "./new-change-request-dialog";
import { QueueTabs } from "./queue-tabs";

export const metadata = { title: "Change requests" };

const SORTABLE = ["reference", "status", "type", "priority", "age", "updatedAt"];
const FILTER_KEYS = ["q", "status", "type", "priority", "pm", "company", "awaiting"];

/** The bucket tabs map to a filter the server applies. */
const BUCKET_FILTERS = {
  submitted: { status: ["SUBMITTED", "UNDER_REVIEW", "PENDING_IMPACT_ASSESSMENT"] },
  "pending-approval": { status: ["PENDING_APPROVAL"] },
  overdue: { overdueOnly: true },
};

export default async function ChangeRequestsPage({ searchParams }) {
  const params = await searchParams;
  const bucket = readString(params, "bucket") ?? "all";

  const [{ data: counts }, optionsResult] = await Promise.all([
    getClient().query({ query: ChangeRequestQueueCountsDocument }),
    getClient().query({ query: ChangeRequestFormOptionsDocument }),
  ]);

  const users = pickList(optionsResult.data, "users");
  const companies = pickList(optionsResult.data, "companies");
  const projects = pickList(optionsResult.data, "projects");

  const countShape = {
    all: { totalCount: counts.changeRequestDashboard?.openCount ?? 0 },
    submitted: { totalCount: counts.changeRequestDashboard?.openCount ?? 0 },
    pendingApproval: { totalCount: counts.changeRequestDashboard?.pendingApprovalCount ?? 0 },
    overdue: { totalCount: counts.changeRequestDashboard?.overdueCount ?? 0 },
  };

  return (
    <>
      <PageHeader
        eyebrow="Operations"
        title="Change requests"
        description="Everything clients have asked for, what needs assessing, and what's waiting on a decision."
        actions={<NewChangeRequestDialog projects={projects} />}
      />

      <div className="space-y-4">
        <div data-tour="cr-queue-tabs">
          <QueueTabs
            active={bucket}
            counts={{
              all: countShape.all.totalCount,
              submitted: countShape.submitted.totalCount,
              "pending-approval": countShape.pendingApproval.totalCount,
              overdue: countShape.overdue.totalCount,
            }}
          />
        </div>

        <div data-tour="cr-filters">
          <ListToolbar
            searchPlaceholder="Search by title or reference…"
            searchLabel="Search change requests by title or reference"
            filters={[
              {
                key: "status",
                label: "Status",
                options: toOptions(listStatuses("changeRequestStatus")),
              },
              {
                key: "type",
                label: "Type",
                options: [
                  "SCOPE_ADDITION",
                  "SCOPE_REDUCTION",
                  "TIMELINE_CHANGE",
                  "BUDGET_CHANGE",
                  "BUGFIX",
                  "OTHER",
                ].map((value) => ({ value, label: humanize(value) })),
              },
              { key: "priority", label: "Priority", options: toOptions(listStatuses("priority")) },
              {
                key: "awaiting",
                label: "Waiting on",
                multi: false,
                allLabel: "Anyone",
                options: [
                  { value: "AGENCY", label: "Us" },
                  { value: "CLIENT", label: "The client" },
                ],
              },
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
            ]}
          />
        </div>

        <Suspense key={JSON.stringify(params)} fallback={<TableSkeleton rows={8} columns={8} />}>
          <QueueResults params={params} bucket={bucket} />
        </Suspense>
      </div>
    </>
  );
}

async function QueueResults({ params, bucket }) {
  const { sort, pageInput } = parseListParams(params, {
    sortable: SORTABLE,
    defaultSort: "age",
    defaultDirection: "ASC",
  });

  const statuses = readList(params, "status");
  const filter = {
    search: readString(params, "q"),
    type: nullIfEmpty(readList(params, "type")),
    priority: nullIfEmpty(readList(params, "priority")),
    assignedPmId: readString(params, "pm"),
    companyId: readString(params, "company"),
    awaiting: readString(params, "awaiting"),
    // An explicit status filter wins over the bucket's own, so the two controls
    // never silently fight each other.
    ...BUCKET_FILTERS[bucket],
    ...(statuses.length ? { status: statuses } : {}),
  };

  const { rows, projects } = await fetchChangeRequestQueue();
  let filtered = rows;

  if (filter.search) {
    const q = filter.search.toLowerCase();
    filtered = filtered.filter(
      (row) =>
        row.title?.toLowerCase().includes(q) ||
        row.reference?.toLowerCase().includes(q),
    );
  }
  if (filter.status?.length) {
    filtered = filtered.filter((row) => filter.status.includes(row.status));
  }
  if (filter.companyId) {
    filtered = filtered.filter((row) => row.companyId === filter.companyId);
  }
  if (filter.assignedPmId) {
    filtered = filtered.filter((row) => row.assignedPmId === filter.assignedPmId);
  }
  if (filter.overdueOnly) {
    filtered = filtered.filter((row) => row.status === "PENDING_APPROVAL");
  }

  const connection = paginateList(filtered, pageInput);
  const filteredActive = hasActiveFilters(params, FILTER_KEYS) || bucket !== "all";

  return (
    <ChangeRequestsTable
      connection={connection}
      sort={sort}
      emptyState={filteredActive ? <NothingInBucket bucket={bucket} /> : <NoRequests projects={projects} />}
    />
  );
}

const toOptions = (statuses) => statuses.map((s) => ({ value: s.value, label: s.label }));
const nullIfEmpty = (list) => (list.length ? list : null);
const humanize = (value) => {
  const lower = value.toLowerCase().replace(/_/g, " ");
  return lower.charAt(0).toUpperCase() + lower.slice(1);
};

function NothingInBucket({ bucket }) {
  const copy = {
    overdue: {
      title: "Nothing is overdue",
      description: "Every open request is still inside its response window.",
    },
    submitted: {
      title: "Nothing waiting to be assessed",
      description: "New requests will land here as clients raise them.",
    },
    "pending-approval": {
      title: "Nothing waiting on a decision",
      description: "Assessed requests appear here while they're being approved.",
    },
  }[bucket] ?? {
    title: "No change requests match these filters",
    description: "Try loosening a filter or clearing the search.",
  };

  return (
    <EmptyState
      icon={SearchX}
      title={copy.title}
      description={copy.description}
      action={
        <Button variant="outline" asChild>
          <Link href="/change-requests">Clear all filters</Link>
        </Button>
      }
    />
  );
}

function NoRequests({ projects }) {
  return (
    <EmptyState
      icon={GitPullRequestArrow}
      title="No change requests yet"
      description="When a client asks for something outside the agreed scope, it lands here for assessment."
      action={<NewChangeRequestDialog projects={projects} />}
    />
  );
}
