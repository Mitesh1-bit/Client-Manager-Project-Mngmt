import { Suspense } from "react";
import { Search } from "lucide-react";

import { ListToolbar } from "@/app/components/domain/list-toolbar";
import { PageHeader } from "@/app/components/domain/page-header";
import { EmptyState, TableSkeleton } from "@/app/components/domain/states";
import { readString } from "@/app/lib/list-params";

import { RecentSearches } from "./recent-searches";
import { SearchResults } from "./search-results";

export const metadata = { title: "Search" };

export default async function SearchPage({ searchParams }) {
  const params = await searchParams;
  const query = readString(params, "q");

  return (
    <>
      <PageHeader
        eyebrow="Workspace"
        title="Search"
        description="One search across companies, contacts, projects and tasks."
      />

      <div className="space-y-4" data-tour="search-page">
        <ListToolbar
          searchKey="q"
          searchPlaceholder="Search companies, contacts, projects, tasks…"
          searchLabel="Search the workspace"
        />

        {query && query.trim().length >= 2 ? (
          <Suspense key={query} fallback={<TableSkeleton rows={5} columns={2} />}>
            <SearchResults query={query.trim()} />
          </Suspense>
        ) : (
          <>
            <EmptyState
              icon={Search}
              title={query ? "Keep typing…" : "Search your workspace"}
              description={
                query
                  ? "Enter at least 2 characters to search."
                  : "Find a company, contact, project, or task by name."
              }
            />
            <RecentSearches />
          </>
        )}
      </div>
    </>
  );
}
