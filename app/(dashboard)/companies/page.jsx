import { Suspense } from "react";
import Link from "next/link";
import { Building2, Plus, SearchX } from "lucide-react";

import { PageHeader } from "@/app/components/domain/page-header";
import { EmptyState, TableSkeleton } from "@/app/components/domain/states";
import { Button } from "@/app/components/ui/button";
import { getClient } from "@/app/lib/graphql/apollo-client";
import {
  CompanyFormOptionsDocument,
  CompanyListDocument,
} from "@/app/lib/graphql/generated/documents";
import { hasActiveFilters, parseListParams, readList, readString } from "@/app/lib/list-params";

import { CompaniesTable } from "./companies-table";
import { CompaniesToolbar } from "./companies-toolbar";

export const metadata = { title: "Companies" };

const SORTABLE = ["name", "status", "healthScore", "updatedAt"];
const FILTER_KEYS = ["q", "status", "tag", "owner"];

export default async function CompaniesPage({ searchParams }) {
  const params = await searchParams;
  const { data: options } = await getClient().query({ query: CompanyFormOptionsDocument });

  return (
    <>
      <PageHeader
        eyebrow="Clients"
        title="Companies"
        description="Every account you work with, their contacts, health score and open work."
        actions={
          <Button asChild>
            <Link href="/companies/new">
              <Plus aria-hidden="true" />
              New company
            </Link>
          </Button>
        }
      />

      <div className="space-y-4">
        <CompaniesToolbar owners={options.users} tags={options.tags} />

        {/* Keyed on the query so changing a filter re-suspends and shows the
            skeleton, rather than leaving stale rows on screen. */}
        <Suspense key={JSON.stringify(params)} fallback={<TableSkeleton rows={8} columns={7} />}>
          <CompaniesResults params={params} />
        </Suspense>
      </div>
    </>
  );
}

async function CompaniesResults({ params }) {
  const { sort, pageInput } = parseListParams(params, {
    sortable: SORTABLE,
    defaultSort: "name",
    defaultDirection: "ASC",
  });

  const statuses = readList(params, "status");
  const tagIds = readList(params, "tag");

  const filter = {
    search: readString(params, "q"),
    status: statuses.length ? statuses : null,
    tagIds: tagIds.length ? tagIds : null,
    accountOwnerId: readString(params, "owner"),
  };

  const { data } = await getClient().query({
    query: CompanyListDocument,
    variables: { filter, page: pageInput },
  });

  const filtered = hasActiveFilters(params, FILTER_KEYS);

  return (
    <CompaniesTable
      connection={data.companies}
      sort={sort}
      emptyState={filtered ? <NoMatches /> : <NoCompanies />}
    />
  );
}

function NoMatches() {
  return (
    <EmptyState
      icon={SearchX}
      title="No companies match these filters"
      description="Try loosening a filter or clearing the search to see more."
      action={
        <Button variant="outline" asChild>
          <Link href="/companies">Clear all filters</Link>
        </Button>
      }
    />
  );
}

function NoCompanies() {
  return (
    <EmptyState
      icon={Building2}
      title="No companies yet"
      description="Add your first client company to start tracking contacts, projects and touchpoints against it."
      action={
        <Button asChild>
          <Link href="/companies/new">
            <Plus aria-hidden="true" />
            New company
          </Link>
        </Button>
      }
    />
  );
}
