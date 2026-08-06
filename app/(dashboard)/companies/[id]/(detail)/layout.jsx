import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, Pencil } from "lucide-react";

import { BackLink } from "@/app/components/domain/back-link";

import { DetailTabs } from "@/app/components/domain/detail-tabs";
import { EntityAvatar } from "@/app/components/domain/entity-avatar";
import { TagList } from "@/app/components/domain/tag-list";
import { Button } from "@/app/components/ui/button";
import { displayUrl } from "@/app/lib/format";
import { normalizeCompany } from "@/app/lib/api/normalize";
import { getSessionClaims } from "@/app/lib/auth/session";
import { getClient } from "@/app/lib/graphql/apollo-client";
import { CompanyDetailHeaderDocument } from "@/app/lib/graphql/generated/documents";

// Mirrors the backend's `invoices` query gate (require_role in
// app/graphql/invoices/schema.py) — a role outside this list gets a clean
// "Requires one of roles: ..." error, so the tab is hidden rather than
// linking somewhere that always fails.
const INVOICE_ROLES = ["admin", "project_manager"];

import { CompanyStatusMenu } from "./company-status-menu";

export async function generateMetadata({ params }) {
  const { id } = await params;
  const { data } = await getClient().query({
    query: CompanyDetailHeaderDocument,
    variables: { id },
  });
  return { title: data.company?.name ?? "Client" };
}

export default async function CompanyDetailLayout({ children, params }) {
  const { id } = await params;
  const { data } = await getClient().query({
    query: CompanyDetailHeaderDocument,
    variables: { id },
  });

  const company = normalizeCompany(data.company);
  if (!company) notFound();

  const claims = await getSessionClaims();
  const canViewInvoices = INVOICE_ROLES.includes(claims?.role);

  const tabs = [
    { href: `/companies/${id}`, label: "Overview" },
    { href: `/companies/${id}/contacts`, label: "Contacts" },
    { href: `/companies/${id}/projects`, label: "Projects" },
    { href: `/companies/${id}/touchpoints`, label: "Touchpoints" },
    { href: `/companies/${id}/docs`, label: "Documents" },
    { href: `/companies/${id}/contracts`, label: "Contracts" },
    ...(canViewInvoices ? [{ href: `/companies/${id}/invoices`, label: "Invoices" }] : []),
    { href: `/companies/${id}/change-log`, label: "Change log" },
  ];

  return (
    <div className="min-w-0 space-y-6">
      <div>
        <BackLink href="/companies">Clients</BackLink>

        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <EntityAvatar
              name={company.name}
              imageUrl={company.logoUrl}
              kind="company"
              size="lg"
            />
            <div className="min-w-0">
              {/* Status lives in the menu on the right — one source of truth,
                  not a badge and a control that can disagree. */}
              <h1 className="text-title text-balance">{company.name}</h1>

              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-caption text-muted-foreground">
                {company.industry ? <span>{company.industry}</span> : null}
                {company.website ? (
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center gap-1 rounded-sm hover:text-foreground hover:underline focus-ring"
                  >
                    {displayUrl(company.website)}
                    <ExternalLink aria-hidden="true" className="size-3" />
                  </a>
                ) : null}
                {company.accountOwner ? (
                  <span>Owned by {company.accountOwner.name}</span>
                ) : (
                  <span className="text-tone-caution-fg">No account owner</span>
                )}
              </div>

              {(company.tags?.length ?? 0) > 0 ? <TagList tags={company.tags} className="mt-2.5" /> : null}
            </div>
          </div>

          <div className="flex w-full flex-wrap items-center gap-2 md:w-auto md:shrink-0">
            <CompanyStatusMenu
              companyId={company.id}
              companyName={company.name}
              status={company.status}
            />
            <Button variant="outline" asChild>
              <Link href={`/companies/${id}/edit`}>
                <Pencil aria-hidden="true" />
                Edit
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <DetailTabs tabs={tabs} tourId="company-tabs" />

      <div className="min-w-0">{children}</div>
    </div>
  );
}
