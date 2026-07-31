import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { PageHeader } from "@/app/components/domain/page-header";
import { getClient } from "@/app/lib/graphql/apollo-client";
import { CompanyFormOptionsDocument } from "@/app/lib/graphql/generated/documents";

import { CompanyForm } from "../company-form";

export const metadata = { title: "New company" };

export default async function NewCompanyPage() {
  const { data } = await getClient().query({ query: CompanyFormOptionsDocument });

  return (
    <div className="mx-auto w-full max-w-3xl">
      <Link
        href="/companies"
        className="mb-4 inline-flex items-center gap-1 rounded-sm text-caption text-muted-foreground hover:text-foreground focus-ring"
      >
        <ChevronLeft aria-hidden="true" className="size-4" />
        Back to companies
      </Link>

      <PageHeader
        title="New company"
        description="Start with the essentials — you can fill in the rest once the relationship is underway."
      />

      <CompanyForm mode="create" owners={data.users} tags={data.tags} />
    </div>
  );
}
