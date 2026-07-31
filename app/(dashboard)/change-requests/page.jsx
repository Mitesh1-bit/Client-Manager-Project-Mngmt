import { Suspense } from "react";
import Link from "next/link";
import { GitPullRequestArrow, SearchX } from "lucide-react";

import { ListToolbar } from "@/app/components/domain/list-toolbar";
import { PageHeader } from "@/app/components/domain/page-header";
import { EmptyState, TableSkeleton } from "@/app/components/domain/states";
import { Button } from "@/app/components/ui/button";
import { getClient } from "@/app/lib/graphql/apollo-client";
import {
  ChangeRequestFormOptionsDocument,
  ChangeRequestQueueCountsDocument,
  ChangeRequestQueueDocument,
} from "@/app/lib/graphql/generated/documents";
import { hasActiveFilters, parseListParams, readList, readString } from "@/app/lib/list-params";
import { listStatuses } from "@/app/lib/status";

import { ChangeRequestsTable } from "./change-requests-table";
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

  const [{ data: counts }, { data: options }] = await Promise.all([
    getClient().query({ query: ChangeRequestQueueCountsDocument }),
    getClient().query({ query: ChangeRequestFormOptionsDocument }),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Operations"
        title="Change requests"
        description="Everything clients have asked for, what needs assessing, and what's waiting on a decision."
      />

      <div className="space-y-4">
        <QueueTabs
          active={bucket}
          counts={{
            all: counts.all.totalCount,
            submitted: counts.submitted.totalCount,
            "pending-approval": counts.pendingApproval.totalCount,
            overdue: counts.overdue.totalCount,
          }}
        />

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
              options: options.users.map((user) => ({ value: user.id, label: user.name })),
            },
            {
              key: "company",
              label: "Client",
              multi: false,
              allLabel: "All clients",
              options: options.companies.nodes.map((company) => ({
                value: company.id,
                label: company.name,
              })),
            },
          ]}
        />

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

  const { data } = await getClient().query({
    query: ChangeRequestQueueDocument,
    variables: { filter, page: pageInput },
  });

  const filtered = hasActiveFilters(params, FILTER_KEYS) || bucket !== "all";

  return (
    <ChangeRequestsTable
      connection={data.changeRequestQueue}
      sort={sort}
      emptyState={filtered ? <NothingInBucket bucket={bucket} /> : <NoRequests />}
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

function NoRequests() {
  return (
    <EmptyState
      icon={GitPullRequestArrow}
      title="No change requests yet"
      description="When a client asks for something outside the agreed scope, it lands here for assessment."
    />
  );
}
