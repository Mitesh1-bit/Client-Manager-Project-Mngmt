import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { PageHeader } from "@/app/components/domain/page-header";
import { getClient } from "@/app/lib/graphql/apollo-client";
import { PortalProjectsDocument } from "@/app/lib/graphql/generated/documents";

import { ChangeRequestForm } from "../change-request-form";

export const metadata = { title: "New request" };

export default async function NewChangeRequestPage() {
  const { data } = await getClient().query({ query: PortalProjectsDocument });

  return (
    <div className="mx-auto w-full max-w-2xl">
      <Link
        href="/portal/change-requests"
        className="mb-4 inline-flex items-center gap-1 rounded-sm text-caption text-muted-foreground hover:text-foreground focus-ring"
      >
        <ChevronLeft aria-hidden="true" className="size-4" />
        Your requests
      </Link>

      <PageHeader
        title="Request a change"
        description="Ask for something outside the agreed scope — a new feature, a different date, more budget. We'll come back with what it involves before anything is booked in."
      />

      <ChangeRequestForm projects={data.projects.nodes} />
    </div>
  );
}
