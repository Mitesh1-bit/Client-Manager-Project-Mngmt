import { Suspense } from "react";

import { CardGridSkeleton } from "@/app/components/domain/states";
import { PageHeader } from "@/app/components/domain/page-header";
import { getClient } from "@/app/lib/graphql/apollo-client";
import { GlobalSearchDocument } from "@/app/lib/graphql/generated/documents";
import { readString } from "@/app/lib/list-params";

import { RecentSearches } from "./recent-searches";
import { SearchField } from "./search-field";
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

      <div className="space-y-6">
        <SearchField />

        {query ? (
          <Suspense key={query} fallback={<CardGridSkeleton cards={4} />}>
            <SearchResultsForQuery query={query} />
          </Suspense>
        ) : (
          <RecentSearches />
        )}
      </div>
    </>
  );
}

async function SearchResultsForQuery({ query }) {
  const { data } = await getClient().query({
    query: GlobalSearchDocument,
    variables: { query },
  });

  return <SearchResults query={query} results={data.search} />;
}
