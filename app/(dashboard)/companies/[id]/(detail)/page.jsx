import Link from "next/link";
import { notFound } from "next/navigation";
import { History, Mail, Phone, UserRound } from "lucide-react";

import { ActivityTimeline } from "@/app/components/domain/activity-timeline";
import { EntityAvatar } from "@/app/components/domain/entity-avatar";
import { HealthScoreBadge } from "@/app/components/domain/health-score-badge";
import { EmptyState, SectionCard } from "@/app/components/domain/states";
import { Button } from "@/app/components/ui/button";
import { formatCurrency, formatDate, displayUrl } from "@/app/lib/format";
import { normalizeCompany } from "@/app/lib/api/normalize";
import { asArray } from "@/app/lib/api/safe-list";
import { getClient } from "@/app/lib/graphql/apollo-client";
import { CompanyOverviewDocument } from "@/app/lib/graphql/generated/documents";

const TIMELINE_LIMIT = 12;

export default async function CompanyOverviewPage({ params }) {
  const { id } = await params;
  const { data } = await getClient().query({
    query: CompanyOverviewDocument,
    variables: { id },
  });

  const company = normalizeCompany(data.company);
  if (!company) notFound();

  const contracts = asArray(data.contracts);
  const history = asArray(company.healthScoreTrend).map((point) => point?.score ?? 0);
  const activeContract = contracts.find(
    (contract) => String(contract.status).toLowerCase() === "active",
  );
  const activity = company.activity ?? [];

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <div className="space-y-5 lg:col-span-2">
        <SectionCard title="Health" description="Recalculated nightly from touchpoints, project status and response times.">
          {/* Stacked on phones — side by side the score and the six-field grid
              squeeze each other into unreadable columns. */}
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <HealthScoreBadge
              score={company.healthScore}
              history={history}
              size="lg"
              className="self-start"
            />
            <dl className="grid flex-1 grid-cols-2 gap-x-6 gap-y-3 text-caption sm:grid-cols-3">
              <Detail label="Client since" value={company.createdAt ? formatDate(company.createdAt) : "—"} />
              <Detail label="Last updated" value={company.updatedAt ? formatDate(company.updatedAt) : "—"} />
              <Detail
                label="Contract ends"
                value={activeContract ? formatDate(activeContract.endDate) : "No active contract"}
              />
              <Detail
                label="Contract value"
                value={activeContract ? formatCurrency(activeContract.value) : "—"}
              />
              <Detail
                label="Auto-renew"
                value={activeContract ? (activeContract.autoRenew ? "Yes" : "No") : "—"}
              />
              <Detail label="Timezone" value={company.timezone?.replace(/_/g, " ") ?? "—"} />
            </dl>
          </div>
        </SectionCard>

        <SectionCard
          title="Activity"
          description="Touchpoints, change requests, projects and edits in one feed."
          actions={
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/companies/${id}/touchpoints`}>All touchpoints</Link>
            </Button>
          }
        >
          {activity.length === 0 ? (
            <EmptyState
              icon={History}
              title="Nothing has happened yet"
              description="Once you log a touchpoint or start a project, it shows up here."
            />
          ) : (
            <ActivityTimeline entries={activity} limit={TIMELINE_LIMIT} />
          )}
        </SectionCard>
      </div>

      <div className="space-y-5">
        <SectionCard
          title="Primary contact"
          actions={
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/companies/${id}/contacts`}>All contacts</Link>
            </Button>
          }
        >
          {company.primaryContact ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <EntityAvatar name={company.primaryContact.fullName} />
                <div className="min-w-0">
                  <p className="truncate font-medium">{company.primaryContact.fullName}</p>
                  <p className="truncate text-caption text-muted-foreground">
                    {company.primaryContact.title ?? "No title recorded"}
                  </p>
                </div>
              </div>
              <div className="space-y-1.5 text-caption">
                <a
                  href={`mailto:${company.primaryContact.email}`}
                  className="flex items-center gap-2 rounded-sm text-muted-foreground hover:text-foreground focus-ring"
                >
                  <Mail aria-hidden="true" className="size-3.5 shrink-0" />
                  <span className="truncate">{company.primaryContact.email}</span>
                </a>
                {company.primaryContact.phone ? (
                  <a
                    href={`tel:${company.primaryContact.phone}`}
                    className="flex items-center gap-2 rounded-sm text-muted-foreground hover:text-foreground focus-ring"
                  >
                    <Phone aria-hidden="true" className="size-3.5 shrink-0" />
                    {company.primaryContact.phone}
                  </a>
                ) : null}
              </div>
            </div>
          ) : (
            <EmptyState
              icon={UserRound}
              title="No primary contact"
              description="Mark one contact as primary so everyone knows who to talk to."
              className="border-0 bg-transparent py-6"
              action={
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/companies/${id}/contacts`}>Choose one</Link>
                </Button>
              }
            />
          )}
        </SectionCard>

        <SectionCard title="Details">
          <dl className="space-y-3 text-caption">
            <Detail label="Industry" value={company.industry ?? "—"} />
            <Detail label="Size" value={company.size ? `${company.size} employees` : "—"} />
            <Detail
              label="Website"
              value={
                company.website ? (
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="rounded-sm text-primary hover:underline focus-ring"
                  >
                    {displayUrl(company.website)}
                  </a>
                ) : (
                  "—"
                )
              }
            />
            <Detail label="Account owner" value={company.accountOwner?.name ?? "Unassigned"} />
            <Detail label="Address" value={formatAddress(company.address)} />
          </dl>
        </SectionCard>
      </div>
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div className="min-w-0">
      <dt className="text-muted-foreground">{label}</dt>
      {/* break-words so long values (timezones, URLs) stay inside the card on
          narrow screens. */}
      <dd className="mt-0.5 font-medium text-pretty break-words">{value}</dd>
    </div>
  );
}

function formatAddress(address) {
  if (!address) return "—";
  const parts = [
    address.line1,
    address.line2,
    address.city,
    address.region,
    address.postalCode,
    address.country,
  ].filter(Boolean);
  return parts.length ? parts.join(", ") : "—";
}
