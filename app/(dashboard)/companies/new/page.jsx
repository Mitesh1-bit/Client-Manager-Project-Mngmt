import { redirect } from "next/navigation";

import { BackLink } from "@/app/components/domain/back-link";
import { PageHeader } from "@/app/components/domain/page-header";
import { getSessionClaims } from "@/app/lib/auth/session";
import { getClient } from "@/app/lib/graphql/apollo-client";
import { CompanyFormOptionsDocument } from "@/app/lib/graphql/generated/documents";
import { canManageClients } from "@/app/lib/rbac";

import { CompanyForm } from "../company-form";

export const metadata = { title: "New client" };

export default async function NewCompanyPage() {
  const claims = await getSessionClaims();
  if (!canManageClients(claims?.role)) redirect("/companies");

  let owners = [];
  let tags = [];
  let sizes = [];
  let industries = [];

  try {
    const { data } = await getClient().query({ query: CompanyFormOptionsDocument });
    owners = data?.users ?? [];
    tags = data?.tags ?? [];
    sizes = data?.companySizes ?? [];
    industries = data?.industries ?? [];
  } catch {
    owners = [];
    tags = [];
    sizes = [];
    industries = [];
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <BackLink href="/companies">Back to clients</BackLink>

      <PageHeader
        title="New client"
        description="Start with the essentials — you can fill in the rest once the relationship is underway."
      />

      <CompanyForm mode="create" owners={owners} tags={tags} sizes={sizes} industries={industries} />
    </div>
  );
}
