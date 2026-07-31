import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ExternalLink, Pencil } from "lucide-react";

import { DetailTabs } from "@/app/components/domain/detail-tabs";
import { EntityAvatar } from "@/app/components/domain/entity-avatar";
import { TagList } from "@/app/components/domain/tag-list";
import { Button } from "@/app/components/ui/button";
import { displayUrl } from "@/app/lib/format";
import { getClient } from "@/app/lib/graphql/apollo-client";
import { CompanyDetailHeaderDocument } from "@/app/lib/graphql/generated/documents";

import { CompanyStatusMenu } from "./company-status-menu";

export async function generateMetadata({ params }) {
  const { id } = await params;
  const { data } = await getClient().query({
    query: CompanyDetailHeaderDocument,
    variables: { id },
  });
  return { title: data.company?.name ?? "Company" };
}

export default async function CompanyDetailLayout({ children, params }) {
  const { id } = await params;
  const { data } = await getClient().query({
    query: CompanyDetailHeaderDocument,
    variables: { id },
  });

  const company = data.company;
  if (!company) notFound();

  const tabs = [
    { href: `/companies/${id}`, label: "Overview" },
    { href: `/companies/${id}/contacts`, label: "Contacts" },
    { href: `/companies/${id}/projects`, label: "Projects" },
    { href: `/companies/${id}/touchpoints`, label: "Touchpoints" },
    { href: `/companies/${id}/docs`, label: "Documents" },
    { href: `/companies/${id}/change-log`, label: "Change log" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/companies"
          className="mb-4 inline-flex items-center gap-1 rounded-sm text-caption text-muted-foreground hover:text-foreground focus-ring"
        >
          <ChevronLeft aria-hidden="true" className="size-4" />
          Companies
        </Link>

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

              {company.tags.length ? <TagList tags={company.tags} className="mt-2.5" /> : null}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
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

      <DetailTabs tabs={tabs} />

      {children}
    </div>
  );
}
