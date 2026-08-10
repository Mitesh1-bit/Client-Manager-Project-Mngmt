import { CircleCheck } from "lucide-react";

import { PageHeader } from "@/app/components/domain/page-header";
import { getClient } from "@/app/lib/graphql/apollo-client";
import {
  AtRiskDashboardDocument,
  RetentionFormOptionsDocument,
} from "@/app/lib/graphql/generated/documents";

import { AtRiskCompanyCard } from "./at-risk-company-card";
import { RetentionTabs } from "./retention-tabs";
import { RETENTION_MODULE_DESCRIPTION } from "@/app/lib/retention";

export const metadata = { title: "Retention" };

export default async function RetentionAtRiskPage() {
  const [{ data }, { data: options }] = await Promise.all([
    getClient().query({ query: AtRiskDashboardDocument }),
    getClient().query({ query: RetentionFormOptionsDocument }),
  ]);

  const rows = data.atRiskCompanies ?? [];
  const sequences = options.retentionSequences ?? [];

  return (
    <>
      <PageHeader
        eyebrow="Operations"
        title="Retention"
        description={RETENTION_MODULE_DESCRIPTION}
      />

      <div className="space-y-4">
        <div data-tour="retention-tabs">
          <RetentionTabs counts={{ "/retention": rows.length }} />
        </div>

        {rows.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed py-16 text-center">
            <span className="flex size-11 items-center justify-center rounded-full bg-tone-positive-bg text-tone-positive-fg">
              <CircleCheck aria-hidden="true" className="size-5" />
            </span>
            <div>
              <p className="font-medium">Nothing at risk right now</p>
              <p className="mt-1 max-w-sm text-caption text-muted-foreground">
                Post-project accounts with healthy scores and up-to-date call or email follow-ups
                appear here when they need attention.
              </p>
            </div>
          </div>
        ) : (
          <div data-tour="retention-at-risk-list" className="space-y-3">
            {rows.map((row) => (
              <AtRiskCompanyCard key={row.company.id} row={row} sequences={sequences} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
